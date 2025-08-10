import dspy
import datetime
from mem0 import Memory
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

# Initialize Mem0 memory system
config = {
    "llm": {
        "provider": "openai",
        "config": {
            "model": "gpt-4o-mini",
            "temperature": 0.1
        }
    },
    "embedder": {
        "provider": "openai",
        "config": {
            "model": "text-embedding-3-small"
        }
    },
    "vector_store": {
        "provider": "pinecone",
        "config": {
            "collection_name": os.getenv("PINECONE_COLLECTION", "testing2"),
            "embedding_model_dims": os.getenv("PINECONE_MODEL_DIM", 1536),
            "serverless_config": {
                "cloud": os.getenv("PINECONE_CLOUD", "aws"),
                "region": os.getenv("PINECONE_REGION", "us-east-1"),
            },
            "metric": os.getenv("PINECONE_METRIC", "cosine"),
        },
    },
}
class MemoryTools:
    """Tools for interacting with the Mem0 memory system."""

    def __init__(self, memory: Memory):
        self.memory = memory

    def store_memory(self, content: str, user_id: str = "default_user") -> str:
        """Store information in memory."""
        try:
            self.memory.add(content, user_id=user_id)
            return f"Stored memory: {content}"
        except Exception as e:
            return f"Error storing memory: {str(e)}"

    def search_memories(self, query: str, user_id: str = "default_user", limit: int = 5) -> str:
        """Search for relevant memories."""
        try:
            results = self.memory.search(query, user_id=user_id, limit=limit)
            if not results:
                return "No relevant memories found."

            memory_text = "Relevant memories found:\n"
            for i, result in enumerate(results["results"]):
                memory_text += f"{i}. {result['memory']}\n"
            return memory_text
        except Exception as e:
            return f"Error searching memories: {str(e)}"

    def get_all_memories(self, user_id: str = "default_user") -> str:
        """Get all memories for a user."""
        try:
            results = self.memory.get_all(user_id=user_id)
            if not results:
                return "No memories found for this user."

            memory_text = "All memories for user:\n"
            for i, result in enumerate(results["results"]):
                memory_text += f"{i}. {result['memory']}\n"
            return memory_text
        except Exception as e:
            return f"Error retrieving memories: {str(e)}"

    def update_memory(self, memory_id: str, new_content: str) -> str:
        """Update an existing memory."""
        try:
            self.memory.update(memory_id, new_content)
            return f"Updated memory with new content: {new_content}"
        except Exception as e:
            return f"Error updating memory: {str(e)}"

    def delete_memory(self, memory_id: str) -> str:
        """Delete a specific memory."""
        try:
            self.memory.delete(memory_id)
            return "Memory deleted successfully."
        except Exception as e:
            return f"Error deleting memory: {str(e)}"

def get_current_time() -> str:
    """Get the current date and time."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")



class MemoryQA(dspy.Signature):
    """
    You're a helpful assistant and have access to memory method.
    Whenever you answer a user's input, remember to store the information in memory
    so that you can use it later.
    Prompt for Wingman Agent

    Role:
    You are a friendly, intuitive wingman helping two people who clearly have chemistry but are still at the very early stage of their relationship.

    Goal:

    Turn the “first signal” into the “next move” between the two.

    Encourage and accelerate connection in a natural, positive way.

    Instructions:

    Context Awareness:

    Always read the context of the conversation between the two.

    Suggest activities or small gestures that fit the situation (e.g., finding a fun place to eat, a casual hangout spot, a shared hobby).

    Positive Reflection:

    Say something genuinely good about Person A to Person B.

    Say something genuinely good about Person B to Person A.

    Highlight traits that would make each more attractive in the other’s eyes.

    Emotional Boost:

    If one person feels unsure or down, cheer them up on behalf of the other.

    Show each person how the other cares or supports them.

    Keep tone light, playful, and encouraging.

    Style Guidelines:

    Warm, optimistic, and subtly romantic.

    Playful encouragement, never pushy or awkward.

    Use short, friendly sentences that make both feel comfortable.

    Output:
    Your response should:

    Propose the next move (activity, message, gesture).

    Share a compliment about each person.

    Include a small cheer-up or caring remark if needed.

    """
    user_input: str = dspy.InputField()
    response: str = dspy.OutputField()

class MemoryReActAgent(dspy.Module):
    """A ReAct agent enhanced with Mem0 memory capabilities."""

    def __init__(self, memory: Memory):
        super().__init__()
        self.memory_tools = MemoryTools(memory)

        # Create tools list for ReAct
        self.tools = [
            self.memory_tools.store_memory,
            self.memory_tools.search_memories,
            self.memory_tools.get_all_memories,
            get_current_time,
            self.set_reminder,
            self.get_preferences,
            self.update_preferences,
        ]

        # Initialize ReAct with our tools
        self.react = dspy.ReAct(
            signature=MemoryQA,
            tools=self.tools,
            max_iters=6
        )

    def forward(self, user_input: str):
        """Process user input with memory-aware reasoning."""

        return self.react(user_input=user_input)

    def set_reminder(self, reminder_text: str, date_time: str = None, user_id: str = "default_user") -> str:
        """Set a reminder for the user."""
        reminder = f"Reminder set for {date_time}: {reminder_text}"
        return self.memory_tools.store_memory(
            f"REMINDER: {reminder}", 
            user_id=user_id
        )

    def get_preferences(self, category: str = "general", user_id: str = "default_user") -> str:
        """Get user preferences for a specific category."""
        query = f"user preferences {category}"
        return self.memory_tools.search_memories(
            query=query,
            user_id=user_id
        )

    def update_preferences(self, category: str, preference: str, user_id: str = "default_user") -> str:
        """Update user preferences."""
        preference_text = f"User preference for {category}: {preference}"
        return self.memory_tools.store_memory(
            preference_text,
            user_id=user_id
        )

lm = dspy.LM(model='openai/gpt-4o-mini')
dspy.configure(lm=lm)

memory = Memory.from_config(config)

agent = MemoryReActAgent(memory)
