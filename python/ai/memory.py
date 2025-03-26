"""
Memory Component
Provides basic conversation memory for maintaining context
"""
import logging
from collections import deque


class ConversationMemory:
    """Simple memory store for maintaining context in AI interactions."""
    
    def __init__(self, name, max_items=5):
        """
        Initialize a conversation memory.
        
        Args:
            name (str): Identifier for this memory
            max_items (int): Maximum number of items to store in memory
        """
        self.name = name
        self.max_items = max_items
        self.memory = deque(maxlen=max_items)
        self.logger = logging.getLogger(f"memory.{name}")
    
    def add(self, item):
        """
        Add an item to memory.
        
        Args:
            item (str): Item to add to memory
        """
        self.memory.append(item)
        self.logger.debug(f"Added to {self.name} memory: {item[:50]}...")
    
    def get_context(self):
        """
        Get the current context from memory.
        
        Returns:
            str: Memory context as a string
        """
        if not self.memory:
            return "No previous context."
            
        return "\n".join([f"- {item}" for item in self.memory])
    
    def clear(self):
        """Clear all items from memory."""
        self.memory.clear()
        self.logger.debug(f"Cleared {self.name} memory")


class ContextManager:
    """
    Manages multiple conversation memories for different contexts.
    
    This allows maintaining separate contexts for different aspects of the system
    (e.g., link selection, page analysis, product extraction).
    """
    
    def __init__(self):
        """Initialize the context manager."""
        self.memories = {}
        self.logger = logging.getLogger("context_manager")
    
    def get_memory(self, name, max_items=5):
        """
        Get or create a memory for the specified context.
        
        Args:
            name (str): Memory context name
            max_items (int): Maximum items for this memory
            
        Returns:
            ConversationMemory: The memory instance
        """
        if name not in self.memories:
            self.memories[name] = ConversationMemory(name, max_items)
            self.logger.debug(f"Created new memory context: {name}")
            
        return self.memories[name]