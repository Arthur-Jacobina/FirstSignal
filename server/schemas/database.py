from dataclasses import dataclass
from typing import Optional

@dataclass
class RegisteredUser:
    chat_id: int
    username: Optional[str]
    created_at: Optional[str] = None
