import { describe, expect, it } from "vitest";
import { createTaskStore } from "./tasks.js";

describe("task store", () => {
  it("trims the title and stores a new todo task", () => {
    const store = createTaskStore();
    const created = store.create("  Empaquetar la imagen  ");

    expect(created).toMatchObject({
      title: "Empaquetar la imagen",
      status: "todo",
    });
    expect(store.list()).toHaveLength(1);
  });

  it("rejects an empty title and a title over 120 characters", () => {
    const store = createTaskStore();

    expect(store.create("   ")).toEqual({ error: "El título es obligatorio" });
    expect(store.create("a".repeat(121))).toEqual({
      error: "El título no puede pasar de 120 caracteres",
    });
    expect(store.list()).toHaveLength(0);
  });

  it("updates status and removes a task without touching the others", () => {
    const store = createTaskStore();
    const first = store.create("Primera");
    const second = store.create("Segunda");
    if ("error" in first || "error" in second) throw new Error("seed failed");

    expect(store.updateStatus(first.id, "done")).toMatchObject({ status: "done" });
    expect(store.updateStatus("missing", "doing")).toEqual({ error: "No existe esa tarea" });
    expect(store.remove(second.id)).toBe(true);
    expect(store.remove(second.id)).toBe(false);
    expect(store.list().map((task) => task.id)).toEqual([first.id]);
  });
});
