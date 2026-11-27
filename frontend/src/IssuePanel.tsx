import { useEffect, useState, type FormEvent } from "react";
import { addComment, createIssue, fetchIssue, updateIssue } from "./api";
import type { Comment, Issue, IssueStatus, Label, Member } from "./types";
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, type Priority } from "./types";

const priorityDot: Record<Priority, string> = {
  low: "bg-priority-low",
  medium: "bg-priority-medium",
  high: "bg-priority-high",
  urgent: "bg-priority-urgent",
};

type IssuePanelProps = {
  issue: Issue | null;
  creating: boolean;
  labels: Label[];
  members: Member[];
  onClose: () => void;
  onIssue: (issue: Issue) => void;
  onCreated: (issue: Issue) => void;
};

const fieldClass =
  "w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export const IssuePanel = ({
  issue,
  creating,
  labels,
  members,
  onClose,
  onIssue,
  onCreated,
}: IssuePanelProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setTitle(issue?.title ?? "");
    setDescription(issue?.description ?? "");
    setComment("");
    setError("");
    if (!issue) {
      setComments([]);
      return;
    }
    const load = async () => {
      try {
        const detail = await fetchIssue(issue.key);
        setComments(detail.comments);
        setTitle(detail.issue.title);
        setDescription(detail.issue.description);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "No se pudo abrir el issue");
      }
    };
    void load();
  }, [issue]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      const created = await createIssue(title, description);
      onCreated(created.issue);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear el issue");
    }
  };

  const saveText = async (patch: { title?: string; description?: string }) => {
    if (!issue) return;
    setError("");
    try {
      const updated = await updateIssue(issue.key, patch);
      onIssue(updated.issue);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar");
    }
  };

  const saveField = async (patch: { status?: IssueStatus; priority?: Priority; assigneeId?: string | null; labelIds?: string[] }) => {
    if (!issue) return;
    setError("");
    try {
      const updated = await updateIssue(issue.key, patch);
      onIssue(updated.issue);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar");
    }
  };

  const handleComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!issue) return;
    setError("");
    try {
      const created = await addComment(issue.key, comment);
      setComments((current) => [...current, created.comment]);
      setComment("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo comentar");
    }
  };

  const toggleLabel = (labelId: string) => {
    if (!issue) return;
    const next = issue.labelIds.includes(labelId)
      ? issue.labelIds.filter((id) => id !== labelId)
      : [...issue.labelIds, labelId];
    void saveField({ labelIds: next });
  };

  return (
    <aside
      className="fixed inset-y-0 right-0 z-20 flex w-full max-w-md flex-col bg-rail shadow-[var(--side-panel-shadow)]"
      aria-label={creating ? "Nuevo issue" : issue?.key}
    >
      <header className="flex items-center justify-between px-5 pt-5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">
          {creating ? "Nuevo issue" : issue?.key}
        </p>
        <button
          className="rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          type="button"
          onClick={onClose}
        >
          Cerrar
        </button>
      </header>

      {creating ? (
        <form className="flex flex-1 flex-col gap-4 px-5 py-4" onSubmit={handleCreate}>
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="new-title">
            Título
            <input
              id="new-title"
              className={fieldClass}
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-1 flex-col gap-2 text-sm font-medium" htmlFor="new-description">
            Descripción
            <textarea
              id="new-description"
              className={`${fieldClass} min-h-32 flex-1 resize-none`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="h-9 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90"
            type="submit"
          >
            Crear issue
          </button>
        </form>
      ) : issue ? (
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-4">
          <input
            className="bg-transparent text-xl font-medium tracking-tight outline-none"
            aria-label="Título"
            value={title}
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => {
              if (title.trim() && title.trim() !== issue.title) void saveText({ title });
            }}
          />
          <textarea
            className="min-h-24 resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none"
            aria-label="Descripción"
            value={description}
            placeholder="Añade una descripción"
            onChange={(event) => setDescription(event.target.value)}
            onBlur={() => {
              if (description !== issue.description) void saveText({ description });
            }}
          />

          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Estado</h2>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  className={`h-8 rounded-lg px-3 text-sm ${issue.status === status ? "bg-secondary text-secondary-foreground" : "hover:bg-accent"}`}
                  type="button"
                  onClick={() => void saveField({ status })}
                >
                  {STATUS_LABEL[status]}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Prioridad</h2>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((priority) => (
                <button
                  key={priority}
                  className={`inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm ${issue.priority === priority ? "bg-secondary" : "hover:bg-accent"}`}
                  type="button"
                  onClick={() => void saveField({ priority })}
                >
                  <span className={`size-2 rounded-full ${priorityDot[priority]}`} />
                  {PRIORITY_LABEL[priority]}
                </button>
              ))}
            </div>
          </section>

          <label className="flex flex-col gap-2 text-sm" htmlFor="assignee">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Responsable
            </span>
            <select
              id="assignee"
              className={fieldClass}
              value={issue.assigneeId ?? ""}
              onChange={(event) =>
                void saveField({ assigneeId: event.target.value === "" ? null : event.target.value })
              }
            >
              <option value="">Sin asignar</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>

          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Etiquetas</h2>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => {
                const active = issue.labelIds.includes(label.id);
                return (
                  <button
                    key={label.id}
                    className={`inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm ${active ? "bg-secondary" : "hover:bg-accent"}`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleLabel(label.id)}
                  >
                    <span className="size-2 rounded-full" style={{ backgroundColor: label.color }} />
                    {label.name}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Comentarios
            </h2>
            <ul className="flex flex-col gap-3">
              {comments.map((item) => {
                const author = members.find((member) => member.id === item.authorId);
                return (
                  <li key={item.id} className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground">{author?.name ?? "Alguien"}</p>
                    <p className="text-sm">{item.body}</p>
                  </li>
                );
              })}
            </ul>
            <form className="flex flex-col gap-2" onSubmit={handleComment}>
              <label className="sr-only" htmlFor="comment">
                Comentario
              </label>
              <textarea
                id="comment"
                className={`${fieldClass} min-h-20`}
                value={comment}
                placeholder="Escribe un comentario"
                onChange={(event) => setComment(event.target.value)}
              />
              <button
                className="h-8 self-end rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
                type="submit"
                disabled={comment.trim().length === 0}
              >
                Comentar
              </button>
            </form>
          </section>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
};
