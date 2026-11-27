import { createApp } from "./app.js";
import { createTaskStore, type Task } from "./tasks.js";

const seed: Task[] = [
  {
    id: "seed-dockerfile",
    title: "Revisar el Dockerfile",
    status: "todo",
    createdAt: "2026-01-01T12:00:00.000Z",
  },
  {
    id: "seed-jenkins",
    title: "Conectar Jenkins",
    status: "doing",
    createdAt: "2026-01-01T12:05:00.000Z",
  },
  {
    id: "seed-sonar",
    title: "Publicar el reporte de Sonar",
    status: "done",
    createdAt: "2026-01-01T12:10:00.000Z",
  },
];

const port = Number(process.env.PORT ?? 4000);
const app = createApp(createTaskStore(seed));

app.listen(port, "0.0.0.0", () => {
  console.log(`api listening on ${port}`);
});
