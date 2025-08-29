pipeline {
    agent any

    environment {
        // AWS credentials ID in Jenkins
        AWS_CREDENTIALS_ID = 'aws-credentials'

        // Path to EC2 private key on Jenkins VM
        EC2_KEY_PATH = '/var/lib/jenkins/.ssh/jenkins-ec2.pem'

        // EC2 host user and IP
        EC2_HOST = 'ec2-user@3.25.55.127'

        // Docker image info
        IMAGE_NAME = 'meetly-omni-frontend'
        ECR_URI = '381492242095.dkr.ecr.ap-southeast-2.amazonaws.com/meetly-omni-frontend:latest'
    
        // Frontend API URL
        NEXT_PUBLIC_API_BASE_URL = 'https://api-dev.meetlyomni.com'

        NODE_ENV = 'development'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install & Test') {
            steps {
                sh '''
                    npm install
                    npm run test
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                docker build \
                --build-arg NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
                --build-arg NODE_ENV=${NODE_ENV} \
                -t ${IMAGE_NAME}:latest .
                """
            }
        }

        stage('Push to ECR') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: env.AWS_CREDENTIALS_ID]]) {
                    sh '''
                        $(aws ecr get-login-password --no-include-email --region ap-southeast-2)
                        docker tag ${IMAGE_NAME}:latest ${ECR_URI}
                        docker push ${ECR_URI}
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            when {
                branch 'dev'
            }
            steps {
                sh """
                ssh -i ${EC2_KEY_PATH} ${EC2_HOST} '
                    # Stop old container if exists
                    docker stop ${IMAGE_NAME} || true
                    docker rm ${IMAGE_NAME} || true

                    # Pull latest image from ECR
                    docker pull ${ECR_URI}

                    # Run container
                    docker run -d -p 80:3000 --name ${IMAGE_NAME} ${ECR_URI}
                '
                """
            }
        }
    }

    post {
        always {
            echo 'FE deployment finished.'
        }
    }
}
