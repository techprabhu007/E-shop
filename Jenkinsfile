pipeline {
    agent any
    environment {
        AWS_PROFILE = 'personal-sso'
        AWS_REGION  = 'ap-south-1'
        ACCOUNT_ID  = sh(script: "aws sts get-caller-identity --query Account --output text --profile ${AWS_PROFILE}", returnStdout: true).trim()
    }
    stages {
        stage('Login to ECR') {
            steps {
                sh '''
                aws ecr get-login-password --region $AWS_REGION --profile $AWS_PROFILE \
                | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
                '''
            }
        }
        stage('Build and Push Frontend') {
            steps {
                sh '''
                docker build -t e-shop-frontend ./frontend
                docker tag e-shop-frontend:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/e-shop-frontend:latest
                docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/e-shop-frontend:latest
                '''
            }
        }
        stage('Build and Push Backend') {
            steps {
                sh '''
                docker build -t e-shop-backend ./backend
                docker tag e-shop-backend:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/e-shop-backend:latest
                docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/e-shop-backend:latest
                '''
            }
        }
    }
}
