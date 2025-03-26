#!/bin/bash

# Start Ollama in the background
ollama serve &

# Wait for Ollama to start
sleep 5

# Pull the specified model (default to llama3 if not provided)
MODEL=${OLLAMA_MODEL:-"llama3"}
echo "Pulling Ollama model: $MODEL"
ollama pull $MODEL

# Run the scraper with arguments passed to the container
echo "Starting scraper..."
exec python3 /app/run_scraper.py "$@"
