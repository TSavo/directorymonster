#!/bin/bash
set -e

# The Selenium image already has Xvfb running, no need to start it

# Start Ollama in the background
echo "Starting Ollama server..."
ollama serve &

# Wait for Ollama to be ready
echo "Waiting for Ollama server to be ready..."
until curl -s http://localhost:11434/api/tags >/dev/null 2>&1; do
  echo "Waiting for Ollama API to become available..."
  sleep 1
done

# Check if the model exists, if not pull it
MODEL=${OLLAMA_MODEL:-"llama3:latest"}
echo "Checking for model $MODEL..."
if ! ollama list | grep -q "$MODEL"; then
  echo "Pulling model $MODEL..."
  ollama pull $MODEL
fi

echo "Ollama is ready with model $MODEL"

# Run the scraper with whatever arguments were passed to the container
echo "Starting product scraper..."
python3 run_scraper.py --ollama-host localhost --search-engine "https://www.google.com/" "$@"