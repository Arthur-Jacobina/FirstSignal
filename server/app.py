import os
import threading
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from x402.fastapi.middleware import require_payment

from clients.telegram import TelegramClient
from schemas.app import SendRequest
from cdp import CdpClient
from dotenv import load_dotenv

load_dotenv()

cdp_client = CdpClient()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
if not BOT_TOKEN:
    raise RuntimeError("TELEGRAM_BOT_TOKEN must be set in environment or .env")

ALLOWED_CHAT_ID_ENV = os.getenv("TELEGRAM_ALLOWED_CHAT_ID")

telegram_client = TelegramClient(BOT_TOKEN)

def _parse_allowed_chat_id(value: Optional[str]) -> Optional[int]:
    if not value:
        return None
    try:
        return int(value)
    except ValueError:
        raise RuntimeError("TELEGRAM_ALLOWED_CHAT_ID must be numeric if set")


@asynccontextmanager
async def lifespan(app: FastAPI):
    allowed_chat_id = _parse_allowed_chat_id(ALLOWED_CHAT_ID_ENV)

    listener_thread = threading.Thread(
        target=telegram_client.run_listener,
        kwargs={
            "allowed_chat_id": allowed_chat_id,
            "prompt_text": "Approve this request?",
        },
        daemon=True,
        name="telegram-listener-thread",
    )
    listener_thread.start()
    try:
        yield
    finally:
        pass


app = FastAPI(title="First Signal API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "*",
        "Content-Type",
        "Authorization", 
        "Accept",
        "Origin",
        "X-Requested-With",
        "x-payment-required",
        "x-payment-response",
        "x-payment-proof",
        "x-payment-invoice"
    ],
    expose_headers=[
        "x-payment-response", 
        "x-payment-required",
        "x-payment-proof",
        "x-payment-invoice",
        "Content-Type"
    ],
)

@app.middleware("http")
async def payment_middleware(request, call_next):
    wallet = await cdp_client.evm.get_or_create_account(name="FirstSignal")
    if request.method == "OPTIONS":
        return await call_next(request)

    if request.url.path == "/send" and request.method == "POST":
        payment_middleware_func = require_payment(
            path="/send",
            price="$0.001", 
            pay_to_address=wallet.address,
            network="base-sepolia",
            description="Send a secret signal with approval prompt to a Telegram user",
            input_schema={
                "type": "object",
                "properties": {
                    "handle": {"type": "string", "description": "Telegram @username or handle"},
                    "chat_id": {"type": "integer", "description": "Numeric chat ID"},
                    "message": {"type": "string", "description": "Secret message to send"},
                    "sender_handle": {"type": "string", "description": "Your handle to reveal after approval"}
                },
                "required": ["message"]
            },
            output_schema={
                "type": "object",
                "properties": {
                    "ok": {"type": "boolean"},
                    "chat_id": {"type": "integer"},
                    "message_id": {"type": "integer"},
                    "image_message_id": {"type": "integer"}
                }
            }
        )
        
        response = await payment_middleware_func(request, call_next)
        
        origin = request.headers.get("origin")
        if origin:
            response.headers["access-control-allow-origin"] = origin
            response.headers["access-control-allow-credentials"] = "true"
            response.headers["access-control-expose-headers"] = ", ".join([
                "x-payment-response", 
                "x-payment-required",
                "x-payment-proof",
                "x-payment-invoice",
                "Content-Type"
            ])
        
        return response
    else:
        return await call_next(request)

def _resolve_chat_id(handle: Optional[str]) -> int:
    if not handle:
        raise ValueError("Provide either chat_id or handle")

    h = handle.strip()

    if h.lstrip("-").isdigit():
        return int(h)

    result = telegram_client.find_registered_chat(h)
    if result is not None:
        return result

    raise ValueError(f"User '{h}' not found. The user needs to message the bot first to get registered, or provide a numeric chat_id instead of a username.")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}

@app.post("/send")
def send(payload: SendRequest) -> dict:
    try:
        print(payload)
        resolved_chat_id = _resolve_chat_id(payload.handle)
        print(resolved_chat_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    try:
        image_url = "https://i.imgur.com/SeO2KFF.jpeg"
        image_response = telegram_client.send_photo(
            chat_id=str(resolved_chat_id),
            photo=image_url
        )
        image_message_id = image_response.get("result", {}).get("message_id")

        api_response = telegram_client.send_decision_prompt(
            chat_id=resolved_chat_id,
            prompt_text="Your secret admirer sent you a signal, do you want to open it?",
            initial_message_id=image_message_id,  # In case of two messages later for better UI
            pending_message=payload.message,
            image_message_id=image_message_id,
            sender_handle=payload.sender_handle
        )
        decision_message_id = api_response.get("result", {}).get("message_id")

        return {"ok": True, "chat_id": resolved_chat_id, "message_id": decision_message_id, "image_message_id": image_message_id}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to send message: {exc}")


def run() -> None:
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "2053"))
    uvicorn.run(app, host=host, port=port, reload=False)


if __name__ == "__main__":
    run() 