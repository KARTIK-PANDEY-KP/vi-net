# app.py
import os
from flask import Flask, redirect, request, session, url_for, render_template_string, jsonify
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.cloud import firestore
from google.oauth2.credentials import Credentials
from dotenv import load_dotenv
from email.mime.text import MIMEText
import base64
from flask import jsonify
from google_search import perform_google_search
import logging
import requests
import json
import urllib.parse
import google.generativeai as genai
from werkzeug.utils import secure_filename
import PyPDF2
import io
from flask_session import Session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
# Initialize Gemini
GEMINI_API_KEY = "AIzaSyAev-H99dpUS4EcJ26HcYJt6PrIdKjalMA"
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Gemini 2.0 Flash model
model_name = "gemini-2.0-flash"  # Using the faster Flash model
gemini_model = genai.GenerativeModel(model_name)

# Load environment variables
# Get paths from environment variables
GMAIL_CREDENTIALS_PATH = os.getenv('GMAIL_CREDENTIALS_PATH', './GCP_gmail_api_credentials.json')
FIRESTORE_CREDENTIALS_PATH = os.getenv('FIRESTORE_CREDENTIALS_PATH', './firestore-creds.json')

# Get API key from environment variable
LINKD_API_KEY = os.getenv('LINKD_API_KEY')

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"


SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly'
]

app = Flask(__name__)
app.secret_key = "FLASK_SESSION_KEY"
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Add PDF upload configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Initialize session
Session(app)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def parse_pdf(pdf_file):
    try:
        # Read PDF content
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Error parsing PDF: {str(e)}")
        return None

def get_firestore_client():
    # Set the credentials path for Firestore
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = FIRESTORE_CREDENTIALS_PATH
    return firestore.Client()

from google.auth.transport.requests import Request

def get_user_credentials(user_id):
    db = get_firestore_client()
    doc = db.collection("users").document(user_id).get()
    if not doc.exists:
        return None

    data = doc.to_dict()
    
    # Ensure all required fields are present
    required_fields = ['access_token', 'refresh_token', 'token_uri', 'client_id', 'client_secret']
    missing_fields = [field for field in required_fields if field not in data]
    
    if missing_fields:
        print(f"❌ Missing required OAuth fields: {', '.join(missing_fields)}")
        return None

    creds = Credentials(
        token=data['access_token'],
        refresh_token=data['refresh_token'],
        token_uri=data['token_uri'],
        client_id=data['client_id'],
        client_secret=data['client_secret'],
        scopes=SCOPES
    )

    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            # Save new access token and expiry to Firestore
            db.collection("users").document(user_id).update({
                "access_token": creds.token,
                "token_expiry": creds.expiry.isoformat()
            })
        except Exception as e:
            print(f"❌ Error refreshing token: {str(e)}")
            return None

    return creds

def update_oauth_credentials(username):
    """Update OAuth credentials for a user in Firestore with required fields"""
    try:
        db = get_firestore_client()
        db.collection("users").document(username).update({
            "token_uri": "https://oauth2.googleapis.com/token",
            "client_id": "190155573895-idbc0tepspqmm08r5j2p82baii075b30.apps.googleusercontent.com",
            "client_secret": "GOCSPX-8QZQZQZQZQZQZQZQZQZQZQZQZQZQZQZ",
            "scopes": SCOPES,
            "redirect_uri": "https://38a4-164-67-70-232.ngrok-free.app/oauth2callback"
        })
        print(f"✅ Successfully updated OAuth credentials for {username}")
        return True
    except Exception as e:
        print(f"❌ Error updating credentials: {str(e)}")
        return False

@app.route('/')
def home():
    return '''
        <form action="/login" method="get">
            <label for="username">Choose a username:</label><br>
            <input type="text" id="username" name="username" required><br><br>
            <input type="submit" value="Login with Google">
        </form>
    '''


@app.route('/login')
def login():
    username = request.args.get('username')
    print(f"\n=== Login Attempt ===")
    print(f"Requested username: {username}")
    
    if not username:
        return "❌ Username required", 400

    session['custom_username'] = username
    session.permanent = True
    print(f"Username set in session: {session.get('custom_username')}")

    # Get ngrok URL from environment or use default
    ngrok_url = os.getenv('NGROK_URL', 'https://38a4-164-67-70-232.ngrok-free.app')
    redirect_uri = f"{ngrok_url}/oauth2callback"

    flow = Flow.from_client_secrets_file(
        GMAIL_CREDENTIALS_PATH,
        scopes=SCOPES,
        redirect_uri=redirect_uri
    )
    auth_url, state = flow.authorization_url(
        prompt='consent',
        include_granted_scopes='true',
        access_type='offline'
    )
    session['oauth_state'] = state
    print(f"OAuth state set: {state}")
    return redirect(auth_url)


@app.route('/oauth2callback')
def oauth2callback():
    print("\n=== OAuth Callback ===")
    print(f"Session username: {session.get('custom_username')}")
    print(f"Session state: {session.get('oauth_state')}")
    print(f"Request state: {request.args.get('state')}")
    
    username = session.get('custom_username')
    if not username:
        print("No username found in session")
        return "❌ Missing username from session", 400

    if request.args.get('state') != session.get('oauth_state'):
        print("State mismatch")
        return "❌ Invalid state parameter", 400

    # Get ngrok URL from environment or use default
    ngrok_url = os.getenv('NGROK_URL', 'https://38a4-164-67-70-232.ngrok-free.app')
    redirect_uri = f"{ngrok_url}/oauth2callback"

    flow = Flow.from_client_secrets_file(
        GMAIL_CREDENTIALS_PATH,
        scopes=SCOPES,
        redirect_uri=redirect_uri
    )
    flow.fetch_token(authorization_response=request.url)

    credentials = flow.credentials
    access_token = credentials.token
    refresh_token = credentials.refresh_token
    token_expiry = credentials.expiry.isoformat()

    service = build('gmail', 'v1', credentials=credentials)
    profile = service.users().getProfile(userId='me').execute()
    email = profile['emailAddress']

    print(f"Storing data for username: {username}")
    db = get_firestore_client()
    db.collection("users").document(username).set({
        "email": email,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_expiry": token_expiry
    })

    return render_template_string('''
        <h2>✅ Auth successful for {{ username }}!</h2>
        <p>Please upload your resume and provide additional details:</p>
        
        <form action="/complete_profile" method="post" enctype="multipart/form-data">
            <input type="hidden" name="username" value="{{ username }}">
            
            <div>
                <label for="resume_file">Upload Resume (PDF):</label><br>
                <input type="file" id="resume_file" name="resume_file" accept=".pdf" required><br><br>
            </div>
            
            <div>
                <label for="additional_details">Additional Details:</label><br>
                <textarea id="additional_details" name="additional_details" rows="10" style="width: 100%;"></textarea>
            </div>
            
            <button type="submit">Save</button>
        </form>
    ''', username=username)


@app.route('/complete_profile', methods=['POST'])
def complete_profile():
    username = request.form.get('username')
    if not username:
        return "❌ Missing username", 400

    # Check if resume file was uploaded
    if 'resume_file' not in request.files:
        return "❌ No resume file uploaded", 400
        
    file = request.files['resume_file']
    if file.filename == '':
        return "❌ No selected file", 400
        
    if file and allowed_file(file.filename):
        # Parse PDF content
        resume_text = parse_pdf(file)
        if not resume_text:
            return "❌ Failed to parse PDF resume", 400

        # Get additional details
        additional_details = request.form.get('additional_details', '')

        # Store in Firestore
        db = get_firestore_client()
        user_ref = db.collection("users").document(username)
        
        # First check if document exists
        doc = user_ref.get()
        if not doc.exists:
            # Create new document
            user_ref.set({
                "resume_text": resume_text,
                "additional_details": additional_details,
                "profile_completed": True
            })
        else:
            # Update existing document
            user_ref.update({
                "resume_text": resume_text,
                "additional_details": additional_details,
                "profile_completed": True
            })

        return "✅ Profile saved successfully!"
    else:
        return "❌ Invalid file type. Please upload a PDF.", 400


@app.route('/send_email', methods=['POST'])
def send_email():
    data = request.json
    username = data.get('username')
    to_email = data.get('to')
    subject = data.get('subject')
    body = data.get('body')

    if not all([username, to_email, subject, body]):
        return {"error": "Missing one of: username, to, subject, body"}, 400

    creds = get_user_credentials(username)
    if creds is None:
        return {"error": "❌ No credentials found for this user"}, 403

    service = build('gmail', 'v1', credentials=creds)
    message = MIMEText(body)
    message['to'] = to_email
    message['subject'] = subject

    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    send_result = service.users().messages().send(userId='me', body={'raw': raw_message}).execute()

    return {"status": "✅ Email sent successfully!", "id": send_result['id']}


@app.route('/read_with', methods=['POST'])
def read_with():
    data = request.json
    username = data.get('username')
    target_email = data.get('email')

    if not username or not target_email:
        return {"error": "Missing username or target email"}, 400

    creds = get_user_credentials(username)
    if creds is None:
        return {"error": "❌ No credentials found for this user"}, 403

    service = build('gmail', 'v1', credentials=creds)
    query = f'to:{target_email} OR from:{target_email}'
    results = service.users().messages().list(userId='me', q=query, maxResults=10).execute()
    messages = results.get('messages', [])

    email_data = []
    for msg in messages:
        msg_detail = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
        headers = msg_detail.get('payload', {}).get('headers', [])

        def get_header(name):
            return next((h['value'] for h in headers if h['name'].lower() == name.lower()), "")

        subject = get_header('Subject')
        sender = get_header('From')
        recipient = get_header('To')
        cc = get_header('Cc')
        bcc = get_header('Bcc')
        date = get_header('Date')

        body = ''
        payload = msg_detail.get('payload', {})
        parts = payload.get('parts', [])

        if parts:
            for part in parts:
                if part['mimeType'] == 'text/plain' and 'data' in part['body']:
                    body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
                    break
                elif part['mimeType'] == 'text/html' and 'data' in part['body']:
                    body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
        elif 'data' in payload.get('body', {}):
            body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')

        email_data.append({
            'from': sender,
            'to': recipient,
            'cc': cc,
            'bcc': bcc,
            'date': date,
            'subject': subject,
            'body': body[:500]
        })

    return {'emails': email_data}

@app.route('/google_search', methods=['POST'])
async def google_search_endpoint():
    try:
        data = request.json
        if not data:
            logger.error("No JSON data received")
            return jsonify({"error": "No JSON data received"}), 400
            
        search_query = data.get('query')
        if not search_query:
            logger.error("Missing search query")
            return jsonify({"error": "Missing search query"}), 400
        
        logger.info(f"Performing search with query: {search_query}")
        results = await perform_google_search(search_query)
        logger.info(f"Search completed. Found {len(results)} results")
        
        return jsonify({
            "status": "success",
            "results": results
        })
    except Exception as e:
        logger.error(f"Error in google_search endpoint: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route("/health")
def health():
    return jsonify({"status": "healthy"}), 200

@app.route("/search_people", methods=['POST'])
def search_people():
    try:
        # Check if API key is configured
        if not LINKD_API_KEY:
            logger.error("LINKD_API_KEY not configured")
            return jsonify({"error": "API key not configured"}), 500
            
        data = request.json
        query = data.get('query')
        limit = data.get('limit', 10)  # Default to 10 results
        schools = data.get('schools', [])  # Optional school filter
        
        if not query:
            logger.error("Missing search query")
            return jsonify({"error": "Search query is required"}), 400
            
        # Prepare request to Linkd API
        url = "https://search.linkd.inc/api/search/users"
        headers = {
            "Authorization": f"Bearer {LINKD_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # URL encode the query parameter
        encoded_query = urllib.parse.quote(query)
        params = {
            "query": encoded_query,
            "limit": min(limit, 30)  # API limit is 30
        }
        
        if schools:
            # URL encode each school name
            encoded_schools = [urllib.parse.quote(school) for school in schools]
            params["school"] = encoded_schools
            
        # Make request to Linkd API
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
            logger.error(f"Linkd API error: {response.text}")
            return jsonify({
                "error": "Failed to fetch results from Linkd API",
                "status_code": response.status_code,
                "details": response.text
            }), response.status_code
            
        # Return the API response
        return jsonify(response.json())
        
    except Exception as e:
        logger.error(f"Error in search_people: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/get_email', methods=['POST'])
def get_email():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data received"}), 400
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        linkedin_url = data.get("linkedin_url")
        if not first_name or not last_name or not linkedin_url:
            return jsonify({"error": "Missing required fields: first_name, last_name, linkedin_url"}), 400

        encoded_profile = urllib.parse.quote(linkedin_url, safe='')
        url = (f"https://api.apollo.io/api/v1/people/match?first_name={first_name}"
               f"&last_name={last_name}&linkedin_url={encoded_profile}&"
               "reveal_personal_emails=true&reveal_phone_number=false")

        headers = {
            "accept": "application/json",
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
            "x-api-key": os.getenv("APOLLO_API_KEY")
        }

        response = requests.post(url, headers=headers)
        if response.status_code != 200:
            logger.error(f"Apollo API error: {response.text}")
            return jsonify({
                "error": "Failed to fetch email from Apollo API",
                "status_code": response.status_code,
                "details": response.text
            }), response.status_code

        # Parse and return only the email
        result = response.json()
        email = result.get("person", {}).get("email")
        if not email:
            return jsonify({"error": "Email not found"}), 404
        return jsonify({"email": email})
    except Exception as e:
        logger.error(f"Error in get_email: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/find_and_contact_candidates', methods=['POST'])
def find_and_contact_candidates():
    try:
        print("\n=== Starting Candidate Search Process ===")
        
        # Get job description and username from request
        data = request.json
        job_description = data.get('job_description')
        username = data.get('username')
        print(f"Received request for username: {username}")
        print(f"Job description: {job_description}")
        
        if not job_description:
            print("Error: Missing job description")
            return jsonify({"error": "Job description is required"}), 400
        if not username:
            print("Error: Missing username")
            return jsonify({"error": "Username is required"}), 400

        # Get user's details from Firestore
        print(f"\n=== Fetching User Profile from Firestore ===")
        db = get_firestore_client()
        user_doc = db.collection("users").document(username).get()
        print(f"Firestore document exists: {user_doc.exists}")
        
        if not user_doc.exists:
            print(f"Error: User profile not found for {username}")
            return jsonify({"error": f"User profile not found for {username}"}), 404

        user_data = user_doc.to_dict()
        user_resume = user_data.get('resume_text', '')
        user_details = user_data.get('additional_details', '')
        print(f"Resume length: {len(user_resume)} characters")
        print(f"Additional details length: {len(user_details)} characters")

        print("\n=== Generating Search Query with Gemini ===")
        # Use Gemini to analyze job description and create search query
        search_prompt = f"""
        Analyze this job descriptions/query:
        {job_description}
        this is the users resume:
        {user_resume}
        this is the users additional details:
        {user_details}

        Follow these rules and create a search query in plain english:
        1. Identify if the user has provided a query or a job 
        2. If the user has provided a job description do the following:
            1. Extract the company name, role, and key requirements
            2. Format the query similar to these examples:
            - "People working as <role(hiring manager, recruiter, etc)> at <company(FAANG, Google, etc)>"
            - "PhDs now working at FAANG companies"
            - "CS graduates working on autonomous vehicles"
            - "People working on biotech in the Bay Area"
            3. Focus on finding:
            - People in similar roles at target companies
            - Hiring managers or recruiters at target companies
            - People who recently moved to target companies
            4. Use exact company names (e.g., "Google" not "FAANG")
            5. Keep the query concise and specific
        3. If the user has provided a query do the following:
            - Use the query as is

        Return ONLY the search query, nothing else.
        """
        print("Sending prompt to Gemini...")
        search_response = gemini_model.generate_content(search_prompt)
        search_query = search_response.text.strip()
        # Clean up the query - remove any extra quotes
        search_query = search_query.replace('"', '').replace("'", "").strip()
        print(f"Generated search query: {search_query}")

        print("\n=== Searching Candidates using Linkd API ===")
        # Search for candidates using Linkd API directly
        url = "https://search.linkd.inc/api/search/users"
        headers = {
            "Authorization": f"Bearer {LINKD_API_KEY}",
            "Content-Type": "application/json"
        }
        params = {
            "query": search_query,
            "limit": 5
        }
        print(f"Making request to Linkd API with params: {params}")

        response = requests.get(url, headers=headers, params=params)
        print(f"Linkd API response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Error from Linkd API: {response.text}")
            return jsonify({"error": "Failed to search candidates"}), response.status_code

        print(f"Linkd API response: {response.json()}")
        candidates = response.json().get('results', [])
        print(f"Found {len(candidates)} candidates")
        
        if not candidates:
            print("No candidates found in response")
            return jsonify({"error": "No candidates found"}), 404

        print("\n=== Processing Candidates ===")
        # Get emails and prepare personalized messages
        results = []
        for idx, candidate in enumerate(candidates, 1):
            print(f"\nProcessing candidate {idx}/5:")
            profile = candidate.get('profile', {})
            print(f"Name: {profile.get('name')}")
            print(f"Title: {profile.get('title')}")
            print(f"Headline: {profile.get('headline')}")
            print(f"Linkedin URL: {profile.get('linkedin_url')}")
            
            # Get email using Apollo API
            email_response = requests.post(
                'http://localhost:8080/get_email',
                json={
                    "first_name": profile.get('name', '').split()[0] if profile.get('name') else '',
                    "last_name": profile.get('name', '').split()[-1] if profile.get('name') else '',
                    "linkedin_url": profile.get('linkedin_url', '')
                }
            )
            
            print(f"Apollo API response status: {email_response.status_code}")
            # Hardcoded email generation
            first_name = profile.get('name', '').split()[0].lower() if profile.get('name') else ''
            last_name = profile.get('name', '').split()[-1].lower() if profile.get('name') else ''
            
            # Get company from experience if available
            company = None
            if candidate.get('experience'):
                current_exp = candidate['experience'][0]  # Get most recent experience
                company = current_exp.get('company_name', '').lower().replace(' ', '')
            email = f"{first_name}.{last_name}@{company}.com"
            # if email_response.status_code == 200:
            if True:
                # email = email_response.json().get('email')
                if email:
                    print(f"Email found: {email}")
                    
                    print("Generating personalized message with Gemini...")
                    # Generate personalized message first
                    message_prompt = f"""
                    Create a personalized email to this person. Here are their complete details:

                    RECIPIENT DETAILS:
                    {json.dumps(candidate, indent=2)}

                    SENDER BACKGROUND:
                    Resume: {user_resume}
                    Additional Details: {user_details}
                    
                    CONTEXT:
                    Job Description/Query: {job_description}
                    
                    Create a personalized email that:
                    1. Shows you've thoroughly researched their background
                    2. Makes specific references to their experience and current role
                    3. Explains why you're reaching out to them specifically
                    4. Keeps the tone professional but friendly
                    5. Stays under 200 words
                    6. Includes a clear call to action
                    
                    Return ONLY the email message, nothing else.
                    """

                    message_response = gemini_model.generate_content(message_prompt)
                    personalized_message = message_response.text.strip()

                    # Generate subject line based on the personalized message
                    subject_prompt = f"""
                    Create a compelling subject line for this email:

                    EMAIL CONTENT:
                    {personalized_message}

                    CANDIDATE:
                    {json.dumps(candidate, indent=2)}

                    Rules for subject line:
                    1. Be specific and relevant to the email content
                    2. Mention a key point from the email
                    3. Keep it under 60 characters
                    4. Make it compelling to open
                    5. No generic phrases like "Opportunity to Connect"
                    
                    Return ONLY the subject line, nothing else.
                    """

                    subject_response = gemini_model.generate_content(subject_prompt)
                    personalized_subject = subject_response.text.strip()
                    print(f"Generated subject: {personalized_subject}")

                    # Prepare email data
                    email_data = {
                        "to": email,
                        "subject": personalized_subject,
                        "body": personalized_message
                    }

                    # Print email details for testing
                    print(f"\n{'='*50}")
                    print(f"Would send email to: {email}")
                    print(f"From user: {username}")
                    print(f"Subject: {email_data['subject']}")
                    print(f"Message:\n{personalized_message}")
                    print(f"{'='*50}\n")

                    # Send the email
                    send_response = requests.post(
                        'http://localhost:8080/send_email',
                        json={
                            "username": username,
                            "to": email,
                            "subject": personalized_subject,
                            "body": personalized_message
                        }
                    )

                    results.append({
                        "candidate": candidate,
                        "email": email,
                        "email_sent": True,
                        "message": personalized_message
                    })
            else:
                print(f"Failed to get email: {email_response.text}")

        print("\n=== Process Complete ===")
        print(f"Successfully processed {len(results)} candidates")
        
        return jsonify({
            "status": "success",
            "search_query": search_query,
            "candidates_contacted": len(results),
            "details": results
        })

    except Exception as e:
        print(f"\n=== Error Occurred ===")
        print(f"Error type: {type(e)}")
        print(f"Error message: {str(e)}")
        logger.error(f"Error in find_and_contact_candidates: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/update_credentials/<username>')
def update_credentials_route(username):
    if update_oauth_credentials(username):
        return "✅ Credentials updated successfully"
    return "❌ Failed to update credentials", 400

@app.route('/check_credentials/<username>')
def check_credentials_route(username):
    try:
        db = get_firestore_client()
        doc = db.collection("users").document(username).get()
        if not doc.exists:
            return "❌ User not found", 404
            
        data = doc.to_dict()
        missing_fields = [field for field in ['token_uri', 'client_id', 'client_secret', 'scopes', 'redirect_uri'] 
                         if field not in data]
        
        if missing_fields:
            return f"❌ Missing fields: {', '.join(missing_fields)}", 400
            
        return f"✅ All credentials present for {username}"
    except Exception as e:
        return f"❌ Error checking credentials: {str(e)}", 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    host = os.getenv('HOST', '0.0.0.0')
    app.run(host=host, port=port, debug=True)