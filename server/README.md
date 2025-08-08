# First Signal - Telegram Sender

Minimal Telegram send utility using stdlib only.

## Usage

1. Create a bot with BotFather and copy the bot token.
2. Get your chat ID (e.g. by sending a message to the bot and using a bot like @userinfobot, or log updates via getUpdates).
3. Set environment variables and run:

```bash
export TELEGRAM_BOT_TOKEN="<your-bot-token>"
export TELEGRAM_CHAT_ID="<your-chat-id>"
python -m clients.telegram --text "Hello"
```

Alternatively, pass flags explicitly:

```bash
python -m clients.telegram --token "<token>" --chat-id "<chat-id>" --text "Hello"
```

### Resolve chat id from a public @username

- Channels and supergroups with public usernames can be resolved via `getChat`:

```bash
python -m clients.telegram --token "<token>" --resolve-chat "@publicchannel"
# prints numeric chat id
```

- Private users cannot be resolved by username via the Bot API. They must message your bot first; then you can read `chat.id` from updates, or use the full Telegram client API (e.g. Telethon/TDLib) with a user account.

## Continuous listener with Approve/Decline buttons

You can run a long-polling listener that replies to any message in the allowed chat with an inline keyboard offering "Approve" and "Decline".

```bash
# Using console script (preferred)
uv run first-signal --listen --prompt-text "Approve this request?"

# Or with module path
python -m clients.telegram --listen --prompt-text "Approve this request?"
```

Optional:

- Restrict to a specific chat id:

```bash
export TELEGRAM_ALLOWED_CHAT_ID="<numeric-chat-id>"
uv run first-signal --listen
# or
python -m clients.telegram --listen --allowed-chat-id <numeric-chat-id>
```

## Database Setup

This application uses Supabase for storing registered users. To set up the database:

1. Create a new Supabase project at https://supabase.com
2. In your Supabase dashboard, go to the SQL Editor
3. Run the SQL script from `setup.sql` to create the necessary tables and indexes
4. Get your project URL and anon key from Project Settings > API

## Blockchain Integration

This application integrates with a smart contract deployed on Base Sepolia. When users approve messages through the Telegram bot, the messages are automatically stored on the blockchain using the FirstSignal smart contract.

### Smart Contract Features:
- **store(string _message)** - Stores a message on the blockchain
- **retrieveLast()** - Retrieves the last stored message
- **retrieve()** - Retrieves all stored messages

### Setup:
1. Deploy your FirstSignal smart contract to Base Sepolia
2. Add the contract address and your private key to your `.env` file
3. Ensure your wallet has sufficient ETH on Base Sepolia for gas fees

When a user clicks "Yes" on a signal request, the bot will:
1. Store the message on the blockchain via the smart contract
2. Send the decoded message to the user
3. Include the transaction hash in the response for verification

## Environment Variables

Create a `.env` file in the project root with the following variables:

### Required:
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token from BotFather
- `SUPABASE_URL` - Your Supabase project URL (https://your-project-id.supabase.co)
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `BLOCKCHAIN_PRIVATE_KEY` - Your private key for Base Sepolia transactions (without 0x prefix)
- `SMART_CONTRACT_ADDRESS` - Your deployed FirstSignal smart contract address on Base Sepolia

### Optional:
- `TELEGRAM_ALLOWED_CHAT_ID` - Restrict listener to specific chat ID
- `HOST` - Server host (default: 0.0.0.0)
- `PORT` - Server port (default: 2053)

Example `.env` file:
```
TELEGRAM_BOT_TOKEN=1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
SUPABASE_URL=https://abcdefghijk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TELEGRAM_ALLOWED_CHAT_ID=123456789
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here
SMART_CONTRACT_ADDRESS=0x1234567890abcdef...
```
