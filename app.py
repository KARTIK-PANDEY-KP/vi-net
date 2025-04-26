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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Load environment variables
load_dotenv()

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
    creds = Credentials(
        token=data['access_token'],
        refresh_token=data['refresh_token'],
        token_uri='https://oauth2.googleapis.com/token',
        client_id=os.environ.get('GOOGLE_CLIENT_ID'),
        client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
        scopes=SCOPES
    )

    if creds.expired and creds.refresh_token:
        creds.refresh(Request())

        # Save new access token and expiry to Firestore
        db.collection("users").document(user_id).update({
            "access_token": creds.token,
            "token_expiry": creds.expiry.isoformat()
        })

    return creds



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
    if not username:
        return "❌ Username required", 400

    session['custom_username'] = username

    flow = Flow.from_client_secrets_file(
        GMAIL_CREDENTIALS_PATH,
        scopes=SCOPES,
        redirect_uri=url_for('oauth2callback', _external=True)
    )
    auth_url, _ = flow.authorization_url(prompt='consent', include_granted_scopes='true')
    return redirect(auth_url)


@app.route('/oauth2callback')
def oauth2callback():
    flow = Flow.from_client_secrets_file(
        GMAIL_CREDENTIALS_PATH,
        scopes=SCOPES,
        redirect_uri=url_for('oauth2callback', _external=True)
    )
    flow.fetch_token(authorization_response=request.url)

    credentials = flow.credentials
    access_token = credentials.token
    refresh_token = credentials.refresh_token
    token_expiry = credentials.expiry.isoformat()

    service = build('gmail', 'v1', credentials=credentials)
    profile = service.users().getProfile(userId='me').execute()
    email = profile['emailAddress']

    username = session.get('custom_username')
    if not username:
        return "❌ Missing username from session", 400

    user_id = username

    db = get_firestore_client()
    db.collection("users").document(user_id).set({
        "email": email,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_expiry": token_expiry
    })

    # Return a form with two text fields
    return render_template_string('''
        <h2>✅ Auth successful for {{ username }}!</h2>
        <p>Please provide your resume and additional details:</p>
        
        <form action="/complete_profile" method="post">
            <input type="hidden" name="username" value="{{ username }}">
            
            <div>
                <label for="resume">Resume Text:</label><br>
                <textarea id="resume" name="resume" rows="15" required style="width: 100%;"></textarea>
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

    # Get form data
    resume_text = request.form.get('resume', '')
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

    return "✅ Saved"


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
        params = {
            "query": query,
            "limit": min(limit, 30)  # API limit is 30
        }
        
        if schools:
            params["school"] = schools
            
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

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    host = os.getenv('HOST', '0.0.0.0')
    app.run(host=host, port=port)