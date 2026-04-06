import { useState } from "react";
import { login, register, requestPasswordReset, resetPassword } from "../api/auth";

export default function AuthModal({ onLogin, onClose }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [devResetToken, setDevResetToken] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setError("");
    setInfo("");
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    clearMessages();
    if (nextMode !== "reset") {
      setResetToken("");
      setNewPassword("");
      setDevResetToken("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (mode === "register") {
        await register(email, password);
      }
      const tokenRes = await login(email, password);
      const { access_token: token, refresh_token: refreshToken } = tokenRes.data;

      // Fetch the user's profile with the new token
      const { default: api } = await import("../api/client");
      const meRes = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      onLogin(meRes.data, token, refreshToken);
    } catch (err) {
      if (err.response?.status === 400) {
        setError("That email is already registered.");
      } else if (err.response?.status === 401) {
        setError("Incorrect email or password.");
      } else if (err.response?.status === 422) {
        setError("Please enter a valid email and a password of at least 8 characters.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    clearMessages();
    setLoading(true);

    try {
      const response = await requestPasswordReset(email);
      setMode("reset");
      setDevResetToken(response.data.reset_token || "");
      setInfo(
        response.data.reset_token
          ? "A reset token was generated for this account. Use it below to choose a new password."
          : response.data.message
      );
    } catch {
      setError("Could not start password reset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      await resetPassword(resetToken.trim(), newPassword);
      setPassword("");
      setResetToken("");
      setNewPassword("");
      setDevResetToken("");
      setMode("login");
      setInfo("Password updated. You can sign in now.");
    } catch (err) {
      if (err.response?.status === 400) {
        setError("That reset token is invalid or expired.");
      } else if (err.response?.status === 422) {
        setError("Please enter a valid token and a password with at least 8 characters.");
      } else {
        setError("Could not reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Reset password"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="panel relative w-full max-w-sm p-6">
        <div className="mb-6 flex gap-2 border-b border-[var(--border)] pb-4">
          {["login", "register"].map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={mode === tab}
              onClick={() => switchMode(tab)}
              className={`tab-button ${mode === tab ? "tab-button-active" : ""}`}
            >
              {tab === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {mode === "reset" ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <p className="ui-title text-lg">Reset password</p>
              <p className="ui-subtle mt-2 text-sm leading-6">
                Enter your reset token and choose a new password.
              </p>
            </div>

            {devResetToken ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Reset token
                </p>
                <p className="mt-2 break-all text-sm leading-6 text-[var(--text)]">{devResetToken}</p>
              </div>
            ) : null}

            {info ? (
              <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-soft)]">
                {info}
              </p>
            ) : null}

            <div>
              <label htmlFor="auth-reset-token" className="text-sm font-semibold text-[var(--text)]">
                Reset token
              </label>
              <input
                id="auth-reset-token"
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="surface-input mt-1 w-full rounded-xl px-4 py-2.5 text-sm transition"
              />
            </div>

            <div>
              <label htmlFor="auth-new-password" className="text-sm font-semibold text-[var(--text)]">
                New password
              </label>
              <input
                id="auth-new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="surface-input mt-1 w-full rounded-xl px-4 py-2.5 text-sm transition"
              />
            </div>

            {error ? (
              <p role="alert" className="status-error rounded-lg px-3 py-2 text-sm">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? "Please wait…" : "Update password"}
            </button>

            <button
              type="button"
              onClick={() => switchMode("login")}
              className="btn-secondary w-full rounded-lg px-4 py-2.5 text-sm font-medium transition"
            >
              Back to sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="text-sm font-semibold text-[var(--text)]">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="surface-input mt-1 w-full rounded-xl px-4 py-2.5 text-sm transition"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="text-sm font-semibold text-[var(--text)]">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="surface-input mt-1 w-full rounded-xl px-4 py-2.5 text-sm transition"
              />
              {mode === "register" ? (
                <p className="mt-1 text-xs text-[var(--text-muted)]">At least 8 characters.</p>
              ) : null}
            </div>

            {mode === "login" ? (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading || !email}
                className="text-sm text-[var(--primary)] underline-offset-4 transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Forgot password?
              </button>
            ) : null}

            {info ? (
              <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-soft)]">
                {info}
              </p>
            ) : null}

            {error ? (
              <p role="alert" className="status-error rounded-lg px-3 py-2 text-sm">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in dialog"
          className="absolute right-4 top-4 rounded p-1 text-[var(--text-muted)] transition hover:text-[var(--text)]"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
