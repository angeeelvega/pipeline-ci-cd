import { useEffect, useRef, useState, type DragEvent } from "react";
import { fetchBoard, logout, updateIssue } from "./api";
import { IssuePanel } from "./IssuePanel";
import type { Issue, IssueStatus, Label, Member } from "./types";
import { PRIORITY_LABEL, STATUSES, STATUS_LABEL, type Priority } from "./types";

const priorityText: Record<Priority, string> = {
  low: "text-priority-low",
  medium: "text-priority-medium",
  high: "text-priority-high",
  urgent: "text-priority-urgent",
};

type BoardScreenProps = {
  user: Member;
  onLogout: () => void;
};

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

export const BoardScreen = ({ user, onLogout }: BoardScreenProps) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<IssueStatus | null>(null);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const ignoreClick = useRef(false);

  const load = async () => {
    const board = await fetchBoard();
    setIssues(board.issues);
    setLabels(board.labels);
    setMembers(board.members);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await load();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "No se pudo cargar el tablero");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const handleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleDrop = async (status: IssueStatus, event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragOver(null);
    const key = event.dataTransfer.getData("text/plain");
    const current = issues.find((issue) => issue.key === key);
    if (!current || current.status === status) return;
    setIssues((items) => items.map((issue) => (issue.key === key ? { ...issue, status } : issue)));
    try {
      const updated = await updateIssue(key, { status });
      setIssues((items) => items.map((issue) => (issue.key === key ? updated.issue : issue)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo mover el issue");
      await load();
    }
  };

  const selected = issues.find((issue) => issue.key === selectedKey) ?? null;
  const visible = issues.filter((issue) => !labelFilter || issue.labelIds.includes(labelFilter));

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col bg-sidebar px-3 py-4">
        <p className="px-2 text-sm font-medium">Pipeline</p>
        <p className="px-2 pt-1 text-xs text-muted-foreground">Tablero</p>
        <nav className="mt-6 flex flex-col gap-1" aria-label="Etiquetas">
          <button
            className={`rounded-lg px-2 py-1.5 text-left text-sm ${labelFilter === null ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"}`}
            type="button"
            onClick={() => setLabelFilter(null)}
          >
            Todas
          </button>
          {labels.map((label) => (
            <button
              key={label.id}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${labelFilter === label.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"}`}
              type="button"
              onClick={() => setLabelFilter(label.id)}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: label.color }} />
              {label.name}
            </button>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 px-2">
          <button className="text-left text-sm text-muted-foreground hover:text-foreground" type="button" onClick={handleTheme}>
            {dark ? "Tema claro" : "Tema oscuro"}
          </button>
          <p className="text-sm">{user.name}</p>
          <button className="text-left text-sm text-muted-foreground hover:text-foreground" type="button" onClick={() => void handleLogout()}>
            Salir
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-5 py-4">
          <div>
            <h1 className="text-lg font-medium">Tablero</h1>
            <p className="text-sm text-muted-foreground">Arrastra un issue para cambiar su estado.</p>
          </div>
          <button
            className="h-8 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            type="button"
            onClick={() => {
              setCreating(true);
              setSelectedKey(null);
            }}
          >
            Nuevo issue
          </button>
        </header>

        {error ? (
          <p className="px-5 pb-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="px-5 text-sm text-muted-foreground">Cargando tablero…</p>
        ) : (
          <div className="flex flex-1 gap-3 overflow-x-auto px-5 pb-5">
            {STATUSES.map((status) => {
              const columnIssues = visible.filter((issue) => issue.status === status);
              return (
                <section
                  key={status}
                  className={`flex w-72 shrink-0 flex-col gap-2 rounded-xl p-2 ${dragOver === status ? "bg-kanban-column-raised" : "bg-kanban-column"}`}
                  aria-label={STATUS_LABEL[status]}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(status);
                  }}
                  onDragLeave={() => setDragOver((current) => (current === status ? null : current))}
                  onDrop={(event) => void handleDrop(status, event)}
                >
                  <header className="flex items-center justify-between px-2 py-1">
                    <h2 className="text-sm font-medium">{STATUS_LABEL[status]}</h2>
                    <span className="text-xs text-muted-foreground">{columnIssues.length}</span>
                  </header>
                  <ul className="flex flex-col gap-2">
                    {columnIssues.map((issue) => {
                      const assignee = members.find((member) => member.id === issue.assigneeId);
                      return (
                        <li key={issue.id}>
                          <article
                            className={`cursor-grab rounded-lg p-3 shadow-[var(--tile-shadow)] hover:shadow-[var(--tile-shadow-hover)] ${selectedKey === issue.key ? "bg-kanban-card-selected" : "bg-kanban-card hover:bg-kanban-card-hover"}`}
                            draggable
                            tabIndex={0}
                            role="button"
                            aria-label={`Abrir ${issue.key}, ${issue.title}`}
                            onDragStart={(event) => {
                              ignoreClick.current = true;
                              event.dataTransfer.setData("text/plain", issue.key);
                              event.dataTransfer.effectAllowed = "move";
                            }}
                            onDragEnd={() => {
                              window.setTimeout(() => {
                                ignoreClick.current = false;
                              }, 0);
                            }}
                            onClick={() => {
                              if (ignoreClick.current) {
                                ignoreClick.current = false;
                                return;
                              }
                              setCreating(false);
                              setSelectedKey(issue.key);
                            }}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter" && event.key !== " ") return;
                              event.preventDefault();
                              setCreating(false);
                              setSelectedKey(issue.key);
                            }}
                          >
                            <p className="text-xs text-muted-foreground">{issue.key}</p>
                            <p className="pt-1 text-sm font-medium">{issue.title}</p>
                            <div className="mt-3 flex items-center gap-2">
                              <span className={`text-xs ${priorityText[issue.priority]}`}>
                                {PRIORITY_LABEL[issue.priority]}
                              </span>
                              <span className="ml-auto flex items-center gap-2">
                                {issue.labelIds.map((id) => {
                                  const label = labels.find((item) => item.id === id);
                                  if (!label) return null;
                                  return (
                                    <span
                                      key={id}
                                      className="size-2 rounded-full"
                                      title={label.name}
                                      style={{ backgroundColor: label.color }}
                                    />
                                  );
                                })}
                                {assignee ? (
                                  <span
                                    className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium"
                                    title={assignee.name}
                                  >
                                    {initials(assignee.name)}
                                  </span>
                                ) : null}
                              </span>
                            </div>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {creating || selected ? (
        <IssuePanel
          issue={selected}
          creating={creating}
          labels={labels}
          members={members}
          onClose={() => {
            setCreating(false);
            setSelectedKey(null);
          }}
          onIssue={(issue) => setIssues((items) => items.map((item) => (item.key === issue.key ? issue : item)))}
          onCreated={(issue) => {
            setIssues((items) => [issue, ...items]);
            setCreating(false);
            setSelectedKey(issue.key);
          }}
        />
      ) : null}
    </div>
  );
};
