import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { clearTokens, getAccessToken, setTokens } from "./api/axios-instance";
import { getOsolotAPI, type UserOut } from "./api/generated";

const api = getOsolotAPI();

function App() {
  const [panel, setPanel] = useState<"login" | "register">("login");
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const [regUser, setRegUser] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regName, setRegName] = useState("");

  const [editName, setEditName] = useState("");

  const bootstrap = useCallback(async () => {
    setError(null);
    if (!getAccessToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.usersRoutesMe();
      setUser(me);
      setEditName(me.name);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const tokens = await api.usersRoutesLogin({
        username: loginUser,
        password: loginPass,
      });
      setTokens(tokens.access, tokens.refresh);
      await bootstrap();
    } catch {
      setError("Login failed. Check username and password.");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const tokens = await api.usersRoutesRegister({
        username: regUser,
        password: regPass,
        email: regEmail || null,
        name: regName,
      });
      setTokens(tokens.access, tokens.refresh);
      await bootstrap();
    } catch {
      setError("Registration failed. Username may already exist.");
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    try {
      const updated = await api.usersRoutesUpdateMe({ name: editName });
      setUser(updated);
    } catch {
      setError("Could not update profile.");
    }
  }

  function handleLogout() {
    clearTokens();
    setUser(null);
    setLoading(false);
    setLoginUser("");
    setLoginPass("");
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="page">
        <header className="header">
          <h1>Account</h1>
          <button type="button" className="btn secondary" onClick={handleLogout}>
            Log out
          </button>
        </header>

        {error ? <p className="error">{error}</p> : null}

        <section className="card">
          <h2>Profile</h2>
          <dl className="kv">
            <div>
              <dt>Username</dt>
              <dd>{user.username}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email || "—"}</dd>
            </div>
          </dl>

          <form onSubmit={handleSaveProfile} className="form">
            <label>
              Name
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoComplete="name"
              />
            </label>
            <button type="submit" className="btn">
              Save name
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="header">
        <h1>Osolot</h1>
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
            Username
            <input
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              autoComplete="username"
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
          <button type="submit" className="btn">
            Log in
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="card form">
          <label>
            Username
            <input
              value={regUser}
              onChange={(e) => setRegUser(e.target.value)}
              autoComplete="username"
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
            Email (optional)
            <input
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label>
            Name (optional)
            <input
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              autoComplete="name"
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

export default App;
