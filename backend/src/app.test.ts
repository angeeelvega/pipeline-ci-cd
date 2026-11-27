import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createTaskStore } from "./tasks.js";

describe("http api", () => {
  it("reports health and the route map", async () => {
    const app = createApp(createTaskStore());

    const health = await request(app).get("/health");
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: "ok" });

    const root = await request(app).get("/");
    expect(root.body).toEqual({
      name: "pipeline-api",
      health: "/health",
      tasks: "/api/tasks",
    });
  });

  it("creates a task and lists it", async () => {
    const app = createApp(createTaskStore());
    const created = await request(app).post("/api/tasks").send({ title: "  Sonar  " });

    expect(created.status).toBe(201);
    expect(created.body.task).toMatchObject({ title: "Sonar", status: "todo" });

    const listed = await request(app).get("/api/tasks");
    expect(listed.body.tasks).toHaveLength(1);
  });

  it("rejects a missing title, an unknown status, and invalid JSON", async () => {
    const app = createApp(createTaskStore());

    const missing = await request(app).post("/api/tasks").send({});
    expect(missing.status).toBe(400);

    const created = await request(app).post("/api/tasks").send({ title: "Jenkins" });
    const badStatus = await request(app)
      .patch(`/api/tasks/${created.body.task.id}`)
      .send({ status: "later" });
    expect(badStatus.status).toBe(400);

    const badJson = await request(app)
      .post("/api/tasks")
      .set("Content-Type", "application/json")
      .send("{");
    expect(badJson.status).toBe(400);
  });

  it("moves a task and then deletes it", async () => {
    const app = createApp(createTaskStore());
    const created = await request(app).post("/api/tasks").send({ title: "Build" });
    const id = created.body.task.id as string;

    const moved = await request(app).patch(`/api/tasks/${id}`).send({ status: "doing" });
    expect(moved.status).toBe(200);
    expect(moved.body.task.status).toBe("doing");

    const removed = await request(app).delete(`/api/tasks/${id}`);
    expect(removed.status).toBe(204);

    const missing = await request(app).delete(`/api/tasks/${id}`);
    expect(missing.status).toBe(404);
  });
});
