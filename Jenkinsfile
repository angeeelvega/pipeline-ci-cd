// Pipeline de CD: clona el repositorio, construye las imágenes Docker y las publica en DockerHub.
// Requisitos en Jenkins:
//   - Credencial tipo "Username with password" con ID: dockerhub-credentials
//     (usuario de DockerHub + token de acceso).
//   - El agente debe tener el cliente Docker y acceso al daemon (ver jenkins/README.md).
pipeline {
    agent any

    parameters {
        string(
            name: 'DOCKERHUB_USER',
            defaultValue: 'tu-usuario-dockerhub',
            description: 'Usuario u organización de DockerHub donde se publican las imágenes'
        )
    }

    environment {
        REGISTRY_CREDENTIALS = 'dockerhub-credentials'
        API_IMAGE            = "${params.DOCKERHUB_USER}/pipeline-api"
        WEB_IMAGE            = "${params.DOCKERHUB_USER}/pipeline-web"
    }

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('Clonar repositorio') {
            steps {
                // Clona el repo y la rama configurados en el job de Jenkins.
                checkout scm
                script {
                    env.IMAGE_TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                }
                echo "Versión de imagen: ${env.IMAGE_TAG}"
            }
        }

        stage('Construir imágenes Docker') {
            parallel {
                stage('Backend') {
                    steps {
                        sh 'docker build -t ${API_IMAGE}:${IMAGE_TAG} -t ${API_IMAGE}:latest ./backend'
                    }
                }
                stage('Frontend') {
                    steps {
                        sh 'docker build -t ${WEB_IMAGE}:${IMAGE_TAG} -t ${WEB_IMAGE}:latest ./frontend'
                    }
                }
            }
        }

        stage('Publicar en DockerHub') {
            // Solo se publica desde main; otras ramas únicamente construyen.
            when {
                anyOf {
                    branch 'main'
                    expression { env.BRANCH_NAME == null }
                }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: env.REGISTRY_CREDENTIALS,
                    usernameVariable: 'REGISTRY_USER',
                    passwordVariable: 'REGISTRY_TOKEN'
                )]) {
                    sh 'echo "$REGISTRY_TOKEN" | docker login -u "$REGISTRY_USER" --password-stdin'
                    sh '''
                        docker push ${API_IMAGE}:${IMAGE_TAG}
                        docker push ${API_IMAGE}:latest
                        docker push ${WEB_IMAGE}:${IMAGE_TAG}
                        docker push ${WEB_IMAGE}:latest
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
        }
        success {
            echo "Imágenes publicadas: ${env.API_IMAGE}:${env.IMAGE_TAG} y ${env.WEB_IMAGE}:${env.IMAGE_TAG}"
        }
        failure {
            echo 'El pipeline falló. Revisa el log del stage que quedó en rojo.'
        }
    }
}
