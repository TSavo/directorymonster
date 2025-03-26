def _check_gpu_optimized_model(self):
        """Check if GPU is available and select an optimized model."""
        try:
            # Get model list from Ollama
            response = requests.get(self.list_url, timeout=10)
            
            if response.status_code != 200:
                self.logger.warning(f"Could not check available models: {response.status_code}")
                return
                
            models = response.json().get('models', [])
            
            # Check if server reports GPU
            info_response = requests.get(f"http://{self.api_url.split('/')[2]}/api/info", timeout=10)
            if info_response.status_code == 200:
                has_gpu = info_response.json().get('cuda', {}).get('available', False)
                if has_gpu:
                    self.logger.info("GPU detected by Ollama server")
                    
                    # If user specified a model ending with ":latest", try to find a GPU variant
                    if self.model_name.endswith(":latest"):
                        base_model = self.model_name.split(":")[0]
                        gpu_variants = [m['name'] for m in models if base_model in m['name'] and any(gpu_tag in m['name'] for gpu_tag in [":7b-q8", ":8b-q8", ":4b-q8"])]
                        
                        if gpu_variants:
                            # Pick a quantized model that's optimized for GPU
                            self.model_name = gpu_variants[0]
                            self.logger.info(f"Switched to GPU-optimized model: {self.model_name}")
                    
            else:
                self.logger.warning("Could not detect GPU status from Ollama")
                
        except Exception as e:
            self.logger.warning(f"Error checking GPU models: {str(e)}")
"""
Ollama API Client
Provides a clean interface for interacting with the Ollama API
"""
import requests
import logging
import json
import time


class OllamaClient:
    """Client for the Ollama API."""
    
    def __init__(self, model_name="llama3:latest", host="localhost", port=11434, timeout=60):
        """
        Initialize an Ollama client.
        
        Args:
            model_name (str): Name of the Ollama model to use
            host (str): Hostname where Ollama is running
            port (int): Port for the Ollama API
            timeout (int): Request timeout in seconds
        """
        self.model_name = model_name
        self.api_url = f"http://{host}:{port}/api/generate"
        self.list_url = f"http://{host}:{port}/api/tags"
        self.timeout = timeout
        self.logger = logging.getLogger("ollama")
        self.request_count = 0
        self.last_request_time = 0
        self.rate_limit_delay = 0.5  # seconds between requests
        self.debug_mode = False  # Flag to enable detailed debugging
        self.debug_dir = None    # Directory to save debug files
        

    
    def generate(self, prompt, max_retries=3, retry_delay=2):
        """
        Generate a response from the Ollama model.
        
        Args:
            prompt (str): The prompt to send to the model
            max_retries (int): Maximum number of retry attempts
            retry_delay (int): Delay between retries in seconds
            
        Returns:
            str: The model's response
        """
        # Apply rate limiting
        self._rate_limit()
        
        # Save prompt for debugging if enabled
        if self.debug_mode and self.debug_dir:
            debug_file = f"{self.debug_dir}/prompt_{int(time.time())}.txt"
            try:
                with open(debug_file, "w", encoding="utf-8") as f:
                    f.write(prompt)
                self.logger.debug(f"Saved prompt to {debug_file}")
            except Exception as e:
                self.logger.warning(f"Could not save debug prompt: {e}")
        
        retries = 0
        while retries <= max_retries:
            try:
                self.logger.debug(f"Sending prompt to Ollama ({len(prompt)} chars)")
                
                # Make the API request
                response = requests.post(
                    self.api_url,
                    json={
                        "model": self.model_name,
                        "prompt": prompt,
                        "stream": False
                    },
                    timeout=self.timeout
                )
                
                # Record this request
                self.request_count += 1
                self.last_request_time = time.time()
                
                if response.status_code == 200:
                    result = response.json().get('response', '')
                    
                    # Save response for debugging if enabled
                    if self.debug_mode and self.debug_dir:
                        debug_file = f"{self.debug_dir}/response_{int(time.time())}.txt"
                        try:
                            with open(debug_file, "w", encoding="utf-8") as f:
                                f.write(result)
                            self.logger.debug(f"Saved response to {debug_file}")
                        except Exception as e:
                            self.logger.warning(f"Could not save debug response: {e}")
                            
                    return result
                else:
                    error_msg = f"Error from Ollama API: {response.status_code}"
                    self.logger.error(error_msg)
                    
                    # Retry logic
                    retries += 1
                    if retries <= max_retries:
                        wait_time = retry_delay * (2 ** (retries - 1))  # Exponential backoff
                        self.logger.info(f"Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                    else:
                        return f"Error: {response.status_code}"
                        
            except Exception as e:
                error_msg = f"Exception calling Ollama: {str(e)}"
                self.logger.error(error_msg)
                
                # Retry logic
                retries += 1
                if retries <= max_retries:
                    wait_time = retry_delay * (2 ** (retries - 1))
                    self.logger.info(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    return f"Error: {str(e)}"
    
    def generate_structured(self, prompt, output_schema, max_retries=3):
        """
        Generate a structured response from the Ollama model.
        
        Args:
            prompt (str): The prompt to send to the model
            output_schema: A Pydantic model class defining the expected output structure
            max_retries (int): Maximum number of retry attempts
            
        Returns:
            dict: The structured response conforming to the schema
        """
        try:
            # Import our schema parser
            from ai.schema_parser import JsonOutputParser
        except ImportError:
            self.logger.error("Schema parser not available, falling back to standard generate")
            return self.generate(prompt, max_retries)
        
        # Create the parser with the provided schema
        parser = JsonOutputParser(pydantic_model=output_schema, logger=self.logger)
        
        # Add format instructions to the prompt
        format_instructions = parser.get_format_instructions()
        full_prompt = f"{prompt}\n\n{format_instructions}"
        
        # Generate response from model
        response_text = self.generate(full_prompt, max_retries)
        
        # Save a debug copy of the raw response
        debug_path = f"debug_response_{int(time.time())}.txt"
        try:
            with open(debug_path, "w", encoding="utf-8") as f:
                f.write(f"PROMPT:\n{full_prompt}\n\nRESPONSE:\n{response_text}")
            self.logger.debug(f"Saved raw response to {debug_path}")
        except Exception as e:
            self.logger.debug(f"Could not save debug response: {e}")
        
        # Log the raw response excerpt
        response_excerpt = response_text[:500] + "..." if len(response_text) > 500 else response_text
        self.logger.debug(f"Raw response: {response_excerpt}")
        
        try:
            # Try to parse the JSON using our parser
            return parser.parse(response_text)
        except ValueError as e:
            self.logger.error(f"Failed to parse structured output: {e}")
            
            # Extract the problematic JSON for logging
            extracted_json = parser._extract_json(response_text)
            extracted_excerpt = extracted_json[:200] + "..." if len(extracted_json) > 200 else extracted_json
            self.logger.error(f"Problematic JSON: {extracted_excerpt}")
            
            # Save problematic JSON for debugging
            try:
                error_path = f"json_error_{int(time.time())}.json"
                with open(error_path, "w", encoding="utf-8") as f:
                    f.write(extracted_json)
                self.logger.info(f"Saved problematic JSON to {error_path}")
            except Exception as save_err:
                self.logger.debug(f"Could not save error JSON: {save_err}")
            
            # Try to parse as much as we can as a regular dict
            try:
                import json
                result = json.loads(parser._extract_json(response_text))
                self.logger.info("Successfully parsed as regular JSON despite schema error")
                return result
            except json.JSONDecodeError as json_err:
                self.logger.error(f"JSON decode error details: {str(json_err)}")
                # Add context about the error position in the JSON
                if hasattr(json_err, 'pos'):
                    position = json_err.pos
                    context_start = max(0, position - 30)
                    context_end = min(len(extracted_json), position + 30)
                    context = extracted_json[context_start:context_end]
                    self.logger.error(f"Error context: ...{context}... (error near position {position})")
                    
                # Return the raw text if all parsing fails
                return {"is_product": False, "raw_response": response_text[:500], "error": f"JSON parsing failed: {str(json_err)}"}
    
    def _rate_limit(self):
        """Apply rate limiting to avoid overwhelming the API."""
        if self.last_request_time > 0:
            elapsed = time.time() - self.last_request_time
            if elapsed < self.rate_limit_delay:
                sleep_time = self.rate_limit_delay - elapsed
                time.sleep(sleep_time)