from browser_use import Agent, Browser, BrowserConfig
from langchain_openai import ChatOpenAI
import asyncio
from dotenv import load_dotenv
import os
import sys

# Add parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import re
from playwright.async_api import BrowserContext

load_dotenv()

async def connect_to_profile(browser_context: BrowserContext, profile_urls: list, base_message: str):
    """Helper function to handle connecting to multiple profiles"""
    try:
        # Create agent for checking connection status and connecting
        agent = Agent(
            task=f"""Perform these exact steps in order for each of these profile URLs:
                {', '.join(profile_urls)}

                1. For each profile URL in the list:
                   a. Go to the profile URL
                   b. Wait for the profile to load
                   c. Check for any of these conditions:
                      - If you see "Pending" or "Connection request sent" - this means we already sent a request
                      - If you see "1st" or "1st degree" - this means we're already connected
                      - If you see "Enter their email" or "email address" - this means email verification is required
                      - If you only see "Follow" and "More" button but no connect button EVEN after clicking more button
                      - If you see "Message" or "Connect" - this means we can connect or click more button then connect button
                   d. If any of the first four conditions are true, skip this profile
                   e. If the last condition is true:
                      - Click the 'Connect' button
                      - Click 'Add a note'
                      - Type this exact message customize according to the persons profile:
                        {base_message}
                      - Click 'Send'
                      - Wait for the connection request to be sent
                   f. Wait 5 seconds before moving to the next profile
                2. Return "SUCCESS" for each successful connection, "SKIP" for each skipped profile, or "ERROR" if there was an error
                """,
            llm=ChatOpenAI(model="gpt-4o"),
            browser_context=browser_context
        )
        
        # Run the agent and get the result
        result = await agent.run()
        
        # Process results
        success_count = 0
        skip_count = 0
        error_count = 0
        
        # Convert result to string if it's not already
        result_str = str(result)
        
        # Process each line of the result
        for line in result_str.split('\n'):
            if "SUCCESS" in line:
                success_count += 1
            elif "SKIP" in line:
                skip_count += 1
            else:
                error_count += 1
        
        print(f"\nConnection Summary:")
        print(f"Successfully connected: {success_count}")
        print(f"Skipped profiles: {skip_count}")
        print(f"Errors: {error_count}")
        
        return success_count > 0
        
    except Exception as e:
        print(f"Error processing profiles: {str(e)}")
        return False

async def process_profiles(browser, search_results, base_message):
    """Process all profiles at once"""
    # Create a persistent browser context
    context = await browser.new_context()
    try:
        # Extract all profile URLs
        profile_urls = [result['link'] for result in search_results]
        print(f"\nProcessing {len(profile_urls)} profiles in batch")
        
        # Connect to all profiles using the persistent context
        success = await connect_to_profile(context, profile_urls, base_message)
        
        if not success:
            print("No successful connections were made")
            
    finally:
        await context.close()

async def main(search_query: str = None, base_message: str = None, search_results: list = None):
    print("\nLinkedIn Profile Connection Automation")
    print("This will help you connect with people on LinkedIn based on your search criteria\n")
    
    # Get user input if not provided
    if not search_query:
        search_query = str(input("Enter your LinkedIn profile search query (e.g., 'site:linkedin.com/in/ software engineer at google'): ")).strip()
    if not base_message:
        base_message = str(input("Enter your connection message: ")).strip()
    
    if not search_query or not base_message:
        print("Please provide both search query and message")
        return
    
    print(f"\nSearching for LinkedIn profiles matching: {search_query}")
    
    browser = None
    try:
        # Use provided search results or perform new search
        if not search_results:
            print("[ERROR] Performing Google search... SHOULD NOT HAPPEN NORMALLY")
        
        if not search_results:
            print("No LinkedIn profiles found matching your search criteria")
            return
            
        print(f"\nFound {len(search_results)} LinkedIn profiles")
        
        # Configure browser
        browser = Browser(
            config=BrowserConfig(
                browser_binary_path='/usr/bin/google-chrome',
                headless=False,
                reuse_browser=True
            )
        )
        
        # Process all profiles with persistent context
        await process_profiles(browser, search_results, base_message)
            
    except Exception as e:
        print(f"\nAn error occurred: {str(e)}")
        raise e
    finally:
        if browser:
            await browser.close()