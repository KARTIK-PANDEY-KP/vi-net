import requests
import json
import argparse

LOCAL_SEARCH_ENDPOINT = "http://localhost:5000/search"
LOCAL_LINKS_ENDPOINT = "http://localhost:5000/links"
SPECIAL_TAG = "dave_links_only_2024"

def send_search_query(query, links_only=False):
    """Send a search query to the agent via REST endpoint"""
    try:
        # Format query with special tag if links_only is True
        if links_only:
            query = f"{SPECIAL_TAG} {query}"
        
        print(f"Sending search query: '{query}'")
        
        response = requests.post(
            LOCAL_SEARCH_ENDPOINT,
            json={"query": query},
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Response status code: {response.status_code}")
        
        response.raise_for_status()
        result = response.json()
        
        # If links_only is True, the result will be in JSON format
        if links_only:
            # Parse the JSON string in the results field
            links_data = json.loads(result["results"])
            return links_data["links"]
        else:
            return result["results"]
    except Exception as e:
        return f"Error: {str(e)}"

def send_links_query(query):
    """Send a query to get only links via dedicated endpoint"""
    try:
        print(f"Sending links query: '{query}'")
        
        response = requests.post(
            LOCAL_LINKS_ENDPOINT,
            json={"query": query},
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Response status code: {response.status_code}")
        
        response.raise_for_status()
        return response.json()["links"]
    except Exception as e:
        return f"Error: {str(e)}"

def parse_args():
    parser = argparse.ArgumentParser(description='Send queries to the dorks agent via REST')
    parser.add_argument('--query', '-q', type=str, help='Query string to send to the agent')
    parser.add_argument('--links-only', '-l', action='store_true',
                        help='Get only links in the response')
    parser.add_argument('--links-endpoint', '-e', action='store_true',
                        help='Use the dedicated links endpoint')
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    
    # If no query provided, prompt the user
    if not args.query:
        args.query = input("Enter your query: ")
    
    # Send the query and get results
    if args.links_endpoint:
        result = send_links_query(args.query)
        # Format links as a list for display
        print("\nRESULT (LINKS ONLY):")
        for link in result:
            print(link)
    else:
        result = send_search_query(args.query, args.links_only)
        
        if args.links_only:
            # Format links as a list for display
            print("\nRESULT (LINKS ONLY):")
            for link in result:
                print(link)
        else:
            # Print full formatted results
            print("\nRESULT:")
            print(result) 