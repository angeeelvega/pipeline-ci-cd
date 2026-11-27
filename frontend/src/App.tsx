import { useEffect, useState, type FormEvent } from "react";
import { createTask, deleteTask, fetchTasks, updateTaskStatus } from "./api";
import type { Task, TaskStatus } from "./types";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "Por hacer" },
  { status: "doing", label: "En curso" },
  { status: "done", label: "Listo" },
];

const STATUS_ORDER: TaskStatus[] = ["todo", "doing", "done"];

const shiftStatus = (status: TaskStatus, direction: -1 | 1): TaskStatus | null => {
  const index = STATUS_ORDER.indexOf(status) + direction;
  if (index < 0 || index >= STATUS_ORDER.length) return null;
  return STATUS_ORDER[index];
};

const columnAccent: Record<TaskStatus, string> = {
  todo: "border-stone-400",
  doing: "border-teal",
  done: "border-clay",
};

export const App = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTasks = async () => {
    const next = await fetchTasks();
    setTasks(next);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadTasks();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "No se pudo cargar el tablero");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createTask(title);
      setTitle("");
      await loadTasks();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear la tarea");
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (task: Task, direction: -1 | 1) => {
    const status = shiftStatus(task.status, direction);
    if (!status) return;
    setError("");
    try {
      await updateTaskStatus(task.id, status);
      await loadTasks();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo mover la tarea");
    }
  };

  const handleDelete = async (task: Task) => {
    setError("");
    try {
      await deleteTask(task.id);
      await loadTasks();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo eliminar la tarea");
    }
  };

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 sm:px-8">
        <header className="flex flex-col gap-3 border-b border-line pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal">
            pipeline-ci-cd
          </p>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Tablero de tareas</h1>
          <p className="max-w-2xl text-lg text-stone-600">
            Front y API de ejemplo, listos en Docker. Jenkins, Sonar y el resto del pipeline se
            conectan encima.
          </p>
        </header>

        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleCreate}>
          <label className="flex flex-1 flex-col gap-2 text-sm font-semibold" htmlFor="task-title">
            Nueva tarea
            <input
              id="task-title"
              className="rounded-lg border border-line bg-card px-3 py-2 text-base font-normal outline-none ring-teal focus:ring-2"
              value={title}
              maxLength={120}
              placeholder="Escribe qué hay que mover en el pipeline"
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <button
            className="h-11 w-full self-end rounded-lg bg-teal px-5 font-semibold text-white hover:bg-teal-dark disabled:opacity-60 sm:w-auto"
            type="submit"
            disabled={saving || title.trim().length === 0}
          >
            Agregar
          </button>
        </form>

        {error ? (
          <p className="rounded-lg border border-clay/30 bg-white px-4 py-3 text-clay" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-stone-600">Cargando tablero…</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {COLUMNS.map((column) => {
              const columnTasks = tasks.filter((task) => task.status === column.status);
              return (
                <section
                  key={column.status}
                  className={`flex flex-col gap-3 rounded-2xl border border-line border-t-4 bg-card/70 p-4 ${columnAccent[column.status]}`}
                  aria-label={column.label}
                >
                  <header className="flex items-baseline justify-between">
                    <h2 className="font-display text-2xl">{column.label}</h2>
                    <span className="text-sm text-stone-500">{columnTasks.length}</span>
                  </header>
                  {columnTasks.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-stone-500">
                      Nada en esta columna
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {columnTasks.map((task) => (
                        <li key={task.id} className="rounded-xl border border-line bg-card p-3 shadow-sm">
                          <p className="text-base font-semibold">{task.title}</p>
                          <div className="mt-3 flex gap-2">
                            <button
                              className="rounded-md border border-line px-2 py-1 text-sm hover:bg-paper disabled:opacity-40"
                              type="button"
                              aria-label={`Mover ${task.title} a la columna anterior`}
                              disabled={shiftStatus(task.status, -1) === null}
                              onClick={() => void handleMove(task, -1)}
                            >
                              Atrás
                            </button>
                            <button
                              className="rounded-md border border-line px-2 py-1 text-sm hover:bg-paper disabled:opacity-40"
                              type="button"
                              aria-label={`Mover ${task.title} a la columna siguiente`}
                              disabled={shiftStatus(task.status, 1) === null}
                              onClick={() => void handleMove(task, 1)}
                            >
                              Adelante
                            </button>
                            <button
                              className="ml-auto rounded-md px-2 py-1 text-sm text-clay hover:bg-paper"
                              type="button"
                              aria-label={`Eliminar ${task.title}`}
                              onClick={() => void handleDelete(task)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
