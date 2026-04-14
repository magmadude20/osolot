import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { CollectiveDetail } from "../api/generated";
import { fetchCollective, isAbortError } from "../api/collectives-queries";
import { getOsolotAPI } from "../api/generated";
import { useAuth } from "../auth/AuthContext";
import "../App.css";

const api = getOsolotAPI();

export default function CollectiveEdit() {
  const { collectiveId } = useParams<{ collectiveId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const id = collectiveId ? Number.parseInt(collectiveId, 10) : NaN;

  const [collective, setCollective] = useState<CollectiveDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [admissionType, setAdmissionType] = useState("open");
  const [applicationQuestion, setApplicationQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid collective.");
      return;
    }
    const ac = new AbortController();
    (async () => {
      try {
        const c = await fetchCollective(id, ac.signal);
        setCollective(c);
        setName(c.summary.name);
        setDescription(c.summary.description);
        setVisibility(c.summary.visibility);
        setAdmissionType(c.summary.admission_type);
        setApplicationQuestion(c.application_question);
      } catch (e) {
        if (isAbortError(e)) return;
        setLoadError("Collective not found or not accessible.");
      }
    })();
    return () => ac.abort();
  }, [id]);

  const isAdmin = useMemo(() => {
    if (!user || !collective) return false;
    return collective.members.some(
      (m) => m.user.id === user.id && m.role === "admin",
    );
  }, [user, collective]);

  const detailHref = `/collectives/${id}`;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !Number.isFinite(id)) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.osolotServerApiCollectivesUpdateCollective(id, {
        name: name.trim(),
        description,
        visibility,
        admission_type: admissionType,
        application_question: applicationQuestion,
      });
      navigate(detailHref, { replace: true });
    } catch {
      setError("Could not save changes. Check your connection and permissions.");
    } finally {
      setSubmitting(false);
    }
  }

  function onDeleteClick() {
    if (!Number.isFinite(id) || !collective) return;
    const label = collective.summary.name;
    const ok = window.confirm(
      `Delete “${label}”? This permanently removes the collective and cannot be undone.`,
    );
    if (!ok) return;

    setError(null);
    setDeleting(true);
    void (async () => {
      try {
        await api.osolotServerApiCollectivesDeleteCollective(id);
        navigate("/collectives", { replace: true });
      } catch {
        setError("Could not delete the collective.");
      } finally {
        setDeleting(false);
      }
    })();
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
          <h1>Edit collective</h1>
          <Link to={Number.isFinite(id) ? detailHref : "/collectives"} className="link">
            Back
          </Link>
        </header>
        <p className="muted">Log in to edit this collective.</p>
        <Link to="/login" state={{ from: Number.isFinite(id) ? `/collectives/${id}/edit` : "/collectives" }} className="btn">
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

  if (!collective) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="page">
        <header className="header">
          <h1>Edit collective</h1>
          <Link to={detailHref} className="link">
            Back
          </Link>
        </header>
        <p className="error">You don’t have permission to edit this collective.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="header">
        <h1>Edit collective</h1>
        <Link to={detailHref} className="link">
          Cancel
        </Link>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <form onSubmit={onSubmit} className="card form">
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={1}
            maxLength={255}
            autoComplete="off"
          />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={100_000}
          />
        </label>
        <label>
          Visibility
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </label>
        <label>
          Admission
          <select
            value={admissionType}
            onChange={(e) => setAdmissionType(e.target.value)}
          >
            <option value="open">Open</option>
            <option value="application">Application required</option>
          </select>
        </label>
        <label>
          Application question (optional)
          <textarea
            value={applicationQuestion}
            onChange={(e) => setApplicationQuestion(e.target.value)}
            rows={3}
            maxLength={100_000}
            placeholder="Shown when admission is application-based"
          />
        </label>
        <button type="submit" className="btn" disabled={submitting || deleting}>
          {submitting ? "Saving…" : "Save changes"}
        </button>
      </form>

      <section className="card danger-zone">
        <h2>Danger zone</h2>
        <p className="muted">
          Deleting removes this collective for everyone. This action cannot be undone.
        </p>
        <button
          type="button"
          className="btn btn-danger"
          disabled={deleting || submitting}
          onClick={onDeleteClick}
        >
          {deleting ? "Deleting…" : "Delete collective"}
        </button>
      </section>
    </div>
  );
}
