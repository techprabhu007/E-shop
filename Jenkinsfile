pipeline {
    agent any

    environment {
        AWS_ACCOUNT_ID      = "778813324501"
        AWS_REGION          = "us-west-2"

        BACKEND_IMAGE_NAME  = "e-shop-backend"
        FRONTEND_IMAGE_NAME = "e-shop-frontend"

        ECR_BACKEND_URI     = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_IMAGE_NAME}"
        ECR_FRONTEND_URI    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${FRONTEND_IMAGE_NAME}"

        BACKEND_GIT_REPO    = "https://github.com/techprabhu007/E-shop.git"
        FRONTEND_GIT_REPO   = "https://github.com/techprabhu007/E-shop.git"
    }

    stages {
        stage('Build & Push Backend on EC2') {
            steps {
                script {
                    def backendCmd = """
                        cd /home/ubuntu/backend || (git clone ${BACKEND_GIT_REPO} backend && cd backend/backend);
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_BACKEND_URI};
                        docker build -t ${ECR_BACKEND_URI}:latest .;
                        docker push ${ECR_BACKEND_URI}:latest;
                    """

                    sendSSMCommand('AppServer', backendCmd, 'Build and push backend')
                }
            }
        }

        stage('Build & Push Frontend on EC2') {
            steps {
                script {
                    def frontendCmd = """
                        cd /home/ubuntu/frontend || (git clone ${FRONTEND_GIT_REPO} frontend && cd frontend/frontend);
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_FRONTEND_URI};
                        docker build -t ${ECR_FRONTEND_URI}:latest .;
                        docker push ${ECR_FRONTEND_URI}:latest;
                    """

                    sendSSMCommand('WebServer', frontendCmd, 'Build and push frontend')
                }
            }
        }

        stage('Deploy Backend on EC2') {
            steps {
                withCredentials([string(credentialsId: 'mongo-db-uri', variable: 'MONGO_URI')]) {
                    script {
                        def deployBackendCmd = """
                            aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_BACKEND_URI};
                            docker pull ${ECR_BACKEND_URI}:latest;
                            docker stop ${BACKEND_IMAGE_NAME} || true;
                            docker rm ${BACKEND_IMAGE_NAME} || true;
                            docker run -d --name ${BACKEND_IMAGE_NAME} --restart always \\
                                -p 5000:5000 \\
                                -e MONGO_URI='${MONGO_URI}' \\
                                ${ECR_BACKEND_URI}:latest;
                        """

                        sendSSMCommand('AppServer', deployBackendCmd, 'Deploy backend container')
                    }
                }
            }
        }

        stage('Deploy Frontend on EC2') {
            steps {
                script {
                    def deployFrontendCmd = """
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_FRONTEND_URI};
                        docker pull ${ECR_FRONTEND_URI}:latest;
                        docker stop ${FRONTEND_IMAGE_NAME} || true;
                        docker rm ${FRONTEND_IMAGE_NAME} || true;
                        docker run -d --name ${FRONTEND_IMAGE_NAME} --restart always \\
                            -p 80:80 \\
                            ${ECR_FRONTEND_URI}:latest;
                    """

                    sendSSMCommand('WebServer', deployFrontendCmd, 'Deploy frontend container')
                }
            }
        }
    }

    post {
        always {
            echo '✅ Pipeline completed.'
            cleanWs()
        }
    }
}

/**
 * Sends an AWS SSM command using a tag key: Role
 */
def sendSSMCommand(roleTag, shellCommand, comment) {
    def escapedCommand = shellCommand.replaceAll('"', '\\\\\\"')
    sh """
        aws ssm send-command \
          --document-name "AWS-RunShellScript" \
          --targets "Key=tag:Role,Values=${roleTag}" \
          --parameters commands=["${escapedCommand}"] \
          --region ${env.AWS_REGION} \
          --comment "${comment}" \
          --output text
    """
}
