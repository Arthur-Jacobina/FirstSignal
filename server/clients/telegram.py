import json
import os
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, Optional
from dotenv import load_dotenv

from .database import get_database_client
from .constants import TELEGRAM_API_BASE
from .blockchain import get_blockchain_client

load_dotenv()

# Import agent - adding parent directory to path to import from root
try:
    import sys
    import os
    # Add the parent directory (server/) to Python path
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    from agent import agent
    print("Successfully imported agent")
except ImportError as e:
    print(f"Warning: Could not import agent: {e}")
    agent = None




class TelegramClient:
    """Telegram Bot API client with database integration for chat management."""
    
    def __init__(self, token: str):
        """Initialize the Telegram client with a bot token.
        
        Args:
            token: Telegram bot token from BotFather
        """
        if not token:
            raise ValueError("Telegram bot token is required")
        self._token = token
        # Store for pending messages that are waiting for user approval
        self._pending_messages: Dict[str, str] = {}
    
    # Public API methods
    
    def _resolve_chat_id(self, handle: Optional[str]) -> int:
        if not handle:
            raise ValueError("Provide either chat_id or handle")

        h = handle.strip()

        if h.lstrip("-").isdigit():
            return int(h)

        result = self.find_registered_chat(h)
        if result is not None:
            return result

        raise ValueError(f"User '{h}' not found. The user needs to message the bot first to get registered, or provide a numeric chat_id instead of a username.")

    def is_chat_registered(self, chat_id: int) -> bool:
        """Return True if the chat_id is already registered in the database."""
        try:
            db = get_database_client()
            return db.is_chat_registered(chat_id)
        except Exception as e:
            print(f"Error checking registration status: {e}")
            return False

    def register_chat(self, chat_id: int, username: Optional[str]) -> None:
        """Register a chat with the associated user handle (may be None)."""
        try:
            db = get_database_client()
            success = db.register_chat(chat_id, username)
            if not success:
                print(f"Failed to register chat {chat_id}")
        except Exception as e:
            print(f"Error registering chat: {e}")

    def find_registered_chat(self, handle: str) -> Optional[int]:
        """Find a chat_id by username from the database."""
        try:
            db = get_database_client()
            result = db.find_chat_id_by_username(handle)
            return result
        except Exception as e:
            print(f"Error finding chat by handle: {e}")
            return None

    def send_message(
        self,
        *,
        chat_id: str,
        text: str,
        parse_mode: Optional[str] = None,
        disable_web_page_preview: Optional[bool] = None,
        reply_markup: Optional[Dict[str, Any]] = None,
        protect_content: bool = True,
    ) -> Dict[str, Any]:
        """
        Send a message via the Telegram Bot API using only the Python standard library.

        Args:
            chat_id: Destination chat ID (user, group, or channel)
            text: The message text to send
            parse_mode: Optional parse mode (e.g. "MarkdownV2" or "HTML")
            disable_web_page_preview: Disable link previews if True
            reply_markup: Optional reply markup dict (e.g. inline keyboard)
            protect_content: If True, prevent users from forwarding or saving the message

        Returns:
            Parsed JSON response from Telegram, as a dict.

        Raises:
            RuntimeError: If Telegram returns ok == False or an HTTP error occurs.
        """
        url = f"{TELEGRAM_API_BASE}/bot{self._token}/sendMessage"

        payload: Dict[str, Any] = {"chat_id": chat_id, "text": text}
        if parse_mode:
            payload["parse_mode"] = parse_mode
        if disable_web_page_preview is not None:
            payload["disable_web_page_preview"] = disable_web_page_preview
        if protect_content is not None:
            payload["protect_content"] = protect_content
        if reply_markup is not None:
            payload["reply_markup"] = reply_markup

        return self._make_api_request(url, payload)

    def send_photo(
        self,
        *,
        chat_id: str,
        photo: str,
        caption: Optional[str] = None,
        parse_mode: Optional[str] = None,
        protect_content: bool = True,
    ) -> Dict[str, Any]:
        """
        Send a photo via the Telegram Bot API.

        Args:
            chat_id: Destination chat ID (user, group, or channel)
            photo: Photo to send (URL, file_id, or file path)
            caption: Optional photo caption
            parse_mode: Optional parse mode for caption
            protect_content: If True, prevent users from forwarding or saving the photo

        Returns:
            Parsed JSON response from Telegram, as a dict.

        Raises:
            RuntimeError: If Telegram returns ok == False or an HTTP error occurs.
        """
        url = f"{TELEGRAM_API_BASE}/bot{self._token}/sendPhoto"

        payload: Dict[str, Any] = {"chat_id": chat_id, "photo": photo}
        if caption:
            payload["caption"] = caption
        if parse_mode:
            payload["parse_mode"] = parse_mode
        if protect_content is not None:
            payload["protect_content"] = protect_content

        return self._make_api_request(url, payload)

    def get_chat(self, chat_identifier: str) -> Dict[str, Any]:
        """
        Fetch chat information using Bot API getChat.

        chat_identifier can be a numeric ID (as string) or a public @username for
        supergroups/channels (e.g. "@mychannel"). For private users, username lookup
        is not supported by the Bot API.
        """
        url = f"{TELEGRAM_API_BASE}/bot{self._token}/getChat"
        payload = {"chat_id": chat_identifier}
        
        result = self._make_api_request(url, payload)
        
        chat = result.get("result")
        if not isinstance(chat, dict):
            raise RuntimeError("Unexpected response structure for getChat")
        return chat

    def resolve_chat_id(self, username_or_id: str) -> int:
        """
        Resolve a chat id from a public @username (channels/supergroups) or pass-through a numeric id.

        For private users, Bot API cannot resolve by username; the user must message the bot first,
        after which you can read chat.id from updates, or you must use the full Telegram client API
        (e.g., Telethon/TDLib) with a user account.
        """
        # If numeric, return as int
        if username_or_id.isdigit() or (username_or_id.startswith("-") and username_or_id[1:].isdigit()):
            return int(username_or_id)

        if username_or_id.startswith("@"):  # public channel/supergroup username
            chat = self.get_chat(chat_identifier=username_or_id)
            chat_id = chat.get("id")
            if not isinstance(chat_id, int):
                raise RuntimeError("getChat did not return a numeric chat id")
            return chat_id

        raise RuntimeError("Provide a numeric chat id or a public @username (channels/supergroups only)")

    def send_decision_prompt(self, *, chat_id: int, prompt_text: str = "2B or not 2B?", initial_message_id: Optional[int] = None, pending_message: Optional[str] = None, image_message_id: Optional[int] = None, sender_handle: Optional[str] = None) -> Dict[str, Any]:
        """Send a message with Yes/No inline keyboard buttons for the initial 'open' decision."""
        approve_data = "open"
        decline_data = "ignore"
        
        # Include initial message ID in callback data if provided
        if initial_message_id is not None:
            approve_data = f"open:{initial_message_id}"
            decline_data = f"ignore:{initial_message_id}"
        
        # Store all the data for the multi-stage flow
        message_key = f"{chat_id}:{approve_data}"
        if pending_message is not None or image_message_id is not None or sender_handle is not None:
            self._pending_messages[message_key] = {
                "message": pending_message,
                "image_message_id": image_message_id,
                "sender_handle": sender_handle,
                "stage": "open"  # Track which stage we're in
            }
        
        reply_markup = {
            "inline_keyboard": [
                [
                    {"text": "Yes ✅", "callback_data": approve_data},
                    {"text": "No ❌", "callback_data": decline_data},
                ]
            ]
        }
        return self.send_message(chat_id=str(chat_id), text=prompt_text, reply_markup=reply_markup, protect_content=True)

    def send_accept_prompt(self, *, chat_id: int, message_content: str, approve_data: str, decline_data: str) -> Dict[str, Any]:
        """Send the message content with accept/decline buttons for the second stage."""
        reply_markup = {
            "inline_keyboard": [
                [
                    {"text": "Accept ✅", "callback_data": approve_data},
                    {"text": "Decline ❌", "callback_data": decline_data},
                ]
            ]
        }
        
        # Show the actual message content
        full_text = f"{message_content}\n\nDo you want to accept this message?"
        return self.send_message(chat_id=str(chat_id), text=full_text, reply_markup=reply_markup, protect_content=True)

    def send_welcome_registration_prompt(self, *, chat_id: int) -> Dict[str, Any]:
        """Send a welcome message with registration button."""
        text = "Welcome to First Signal! Tap the button below to register and start receiving signals. ⏈"
        reply_markup = {
            "inline_keyboard": [
                [
                    {"text": "Register to check", "callback_data": "register"},
                ]
            ]
        }
        return self.send_message(chat_id=str(chat_id), text=text, reply_markup=reply_markup, protect_content=True)

    def run_listener(self, *, allowed_chat_id: Optional[int] = None, prompt_text: str = "Approve this request?") -> None:
        """Run the main polling listener for handling incoming messages and callback queries."""
        print("Starting Telegram long-polling listener...")
        print(f"Allowed chat id: {allowed_chat_id if allowed_chat_id is not None else 'any'}")
        offset: Optional[int] = None

        try:
            while True:
                try:
                    updates = self._get_updates(offset=offset, timeout=50)
                except Exception as exc:  # noqa: BLE001
                    print(f"getUpdates error: {exc}", file=sys.stderr)
                    continue

                results = updates.get("result", [])
                for update in results:
                    # Advance offset regardless of content
                    if isinstance(update, dict) and "update_id" in update:
                        offset = update["update_id"] + 1

                    # Handle callback queries (button presses)
                    if isinstance(update, dict) and "callback_query" in update:
                        self._handle_callback_query(update["callback_query"], allowed_chat_id)
                        continue

                    # Handle normal messages
                    if isinstance(update, dict) and "message" in update:
                        self._handle_message(update["message"], allowed_chat_id, prompt_text)
        except KeyboardInterrupt:
            print("Listener stopped by user.")
    
    # Private helper methods
    
    def _make_api_request(self, url: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Make a POST request to the Telegram Bot API."""
        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")

        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                response_body = response.read().decode("utf-8")
                result = json.loads(response_body)
        except urllib.error.HTTPError as http_err:
            error_text = http_err.read().decode("utf-8", errors="ignore") if hasattr(http_err, "read") else str(http_err)
            raise RuntimeError(f"Telegram HTTP error: {http_err.code} {http_err.reason}: {error_text}") from http_err
        except urllib.error.URLError as url_err:
            raise RuntimeError(f"Network error calling Telegram Bot API: {url_err}") from url_err

        if not isinstance(result, dict) or not result.get("ok", False):
            description = result.get("description") if isinstance(result, dict) else "Unknown error"
            raise RuntimeError(f"Telegram returned an error: {description}")

        return result

    def _get_updates(self, *, offset: Optional[int] = None, timeout: int = 50) -> Dict[str, Any]:
        """Get updates from Telegram Bot API."""
        url = f"{TELEGRAM_API_BASE}/bot{self._token}/getUpdates"
        payload: Dict[str, Any] = {"timeout": timeout}
        if offset is not None:
            payload["offset"] = offset

        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")

        try:
            with urllib.request.urlopen(request, timeout=timeout + 10) as response:
                response_body = response.read().decode("utf-8")
                result = json.loads(response_body)
        except urllib.error.HTTPError as http_err:
            error_text = http_err.read().decode("utf-8", errors="ignore") if hasattr(http_err, "read") else str(http_err)
            raise RuntimeError(f"Telegram HTTP error: {http_err.code} {http_err.reason}: {error_text}") from http_err
        except urllib.error.URLError as url_err:
            raise RuntimeError(f"Network error calling Telegram Bot API: {url_err}") from url_err

        if not isinstance(result, dict) or not result.get("ok", False):
            description = result.get("description") if isinstance(result, dict) else "Unknown error"
            raise RuntimeError(f"Telegram returned an error from getUpdates: {description}")

        return result

    def _answer_callback_query(self, *, callback_query_id: str, text: Optional[str] = None, show_alert: bool = False) -> Dict[str, Any]:
        """Answer a callback query (button press)."""
        url = f"{TELEGRAM_API_BASE}/bot{self._token}/answerCallbackQuery"
        payload: Dict[str, Any] = {"callback_query_id": callback_query_id}
        if text is not None:
            payload["text"] = text
        if show_alert:
            payload["show_alert"] = True

        return self._make_api_request(url, payload)

    def _edit_message_text(self, *, chat_id: int, message_id: int, text: str) -> Dict[str, Any]:
        """Edit the text of an existing message."""
        url = f"{TELEGRAM_API_BASE}/bot{self._token}/editMessageText"
        payload: Dict[str, Any] = {
            "chat_id": chat_id,
            "message_id": message_id,
            "text": text,
        }

        return self._make_api_request(url, payload)

    def delete_message(self, *, chat_id: int, message_id: int) -> Dict[str, Any]:
        """Delete a message."""
        url = f"{TELEGRAM_API_BASE}/bot{self._token}/deleteMessage"
        payload: Dict[str, Any] = {
            "chat_id": chat_id,
            "message_id": message_id,
        }

        return self._make_api_request(url, payload)

    def _handle_callback_query(self, callback_query: Dict[str, Any], allowed_chat_id: Optional[int]) -> None:
        """Handle callback query (button press) events."""
        data = callback_query.get("data")
        callback_query_id = callback_query.get("id")
        message = callback_query.get("message", {}) or {}
        chat = message.get("chat", {}) or {}
        chat_id = chat.get("id")
        message_id = message.get("message_id")
        from_user = callback_query.get("from", {}) or {}
        username = from_user.get("username")

        if allowed_chat_id is not None and chat_id != allowed_chat_id:
            # Ignore callbacks from other chats
            return

        # Registration flow
        if data == "register" and callback_query_id and chat_id:
            try:
                self.register_chat(int(chat_id), username)
                print(f"Registered chat_id={chat_id}, username={username}")
            except Exception as exc:  # noqa: BLE001
                print(f"Registration error: {exc}", file=sys.stderr)
            try:
                self._answer_callback_query(callback_query_id=callback_query_id, text="Registration complete ✅")
            except Exception as exc:  # noqa: BLE001
                print(f"answerCallbackQuery error: {exc}", file=sys.stderr)
            if message_id:
                try:
                    self._edit_message_text(chat_id=chat_id, message_id=message_id, text="Registration complete ✅")
                except Exception as exc:  # noqa: BLE001
                    print(f"editMessageText error: {exc}", file=sys.stderr)
            return

        # Multi-stage decision flow
        if data and callback_query_id and chat_id and message_id:
            # Parse callback data - it might include initial message ID
            action = data
            initial_message_id = None
            if ":" in data:
                action, initial_msg_id_str = data.split(":", 1)
                try:
                    initial_message_id = int(initial_msg_id_str)
                except ValueError:
                    pass  # Invalid format, ignore
            
            # Stage 1: User clicked "Yes" to open the message
            if action == "open":
                print(f"[STAGE 1 - OPEN] User {chat_id} opened a message")
                message_key = f"{chat_id}:{data}"
                pending_message_data = self._pending_messages.get(message_key)
                
                if pending_message_data and pending_message_data.get("message"):
                    # Delete the image message
                    if pending_message_data.get("image_message_id"):
                        try:
                            self.delete_message(chat_id=chat_id, message_id=pending_message_data["image_message_id"])
                        except Exception as exc:  # noqa: BLE001
                            print(f"deleteMessage (image) error: {exc}", file=sys.stderr)
                    
                    # Delete the current prompt message
                    try:
                        self.delete_message(chat_id=chat_id, message_id=message_id)
                    except Exception as exc:  # noqa: BLE001
                        print(f"deleteMessage (prompt) error: {exc}", file=sys.stderr)
                    
                    # Update the stage and create new callback data for stage 2
                    pending_message_data["stage"] = "accept"
                    accept_data = f"accept:{initial_message_id}" if initial_message_id else "accept"
                    decline_data = f"decline_accept:{initial_message_id}" if initial_message_id else "decline_accept"
                    
                    # Store the data with new keys for stage 2
                    accept_key = f"{chat_id}:{accept_data}"
                    self._pending_messages[accept_key] = pending_message_data
                    
                    # Send stage 2: show message content with accept/decline
                    try:
                        self.send_accept_prompt(
                            chat_id=chat_id,
                            message_content=pending_message_data["message"],
                            approve_data=accept_data,
                            decline_data=decline_data
                        )
                    except Exception as exc:  # noqa: BLE001
                        print(f"Failed to send accept prompt: {exc}", file=sys.stderr)
                    
                    # Clean up the old key
                    if message_key in self._pending_messages:
                        del self._pending_messages[message_key]
                
                try:
                    self._answer_callback_query(callback_query_id=callback_query_id, text="Message opened")
                except Exception as exc:  # noqa: BLE001
                    print(f"answerCallbackQuery error: {exc}", file=sys.stderr)
            
            # Stage 2: User clicked "Accept" after seeing the message content
            elif action == "accept":
                print(f"[STAGE 2 - ACCEPT] User {chat_id} accepted a message from {pending_message_data.get('sender_handle', 'Unknown') if 'pending_message_data' in locals() else 'Unknown'}")
                message_key = f"{chat_id}:{data}"
                pending_message_data = self._pending_messages.get(message_key)
                
                if pending_message_data:
                    print(f"[STAGE 2 - ACCEPT] Message from {pending_message_data.get('sender_handle', 'Unknown')} accepted by user {chat_id}")
                
                blockchain_result = None
                if pending_message_data:
                    # Store message on blockchain if it exists
                    if pending_message_data.get("message"):
                        try:
                            blockchain_client = get_blockchain_client()
                            blockchain_result = blockchain_client.store_message(pending_message_data["message"])
                            print(f"Blockchain transaction result: {blockchain_result}")
                        except Exception as exc:  # noqa: BLE001
                            print(f"Failed to store message on blockchain: {exc}", file=sys.stderr)
                            blockchain_result = {"success": False, "error": str(exc)}
                    
                    # Edit the accept prompt message to remove buttons (keep the message content visible)
                    try:
                        message_text = pending_message_data["message"]
                        self._edit_message_text(chat_id=chat_id, message_id=message_id, text=message_text)
                    except Exception as exc:  # noqa: BLE001
                        print(f"editMessageText (remove buttons) error: {exc}", file=sys.stderr)
                    
                    # Stage 3: Reveal the sender's handle
                    try:
                        sender_text = f"🌹\n\nNot so secret admirer: {pending_message_data.get('sender_handle', 'Secret admirer')}"
                        if blockchain_result and blockchain_result.get("success"):
                            tx_hash = blockchain_result.get("transaction_hash", "")
                            short_hash = tx_hash[:10] + "..." if len(tx_hash) > 10 else tx_hash
                            sender_text += f"\n\n🔗 Stored on blockchain: {short_hash}"
                        
                        self.send_message(chat_id=str(chat_id), text=sender_text)
                    except Exception as exc:  # noqa: BLE001
                        print(f"Failed to send sender reveal: {exc}", file=sys.stderr)
                    
                    # Stage 4: Send agent recommendation to the sender for next message
                    if pending_message_data.get("sender_handle") and agent is not None:
                        try:
                            # Get recipient's username/handle
                            db = get_database_client()
                            recipient_username = db.get_username_by_chat_id(chat_id)
                            recipient_name = recipient_username or f"User {chat_id}"
                            
                            # Prepare input for agent
                            approved_message = pending_message_data.get("message", "")
                            agent_input = f"My message '{approved_message}' was just approved by {recipient_name}. What should I send next to continue this connection? Give me advice for my next message to keep the conversation flowing naturally."
                            
                            print(f"Calling agent for next message recommendation: {agent_input}")
                            agent_response = agent(user_input=agent_input)
                            recommendation = agent_response.response if hasattr(agent_response, 'response') else str(agent_response)
                            
                            # Send recommendation to the original sender
                            sender_chat_id = self._resolve_chat_id(pending_message_data.get("sender_handle"))
                            recommendation_text = f"🎯 Great news! Your message was accepted! 🎉\n\n💡 Here's my recommendation for your next move:\n\n{recommendation}"
                            
                            self.send_message(chat_id=str(sender_chat_id), text=recommendation_text, protect_content=False)
                            print(f"Sent agent recommendation to sender {pending_message_data.get('sender_handle')}")
                            
                        except Exception as exc:  # noqa: BLE001
                            print(f"Failed to send agent recommendation to sender: {exc}", file=sys.stderr)
                    
                    # Clean up the stored message
                    del self._pending_messages[message_key]
                
                try:
                    self._answer_callback_query(callback_query_id=callback_query_id, text="Message accepted!")
                except Exception as exc:  # noqa: BLE001
                    print(f"answerCallbackQuery error: {exc}", file=sys.stderr)
            
            # Handle declines at any stage
            elif action in ["ignore", "decline_accept"]:
                # Find the message key - could be current or need to reconstruct
                message_key = f"{chat_id}:{data}"
                
                # For ignore (stage 1), look for the open key
                if action == "ignore":
                    print(f"[STAGE 1 - DECLINE] User {chat_id} ignored/declined to open a message")
                    
                    # Get the pending message data first
                    open_key = f"{chat_id}:{data.replace('ignore', 'open')}"
                    pending_message_data = self._pending_messages.get(open_key)
                    
                    if pending_message_data and pending_message_data.get("sender_handle"):
                        try:
                            sender_id = self._resolve_chat_id(pending_message_data.get("sender_handle"))
                            self.send_message(chat_id=str(sender_id), text='''Eh, looks like this arrow didn't land... 

I find a gadget from my pocket and ready to match you someone. Just let me know when you ready.''')
                            print(f"[STAGE 1 - DECLINE] Notified sender {pending_message_data.get('sender_handle')} that user {chat_id} declined")
                        except Exception as exc:  # noqa: BLE001
                            print(f"Failed to notify sender of decline: {exc}", file=sys.stderr)
                        
                        print(f"[STAGE 1 - DECLINE] Message from {pending_message_data.get('sender_handle', 'Unknown')} ignored by user {chat_id}")
                    
                    if open_key in self._pending_messages:
                        del self._pending_messages[open_key]
                else:
                    # For decline_accept (stage 2), use current key
                    pending_message_data = self._pending_messages.get(message_key)
                    if pending_message_data:
                        print(f"[STAGE 2 - DECLINE] Message from {pending_message_data.get('sender_handle', 'Unknown')} declined by user {chat_id}")
                    else:
                        print(f"[STAGE 2 - DECLINE] User {chat_id} declined to accept a message")
                    if message_key in self._pending_messages:
                        del self._pending_messages[message_key]
                
                # Delete the image message if we have its ID
                if pending_message_data and pending_message_data.get("image_message_id"):
                    try:
                        self.delete_message(chat_id=chat_id, message_id=pending_message_data["image_message_id"])
                    except Exception as exc:  # noqa: BLE001
                        print(f"deleteMessage (image) error: {exc}", file=sys.stderr)
                
                # Delete the initial message if we have its ID
                if initial_message_id is not None:
                    try:
                        self.delete_message(chat_id=chat_id, message_id=initial_message_id)
                    except Exception as exc:  # noqa: BLE001
                        print(f"deleteMessage (initial) error: {exc}", file=sys.stderr)
                
                try:
                    # Delete the current prompt message
                    self.delete_message(chat_id=chat_id, message_id=message_id)
                except Exception as exc:  # noqa: BLE001
                    print(f"deleteMessage (prompt) error: {exc}", file=sys.stderr)
                
                try:
                    # Send the kills message
                    self.send_message(chat_id=str(chat_id), text="Got it. Kills: +1")
                except Exception as exc:  # noqa: BLE001
                    print(f"Failed to send kills message: {exc}", file=sys.stderr)
                
                try:
                    self._answer_callback_query(callback_query_id=callback_query_id, text="Declined")
                except Exception as exc:  # noqa: BLE001
                    print(f"answerCallbackQuery error: {exc}", file=sys.stderr)

    def _handle_message(self, message: Dict[str, Any], allowed_chat_id: Optional[int], prompt_text: str) -> None:
        """Handle incoming message events."""
        chat = message.get("chat", {}) or {}
        chat_id = chat.get("id")
        from_user = message.get("from", {}) or {}
        username = from_user.get("username")
        text = message.get("text", "")

        if allowed_chat_id is not None and chat_id != allowed_chat_id:
            # Ignore messages from other chats
            return

        if chat_id is not None:
            # If not registered, send welcome and register button
            if not self.is_chat_registered(int(chat_id)):
                try:
                    self.send_welcome_registration_prompt(chat_id=int(chat_id))
                except Exception as exc:  # noqa: BLE001
                    print(f"Failed to send welcome prompt: {exc}", file=sys.stderr)
                return

            # Already registered: call agent with user message and send response
            if text and agent is not None:
                try:
                    print(f"Calling agent with user input: {text}")
                    agent_response = agent(user_input=text)
                    response_text = agent_response.response if hasattr(agent_response, 'response') else str(agent_response)
                    
                    # Send the agent's response back to the user
                    self.send_message(chat_id=str(chat_id), text=response_text, protect_content=False)
                    print(f"Sent agent response to chat {chat_id}: {response_text}")
                except Exception as exc:  # noqa: BLE001
                    print(f"Failed to process message with agent: {exc}", file=sys.stderr)
                    # Fallback to decision prompt if agent fails
                    try:
                        self.send_decision_prompt(chat_id=int(chat_id), prompt_text=prompt_text)
                    except Exception as fallback_exc:  # noqa: BLE001
                        print(f"Failed to send decision prompt: {fallback_exc}", file=sys.stderr)
            else:
                # No text message or agent not available: proceed with decision prompt
                try:
                    self.send_decision_prompt(chat_id=int(chat_id), prompt_text=prompt_text)
                except Exception as exc:  # noqa: BLE001
                    print(f"Failed to send decision prompt: {exc}", file=sys.stderr)