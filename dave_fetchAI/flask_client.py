import requests
import json
import argparse

FLASK_SEARCH_ENDPOINT = "http://localhost:5001/search"
FLASK_LINKS_ENDPOINT = "http://localhost:5001/links"
SPECIAL_TAG = "dave_links_only_2024"

def send_search_query(query, links_only=False):
    """Send a search query to the Flask endpoint"""
    try:
        # Format query with special tag if links_only is True
        if links_only:
            query = f"{SPECIAL_TAG} {query}"
        
        print(f"Sending search query to Flask: '{query}'")
        
        response = requests.post(
            FLASK_SEARCH_ENDPOINT,
            json={"query": query},
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Response status code: {response.status_code}")
        
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}

def send_links_query(query):
    """Send a query to get only links via dedicated Flask endpoint"""
    try:
        print(f"Sending links query to Flask: '{query}'")
        
        response = requests.post(
            FLASK_LINKS_ENDPOINT,
            json={"query": query},
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Response status code: {response.status_code}")
        
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}

def parse_args():
    parser = argparse.ArgumentParser(description='Send queries to the Flask search endpoints')
    parser.add_argument('--query', '-q', type=str, help='Query string to send to the server')
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
        print("\nRESULT (LINKS ONLY):")
        if "links" in result:
            for link in result["links"]:
                print(link)
        else:
            print(result)
    else:
        result = send_search_query(args.query, args.links_only)
        
        if args.links_only:
            print("\nRESULT (LINKS ONLY):")
            if "links" in result:
                for link in result["links"]:
                    print(link)
            else:
                print(result)
        else:
            print("\nRESULT:")
            if "results" in result:
                print(result["results"])
            else:
                print(result) 