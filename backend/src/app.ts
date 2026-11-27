import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  createBoard,
  PRIORITIES,
  STATUSES,
  type Board,
  type IssuePatch,
  type IssueStatus,
  type Member,
  type Priority,
} from "./board.js";

type AuthedResponse = Response & { locals: { member?: Member } };

const readCookie = (header: string | undefined, name: string): string => {
  if (!header) return "";
  const part = header
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : "";
};

const writeSession = (res: Response, token: string) => {
  res.setHeader("Set-Cookie", `session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/`);
};

const clearSession = (res: Response) => {
  res.setHeader("Set-Cookie", "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
};

const readObject = (body: unknown): Record<string, unknown> => {
  if (typeof body === "object" && body !== null && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }
  return {};
};

const isStatus = (value: unknown): value is IssueStatus =>
  typeof value === "string" && STATUSES.includes(value as IssueStatus);

const isPriority = (value: unknown): value is Priority =>
  typeof value === "string" && PRIORITIES.includes(value as Priority);

const readPatch = (body: unknown): IssuePatch | { error: string } => {
  const source = readObject(body);
  const patch: IssuePatch = {};

  if ("title" in source) {
    if (typeof source.title !== "string") return { error: "El título es obligatorio" };
    patch.title = source.title;
  }
  if ("description" in source) {
    if (typeof source.description !== "string") return { error: "La descripción no es válida" };
    patch.description = source.description;
  }
  if ("status" in source) {
    if (!isStatus(source.status)) return { error: "El estado no es válido" };
    patch.status = source.status;
  }
  if ("priority" in source) {
    if (!isPriority(source.priority)) return { error: "La prioridad no es válida" };
    patch.priority = source.priority;
  }
  if ("labelIds" in source) {
    if (!Array.isArray(source.labelIds) || source.labelIds.some((id) => typeof id !== "string")) {
      return { error: "Las etiquetas no son válidas" };
    }
    patch.labelIds = source.labelIds;
  }
  if ("assigneeId" in source) {
    if (source.assigneeId !== null && typeof source.assigneeId !== "string") {
      return { error: "Ese responsable no existe" };
    }
    patch.assigneeId = source.assigneeId;
  }

  return patch;
};

export const createApp = (board: Board = createBoard()): Express => {
  const sessions = new Map<string, string>();
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN ?? "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  const requireMember = (req: Request, res: AuthedResponse, next: NextFunction) => {
    const memberId = sessions.get(readCookie(req.headers.cookie, "session"));
    const member = board.listMembers().find((item) => item.id === memberId);
    if (!member) {
      res.status(401).json({ error: "Inicia sesión" });
      return;
    }
    res.locals.member = member;
    next();
  };

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/session", (req, res) => {
    const body = readObject(req.body);
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      res.status(400).json({ error: "Correo o contraseña incorrectos" });
      return;
    }
    const member = board.authenticate(body.email, body.password);
    if (!member) {
      res.status(401).json({ error: "Correo o contraseña incorrectos" });
      return;
    }
    const token = crypto.randomUUID();
    sessions.set(token, member.id);
    writeSession(res, token);
    res.json({ user: member });
  });

  app.get("/api/session", requireMember, (_req, res: AuthedResponse) => {
    res.json({ user: res.locals.member });
  });

  app.delete("/api/session", (req, res) => {
    const token = readCookie(req.headers.cookie, "session");
    if (token) sessions.delete(token);
    clearSession(res);
    res.status(204).send();
  });

  app.get("/api/board", requireMember, (_req, res) => {
    res.json({
      issues: board.listIssues(),
      labels: board.listLabels(),
      members: board.listMembers(),
    });
  });

  app.get("/api/issues/:key", requireMember, (req, res) => {
    const issue = board.findIssue(req.params.key);
    if (!issue) {
      res.status(404).json({ error: "No existe ese issue" });
      return;
    }
    const comments = board.listComments(issue.key);
    res.json({ issue, comments });
  });

  app.post("/api/issues", requireMember, (req, res) => {
    const body = readObject(req.body);
    if (typeof body.title !== "string") {
      res.status(400).json({ error: "El título es obligatorio" });
      return;
    }
    const description = typeof body.description === "string" ? body.description : "";
    const created = board.createIssue(body.title, description);
    if ("error" in created) {
      res.status(400).json(created);
      return;
    }
    res.status(201).json({ issue: created });
  });

  app.patch("/api/issues/:key", requireMember, (req, res) => {
    const patch = readPatch(req.body);
    if ("error" in patch) {
      res.status(400).json(patch);
      return;
    }
    const updated = board.updateIssue(req.params.key, patch);
    if ("error" in updated) {
      const status = updated.error === "No existe ese issue" ? 404 : 400;
      res.status(status).json(updated);
      return;
    }
    res.json({ issue: updated });
  });

  app.post("/api/issues/:key/comments", requireMember, (req, res: AuthedResponse) => {
    const body = readObject(req.body);
    if (typeof body.body !== "string") {
      res.status(400).json({ error: "El comentario es obligatorio" });
      return;
    }
    const comment = board.addComment(req.params.key, res.locals.member!.id, body.body);
    if ("error" in comment) {
      const status = comment.error === "No existe ese issue" ? 404 : 400;
      res.status(status).json(comment);
      return;
    }
    res.status(201).json({ comment });
  });

  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (error instanceof SyntaxError) {
      res.status(400).json({ error: "JSON inválido" });
      return;
    }
    next(error);
  });

  return app;
};
