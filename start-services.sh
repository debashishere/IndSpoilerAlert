#!/bin/bash

# Terminate background jobs on script exit
cleanup() {
    echo ""
    echo "Stopping all services..."
    kill $SIDECAR_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM

echo "========================================="
echo "  IND IND_SPOILER ALERT SURPLUS PLATFORM RUNNER  "
echo "========================================="

# 1. Verify MongoDB is running
echo "Checking MongoDB container..."
if [ ! "$(docker ps -q -f name=inventory-mongo)" ]; then
    if [ "$(docker ps -aq -f name=inventory-mongo)" ]; then
        echo "Starting existing inventory-mongo Docker container..."
        docker start inventory-mongo
    else
        echo "Running new inventory-mongo Docker container..."
        docker run -d --name inventory-mongo -v mongo-data:/data/db -p 27017:27017 mongo:latest
    fi
else
    echo "MongoDB container is already running."
fi

# 1b. Verify Redis is running
echo "Checking Redis container..."
if [ ! "$(docker ps -q -f name=inventory-redis)" ]; then
    if [ "$(docker ps -aq -f name=inventory-redis)" ]; then
        echo "Starting existing inventory-redis Docker container..."
        docker start inventory-redis
    else
        echo "Running new inventory-redis Docker container..."
        docker run -d --name inventory-redis -v redis-data:/data -p 6379:6379 redis:alpine redis-server --save 60 1
    fi
else
    echo "Redis container is already running."
fi

# 1c. Verify LocalStack is running
echo "Checking LocalStack container..."
if [ ! "$(docker ps -q -f name=inventory-localstack)" ]; then
    if [ "$(docker ps -aq -f name=inventory-localstack)" ]; then
        echo "Starting existing inventory-localstack Docker container..."
        docker start inventory-localstack
    else
        echo "Running new inventory-localstack Docker container..."
        docker run -d --name inventory-localstack -p 4566:4566 -e SERVICES=s3,sqs -e AWS_DEFAULT_REGION=us-east-1 -e SKIP_SSL_CERT_DOWNLOAD=1 -v "$(pwd)/localstack-init:/etc/localstack/init/ready.d" localstack/localstack:3.4.0
    fi
else
    echo "LocalStack container is already running."
fi


# 2. Start Python sidecar
echo "Starting Python FastAPI sidecar on http://localhost:8000..."
cd sidecar
.venv/bin/python main.py > sidecar.log 2>&1 &
SIDECAR_PID=$!
cd ..

# 3. Start Express backend
echo "Starting Express backend on http://localhost:5001..."
cd backend
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 4. Start Vite frontend
echo "Starting Vite frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "-----------------------------------------"
echo "All services launched."
echo "- FastAPI Sidecar: http://localhost:8000"
echo "- Express Backend: http://localhost:5001"
echo "- Vite Frontend: check Vite terminal output above"
echo "Press Ctrl+C to stop all services."
echo "-----------------------------------------"

# Keep the script active
wait
