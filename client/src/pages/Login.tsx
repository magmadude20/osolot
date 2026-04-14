import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../App.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const from = (location.state as { from?: string } | null)?.from;
  const redirectTo = from && from.startsWith("/") ? from : "/";
  const [panel, setPanel] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const [regPass, setRegPass] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(loginEmail, loginPass);
      navigate(redirectTo, { replace: true });
    } catch {
      setError("Login failed. Check email and password.");
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register({
        password: regPass,
        email: regEmail,
        first_name: regFirstName || undefined,
        last_name: regLastName || undefined,
      });
      navigate(redirectTo, { replace: true });
    } catch {
      setError("Registration failed. That email may already be registered.");
    }
  }

  return (
    <div className="page">
      <header className="header">
        <h1>Osolot</h1>
        <Link to="/" className="link">
          Home
        </Link>
      </header>

      <div className="tabs">
        <button
          type="button"
          className={panel === "login" ? "tab active" : "tab"}
          onClick={() => {
            setPanel("login");
            setError(null);
          }}
        >
          Log in
        </button>
        <button
          type="button"
          className={panel === "register" ? "tab active" : "tab"}
          onClick={() => {
            setPanel("register");
            setError(null);
          }}
        >
          Register
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {panel === "login" ? (
        <form onSubmit={handleLogin} className="card form">
          <label>
            Email
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <p className="form-meta">
            <Link to="/forgot-password" className="link">
              Forgot password?
            </Link>
          </p>
          <button type="submit" className="btn">
            Log in
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="card form">
          <label>
            Email
            <input
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password (min 8 characters)
            <input
              type="password"
              value={regPass}
              onChange={(e) => setRegPass(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>
          <label>
            First name (optional)
            <input
              value={regFirstName}
              onChange={(e) => setRegFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </label>
          <label>
            Last name (optional)
            <input
              value={regLastName}
              onChange={(e) => setRegLastName(e.target.value)}
              autoComplete="family-name"
            />
          </label>
          <button type="submit" className="btn">
            Create account
          </button>
        </form>
      )}
    </div>
  );
}
