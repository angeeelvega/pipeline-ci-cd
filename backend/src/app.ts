import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { createTaskStore, isTaskStatus, type TaskStore } from "./tasks.js";

const readObject = (body: unknown): Record<string, unknown> => {
  if (typeof body === "object" && body !== null && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }
  return {};
};

export const createApp = (store: TaskStore = createTaskStore()): Express => {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN ?? "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.get("/", (_req, res) => {
    res.json({
      name: "pipeline-api",
      health: "/health",
      tasks: "/api/tasks",
    });
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/tasks", (_req, res) => {
    res.json({ tasks: store.list() });
  });

  app.post("/api/tasks", (req, res) => {
    const title = readObject(req.body).title;
    if (typeof title !== "string") {
      res.status(400).json({ error: "El título es obligatorio" });
      return;
    }

    const result = store.create(title);
    if ("error" in result) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json({ task: result });
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const status = readObject(req.body).status;
    if (typeof status !== "string" || !isTaskStatus(status)) {
      res.status(400).json({ error: "El estado tiene que ser todo, doing o done" });
      return;
    }

    const result = store.updateStatus(req.params.id, status);
    if ("error" in result) {
      res.status(404).json(result);
      return;
    }

    res.json({ task: result });
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const removed = store.remove(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "No existe esa tarea" });
      return;
    }
    res.status(204).send();
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
