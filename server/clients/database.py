import os
from typing import Optional, List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

from schemas.database import RegisteredUser

load_dotenv()

class DatabaseClient:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment")
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
    
    def is_chat_registered(self, chat_id: int) -> bool:
        """Check if a chat_id is already registered in the database."""
        try:
            response = self.client.table("registered_users").select("chat_id").eq("chat_id", chat_id).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error checking if chat is registered: {e}")
            return False
    
    def register_chat(self, chat_id: int, username: Optional[str]) -> bool:
        """Register a new chat with optional username."""
        try:
            # Check if already registered
            if self.is_chat_registered(chat_id):
                return True
            
            # Insert new user
            data = {
                "chat_id": chat_id,
                "username": username or None
            }
            response = self.client.table("registered_users").insert(data).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error registering chat: {e}")
            return False
    
    def find_chat_id_by_username(self, username: str) -> Optional[int]:
        """Find a chat_id by username (case-insensitive)."""
        if not username:
            return None
        
        try:
            # Normalize username
            normalized = username.lower().lstrip("@")
            
            response = self.client.table("registered_users").select("chat_id, username").ilike("username", f"%{normalized}%").execute()
            
            # Find exact match (case-insensitive)
            for user in response.data:
                stored_username = user.get("username")
                if stored_username and stored_username.lower().lstrip("@") == normalized:
                    return user["chat_id"]
            
            return None
        except Exception as e:
            print(f"Error finding chat by username: {e}")
            return None
    
    def get_username_by_chat_id(self, chat_id: int) -> Optional[str]:
        """Find a username by chat_id."""
        try:
            response = self.client.table("registered_users").select("username").eq("chat_id", chat_id).execute()
            if response.data:
                return response.data[0].get("username")
            return None
        except Exception as e:
            print(f"Error finding username by chat_id: {e}")
            return None
    
    def get_all_registered_users(self) -> List[RegisteredUser]:
        """Get all registered users from the database."""
        try:
            response = self.client.table("registered_users").select("*").execute()
            return [
                RegisteredUser(
                    chat_id=user["chat_id"],
                    username=user.get("username"),
                    created_at=user.get("created_at")
                )
                for user in response.data
            ]
        except Exception as e:
            print(f"Error getting all registered users: {e}")
            return []
    
    def update_username(self, chat_id: int, username: Optional[str]) -> bool:
        """Update the username for an existing registered user."""
        try:
            response = self.client.table("registered_users").update({
                "username": username
            }).eq("chat_id", chat_id).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error updating username: {e}")
            return False
    
    def unregister_chat(self, chat_id: int) -> bool:
        """Remove a chat from registered users."""
        try:
            response = self.client.table("registered_users").delete().eq("chat_id", chat_id).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error unregistering chat: {e}")
            return False


# Global database client instance
_db_client: Optional[DatabaseClient] = None


def get_database_client() -> DatabaseClient:
    """Get or create the global database client instance."""
    global _db_client
    if _db_client is None:
        _db_client = DatabaseClient()
    return _db_client 