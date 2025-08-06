pipeline {
    agent any

    environment {
        AWS_ACCOUNT_ID      = "778813324501"
        AWS_DEFAULT_REGION  = "us-west-2"

        ECR_BACKEND_URI     = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/e-shop-backend"
        ECR_FRONTEND_URI    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/e-shop-frontend"

        BACKEND_IMAGE_NAME  = "e-shop-backend"
        FRONTEND_IMAGE_NAME = "e-shop-frontend"

        // Fallback if BUILD_ID is not set
        BUILD_ID = "${env.BUILD_ID ?: 'manual'}"
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Build, Scan & Push Backend Image') {
            steps {
                script {
                    def backendImage = docker.build("${BACKEND_IMAGE_NAME}:${BUILD_ID}", "./backend")

                    echo "🔍 Scanning Backend image with Trivy..."
                    sh "trivy image --exit-code 1 --severity HIGH,CRITICAL ${BACKEND_IMAGE_NAME}:${BUILD_ID}"

                    echo "📦 Pushing Backend image to ECR..."
                    sh """
                        aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com
                        docker tag ${BACKEND_IMAGE_NAME}:${BUILD_ID} ${ECR_BACKEND_URI}:${BUILD_ID}
                        docker tag ${BACKEND_IMAGE_NAME}:${BUILD_ID} ${ECR_BACKEND_URI}:latest
                        docker push ${ECR_BACKEND_URI}:${BUILD_ID}
                        docker push ${ECR_BACKEND_URI}:latest
                    """
                }
            }
        }

        stage('Build, Scan & Push Frontend Image') {
            steps {
                script {
                    def frontendImage = docker.build("${FRONTEND_IMAGE_NAME}:${BUILD_ID}", "./frontend")

                    echo "🔍 Scanning Frontend image with Trivy..."
                    sh "trivy image --exit-code 1 --severity HIGH,CRITICAL ${FRONTEND_IMAGE_NAME}:${BUILD_ID}"

                    echo "📦 Pushing Frontend image to ECR..."
                    sh """
                        aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com
                        docker tag ${FRONTEND_IMAGE_NAME}:${BUILD_ID} ${ECR_FRONTEND_URI}:${BUILD_ID}
                        docker tag ${FRONTEND_IMAGE_NAME}:${BUILD_ID} ${ECR_FRONTEND_URI}:latest
                        docker push ${ECR_FRONTEND_URI}:${BUILD_ID}
                        docker push ${ECR_FRONTEND_URI}:latest
                    """
                }
            }
        }

        stage('Deploy Backend via SSM') {
            steps {
                withCredentials([string(credentialsId: 'mongo-db-uri', variable: 'MONGO_URI')]) {
                    script {
                        def backendCommand = """
                            aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com &&
                            docker pull ${ECR_BACKEND_URI}:latest &&
                            docker stop e-shop-backend || true &&
                            docker rm e-shop-backend || true &&
                            docker run -d --name e-shop-backend --restart always \\
                                -p 5000:5000 \\
                                -e MONGO_URI='${MONGO_URI}' \\
                                ${ECR_BACKEND_URI}:latest
                        """

                        sh """
                            aws ssm send-command \\
                                --document-name "AWS-RunShellScript" \\
                                --targets "Key=tag:Role,Values=AppServer" \\
                                --comment "Deploy backend" \\
                                --parameters commands=["${backendCommand.replaceAll('"', '\\\\\\"')}"] \\
                                --region ${AWS_DEFAULT_REGION} \\
                                --output text
                        """
                    }
                }
            }
        }

        stage('Deploy Frontend via SSM') {
            steps {
                script {
                    def frontendCommand = """
                        aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com &&
                        docker pull ${ECR_FRONTEND_URI}:latest &&
                        docker stop e-shop-frontend || true &&
                        docker rm e-shop-frontend || true &&
                        docker run -d --name e-shop-frontend --restart always \\
                            -p 80:80 \\
                            ${ECR_FRONTEND_URI}:latest
                    """

                    sh """
                        aws ssm send-command \\
                            --document-name "AWS-RunShellScript" \\
                            --targets "Key=tag:Role,Values=WebServer" \\
                            --comment "Deploy frontend" \\
                            --parameters commands=["${frontendCommand.replaceAll('"', '\\\\\\"')}"] \\
                            --region ${AWS_DEFAULT_REGION} \\
                            --output text
                    """
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
