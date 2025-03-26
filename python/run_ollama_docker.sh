#!/bin/bash

# Script to run Ollama in Docker with GPU support

# Default values
OLLAMA_PORT=11434
MODEL="llama3:latest"
CONTAINER_NAME="ollama-server"
VOLUME_NAME="ollama-models"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --port)
      OLLAMA_PORT="$2"
      shift 2
      ;;
    --model)
      MODEL="$2"
      shift 2
      ;;
    --container-name)
      CONTAINER_NAME="$2"
      shift 2
      ;;
    --volume-name)
      VOLUME_NAME="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Nvidia runtime is available (for GPU support)
NVIDIA_FLAG=""
if docker info 2>/dev/null | grep -q "Runtimes:.*nvidia"; then
    echo "NVIDIA runtime detected, enabling GPU support"
    NVIDIA_FLAG="--gpus all"
elif command -v nvidia-smi &> /dev/null; then
    echo "NVIDIA GPU detected, enabling GPU support"
    NVIDIA_FLAG="--gpus all"
else
    echo "Warning: NVIDIA GPU not detected. Ollama will run on CPU only."
fi

# Check if container already exists
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo "Container '$CONTAINER_NAME' already exists."
    
    # Check if container is running
    if docker ps | grep -q "$CONTAINER_NAME"; then
        echo "Container is already running. Stopping..."
        docker stop "$CONTAINER_NAME"
    fi
    
    echo "Removing existing container..."
    docker rm "$CONTAINER_NAME"
fi

# Create the volume if it doesn't exist
if ! docker volume ls | grep -q "$VOLUME_NAME"; then
    echo "Creating volume '$VOLUME_NAME'..."
    docker volume create "$VOLUME_NAME"
fi

# Run Ollama container
echo "Starting Ollama container..."
docker run -d \
    --name "$CONTAINER_NAME" \
    $NVIDIA_FLAG \
    -p "$OLLAMA_PORT:11434" \
    -v "$VOLUME_NAME:/root/.ollama" \
    -e "OLLAMA_HOST=0.0.0.0" \
    -e "CUDA_VISIBLE_DEVICES=0" \
    ollama/ollama

# Wait for Ollama to start
echo "Waiting for Ollama to start..."
MAX_RETRIES=30
RETRY_COUNT=0

while ! curl -s "http://localhost:$OLLAMA_PORT/api/tags" &> /dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "Timed out waiting for Ollama to start"
        exit 1
    fi
    echo "Waiting for Ollama API to become available... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo "Ollama server is running!"

# Pull the specified model
echo "Pulling model: $MODEL"
docker exec "$CONTAINER_NAME" ollama pull "$MODEL"

echo "========================================================"
echo "Ollama is now running with the $MODEL model"
echo "Server URL: http://localhost:$OLLAMA_PORT"
echo ""
echo "To use this server with the product scraper, use:"
echo "  ./run_local.sh --ollama-host localhost --ollama-model $MODEL"
echo ""
echo "To stop the server, run:"
echo "  docker stop $CONTAINER_NAME"
echo "========================================================"

# Print logs
echo "Showing container logs (press Ctrl+C to exit):"
docker logs -f "$CONTAINER_NAME"