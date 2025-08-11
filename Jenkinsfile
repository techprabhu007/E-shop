pipeline {
    agent any
    environment {
        AWS_PROFILE = 'personal-sso'
        AWS_REGION  = 'us-west-2'
        ACCOUNT_ID  = sh(script: "aws sts get-caller-identity --query Account --output text --profile personal-sso", returnStdout: true).trim()
        FRONTEND_INSTANCE_ID = 'i-067874641816d2924'
        BACKEND_INSTANCE_ID  = 'i-05cea5e98e92b019d'
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
        // stage('Deploy Frontend to EC2 via SSM') {
        //     steps {
        //         sh '''
        //         aws ssm send-command \
        //           --targets "Key=instanceIds,Values=$FRONTEND_INSTANCE_ID" \
        //           --document-name "AWS-RunShellScript" \
        //           --comment "Deploy frontend container" \
        //           --profile $AWS_PROFILE \
        //           --region $AWS_REGION \
        //           --parameters 'commands=[
        //             "aws ecr get-login-password --region $AWS_REGION --profile $AWS_PROFILE | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com",
        //             "docker pull $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/e-shop-frontend:latest",
        //             "docker stop frontend || true && docker rm frontend || true",
        //             "docker run -d --name frontend -p 80:80 $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/e-shop-frontend:latest"
        //           ]'
        //         '''
        //     }
        // }
        stage('Deploy Backend to EC2 via SSM') {
            steps {
                sh '''
                aws ssm send-command \
                  --targets "Key=instanceIds,Values=$BACKEND_INSTANCE_ID" \
                  --document-name "AWS-RunShellScript" \
                  --comment "Deploy backend container" \
                  --profile $AWS_PROFILE \
                  --region $AWS_REGION \
                  --parameters 'commands=[
                    "aws ecr get-login-password --region $AWS_REGION --profile $AWS_PROFILE | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com",
                    "docker pull $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/e-shop-backend:latest",
                    "docker stop backend || true && docker rm backend || true",
                    "docker run -d --name backend -p 8080:8080 $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/e-shop-backend:latest"
                  ]'
                '''
            }
        }
    }
}
