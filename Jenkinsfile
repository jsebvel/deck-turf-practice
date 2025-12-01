pipeline {
    agent any

    environment {
        PROJECT_NAME = "CI/CD Demo"
    }

    // Define the stages of the pipeline
    stages {
        stage('Setup') {
            steps {
                echo "Setting up the project: ${env.PROJECT_NAME}"
            }
        }
        stage('Build') {
            steps {
                echo "Building the project: ${env.PROJECT_NAME}"
            }
        }
        stage('Test') {
            steps {
                echo "Testing the project: ${env.PROJECT_NAME}"
                sleep 5
            }
        }
        stage('Deploy') {
            when {
                expression { return currentBuild.result == 'SUCCESS'}
            }
        }
    }
    post {
        always {
            echo 'Pipeline finished.'
        }
    }
}