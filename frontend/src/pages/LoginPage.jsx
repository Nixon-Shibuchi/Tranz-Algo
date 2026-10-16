import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Logo } from "../components/Brand";
import DoodleBackdrop from "../components/Doodles";
import { hasSeenWelcome } from "../welcome";

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;
  if (!hasSeenWelcome()) return <Navigate to="/welcome" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, fullName);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <DoodleBackdrop className="login-doodles" />
      <section className="login-atmosphere" aria-hidden="true">
        <DoodleBackdrop className="login-atmosphere-doodles" />
        <div className="login-atmosphere-copy">
          <p className="brand-mark">Tranz-Algo</p>
          <p>Turn import paperwork into true landed cost, safe retail, and shelf stock — one batch at a time.</p>
        </div>
      </section>

      <div className="login-panel">
        <form className="card login-card" onSubmit={onSubmit}>
          <Link to="/welcome" className="login-back">
            ← Back to welcome
          </Link>
          <div className="login-brand">
            <Logo size={52} />
            <div>
              <h1>Tranz-Algo</h1>
              <p className="muted">
                {mode === "login" ? "Sign in to your workspace" : "Create your account"}
              </p>
            </div>
          </div>
          {mode === "register" && (
            <label>
              Full name
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="btn ghost password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn primary" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
          <button
            type="button"
            className="btn link"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Need an account? Register" : "Have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
