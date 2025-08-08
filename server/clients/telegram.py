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

    def send_decision_prompt(self, *, chat_id: int, prompt_text: str = "2B or not 2B?", initial_message_id: Optional[int] = None, pending_message: Optional[str] = None, image_message_id: Optional[int] = None) -> Dict[str, Any]:
        """Send a message with Yes/No inline keyboard buttons."""
        approve_data = "approve"
        decline_data = "decline"
        
        # Include initial message ID in callback data if provided
        if initial_message_id is not None:
            approve_data = f"approve:{initial_message_id}"
            decline_data = f"decline:{initial_message_id}"
        
        # If we have a pending message or image, store them for later retrieval
        message_key = f"{chat_id}:{approve_data}"
        if pending_message is not None or image_message_id is not None:
            # Store both the message and image message ID
            self._pending_messages[message_key] = {
                "message": pending_message,
                "image_message_id": image_message_id
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

        # Decision flow
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
            
            if action == "approve":
                # Check if we have a pending message for this approval
                message_key = f"{chat_id}:{data}"
                pending_message_data = self._pending_messages.get(message_key)
                
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
                        
                        # Send the actual stored message
                        try:
                            message_text = pending_message_data["message"]
                            if blockchain_result and blockchain_result.get("success"):
                                tx_hash = blockchain_result.get("transaction_hash", "")
                                short_hash = tx_hash[:10] + "..." if len(tx_hash) > 10 else tx_hash
                                message_text += f"\n\n🔗 Stored on blockchain: {short_hash}"
                            self.send_message(chat_id=str(chat_id), text=message_text)
                        except Exception as exc:  # noqa: BLE001
                            print(f"Failed to send pending message: {exc}", file=sys.stderr)
                    
                    # Delete the image message if we have its ID
                    if pending_message_data.get("image_message_id"):
                        try:
                            self.delete_message(chat_id=chat_id, message_id=pending_message_data["image_message_id"])
                        except Exception as exc:  # noqa: BLE001
                            print(f"deleteMessage (image) error: {exc}", file=sys.stderr)
                    
                    # Clean up the stored message
                    del self._pending_messages[message_key]
                
                # Set status text based on blockchain result
                if blockchain_result and blockchain_result.get("success"):
                    status_text = "Message decoded & stored on blockchain ✅"
                elif blockchain_result:
                    status_text = "Message decoded ⚠️ (blockchain error)"
                else:
                    status_text = "Message decoded ✅"
                
                try:
                    self._answer_callback_query(callback_query_id=callback_query_id, text=status_text)
                except Exception as exc:  # noqa: BLE001
                    print(f"answerCallbackQuery error: {exc}", file=sys.stderr)
                try:
                    self._edit_message_text(chat_id=chat_id, message_id=message_id, text=status_text)
                except Exception as exc:  # noqa: BLE001
                    print(f"editMessageText error: {exc}", file=sys.stderr)
            
            elif action == "decline":
                # Get pending message data to access image message ID
                message_key = f"{chat_id}:{data.replace('decline', 'approve')}"
                pending_message_data = self._pending_messages.get(message_key)
                
                # Clean up any pending message
                if message_key in self._pending_messages:
                    del self._pending_messages[message_key]
                
                try:
                    self._answer_callback_query(callback_query_id=callback_query_id, text="Declined")
                except Exception as exc:  # noqa: BLE001
                    print(f"answerCallbackQuery error: {exc}", file=sys.stderr)
                
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
                    # Delete the decision prompt message
                    self.delete_message(chat_id=chat_id, message_id=message_id)
                except Exception as exc:  # noqa: BLE001
                    print(f"deleteMessage (prompt) error: {exc}", file=sys.stderr)
                try:
                    # Send the kills message
                    self.send_message(chat_id=str(chat_id), text="Got it. Kills: +1")
                except Exception as exc:  # noqa: BLE001
                    print(f"Failed to send kills message: {exc}", file=sys.stderr)

    def _handle_message(self, message: Dict[str, Any], allowed_chat_id: Optional[int], prompt_text: str) -> None:
        """Handle incoming message events."""
        chat = message.get("chat", {}) or {}
        chat_id = chat.get("id")
        from_user = message.get("from", {}) or {}
        username = from_user.get("username")

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

            # Already registered: proceed with decision prompt
            try:
                self.send_decision_prompt(chat_id=int(chat_id), prompt_text=prompt_text)
            except Exception as exc:  # noqa: BLE001
                print(f"Failed to send decision prompt: {exc}", file=sys.stderr)