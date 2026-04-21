import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import type { UserDetail, UserSummary } from "../api/generated";
import { getOsolotAPI } from "../api/generated";
import { useAuth } from "../auth/AuthContext";
import "../App.css";

const api = getOsolotAPI();

function displayName(u: UserSummary): string {
  const parts = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return parts || u.username;
}

type LocationState = { fromCollectiveSlug?: string } | null;

export default function UserProfile() {
  const { username: usernameParam } = useParams<{ username: string }>();
  const username = usernameParam ?? "";
  const location = useLocation();
  const fromCollectiveSlug =
    (location.state as LocationState)?.fromCollectiveSlug;
  const { user, loading: authLoading } = useAuth();

  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username.trim()) {
      setDetail(null);
      setError("Missing username.");
      return;
    }
    if (authLoading) return;
    if (!user) {
      setDetail(null);
      setError(null);
      return;
    }
    setError(null);
    setDetail(null);
    void (async () => {
      try {
        const d = await api.osolotServerApiUsersGetUserProfile(username);
        setDetail(d);
      } catch {
        setError("Could not load this profile, or you do not have access.");
      }
    })();
  }, [username, user, authLoading]);

  const backHref = fromCollectiveSlug
    ? `/collectives/${fromCollectiveSlug}`
    : "/collectives";
  const backLabel = fromCollectiveSlug ? "Back to collective" : "All collectives";

  if (authLoading) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <header className="header">
          <h1>Member</h1>
          <div className="nav-links">
            <Link to={backHref} className="link">
              {backLabel}
            </Link>
          </div>
        </header>
        <section className="card">
          <p className="muted">
            Sign in to view member profiles and collectives you have in common.
          </p>
          <p>
            <Link
              to="/login"
              className="btn"
              state={{
                from: `/users/${encodeURIComponent(username)}`,
              }}
            >
              Log in
            </Link>
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="header">
        <h1>Member</h1>
        <div className="nav-links">
          <Link to={backHref} className="link">
            {backLabel}
          </Link>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {!error && detail === null ? <p className="muted">Loading…</p> : null}

      {detail ? (
        <>
          <section className="card">
            <h2>{displayName(detail.summary)}</h2>
            <p className="muted user-profile-username">
              @{detail.summary.username}
            </p>
            {detail.bio ? <p className="user-profile-bio">{detail.bio}</p> : null}
            {user?.id === detail.summary.id ? (
              <p className="muted">
                This is you.{" "}
                <Link to="/" className="link">
                  Edit profile on home
                </Link>
              </p>
            ) : null}
          </section>

          <section className="card">
            <h2>Collectives in common</h2>
            {detail.mutual_collectives.length === 0 ? (
              <p className="muted">
                No other active memberships in common, or none you can both see
                here.
              </p>
            ) : (
              <ul className="collective-list">
                {detail.mutual_collectives.map((c) => (
                  <li key={c.slug ?? c.name}>
                    <Link
                      to={`/collectives/${c.slug ?? ""}`}
                      className="collective-link"
                    >
                      <span className="collective-name">{c.name}</span>
                      {c.description ? (
                        <span className="collective-desc">{c.description}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
