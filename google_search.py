import requests
from typing import List, Dict
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Log all environment variables (excluding sensitive ones)
logger.info("Environment variables loaded:")
for key in os.environ:
    if key.startswith("GOOGLE_"):
        logger.info(f"{key}: {'*' * len(os.environ[key])}")

async def perform_google_search(query: str) -> List[Dict[str, str]]:
    """
    Perform a Google search using a custom search API.
    
    Args:
        query (str): The search query to use
        
    Returns:
        List[Dict[str, str]]: List of search results with title, link, and snippet
    """
    try:
        # Get API key from environment variables
        api_key = os.getenv("GOOGLE_API_KEY")
        search_engine_id = os.getenv("GOOGLE_SEARCH_ENGINE_ID")
        
        logger.info(f"API Key exists: {bool(api_key)}")
        logger.info(f"Search Engine ID exists: {bool(search_engine_id)}")
        
        if not api_key or not search_engine_id:
            raise ValueError("Google API key or Search Engine ID not found in environment variables")
        
        # Google Custom Search API endpoint
        url = "https://www.googleapis.com/customsearch/v1"
        
        # Parameters for the API request
        params = {
            "key": api_key,
            "cx": search_engine_id,
            "q": query,
            "num": 5  # Get 5 results
        }
        
        logger.info(f"Making request to Google API with query: {query}")
        
        # Make the API request
        response = requests.get(url, params=params)
        logger.info(f"API Response Status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"API Error Response: {response.text}")
            return []
            
        response.raise_for_status()
        
        # Parse the results
        search_results = response.json()
        logger.info(f"API Response: {search_results}")
        
        results = []
        
        if "items" in search_results:
            for item in search_results["items"]:
                results.append({
                    "title": item.get("title", ""),
                    "link": item.get("link", ""),
                    "snippet": item.get("snippet", "")
                })
        else:
            logger.warning("No 'items' found in API response")
        
        return results
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error making API request: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"Error performing Google search: {str(e)}")
        return [] 