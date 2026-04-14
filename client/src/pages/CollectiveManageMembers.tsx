import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type {
  CollectiveDetail,
  MembershipDetail,
  MembershipSummary,
} from "../api/generated";
import { getOsolotAPI } from "../api/generated";
import { fetchCollective, isAbortError } from "../api/collectives-queries";
import { useAuth } from "../auth/AuthContext";
import "../App.css";

const api = getOsolotAPI();

const ROLES = ["admin", "moderator", "member"] as const;

async function loadMemberDetailsForSummaries(
  collectiveId: number,
  summaries: MembershipSummary[],
): Promise<Partial<Record<number, MembershipDetail>>> {
  const results = await Promise.all(
    summaries.map(async (m) => {
      try {
        const d = await api.osolotServerApiCollectivesGetMembership(
          collectiveId,
          m.user.id,
        );
        return [m.user.id, d] as const;
      } catch {
        return null;
      }
    }),
  );
  const out: Partial<Record<number, MembershipDetail>> = {};
  for (const r of results) {
    if (r) out[r[0]] = r[1];
  }
  return out;
}

function formatWhen(iso: string | undefined | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function CollectiveManageMembers() {
  const { collectiveId } = useParams<{ collectiveId: string }>();
  const id = collectiveId ? Number.parseInt(collectiveId, 10) : NaN;
  const { user, loading: authLoading } = useAuth();

  const [collective, setCollective] = useState<CollectiveDetail | null>(null);
  const [memberships, setMemberships] = useState<MembershipSummary[] | null>(null);
  const [detailByUserId, setDetailByUserId] = useState<
    Partial<Record<number, MembershipDetail>>
  >({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid collective.");
      return;
    }
    const ac = new AbortController();
    setLoadError(null);
    setPageError(null);
    (async () => {
      try {
        const c = await fetchCollective(id, ac.signal);
        const list = await api.osolotServerApiCollectivesListMemberships(id);
        if (ac.signal.aborted) return;
        const details = await loadMemberDetailsForSummaries(id, list);
        if (ac.signal.aborted) return;
        setCollective(c);
        setMemberships(list);
        setDetailByUserId(details);
      } catch (e) {
        if (isAbortError(e)) return;
        setDetailByUserId({});
        setLoadError("Could not load collective or members.");
      }
    })();
    return () => ac.abort();
  }, [id]);

  const canManage = useMemo(() => {
    if (!user || !collective) return false;
    return collective.members.some(
      (m) =>
        m.user.id === user.id &&
        m.status === "active" &&
        (m.role === "admin" || m.role === "moderator"),
    );
  }, [user, collective]);

  const isAdmin = useMemo(() => {
    if (!user || !collective) return false;
    return collective.members.some(
      (m) => m.user.id === user.id && m.status === "active" && m.role === "admin",
    );
  }, [user, collective]);

  const sortedMemberships = useMemo(() => {
    if (!memberships) return [];
    return [...memberships].sort((a, b) => {
      const ap = a.status === "pending" ? 0 : 1;
      const bp = b.status === "pending" ? 0 : 1;
      if (ap !== bp) return ap - bp;
      const an = `${a.user.first_name} ${a.user.last_name}`;
      const bn = `${b.user.first_name} ${b.user.last_name}`;
      return an.localeCompare(bn);
    });
  }, [memberships]);

  const detailHref = `/collectives/${id}`;

  async function refreshMembers() {
    const list = await api.osolotServerApiCollectivesListMemberships(id);
    const details = await loadMemberDetailsForSummaries(id, list);
    setMemberships(list);
    setDetailByUserId(details);
  }

  async function withBusy(targetUserId: number, fn: () => Promise<unknown>) {
    setPageError(null);
    setBusyUserId(targetUserId);
    try {
      await fn();
      await refreshMembers();
    } catch {
      setPageError("That action failed. Check permissions or try again.");
    } finally {
      setBusyUserId(null);
    }
  }

  function handleApprove(targetUserId: number) {
    void withBusy(targetUserId, () =>
      api.osolotServerApiCollectivesUpdateMembership(id, targetUserId, {
        status: "active",
      }),
    );
  }

  function handleDecline(targetUserId: number, name: string) {
    const ok = window.confirm(
      `Decline ${name}'s application? Their membership request will be removed.`,
    );
    if (!ok) return;
    void withBusy(targetUserId, () =>
      api.osolotServerApiCollectivesDeleteMembership(id, targetUserId),
    );
  }

  function handleRoleChange(targetUserId: number, role: string) {
    void withBusy(targetUserId, () =>
      api.osolotServerApiCollectivesUpdateMembership(id, targetUserId, { role }),
    );
  }

  function handleRemove(targetUserId: number, name: string) {
    const ok = window.confirm(
      `Remove ${name} from this collective? They can rejoin later if allowed.`,
    );
    if (!ok) return;
    void withBusy(targetUserId, () =>
      api.osolotServerApiCollectivesDeleteMembership(id, targetUserId),
    );
  }

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
          <h1>Manage members</h1>
          <Link to={Number.isFinite(id) ? detailHref : "/collectives"} className="link">
            Back
          </Link>
        </header>
        <p className="muted">Log in to manage members.</p>
        <Link
          to="/login"
          state={{
            from: Number.isFinite(id) ? `/collectives/${id}/members/manage` : "/collectives",
          }}
          className="btn"
        >
          Log in
        </Link>
      </div>
    );
  }

  if (loadError || !Number.isFinite(id)) {
    return (
      <div className="page">
        <p className="error">{loadError ?? "Invalid collective."}</p>
        <Link to="/collectives" className="link">
          All collectives
        </Link>
      </div>
    );
  }

  if (!collective || memberships === null) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="page">
        <header className="header">
          <h1>Manage members</h1>
          <Link to={detailHref} className="link">
            Back
          </Link>
        </header>
        <p className="error">
          Only admins and moderators can manage members.
        </p>
      </div>
    );
  }

  return (
    <div className="page manage-members">
      <header className="header">
        <h1>Members · {collective.summary.name}</h1>
        <Link to={detailHref} className="link">
          Back to collective
        </Link>
      </header>

      {pageError ? <p className="error">{pageError}</p> : null}

      <ul className="manage-member-cards">
        {sortedMemberships.map((m) => {
          const uid = m.user.id;
          const name = `${m.user.first_name} ${m.user.last_name}`.trim() || `User #${uid}`;
          const pending = m.status === "pending";
          const busy = busyUserId === uid;
          const d = detailByUserId[uid];

          return (
            <li key={uid} className="card manage-member-card">
              <div className="manage-member-title">
                <strong>{name}</strong>
                <span className="member-meta">
                  {m.role} · {m.status}
                </span>
              </div>

              <dl className="kv manage-member-dates">
                <div>
                  <dt>Applied</dt>
                  <dd>{formatWhen(d?.applied_at)}</dd>
                </div>
                <div>
                  <dt>Joined / accepted</dt>
                  <dd>{pending ? "—" : formatWhen(d?.joined_at)}</dd>
                </div>
              </dl>

              {d?.application_message ? (
                <p className="muted manage-app-msg">
                  <strong>Message:</strong> {d.application_message}
                </p>
              ) : null}

              <div className="manage-member-actions">
                {pending ? (
                  <>
                    <button
                      type="button"
                      className="btn"
                      disabled={busy}
                      onClick={() => handleApprove(uid)}
                    >
                      {busy ? "…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      className="btn secondary"
                      disabled={busy}
                      onClick={() => handleDecline(uid, name)}
                    >
                      Decline
                    </button>
                  </>
                ) : null}

                {isAdmin ? (
                  <label className="manage-role-label">
                    Role
                    <select
                      className="manage-role-select"
                      value={m.role}
                      disabled={busy}
                      onChange={(e) => handleRoleChange(uid, e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {uid !== user.id ? (
                  <button
                    type="button"
                    className="btn secondary"
                    disabled={busy}
                    onClick={() => handleRemove(uid, name)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
