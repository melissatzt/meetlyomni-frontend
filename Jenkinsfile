pipeline {
    agent any

    environment {
        AWS_CREDENTIALS_ID = 'aws-credentials'
        EC2_KEY_PATH = '/var/lib/jenkins/.ssh/jenkins-ec2.pem'
        EC2_HOST = 'ec2-user@3.25.55.127'
        IMAGE_NAME = 'meetly-omni-frontend'
        ECR_REGISTRY = '381492242095.dkr.ecr.ap-southeast-2.amazonaws.com'
        ECR_URI = '381492242095.dkr.ecr.ap-southeast-2.amazonaws.com/meetly-omni-frontend:latest'
        NEXT_PUBLIC_API_BASE_URL = 'https://api-dev.meetlyomni.com'
        NODE_ENV = 'production'
        TEMP_PORT = '3001'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
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
                        aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin $ECR_REGISTRY
                        docker tag ${IMAGE_NAME}:latest ${ECR_URI}
                        docker push ${ECR_URI}
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                sh """
                ssh -i ${EC2_KEY_PATH} ${EC2_HOST} '
                    set -e

                    aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin ${ECR_REGISTRY}
                    docker pull ${ECR_URI}

                    # clean up any leftover "-new" container
                    docker rm -f ${IMAGE_NAME}-new || true

                    # start new container on temp port
                    docker run -d -p ${TEMP_PORT}:3000 --name ${IMAGE_NAME}-new ${ECR_URI}

                    echo "Waiting for new container to start..."
                    sleep 5

                    # stop and remove old container
                    docker stop ${IMAGE_NAME} || true
                    docker rm ${IMAGE_NAME} || true

                    # rename new container to the final name
                    docker rename ${IMAGE_NAME}-new ${IMAGE_NAME}
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
