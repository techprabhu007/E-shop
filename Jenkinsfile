pipeline {
    agent any

    environment {
        AWS_ACCOUNT_ID      = "778813324501"
        AWS_REGION          = "us-west-2"

        BACKEND_IMAGE_NAME  = "e-shop-backend"
        FRONTEND_IMAGE_NAME = "e-shop-frontend"

        ECR_BACKEND_URI     = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_IMAGE_NAME}"
        ECR_FRONTEND_URI    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${FRONTEND_IMAGE_NAME}"
    }

    stages {
        stage('Build & Push Backend on EC2') {
            steps {
                script {
                    def backendCmd = """
                        cd /home/ubuntu/backend || git clone https://github.com/techprabhu007/E-shop.git backend && cd backend/backend;
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com;
                        docker build -t ${ECR_BACKEND_URI}:latest .;
                        docker push ${ECR_BACKEND_URI}:latest;
                    """

                    sh """
                        aws ssm send-command \
                          --document-name "AWS-RunShellScript" \
                          --targets "Key=tag:Role,Values=AppServer" \
                          --parameters commands=["${backendCmd.replaceAll('"', '\\\\\\"')}"] \
                          --region ${AWS_REGION} \
                          --comment "Build and push backend" \
                          --output text
                    """
                }
            }
        }

        stage('Build & Push Frontend on EC2') {
            steps {
                script {
                    def frontendCmd = """
                        cd /home/ubuntu/frontend || git clone https://github.com/techprabhu007/E-shop.git frontend && cd frontend/frontend;
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com;
                        docker build -t ${ECR_FRONTEND_URI}:latest .;
                        docker push ${ECR_FRONTEND_URI}:latest;
                    """

                    sh """
                        aws ssm send-command \
                          --document-name "AWS-RunShellScript" \
                          --targets "Key=tag:Role,Values=WebServer" \
                          --parameters commands=["${frontendCmd.replaceAll('"', '\\\\\\"')}"] \
                          --region ${AWS_REGION} \
                          --comment "Build and push frontend" \
                          --output text
                    """
                }
            }
        }

        stage('Deploy Backend on EC2') {
            steps {
                withCredentials([string(credentialsId: 'mongo-db-uri', variable: 'MONGO_URI')]) {
                    script {
                        def deployBackend = """
                            aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com &&
                            docker pull ${ECR_BACKEND_URI}:latest &&
                            docker stop ${BACKEND_IMAGE_NAME} || true &&
                            docker rm ${BACKEND_IMAGE_NAME} || true &&
                            docker run -d --name ${BACKEND_IMAGE_NAME} --restart always \\
                                -p 5000:5000 \\
                                -e MONGO_URI='${MONGO_URI}' \\
                                ${ECR_BACKEND_URI}:latest
                        """

                        sh """
                            aws ssm send-command \
                              --document-name "AWS-RunShellScript" \
                              --targets "Key=tag:Role,Values=AppServer" \
                              --parameters commands=["${deployBackend.replaceAll('"', '\\\\\\"')}"] \
                              --region ${AWS_REGION} \
                              --comment "Deploy backend container" \
                              --output text
                        """
                    }
                }
            }
        }

        stage('Deploy Frontend on EC2') {
            steps {
                script {
                    def deployFrontend = """
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com &&
                        docker pull ${ECR_FRONTEND_URI}:latest &&
                        docker stop ${FRONTEND_IMAGE_NAME} || true &&
                        docker rm ${FRONTEND_IMAGE_NAME} || true &&
                        docker run -d --name ${FRONTEND_IMAGE_NAME} --restart always \\
                            -p 80:80 \\
                            ${ECR_FRONTEND_URI}:latest
                    """

                    sh """
                        aws ssm send-command \
                          --document-name "AWS-RunShellScript" \
                          --targets "Key=tag:Role,Values=WebServer" \
                          --parameters commands=["${deployFrontend.replaceAll('"', '\\\\\\"')}"] \
                          --region ${AWS_REGION} \
                          --comment "Deploy frontend container" \
                          --output text
                    """
                }
            }
        }
    }

    post {
        always {
            echo '✅ Pipeline completed successfully.'
            cleanWs()
        }
    }
}
