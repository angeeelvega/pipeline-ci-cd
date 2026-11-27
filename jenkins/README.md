# Jenkins local (CD)

Jenkins ejecuta el `Jenkinsfile` de la raíz: clona el repo, construye las imágenes Docker y las publica en DockerHub.

## Levantar Jenkins

Hace falta Docker.

```bash
cd jenkins
docker compose up -d --build
```

Abre http://localhost:8081.

Clave inicial de administrador:

```bash
docker exec jenkins-local cat /var/jenkins_home/secrets/initialAdminPassword
```

En el asistente elige **Install suggested plugins** y crea el usuario administrador.

## Credenciales de DockerHub

1. En DockerHub crea un token en *Account Settings → Security → New Access Token*.
2. En Jenkins ve a *Manage Jenkins → Credentials → System → Global → Add Credentials*.
3. Tipo **Username with password**, usuario de DockerHub, el token como contraseña, ID `dockerhub-credentials`.

## Crear el job

1. *New Item* → nombre `pipeline-ci-cd` → **Pipeline** (o *Multibranch Pipeline*).
2. En *Pipeline* elige **Pipeline script from SCM** → Git → URL del repositorio, rama `main`, Script Path `Jenkinsfile`.
3. Guarda y pulsa **Build with Parameters**. Indica tu usuario de DockerHub en `DOCKERHUB_USER`.

## Stages

| Stage | Qué hace |
|---|---|
| Clonar repositorio | `checkout scm` y calcula la versión de imagen (hash corto del commit) |
| Construir imágenes Docker | `docker build` del backend y del frontend en paralelo |
| Publicar en DockerHub | `docker login` con la credencial y `docker push` de ambas imágenes (solo `main`) |
