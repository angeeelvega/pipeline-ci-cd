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

export type IssuePatch = {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: Priority;
  labelIds?: string[];
  assigneeId?: string | null;
};

type StoredMember = Member & { password: string };

const TITLE_LIMIT = 120;
const COMMENT_LIMIT = 2000;

const isStatus = (value: string): value is IssueStatus =>
  STATUSES.includes(value as IssueStatus);

const isPriority = (value: string): value is Priority =>
  PRIORITIES.includes(value as Priority);

const members: StoredMember[] = [
  { id: "u-angel", name: "Angel Vega", email: "angel@pipeline.dev", password: "pipeline" },
  { id: "u-cristian", name: "Cristian Vargas", email: "cristian@pipeline.dev", password: "pipeline" },
  { id: "u-camilo", name: "Camilo Cuellar", email: "camilo@pipeline.dev", password: "pipeline" },
];

const labels: Label[] = [
  { id: "infra", name: "Infra", color: "#6b7280" },
  { id: "ci", name: "CI", color: "#0969da" },
  { id: "calidad", name: "Calidad", color: "#0f7b6c" },
  { id: "producto", name: "Producto", color: "#7c3aed" },
];

const seedIssues = (): Issue[] => [
  {
    id: "i-1",
    key: "PIP-1",
    title: "Revisar el Dockerfile",
    description: "Confirmar que el front y la API arrancan con un solo compose.",
    status: "todo",
    priority: "medium",
    labelIds: ["infra"],
    assigneeId: "u-angel",
  },
  {
    id: "i-6",
    key: "PIP-6",
    title: "Separar el build del front",
    description: "El pipeline tiene que poder construir la imagen del front sin la API.",
    status: "todo",
    priority: "urgent",
    labelIds: ["ci", "infra"],
    assigneeId: "u-cristian",
  },
  {
    id: "i-4",
    key: "PIP-4",
    title: "Definir las etiquetas del tablero",
    description: "Dejar las etiquetas mínimas para clasificar el trabajo del pipeline.",
    status: "todo",
    priority: "low",
    labelIds: ["producto"],
    assigneeId: "u-camilo",
  },
  {
    id: "i-2",
    key: "PIP-2",
    title: "Conectar Jenkins",
    description: "El job tiene que construir las imágenes y correr los tests de la API.",
    status: "doing",
    priority: "high",
    labelIds: ["ci"],
    assigneeId: "u-cristian",
  },
  {
    id: "i-5",
    key: "PIP-5",
    title: "Abrir el detalle de un issue",
    description: "Desde el tablero se entra al issue para ver estado, etiquetas y responsable.",
    status: "doing",
    priority: "medium",
    labelIds: ["producto"],
    assigneeId: "u-angel",
  },
  {
    id: "i-3",
    key: "PIP-3",
    title: "Publicar el reporte de Sonar",
    description: "Dejar el reporte visible cuando el análisis termine.",
    status: "done",
    priority: "low",
    labelIds: ["calidad"],
    assigneeId: "u-camilo",
  },
];

export const toMember = (member: StoredMember): Member => ({
  id: member.id,
  name: member.name,
  email: member.email,
});

export const createBoard = (seed = seedIssues()) => {
  const issues = seed.map((issue) => ({ ...issue, labelIds: [...issue.labelIds] }));
  const comments = new Map<string, Comment[]>([
    [
      "i-2",
      [
        {
          id: "c-1",
          authorId: "u-angel",
          body: "El job ya ve el repositorio. Falta publicar el artefacto.",
          createdAt: "2026-01-02T15:00:00.000Z",
        },
      ],
    ],
  ]);
  let sequence = issues.reduce((max, issue) => {
    const number = Number(issue.key.replace("PIP-", ""));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);

  const listMembers = (): Member[] => members.map(toMember);

  const listLabels = (): Label[] => labels.map((label) => ({ ...label }));

  const listIssues = (): Issue[] =>
    issues.map((issue) => ({ ...issue, labelIds: [...issue.labelIds] }));

  const findIssue = (key: string): Issue | undefined =>
    listIssues().find((issue) => issue.key === key);

  const authenticate = (email: string, password: string): Member | null => {
    const member = members.find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password,
    );
    return member ? toMember(member) : null;
  };

  const createIssue = (title: string, description = ""): Issue | { error: string } => {
    const trimmed = title.trim();
    if (!trimmed) return { error: "El título es obligatorio" };
    if (trimmed.length > TITLE_LIMIT) {
      return { error: "El título no puede pasar de 120 caracteres" };
    }
    sequence += 1;
    const issue: Issue = {
      id: crypto.randomUUID(),
      key: `PIP-${sequence}`,
      title: trimmed,
      description: description.trim(),
      status: "todo",
      priority: "medium",
      labelIds: [],
      assigneeId: null,
    };
    issues.unshift(issue);
    return { ...issue, labelIds: [] };
  };

  const updateIssue = (key: string, patch: IssuePatch): Issue | { error: string } => {
    const issue = issues.find((item) => item.key === key);
    if (!issue) return { error: "No existe ese issue" };

    if (patch.title !== undefined) {
      const trimmed = patch.title.trim();
      if (!trimmed) return { error: "El título es obligatorio" };
      if (trimmed.length > TITLE_LIMIT) {
        return { error: "El título no puede pasar de 120 caracteres" };
      }
      issue.title = trimmed;
    }

    if (patch.description !== undefined) issue.description = patch.description.trim();

    if (patch.status !== undefined) {
      if (!isStatus(patch.status)) return { error: "El estado no es válido" };
      issue.status = patch.status;
    }

    if (patch.priority !== undefined) {
      if (!isPriority(patch.priority)) return { error: "La prioridad no es válida" };
      issue.priority = patch.priority;
    }

    if (patch.labelIds !== undefined) {
      const unknown = patch.labelIds.find((id) => !labels.some((label) => label.id === id));
      if (unknown) return { error: "Hay una etiqueta que no existe" };
      issue.labelIds = [...new Set(patch.labelIds)];
    }

    if (patch.assigneeId !== undefined) {
      if (patch.assigneeId !== null && !members.some((member) => member.id === patch.assigneeId)) {
        return { error: "Ese responsable no existe" };
      }
      issue.assigneeId = patch.assigneeId;
    }

    return { ...issue, labelIds: [...issue.labelIds] };
  };

  const listComments = (key: string): Comment[] | { error: string } => {
    const issue = issues.find((item) => item.key === key);
    if (!issue) return { error: "No existe ese issue" };
    return (comments.get(issue.id) ?? []).map((comment) => ({ ...comment }));
  };

  const addComment = (key: string, authorId: string, body: string): Comment | { error: string } => {
    const issue = issues.find((item) => item.key === key);
    if (!issue) return { error: "No existe ese issue" };
    const trimmed = body.trim();
    if (!trimmed) return { error: "El comentario es obligatorio" };
    if (trimmed.length > COMMENT_LIMIT) {
      return { error: "El comentario no puede pasar de 2000 caracteres" };
    }
    const comment: Comment = {
      id: crypto.randomUUID(),
      authorId,
      body: trimmed,
      createdAt: new Date().toISOString(),
    };
    const thread = comments.get(issue.id) ?? [];
    thread.push(comment);
    comments.set(issue.id, thread);
    return { ...comment };
  };

  return {
    listMembers,
    listLabels,
    listIssues,
    findIssue,
    authenticate,
    createIssue,
    updateIssue,
    listComments,
    addComment,
  };
};

export type Board = ReturnType<typeof createBoard>;
