export const STATUSES = ["todo", "doing", "done"] as const;
export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type IssueStatus = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

export type Member = {
  id: string;
  name: string;
  email: string;
};

export type Label = {
  id: string;
  name: string;
  color: string;
};

export type Issue = {
  id: string;
  key: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: Priority;
  labelIds: string[];
  assigneeId: string | null;
};

export type Comment = {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type IssuePatch = Partial<
  Pick<Issue, "title" | "description" | "status" | "priority" | "labelIds" | "assigneeId">
>;

export const STATUS_LABEL: Record<IssueStatus, string> = {
  todo: "Por hacer",
  doing: "En curso",
  done: "Listo",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};
