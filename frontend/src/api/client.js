import axios from "axios";
import { getSessionId } from "./session";

const baseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://127.0.0.1:8000/api" : "/api");

const api = axios.create({
  baseURL,
  headers: {
    "X-Session-ID": getSessionId(),
  },
});

// Attach JWT token to every request when the user is signed in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("neuro-auth-token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// --- Silent token refresh on 401 ---
let _isRefreshing = false;
let _pendingQueue = []; // [{ resolve, reject }]

function _flushQueue(error, token) {
  _pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  _pendingQueue = [];
}

function _clearAuthStorage() {
  localStorage.removeItem("neuro-auth-token");
  localStorage.removeItem("neuro-refresh-token");
  localStorage.removeItem("neuro-auth-user");
  // Notify React tree that the user has been signed out
  window.dispatchEvent(new Event("auth:logout"));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config ?? {};
    const url = original.url ?? "";
    const skipRefresh =
      url.includes("/auth/refresh") ||
      url.includes("/auth/token") ||
      url.includes("/auth/register") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/reset-password") ||
      url.includes("/auth/logout");

    if (error.response?.status === 401 && !original._retry && !skipRefresh) {
      const storedRefresh = localStorage.getItem("neuro-refresh-token");
      if (!storedRefresh) {
        _clearAuthStorage();
        return Promise.reject(error);
      }

      if (_isRefreshing) {
        // Queue this request until the in-flight refresh completes
        return new Promise((resolve, reject) => {
          _pendingQueue.push({ resolve, reject });
        }).then((newToken) => {
          original.headers["Authorization"] = `Bearer ${newToken}`;
          return api(original);
        });
      }

      original._retry = true;
      _isRefreshing = true;

      try {
        const res = await api.post("/auth/refresh", { refresh_token: storedRefresh });
        const { access_token, refresh_token: newRefresh } = res.data;
        localStorage.setItem("neuro-auth-token", access_token);
        localStorage.setItem("neuro-refresh-token", newRefresh);
        _flushQueue(null, access_token);
        original.headers["Authorization"] = `Bearer ${access_token}`;
        return api(original);
      } catch (refreshError) {
        _flushQueue(refreshError, null);
        _clearAuthStorage();
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
