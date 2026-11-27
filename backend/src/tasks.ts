export const TASK_STATUSES = ["todo", "doing", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
};

export type TaskError = { error: string };

const TITLE_LIMIT = 120;

export const isTaskStatus = (value: string): value is TaskStatus =>
  TASK_STATUSES.includes(value as TaskStatus);

export const createTaskStore = (seed: Task[] = []) => {
  const tasks = seed.map((task) => ({ ...task }));

  const list = (): Task[] => tasks.map((task) => ({ ...task }));

  const create = (title: string): Task | TaskError => {
    const trimmed = title.trim();
    if (!trimmed) return { error: "El título es obligatorio" };
    if (trimmed.length > TITLE_LIMIT) {
      return { error: "El título no puede pasar de 120 caracteres" };
    }

    const task: Task = {
      id: crypto.randomUUID(),
      title: trimmed,
      status: "todo",
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(task);
    return { ...task };
  };

  const updateStatus = (id: string, status: TaskStatus): Task | TaskError => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return { error: "No existe esa tarea" };
    task.status = status;
    return { ...task };
  };

  const remove = (id: string): boolean => {
    const index = tasks.findIndex((item) => item.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    return true;
  };

  return { list, create, updateStatus, remove };
};

export type TaskStore = ReturnType<typeof createTaskStore>;
