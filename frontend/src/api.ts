import type { Comment, Issue, IssuePatch, Label, Member } from "./types";

type ErrorBody = { error?: string };

const readError = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as ErrorBody;
    return body.error ?? "No se pudo completar la acción";
  } catch {
    return "No se pudo completar la acción";
  }
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(await readError(response));
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

export const fetchSession = async (): Promise<Member | null> => {
  const response = await fetch("/api/session", { credentials: "include" });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(await readError(response));
  const body = (await response.json()) as { user: Member };
  return body.user;
};

export const login = (email: string, password: string) =>
  request<{ user: Member }>("/api/session", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const logout = () => request<void>("/api/session", { method: "DELETE" });

export const fetchBoard = () =>
  request<{ issues: Issue[]; labels: Label[]; members: Member[] }>("/api/board");

export const fetchIssue = (key: string) =>
  request<{ issue: Issue; comments: Comment[] }>(`/api/issues/${key}`);

export const createIssue = (title: string, description: string) =>
  request<{ issue: Issue }>("/api/issues", {
    method: "POST",
    body: JSON.stringify({ title, description }),
  });

export const updateIssue = (key: string, patch: IssuePatch) =>
  request<{ issue: Issue }>(`/api/issues/${key}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

export const addComment = (key: string, body: string) =>
  request<{ comment: Comment }>(`/api/issues/${key}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
