import api from "./client";

export const register = (email, password) =>
  api.post("/auth/register", { email, password });

export const login = (email, password) => {
  const formData = new URLSearchParams();
  formData.append("username", email); // OAuth2PasswordRequestForm uses 'username'
  formData.append("password", password);
  return api.post("/auth/token", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

export const getMe = () => api.get("/auth/me");

export const refreshAccessToken = (refresh_token) =>
  api.post("/auth/refresh", { refresh_token });

export const logout = (refresh_token) =>
  api.post("/auth/logout", { refresh_token });

export const requestPasswordReset = (email) =>
  api.post("/auth/forgot-password", { email });

export const resetPassword = (token, new_password) =>
  api.post("/auth/reset-password", { token, new_password });
