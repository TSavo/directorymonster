#!/bin/bash

# Run the product scraper locally
# Assumes Python environment is set up with all dependencies

# Default values
COUNT=10
CATEGORIES="tech gadgets"
MIN_PRICE=0
MAX_PRICE=0
OUTPUT_FILE="./data/products.json"
SEARCH_ENGINE="https://www.google.com/"
OLLAMA_HOST="localhost"
OLLAMA_MODEL="llama3:latest"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --count)
      COUNT="$2"
      shift 2
      ;;
    --categories)
      CATEGORIES="$2"
      shift 2
      ;;
    --min-price)
      MIN_PRICE="$2"
      shift 2
      ;;
    --max-price)
      MAX_PRICE="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --search-engine)
      SEARCH_ENGINE="$2"
      shift 2
      ;;
    --ollama-host)
      OLLAMA_HOST="$2"
      shift 2
      ;;
    --ollama-model)
      OLLAMA_MODEL="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Ensure output directory exists
mkdir -p $(dirname "$OUTPUT_FILE")

# Run the script
echo "Starting product scraper with the following parameters:"
echo "  Count: $COUNT"
echo "  Categories: $CATEGORIES"
echo "  Min Price: $MIN_PRICE"
echo "  Max Price: $MAX_PRICE"
echo "  Output File: $OUTPUT_FILE"
echo "  Search Engine: $SEARCH_ENGINE"
echo "  Ollama Host: $OLLAMA_HOST"
echo "  Ollama Model: $OLLAMA_MODEL"

# Build command
CMD="python run_scraper.py --count $COUNT --output $OUTPUT_FILE --search-engine \"$SEARCH_ENGINE\" --ollama-host $OLLAMA_HOST --ollama-model $OLLAMA_MODEL"

# Add optional parameters if non-zero
if [ "$MIN_PRICE" -gt 0 ]; then
  CMD="$CMD --min-price $MIN_PRICE"
fi

if [ "$MAX_PRICE" -gt 0 ]; then
  CMD="$CMD --max-price $MAX_PRICE"
fi

# Add categories
if [ ! -z "$CATEGORIES" ]; then
  CMD="$CMD --categories $CATEGORIES"
fi

# Execute command
echo "Running command: $CMD"
eval $CMD