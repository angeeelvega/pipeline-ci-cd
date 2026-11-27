# Jenkins local para el laboratorio: LTS + cliente Docker para poder ejecutar "docker build/push".
FROM jenkins/jenkins:lts

USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends docker.io \
    && rm -rf /var/lib/apt/lists/*

# Se ejecuta como root para poder usar el socket de Docker del host (solo para uso local/laboratorio).
