# LinkedIn Connection Bot Backend

This is the backend service for the LinkedIn Connection Bot. It provides an API endpoint to start the bot and automate LinkedIn connection requests.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables in `.env`:
```
OPENAI_API_KEY="later shift to Gemini"
GOOGLE_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
BOT_API_PORT=8000
BOT_API_HOST=0.0.0.0
```

## Running the Bot API

Start the bot API server:
```bash
python bot_api.py
```

The server will start on `http://localhost:8000` by default.

## API Endpoints

### Start Bot
- **URL**: `/start_bot`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
    "query": "site:linkedin.com/in/ software engineer at google",
    "message": "Hi, I would like to connect with you on LinkedIn."
}
```
- **Response**:
```json
{
    "status": "success",
    "message": "Bot started successfully"
}
```

## Example Usage

Using curl:
```bash
curl -X POST -H "Content-Type: application/json" -d '{
    "query": "site:linkedin.com/in/ software engineer at google",
    "message": "Hi, I would like to connect with you on LinkedIn."
}' http://localhost:8000/start_bot
```

## How It Works

1. The bot receives a search query and connection message
2. It performs a Google search to find LinkedIn profiles
3. For each profile found:
   - Checks if a connection request can be sent
   - Sends a personalized connection request with the provided message
   - Waits between requests to avoid rate limiting
4. Returns a summary of successful connections and skipped profiles

## Error Handling

The API will return appropriate error messages for:
- Missing or invalid JSON data
- Missing required parameters
- Google API errors
- LinkedIn connection errors

## Logging

The bot logs its activities to the console, including:
- Search results
- Connection attempts
- Success/failure status
- Error messages

## Security Notes

- Keep your Google API key and search engine ID secure
- The bot uses a real browser to interact with LinkedIn
- Make sure to comply with LinkedIn's terms of service
- Use appropriate delays between connection requests 
