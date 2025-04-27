import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import asyncio

# Load environment variables from .env file
load_dotenv()

# Access environment variables
ASI_KEY = os.getenv('ASI_KEY')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_CSE_ID = os.getenv('GOOGLE_CSE_ID')
AGENTVERSE_API_KEY = os.getenv('AGENTVERSE_API_KEY')

# Import the processing functions from dorks_agent.py
from dorks_agent import process_query, SPECIAL_TAG

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get environment variables or use defaults
PORT = int(os.getenv("PORT", 5001))
HOST = os.getenv("HOST", "0.0.0.0")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"

@app.route('/search', methods=['POST'])
def search():
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        # Check if the special tag is present
        links_only = SPECIAL_TAG in query
        # Remove the tag from the query if present
        clean_query = query.replace(SPECIAL_TAG, "").strip()
        
        # Use the event loop to run the async function
        if links_only:
            links = asyncio.run(process_query(clean_query, links_only=True))
            return jsonify({"links": links})
        else:
            results = asyncio.run(process_query(clean_query))
            return jsonify({"results": results})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/links', methods=['POST'])
def links():
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        # Always get links only from this endpoint
        links = asyncio.run(process_query(query, links_only=True))
        return jsonify({"links": links})
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "service": "Dorks Search API",
        "version": "1.0.0",
        "endpoints": [
            {"path": "/search", "method": "POST", "description": "Search with Google dorks"},
            {"path": "/links", "method": "POST", "description": "Get only links from search"},
            {"path": "/health", "method": "GET", "description": "Health check endpoint"}
        ]
    })

if __name__ == '__main__':
    app.run(host=HOST, port=PORT, debug=DEBUG) 