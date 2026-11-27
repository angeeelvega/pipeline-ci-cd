# pipeline-ci-cd

Tablero de issues con un front en React y una API en Node. Se puede entrar, ver el tablero, arrastrar un issue de estado, abrirlo y cambiar título, descripción, etiquetas, prioridad, responsable y comentarios.

## Ejecutar

Hace falta Docker.

```bash
docker compose up --build
```

Abre http://localhost:8080.

Entra con `angel@pipeline.dev`, `cristian@pipeline.dev` o `camilo@pipeline.dev`. La contraseña es `pipeline`.

La API responde en http://localhost:4000/health.

Para detenerlo: `docker compose down`.

## Sin Docker

Hace falta Node 22.

```bash
cd backend && npm install && npm test && npm run dev
cd frontend && npm install && npm run dev
```

El front queda en http://localhost:5173.
