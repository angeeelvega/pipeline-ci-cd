import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createBoard } from "./board.js";

const login = async (agent: request.SuperAgentTest) => {
  const response = await agent
    .post("/api/session")
    .send({ email: "angel@pipeline.dev", password: "pipeline" });
  expect(response.status).toBe(200);
  expect(response.body.user.name).toBe("Angel Vega");
};

describe("issue board api", () => {
  it("reports health without a session", async () => {
    const app = createApp(createBoard([]));
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("rejects the board until the member signs in", async () => {
    const app = createApp(createBoard([]));
    const anonymous = await request(app).get("/api/board");
    expect(anonymous.status).toBe(401);

    const agent = request.agent(app);
    const bad = await agent.post("/api/session").send({ email: "angel@pipeline.dev", password: "no" });
    expect(bad.status).toBe(401);

    await login(agent);
    const board = await agent.get("/api/board");
    expect(board.status).toBe(200);
    expect(board.body.labels.length).toBeGreaterThan(0);
    expect(board.body.members).toHaveLength(3);
  });

  it("creates an issue, moves it, and changes its labels", async () => {
    const app = createApp(createBoard([]));
    const agent = request.agent(app);
    await login(agent);

    const created = await agent.post("/api/issues").send({ title: "  Empaquetar  ", description: "Imagen" });
    expect(created.status).toBe(201);
    expect(created.body.issue).toMatchObject({ title: "Empaquetar", status: "todo", key: "PIP-1" });

    const moved = await agent.patch("/api/issues/PIP-1").send({ status: "doing" });
    expect(moved.status).toBe(200);
    expect(moved.body.issue.status).toBe("doing");

    const labeled = await agent.patch("/api/issues/PIP-1").send({ labelIds: ["ci", "ci"] });
    expect(labeled.body.issue.labelIds).toEqual(["ci"]);

    const unknown = await agent.patch("/api/issues/PIP-1").send({ labelIds: ["nope"] });
    expect(unknown.status).toBe(400);
  });

  it("opens an issue and adds a comment", async () => {
    const app = createApp(createBoard([]));
    const agent = request.agent(app);
    await login(agent);
    await agent.post("/api/issues").send({ title: "Sonar" });

    const empty = await agent.post("/api/issues/PIP-1/comments").send({ body: "   " });
    expect(empty.status).toBe(400);

    const comment = await agent.post("/api/issues/PIP-1/comments").send({ body: "Listo para el análisis" });
    expect(comment.status).toBe(201);
    expect(comment.body.comment.body).toBe("Listo para el análisis");

    const detail = await agent.get("/api/issues/PIP-1");
    expect(detail.body.comments).toHaveLength(1);
    expect(detail.body.issue.title).toBe("Sonar");
  });

  it("ends the session", async () => {
    const app = createApp(createBoard([]));
    const agent = request.agent(app);
    await login(agent);
    const gone = await agent.delete("/api/session");
    expect(gone.status).toBe(204);
    const board = await agent.get("/api/board");
    expect(board.status).toBe(401);
  });
});
