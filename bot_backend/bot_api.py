from flask import Flask, request, jsonify
import asyncio
import os
import sys
from dotenv import load_dotenv
import logging
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from linkedin_automation.connection_requester import main as start_bot

# Load environment variables
load_dotenv()

app = Flask(__name__)

async def perform_google_search(query: str):
    """
    Perform a Google search using the app.py endpoint
    """
    try:
        # Get the app.py server URL from environment or use default
        app_url = os.getenv('APP_URL', 'http://localhost:8080')
        
        # Make request to app.py's google_search endpoint
        response = requests.post(
            f"{app_url}/google_search",
            json={"query": query},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            logger.error(f"Error from app.py: {response.text}")
            return []
            
        data = response.json()
        if data.get("status") == "success":
            return data.get("results", [])
        else:
            logger.error(f"Error in search results: {data.get('message')}")
            return []
            
    except Exception as e:
        logger.error(f"Error performing Google search: {str(e)}")
        return []

@app.route('/start_bot', methods=['POST'])
async def start_bot_endpoint():
    try:
        data = request.json
        if not data:
            logger.error("No JSON data received")
            return jsonify({"error": "No JSON data received"}), 400
            
        search_query = data.get('query')
        message = data.get('message')
        
        if not search_query or not message:
            logger.error("Missing required parameters")
            return jsonify({
                "error": "Missing required parameters: query and message"
            }), 400
        
        logger.info(f"Starting bot with query: {search_query}")
        logger.info(f"Using message: {message}")
        
        # First perform the Google search using app.py
        search_results = await perform_google_search(search_query)
        if not search_results:
            return jsonify({
                "status": "error",
                "message": "No LinkedIn profiles found matching your search criteria"
            }), 404
            
        logger.info(f"Found {len(search_results)} LinkedIn profiles")
        
        # Start the bot with the search results
        await start_bot(search_query=search_query, base_message=message, search_results=search_results)
        
        return jsonify({
            "status": "success",
            "message": "Bot started successfully",
            "profiles_found": len(search_results)
        })
        
    except Exception as e:
        logger.error(f"Error starting bot: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('BOT_API_PORT', 8000))
    host = os.getenv('BOT_API_HOST', '0.0.0.0')
    app.run(host=host, port=port) 