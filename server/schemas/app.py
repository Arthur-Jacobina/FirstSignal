from typing import Optional
from pydantic import BaseModel, Field

class SendRequest(BaseModel):
    handle: Optional[str] = Field(
        default=None,
        description="Telegram @username/handle (public channels/supergroups), or a previously-registered user",
    )
    chat_id: Optional[int] = Field(default=None, description="Numeric chat id")
    message: str = Field(..., description="Message text to send with Yes/No buttons")
