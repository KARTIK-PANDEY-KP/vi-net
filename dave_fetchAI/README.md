# 🕵️‍♂️ Dave the Dork Detective

Hey there! I'm Dave, your personal people-finding expert! I'm not just any search agent - I'm your go-to guy for finding anyone, anywhere on the internet. Whether they're on Instagram, Twitter, LinkedIn, or any other platform, I'll help you connect with them!

## 🤔 What I Can Do For You

I'm powered by a super-smart fine-tuned ASI-1 Mini model that's been specially trained to find people and will use our own proprietery algorithm. Just tell me who you're looking for and which platform you want to search on, and I'll craft the perfect search queries to track them down. I can find people on:
- Instagram (travel influencers, photographers, content creators)
- Twitter (tech experts, thought leaders, journalists)
- LinkedIn (professionals, industry experts, recruiters)
- And many other platforms!

## 🗣️ How to Work With Me

Just chat with me like you would with a friend! Make sure to mention which platform you want to search on. For example:
```
You: "Hey Dave, find me travel photographers on Instagram in Bali"
Me: "On it! Let me search Instagram for travel photographers in Bali..."

You: "Dave, help me find tech startup founders on LinkedIn in London"
Me: "I'll search LinkedIn for tech startup founders in London..."
```

## 🎯 What People Ask Me For

- "Find me travel content creators on Instagram in Japan"
- "Show me tech bloggers on Twitter in Silicon Valley"
- "Help me find software engineers on LinkedIn in San Francisco"
- "I need to connect with food critics on Twitter in New York"
- "Looking for startup founders on LinkedIn in London"

## 🔍 How I Work

I use a powerful ASI-1 Mini model that's been fine-tuned specifically for people search. This means I can:
- Understand exactly what you're looking for and where to look
- Generate precise search queries for specific platforms
- Find people across multiple platforms when needed
- Scale to help millions of users (I'm pretty popular!)
- Keep getting smarter with every search

## 🚀 Why I'm Different

I'm not just another search tool - I'm your personal people-finding assistant! I take pride in being able to:
- Find people others can't on specific platforms
- Search across multiple platforms at once when needed
- Understand complex search requirements
- Help you make meaningful connections on the right platform

## 📝 A Quick Note

While I'm great at finding people, please use my powers responsibly! I'm here to help you make connections, not to invade anyone's privacy. And remember - always specify which platform you want to search on for the best results!

---
*Your friendly neighborhood people-finder, powered by Fetch.ai and ASI-1 Mini* 

# Dorks Search API

A Flask-based API service that generates and executes Google dorks queries to find specific information across social media platforms and websites.

## Features

- Generate Google dorks queries for various search patterns
- Search across multiple platforms (LinkedIn, Twitter, Instagram)
- REST API endpoints for search and links-only results
- Support for both uAgents and Flask interfaces

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dorks-search-api.git
cd dorks-search-api
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with your API keys:
```
ASI_KEY=your_asi_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_google_cse_id
AGENTVERSE_API_KEY=your_agentverse_api_key
DEBUG=False
```

## Running the Service

### Flask Server
```bash
python flask_search_app.py
```
The Flask server will run on `http://0.0.0.0:5001`

### uAgents Server
```bash
python dorks_agent.py
```
The uAgents server will run on `http://0.0.0.0:5000`

## API Endpoints

### Flask API

1. Search Endpoint
```bash
POST /search
Content-Type: application/json
{
    "query": "your search query"
}
```

2. Links-Only Endpoint
```bash
POST /links
Content-Type: application/json
{
    "query": "your search query"
}
```

3. Health Check
```bash
GET /health
```

### Special Features

- Add "dave_links_only_2024" to your query to get only links in the response
- Use the dedicated `/links` endpoint for links-only results

## Testing

Use the provided client scripts to test the API:

```bash
# Flask client
python flask_client.py --query "your search query"
python flask_client.py --query "your search query" --links-only

# Dorks client
python dorks_client.py --query "your search query"
python dorks_client.py --query "your search query" --links-only
```

## Environment Variables

- `ASI_KEY`: API key for ASI-1 AI
- `GOOGLE_API_KEY`: Google API key
- `GOOGLE_CSE_ID`: Google Custom Search Engine ID
- `AGENTVERSE_API_KEY`: AgentVerse API key
- `DEBUG`: Debug mode (True/False)
- `PORT`: Port number (default: 5001 for Flask, 5000 for uAgents)
- `HOST`: Host address (default: 0.0.0.0)

## License

MIT License 