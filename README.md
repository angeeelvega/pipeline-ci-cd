# pipeline-ci-cd

App de ejemplo para practicar el pipeline. Tiene un front y una API, los dos en Docker. Jenkins, Sonar y el resto de integraciones no están configurados: este repo solo deja la aplicación corriendo para que se conecten encima.

No es un clon de [It's a Plan](https://github.com/croffasia/itsaplan). Esa es una plataforma completa de gestión de proyectos. Aquí hay un tablero chico de tareas.

## Qué corre

| Servicio | Carpeta | Puerto en el host | Qué hace |
| --- | --- | --- | --- |
| `web` | `frontend` | [http://localhost:8080](http://localhost:8080) | React, servido por nginx. `/api` y `/health` se proxyean a la API. |
| `api` | `backend` | [http://localhost:4000](http://localhost:4000) | Express. Guarda las tareas en memoria. |

La API vuelve a las tres tareas de ejemplo cada vez que el contenedor arranca. No hay base de datos.

## Arrancar

Hace falta Docker.

```bash
docker compose up --build
```

- Tablero: http://localhost:8080
- Salud de la API: http://localhost:4000/health

Para bajarlo: `docker compose down`.

## Sin Docker

En dos terminales, con Node 22:

```bash
cd backend && npm install && npm test && npm run dev
cd frontend && npm install && npm run dev
```

El front de Vite queda en http://localhost:5173 y reenvía `/api` a `localhost:4000`.

## API

| Método | Ruta | Cuerpo |
| --- | --- | --- |
| `GET` | `/health` | `{ "status": "ok" }` |
| `GET` | `/api/tasks` | Lista de tareas |
| `POST` | `/api/tasks` | `{ "title": "..." }` |
| `PATCH` | `/api/tasks/:id` | `{ "status": "todo" \| "doing" \| "done" }` |
| `DELETE` | `/api/tasks/:id` | — |

## Para el pipeline

- Tests de la API: `cd backend && npm test`
- Build del front: `cd frontend && npm run build`
- Imágenes: `docker compose build`
- El contenedor `api` expone un healthcheck en `/health`
