"""
Schema Parser Utility
Provides tools for parsing structured outputs from AI models
"""
import json
import logging
from typing import Dict, List, Any, Type, Optional, Union
from pydantic import BaseModel, Field, ValidationError

# We'll implement a lightweight version of LangChain's capabilities
# without adding the full dependency if not needed

class OutputParser:
    """Base class for parsing and validating AI outputs."""
    
    def __init__(self, logger=None):
        """Initialize the output parser."""
        self.logger = logger or logging.getLogger("schema_parser")
    
    def parse(self, text: str) -> Any:
        """Parse the output text into the desired format."""
        raise NotImplementedError("Subclasses must implement parse method")
    
    def get_format_instructions(self) -> str:
        """Get instructions for the expected output format."""
        raise NotImplementedError("Subclasses must implement get_format_instructions")


class JsonOutputParser(OutputParser):
    """Parser for JSON outputs."""
    
    def __init__(self, pydantic_model: Type[BaseModel] = None, **kwargs):
        """
        Initialize a JSON output parser.
        
        Args:
            pydantic_model: Optional Pydantic model for validation
            **kwargs: Additional arguments to pass to the base class
        """
        super().__init__(**kwargs)
        self.pydantic_model = pydantic_model
    
    def parse(self, text: str) -> Dict[str, Any]:
        """
        Parse and validate JSON from text.
        
        Args:
            text: Text containing JSON
            
        Returns:
            Dict: Parsed and validated JSON
            
        Raises:
            ValueError: If text cannot be parsed as JSON or validation fails
        """
        # Extract JSON from text if needed
        json_str = self._extract_json(text)
        
        try:
            # Parse JSON
            data = json.loads(json_str)
            
            # Validate against Pydantic model if provided
            if self.pydantic_model:
                try:
                    validated = self.pydantic_model.parse_obj(data)
                    return validated.dict()
                except ValidationError as e:
                    self.logger.error(f"JSON validation error: {e}")
                    # Return the original data if validation fails but JSON is valid
                    return data
            
            return data
            
        except json.JSONDecodeError as e:
            self.logger.error(f"JSON parse error: {e}")
            self.logger.debug(f"Problematic text: {json_str[:100]}...")
            raise ValueError(f"Invalid JSON: {str(e)}")
    
    def _extract_json(self, text: str) -> str:
        """
        Extract JSON from text that might contain other content.
        
        Args:
            text: Text potentially containing JSON
            
        Returns:
            str: Extracted JSON string
        """
        text = text.strip()
        
        # If text is already valid JSON, return it
        try:
            json.loads(text)
            return text
        except json.JSONDecodeError:
            pass
        
        # Look for code blocks
        if "```json" in text:
            # Extract content from JSON code block
            parts = text.split("```json", 1)[1].split("```", 1)
            if parts:
                return parts[0].strip()
        elif "```" in text:
            # Extract from generic code block
            parts = text.split("```", 1)[1].split("```", 1)
            if parts:
                return parts[0].strip()
        
        # Look for JSON-like content
        start_idx = text.find("{")
        end_idx = text.rfind("}")
        
        if (start_idx != -1 and end_idx != -1 and start_idx < end_idx):
            return text[start_idx:end_idx + 1]
        
        # Failed to extract JSON
        return text
    
    def get_format_instructions(self) -> str:
        """Get instructions for the expected JSON format."""
        if self.pydantic_model:
            # Generate a cleaner schema without anyOf patterns
            clean_schema = self._generate_clean_schema()
            return f"""
            Your response should be a JSON object with these fields:
            {json.dumps(clean_schema, indent=2)}
            
            Return only valid JSON with no additional text.
            """
        else:
            return """
            Your response should be a valid JSON object.
            Return only valid JSON with no additional text.
            """
    
    def _generate_clean_schema(self) -> Dict[str, Any]:
        """
        Generate a simplified schema based on the Pydantic model.
        Removes verbose anyOf patterns in favor of more concise field descriptions.
        """
        if not self.pydantic_model:
            return {}
            
        # Get the full schema
        full_schema = self.pydantic_model.schema()
        
        # Extract only the properties section which has the field info
        properties = full_schema.get("properties", {})
        required = full_schema.get("required", [])
        
        # Create a simplified schema structure
        simplified = {}
        
        # Process each property
        for field_name, field_schema in properties.items():
            # Check if field is required
            is_required = field_name in required
            
            # Get field type and description
            field_type = self._get_simplified_type(field_schema)
            field_desc = field_schema.get("description", "")
            
            # Create simplified entry
            simplified[field_name] = {
                "type": field_type,
                "required": is_required,
                "description": field_desc
            }
            
            # Add example values for common types
            if field_type == "string":
                simplified[field_name]["example"] = "example text"
            elif field_type == "integer" or field_type == "number":
                simplified[field_name]["example"] = 100
            elif field_type == "boolean":
                simplified[field_name]["example"] = True
            elif field_type == "array":
                simplified[field_name]["example"] = ["item1", "item2"]
            elif field_type == "object":
                simplified[field_name]["example"] = {"key": "value"}
        
        return simplified
    
    def _get_simplified_type(self, field_schema: Dict[str, Any]) -> str:
        """Extract simplified type from a potentially complex field schema."""
        # Handle arrays
        if field_schema.get("type") == "array":
            return "array"
            
        # Handle objects
        if field_schema.get("type") == "object":
            return "object"
            
        # Handle simple types
        if "type" in field_schema:
            return field_schema["type"]
            
        # Handle anyOf patterns
        if "anyOf" in field_schema:
            for option in field_schema["anyOf"]:
                # Skip null type
                if option.get("type") == "null":
                    continue
                    
                # Return first non-null type
                if "type" in option:
                    return option["type"]
                    
                # Handle nested anyOf
                if "anyOf" in option:
                    return self._get_simplified_type(option)
        
        # Default to string if can't determine
        return "string"


# Define common schema models
class PageAnalysisResult(BaseModel):
    """Schema for page analysis results."""
    page_type: str = Field(..., description="Must be exactly 'PRODUCT', 'CATEGORY', or 'NEITHER'")
    confidence: int = Field(..., description="Integer from 0-100 indicating confidence level")
    reason: str = Field(..., description="Brief explanation of classification")
    recommended_links: Optional[List[Dict[str, str]]] = Field(None, description="Only for CATEGORY pages, list of recommended product links")


class ProductLinkRecommendation(BaseModel):
    """Schema for product link recommendations."""
    url: str = Field(..., description="Full URL of recommended product link")
    reason: str = Field(..., description="Why this link was selected")

class LinkSelectionResult(BaseModel):
    """Schema for link selection results."""
    selection: int = Field(..., description="The index number of the selected link (1-based)")
    reason: str = Field(..., description="Reason why this link was selected")
    is_product_page: bool = Field(..., description="Whether this is likely a direct product page (vs. category)")