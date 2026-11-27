import type { Task, TaskStatus } from "./types";

type TasksResponse = { tasks: Task[] };
type TaskResponse = { task: Task };
type ErrorResponse = { error?: string };

const readError = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as ErrorResponse;
    return body.error ?? "No se pudo completar la acción";
  } catch {
    return "No se pudo completar la acción";
  }
};

export const fetchTasks = async (): Promise<Task[]> => {
  const response = await fetch("/api/tasks");
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as TasksResponse;
  return body.tasks;
};

export const createTask = async (title: string): Promise<Task> => {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as TaskResponse;
  return body.task;
};

export const updateTaskStatus = async (id: string, status: TaskStatus): Promise<Task> => {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as TaskResponse;
  return body.task;
};

export const deleteTask = async (id: string): Promise<void> => {
  const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await readError(response));
};
