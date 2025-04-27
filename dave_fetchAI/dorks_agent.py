import os
from dotenv import load_dotenv
from datetime import datetime
from uuid import uuid4
from uagents import Agent, Protocol, Context, Model
from uagents.setup import fund_agent_if_low
from uagents_core.contrib.protocols.chat import (
    ChatMessage,
    ChatAcknowledgement,
    TextContent,
    chat_protocol_spec,
)
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

# ASI-1 Configuration
URL = "https://api.asi1.ai/v1/chat/completions"
MODEL = "asi1-mini"

# Google Custom Search API Configuration
GOOGLE_SEARCH_URL = "https://www.googleapis.com/customsearch/v1"

# Headers for ASI-1 API
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': f'bearer {ASI_KEY}'
}

# Initialize agent with HTTP endpoints
agent = Agent(
    name="dorks_agent",
    seed="your-seed-here",  # Replace with your seed
    port=5000,
    endpoint=["http://localhost:5000/submit"],
)

# Initialize the chat protocol
chat_proto = Protocol(spec=chat_protocol_spec)

# Add this constant at the top with other configurations
SPECIAL_TAG = "dave_links_only_2024"  # This is our special tag/fingerprint

DORKS_TEMPLATE = """
# Google Dork Syntax Quick Reference
# ===============================

# How to Use This Document:
# 1. Copy the syntax you need from the sections below
# 2. Replace the placeholders (like 'term', 'domain.com', etc.) with your actual search terms
# 3. Combine multiple operators to create complex searches
# 4. Use this as a reference when creating prompts for LLMs to generate dorks

# Example Usage:
# To find PDFs about AI on a specific domain:
# site:example.com filetype:pdf "artificial intelligence"
#
# To find people on LinkedIn in a specific location:
# site:linkedin.com/in "software engineer" "San Francisco"

# Quick Tips:
# - Use quotes for exact phrases
# - Combine operators with spaces
# - Use OR for alternatives
# - Use - to exclude terms
# - Group terms with parentheses

# Google Dorks Examples for Finding Specific People

## Basic Person Search
Natural Query: "Find John Smith who lives in New York"
Dork: site:linkedin.com/in "John Smith" "New York" OR site:twitter.com "John Smith" "New York"

Natural Query: "Find Sarah Johnson who works at Google"
Dork: site:linkedin.com/in "Sarah Johnson" "Google" OR site:twitter.com "Sarah Johnson" "Google"

Natural Query: "Find Michael Brown who graduated from Harvard"
Dork: site:linkedin.com/in "Michael Brown" "Harvard" OR site:twitter.com "Michael Brown" "Harvard"

## Location-Based Person Search
Natural Query: "Find David Wilson in San Francisco"
Dork: (site:linkedin.com/in OR site:twitter.com OR site:instagram.com) "David Wilson" "San Francisco"

Natural Query: "Find Emily Chen in London"
Dork: (site:linkedin.com/in OR site:twitter.com OR site:instagram.com) "Emily Chen" "London"

Natural Query: "Find Robert Taylor in Chicago"
Dork: (site:linkedin.com/in OR site:twitter.com OR site:instagram.com) "Robert Taylor" "Chicago"

## Name and Company Search
Natural Query: "Find Jennifer Lee who works at Microsoft"
Dork: site:linkedin.com/in "Jennifer Lee" "Microsoft" OR site:twitter.com "Jennifer Lee" "Microsoft"

Natural Query: "Find William Park at Apple"
Dork: site:linkedin.com/in "William Park" "Apple" OR site:twitter.com "William Park" "Apple"

Natural Query: "Find Lisa Wong at Amazon"
Dork: site:linkedin.com/in "Lisa Wong" "Amazon" OR site:twitter.com "Lisa Wong" "Amazon"

## Name and Education Search
Natural Query: "Find James Miller who went to Stanford"
Dork: site:linkedin.com/in "James Miller" "Stanford" OR site:twitter.com "James Miller" "Stanford"

Natural Query: "Find Maria Garcia who studied at MIT"
Dork: site:linkedin.com/in "Maria Garcia" "MIT" OR site:twitter.com "Maria Garcia" "MIT"

Natural Query: "Find Thomas Kim who graduated from Yale"
Dork: site:linkedin.com/in "Thomas Kim" "Yale" OR site:twitter.com "Thomas Kim" "Yale"

## Name and Recent Activity Search
Natural Query: "Find Daniel White who recently changed jobs"
Dork: site:linkedin.com/in "Daniel White" "new position" after:2024-02-01

Natural Query: "Find Olivia Brown who recently moved to Seattle"
Dork: site:linkedin.com/in "Olivia Brown" "Seattle" after:2024-01-01

Natural Query: "Find Christopher Lee who got promoted recently"
Dork: site:linkedin.com/in "Christopher Lee" "promoted" after:2024-01-01

## Cross-Platform Person Search
Natural Query: "Find Jessica Martinez across all social media"
Dork: (site:linkedin.com/in OR site:twitter.com OR site:instagram.com) "Jessica Martinez"

Natural Query: "Find Kevin Nguyen on both LinkedIn and Twitter"
Dork: (site:linkedin.com/in OR site:twitter.com) "Kevin Nguyen"

Natural Query: "Find Rachel Adams on Instagram and LinkedIn"
Dork: (site:instagram.com OR site:linkedin.com/in) "Rachel Adams"

## Name and Specific Details Search
Natural Query: "Find Brian Wilson who speaks Spanish"
Dork: site:linkedin.com/in "Brian Wilson" "Spanish" OR "fluent in Spanish"

Natural Query: "Find Sophia Chen who has AWS certification"
Dork: site:linkedin.com/in "Sophia Chen" "AWS" OR "AWS certified"

Natural Query: "Find Matthew Kim who knows Python"
Dork: site:linkedin.com/in "Matthew Kim" "Python" OR "Python developer"

## LinkedIn Profile Search
Natural Query: "Find software engineers at Microsoft in Seattle"
Dork: site:linkedin.com/in "software engineer" "Microsoft" "Seattle"

Natural Query: "Find data scientists who graduated from MIT"
Dork: site:linkedin.com/in "data scientist" "MIT"

Natural Query: "Find product managers who previously worked at Amazon"
Dork: site:linkedin.com/in "product manager" "Amazon" "former"

Natural Query: "Find people who recently joined Meta"
Dork: site:linkedin.com/in "Meta" "new position" after:2024-02-01

## Twitter Profile Search
Natural Query: "Find tech journalists on Twitter"
Dork: site:twitter.com "tech journalist" inurl:/status

Natural Query: "Find AI researchers with verified accounts"
Dork: site:twitter.com "AI researcher" "verified account"

Natural Query: "Find startup founders in San Francisco"
Dork: site:twitter.com "founder" "San Francisco" inurl:/status

Natural Query: "Find cybersecurity experts who tweet about hacking"
Dork: site:twitter.com "cybersecurity" "expert" "hacking" inurl:/status

Natural Query: "Find venture capitalists who tweet about startups"
Dork: site:twitter.com "venture capitalist" "startup" inurl:/status

## Instagram Profile Search
Natural Query: "Find photographers in New York"
Dork: site:instagram.com "photographer" "New York" inurl:/p/

Natural Query: "Find fashion influencers in Paris"
Dork: site:instagram.com "fashion" "influencer" "Paris" inurl:/p/

Natural Query: "Find fitness trainers with verified accounts"
Dork: site:instagram.com "fitness trainer" "verified" inurl:/p/

Natural Query: "Find travel bloggers who post about Asia"
Dork: site:instagram.com "travel blogger" "Asia" inurl:/p/

Natural Query: "Find food critics in Los Angeles"
Dork: site:instagram.com "food critic" "Los Angeles" inurl:/p/

## Cross-Platform Profile Search
Natural Query: "Find someone who's active on both LinkedIn and Twitter"
Dork: site:linkedin.com/in OR site:twitter.com "John Smith"

Natural Query: "Find tech influencers who are on both Instagram and Twitter"
Dork: (site:instagram.com OR site:twitter.com) "tech influencer" "verified"

Natural Query: "Find startup founders who maintain presence on multiple platforms"
Dork: (site:linkedin.com/in OR site:twitter.com OR site:instagram.com) "startup founder" "CEO"

## Advanced Profile Search Techniques
Natural Query: "Find people who changed jobs in the last 3 months"
Dork: site:linkedin.com/in "new position" after:2024-01-01

Natural Query: "Find people who recently moved to a new city"
Dork: site:linkedin.com/in "relocated to" OR "moved to" after:2024-01-01

Natural Query: "Find people who got promoted recently"
Dork: site:linkedin.com/in "promoted to" OR "new role" after:2024-01-01

Natural Query: "Find people who speak multiple languages"
Dork: site:linkedin.com/in "fluent in" OR "proficient in" OR "native speaker"

Natural Query: "Find people with specific certifications"
Dork: site:linkedin.com/in "certified" OR "certification" "AWS" OR "Google Cloud"

## Basic Profile Search Examples
Natural Query: "Find someone's Twitter profile with username containing 'techguy'"
Dork: site:twitter.com inurl:techguy

Natural Query: "Find Instagram profiles from New York"
Dork: site:instagram.com "New York" inurl:/p/

## Advanced Search Examples
Natural Query: "Find LinkedIn profiles of software engineers in San Francisco"
Dork: site:linkedin.com/in "software engineer" "San Francisco"

Natural Query: "Find Twitter posts about AI from verified accounts"
Dork: site:twitter.com "AI" "verified account"

Natural Query: "Find Instagram posts with specific hashtag #tech"
Dork: site:instagram.com/p/ #tech

## Content Search Examples
Natural Query: "Find LinkedIn articles about machine learning"
Dork: site:linkedin.com/pulse "machine learning"

Natural Query: "Find Twitter threads about cybersecurity"
Dork: site:twitter.com "cybersecurity" "thread"

Natural Query: "Find Instagram posts with location in Paris"
Dork: site:instagram.com/p/ "Paris" "location"

## Company/Organization Search
Natural Query: "Find employees of Google on LinkedIn"
Dork: site:linkedin.com/in "Google" "employee"

Natural Query: "Find Twitter accounts of Microsoft employees"
Dork: site:twitter.com "Microsoft" "employee"

Natural Query: "Find Instagram posts from official company accounts"
Dork: site:instagram.com "official account" "company"

## Date-Based Search
Natural Query: "Find LinkedIn posts from last month"
Dork: site:linkedin.com/pulse after:2024-02-01

Natural Query: "Find Twitter posts from specific date"
Dork: site:twitter.com after:2024-03-01 before:2024-03-15

Natural Query: "Find Instagram posts from last week"
Dork: site:instagram.com/p/ after:2024-03-01

## File Type Search
Natural Query: "Find PDF resumes on LinkedIn"
Dork: site:linkedin.com filetype:pdf "resume"

Natural Query: "Find PowerPoint presentations shared on Twitter"
Dork: site:twitter.com filetype:ppt OR filetype:pptx

Natural Query: "Find job postings on LinkedIn"
Dork: site:linkedin.com/jobs "software engineer"

## Combination Search Examples
Natural Query: "Find software engineers in New York who work at startups"
Dork: site:linkedin.com/in "software engineer" "New York" "startup"

Natural Query: "Find tech influencers on Twitter with over 10k followers"
Dork: site:twitter.com "tech" "influencer" "followers"

Natural Query: "Find Instagram posts about food in Tokyo from verified accounts"
Dork: site:instagram.com/p/ "food" "Tokyo" "verified"

## Specialized Search Examples
Natural Query: "Find people who changed jobs in the last month on LinkedIn"
Dork: site:linkedin.com/in "new position" after:2024-02-01

Natural Query: "Find Twitter threads about recent tech layoffs"
Dork: site:twitter.com "tech layoffs" "thread" after:2024-01-01

Natural Query: "Find Instagram posts about tech events in 2024"
Dork: site:instagram.com/p/ "tech event" "2024"

# Google Dork Syntax Reference

## Basic Operators
site:domain.com           # Search only on specific website
"exact phrase"            # Search for exact phrase
term1 OR term2            # Search for either term
-term                     # Exclude specific term
(term1 OR term2)          # Group terms
term1 AND term2           # Both terms must be present

## File Type Search
filetype:ext              # Search for specific file type
filetype:pdf              # PDF files
filetype:doc              # Word documents
filetype:xls              # Excel files
filetype:txt              # Text files

## URL Search
inurl:term                # Search in URL
intitle:term              # Search in page title
intext:term               # Search in page text
allinurl:term1 term2      # All terms in URL
allintitle:term1 term2    # All terms in title
allintext:term1 term2     # All terms in text

## Date Range Search
after:YYYY-MM-DD          # Content after date
before:YYYY-MM-DD         # Content before date
daterange:start-end       # Content between dates

## Advanced Search
cache:url                 # Find cached version
related:domain.com        # Find related sites
link:domain.com           # Find pages linking to URL
info:domain.com           # Get information about site
define:term               # Get definition

## Wildcards and Ranges
term*                     # Wildcard search
number1..number2          # Number range
size:>10MB                # File size
mime:type                 # MIME type

## Location and Language
location:place            # Content near location
lang:code                 # Content in specific language
country:code              # Content from country

## Security Related
intext:"password"         # Find passwords
intext:"username"         # Find usernames
intext:"@domain.com"      # Find email addresses
intext:"XXX-XX-XXXX"      # Find SSN patterns
intext:"XXXX XXXX XXXX XXXX" # Find credit card numbers

## Technical
inurl:"viewerframe?mode=" # Find cameras
intitle:"index of"        # Find directory listings
filetype:sql              # Find database files
filetype:log              # Find log files
filetype:conf             # Find config files

## Boolean Combinations
(term1 OR term2) AND (term3 OR term4) -term5  # Complex boolean
term1 (term2 | term3) term4                   # Alternative syntax
term1 +term2 -term3                           # Include/exclude

## Special Characters
"term1 term2"             # Phrase search
term1 +term2              # Required term
term1 -term2              # Excluded term
term1 ~term2              # Similar term
term1 *term2              # Wildcard term


now following is the user query convert that to dork and give me only dorks in JSON nothing else:

User Query: {query}

Return ONLY the JSON with dorks, nothing else.

"""

# Define request and response models for REST endpoints
class SearchRequest(Model):
    query: str

class SearchResponse(Model):
    results: str

class LinksResponse(Model):
    links: list

async def get_google_search_results(dork: str, num_results: int = 3) -> list:
    try:
        params = {
            'key': GOOGLE_API_KEY,
            'cx': GOOGLE_CSE_ID,
            'q': dork,
            'num': num_results
        }
        
        response = requests.get(GOOGLE_SEARCH_URL, params=params)
        response.raise_for_status()
        
        data = response.json()
        search_results = []
        
        if 'items' in data:
            for item in data['items']:
                search_results.append({
                    'title': item.get('title', ''),
                    'link': item.get('link', ''),
                    'snippet': item.get('snippet', '')
                })
            
            # If we didn't get enough results, try a second page
            if len(search_results) < num_results and 'queries' in data and 'nextPage' in data['queries']:
                next_page = data['queries']['nextPage'][0]['startIndex']
                params['start'] = next_page
                response = requests.get(GOOGLE_SEARCH_URL, params=params)
                response.raise_for_status()
                data = response.json()
                
                if 'items' in data:
                    for item in data['items']:
                        if len(search_results) < num_results:
                            search_results.append({
                                'title': item.get('title', ''),
                                'link': item.get('link', ''),
                                'snippet': item.get('snippet', '')
                            })
        
        return search_results[:num_results]  # Ensure we return exactly num_results
    except Exception as e:
        print(f"An error occurred: {e}")
        return []

def format_results(all_results, links_only: bool = False):
    formatted_output = []
    for dork_name, data in all_results.items():
        if not links_only:
            formatted_output.append(f"\nDork: {data['dork']}\n")
        
        if not data['results']:
            if not links_only:
                formatted_output.append("No results found for this dork.\n")
            continue
            
        for idx, result in enumerate(data['results'], 1):
            if links_only:
                formatted_output.append(result['link'])
            else:
                formatted_output.append(f"Result {idx}:")
                formatted_output.append(f"Title: {result['title']}")
                formatted_output.append(f"Link: {result['link']}")
                formatted_output.append(f"Description: {result['snippet']}\n")
    return "\n".join(formatted_output)

# Add extract_links function to get just links
def extract_links(all_results):
    links = []
    for data in all_results.values():
        for result in data['results']:
            links.append(result['link'])
    return links

async def process_query(query, links_only=False):
    """Process a search query and return results"""
    try:
        # Prepare prompt
        prompt = DORKS_TEMPLATE.format(query=query)
        
        # Prepare ASI-1 request
        payload = {
            "model": MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0,
            "stream": False,
            "max_tokens": 0
        }
        
        # Make request to ASI-1
        response = requests.post(URL, headers=HEADERS, json=payload)
        
        if response.status_code == 200:
            # Get content and clean JSON
            content = response.json()["choices"][0]["message"]["content"]
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            # Parse the dorks from JSON
            dorks_data = json.loads(content)
            
            # Get search results for each dork
            all_results = {}
            for dork_name, dork_queries in dorks_data.items():
                if isinstance(dork_queries, list):
                    for idx, dork_query in enumerate(dork_queries, 1):
                        search_results = await get_google_search_results(dork_query)
                        all_results[f"{dork_name}_{idx}"] = {
                            'dork': dork_query,
                            'results': search_results
                        }
                else:
                    search_results = await get_google_search_results(dork_queries)
                    all_results[dork_name] = {
                        'dork': dork_queries,
                        'results': search_results
                    }
            
            if links_only:
                return extract_links(all_results)
            else:
                return format_results(all_results, links_only=False)
    except Exception as e:
        return f"Error processing query: {str(e)}"

@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Starting up Dorks Generator agent with address: {ctx.agent.address}")
    # Skip funding for now as it's causing errors
    # await fund_agent_if_low(ctx.agent)

# REST endpoint for search
@agent.on_rest_post("/search", SearchRequest, SearchResponse)
async def handle_search(ctx: Context, request: SearchRequest) -> SearchResponse:
    ctx.logger.info(f"Received REST search request: {request.query}")
    
    # Check if the special tag is present
    links_only = SPECIAL_TAG in request.query
    # Remove the tag from the query if present
    query = request.query.replace(SPECIAL_TAG, "").strip()
    
    # Process the query
    if links_only:
        links = await process_query(query, links_only=True)
        result = {"links": links}
        return SearchResponse(results=json.dumps(result))
    else:
        result = await process_query(query)
        return SearchResponse(results=result)

# REST endpoint for links-only response
@agent.on_rest_post("/links", SearchRequest, LinksResponse)
async def handle_links(ctx: Context, request: SearchRequest) -> LinksResponse:
    ctx.logger.info(f"Received REST links request: {request.query}")
    
    # Process the query for links only
    links = await process_query(request.query, links_only=True)
    return LinksResponse(links=links)

@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    for item in msg.content:
        if isinstance(item, TextContent):
            ctx.logger.info(f"Received query from {sender}: {item.text}")
            
            try:
                # Check if the special tag is present
                links_only = SPECIAL_TAG in item.text
                # Remove the tag from the query if present
                query = item.text.replace(SPECIAL_TAG, "").strip()
                
                if links_only:
                    links = await process_query(query, links_only=True)
                    formatted_output = "\n".join(links)
                else:
                    formatted_output = await process_query(query)
                
                # Send acknowledgment
                ack = ChatAcknowledgement(
                    timestamp=datetime.utcnow(),
                    acknowledged_msg_id=msg.msg_id
                )
                await ctx.send(sender, ack)
                
                # Send response
                response_msg = ChatMessage(
                    timestamp=datetime.utcnow(),
                    msg_id=uuid4(),
                    content=[TextContent(type="text", text=formatted_output)]
                )
                await ctx.send(sender, response_msg)
                    
            except Exception as e:
                error_msg = ChatMessage(
                    timestamp=datetime.utcnow(),
                    msg_id=uuid4(),
                    content=[TextContent(type="text", text=f"Error: {str(e)}")]
                )
                await ctx.send(sender, error_msg)

@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"Received acknowledgement from {sender} for message: {msg.acknowledged_msg_id}")

# Include the protocol
agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run() 