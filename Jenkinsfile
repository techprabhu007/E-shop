pipeline {
    agent any

    tools {
        sonarQubeScanner 'SonarQubeScanner'
    }

    environment {
        AWS_ACCOUNT_ID      = "778813324501"
        AWS_DEFAULT_REGION  = "us-west-2"
        ECR_BACKEND_URI     = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/e-shop-backend"
        ECR_FRONTEND_URI    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/e-shop-frontend"

        SONAR_HOST_URL      = "http://localhost:9000/"
        SONAR_PROJECT_KEY   = "e-shop-project"

        BACKEND_IMAGE_NAME  = "e-shop-backend"
        FRONTEND_IMAGE_NAME = "e-shop-frontend"
    }

    stages {
        stage('SonarQube Code Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def scannerHome = tool 'SonarQubeScanner'
                        withCredentials([string(credentialsId: 'sonarqube-token', variable: 'SONAR_TOKEN')]) {
                            sh """
                                ${scannerHome}/bin/sonar-scanner \\
                                -Dsonar.projectKey=${SONAR_PROJECT_KEY} \\
                                -Dsonar.sources=. \\
                                -Dsonar.host.url=${SONAR_HOST_URL} \\
                                -Dsonar.login=${SONAR_TOKEN}
                            """
                        }
                    }
                }
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build, Scan & Push Backend Image') {
            steps {
                script {
                    def backendImage = docker.build("${BACKEND_IMAGE_NAME}:${env.BUILD_ID}", "./backend")

                    echo "Scanning Backend image with Trivy..."
                    sh "trivy image --exit-code 1 --severity HIGH,CRITICAL ${BACKEND_IMAGE_NAME}:${env.BUILD_ID}"

                    echo "Scan passed. Pushing Backend image to ECR..."
                    docker.withRegistry("https://${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com", 'ecr:us-east-1:aws-credentials') {
                        backendImage.push()
                        backendImage.push("latest")
                    }
                }
            }
        }

        stage('Build, Scan & Push Frontend Image') {
            steps {
                script {
                    def frontendImage = docker.build("${FRONTEND_IMAGE_NAME}:${env.BUILD_ID}", "./frontend")

                    echo "Scanning Frontend image with Trivy..."
                    sh "trivy image --exit-code 1 --severity HIGH,CRITICAL ${FRONTEND_IMAGE_NAME}:${env.BUILD_ID}"

                    echo "Scan passed. Pushing Frontend image to ECR..."
                    docker.withRegistry("https://${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com", 'ecr:us-east-1:aws-credentials') {
                        frontendImage.push()
                        frontendImage.push("latest")
                    }
                }
            }
        }

        stage('Deploy Backend to App Tier') {
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
                            aws ssm send-command \
                                --document-name "AWS-RunShellScript" \
                                --targets "Key=tag:Role,Values=AppServer" \
                                --comment "Deploy backend container" \
                                --parameters commands=["${backendCommand.replaceAll('"', '\\\\\\"')}"] \
                                --region ${AWS_DEFAULT_REGION} \
                                --output text
                        """
                    }
                }
            }
        }

        stage('Deploy Frontend to Web Tier') {
            steps {
                script {
                    def frontendCommand = """
                        aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com &&
                        docker pull ${ECR_FRONTEND_URI}:latest &&
                        docker stop e-shop-frontend || true &&
                        docker rm e-shop-frontend || true &&
                        docker run -d --name e-shop-frontend --restart always -p 80:80 ${ECR_FRONTEND_URI}:latest
                    """

                    sh """
                        aws ssm send-command \
                            --document-name "AWS-RunShellScript" \
                            --targets "Key=tag:Role,Values=WebServer" \
                            --comment "Deploy frontend container" \
                            --parameters commands=["${frontendCommand.replaceAll('"', '\\\\\\"')}"] \
                            --region ${AWS_DEFAULT_REGION} \
                            --output text
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
            cleanWs()
        }
    }
}
