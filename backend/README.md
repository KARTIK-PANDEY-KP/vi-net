# 📬 Flask Gmail API App with Firestore Token Storage and bot_backend for LinkedIn automation

This project allows users to log in with their Google account, give consent to access Gmail, and then send or read emails programmatically using just their username. All Gmail OAuth tokens are securely stored in Firestore using a service account.

---

## 🔧 Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <your-repo-directory>
```

---

### 2. Install dependencies

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

### 3. Set up Google Cloud Projectcurl -X POST http://localhost:8080/get_email \
     -H "Content-Type: application/json" \
     -d '{
           "first_name": "Pranav",
           "last_name": "Subbaraman",
           "linkedin_url": "[https://www.linkedin.com/in/pranav-subbaraman/"](https://www.linkedin.com/in/pranav-subbaraman/")
         }'

#### a. 🔐 Enable Gmail API and Firestore API
Go to [Google Cloud Console](https://console.cloud.google.com/):
- Enable the **Gmail API**
- Enable the **Cloud Firestore API**

#### b. 🔐 Create OAuth 2.0 credentials
- Go to **APIs & Services > Credentials**
- Click **Create Credentials > OAuth client ID**
- Choose **Web Application**
- Add `http://localhost:8080/oauth2callback` to redirect URIs
- Download the JSON and save it as:  
  `GCP_gmail_api_credentials.json` (or update `GMAIL_CREDENTIALS_PATH` in `.env`)

#### c. 🔐 Create Firestore service account
- Go to **IAM & Admin > Service Accounts**
- Create a service account
- Grant it the role:  
  ✅ `Cloud Datastore > Cloud Datastore User`
- Download the key as `firestore-creds.json` (or update `FIRESTORE_CREDENTIALS_PATH` in `.env`)

---

### 4. Create a `.env` file

```env
# Redis Configuration (only needed if you add sessions later)
REDIS_PASSWORD=[password]

# Flask Session (optional)
FLASK_SESSION_KEY=[password]

# Google Cloud Credentials
GOOGLE_APPLICATION_CREDENTIALS=./firestore-creds.json

# File Paths
GMAIL_CREDENTIALS_PATH=./GCP_gmail_api_credentials.json
FIRESTORE_CREDENTIALS_PATH=./firestore-creds.json

# Linkd API Configuration
LINKD_API_KEY=your_api_key_here  # Required for people search functionality

# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
FLASK_DEBUG=1

# Server Configuration
PORT=8080
HOST=0.0.0.0
```

---

## 🚀 Run the App

```bash
source venv/bin/activate
python app.py
```

---

## 💡 Usage Flow

### 1. User Registration
Open in browser:

```
http://localhost:8080/
```

- Enter a **custom username** (e.g. `user123`)
- It will redirect to Google OAuth
- After granting Gmail access, the token is saved under that username in Firestore

---

### 2. Send Email (via CURL or API)

```bash
curl -X POST http://localhost:8080/send_email \
  -H "Content-Type: application/json" \
  -d '{
        "username": "user123",
        "to": "recipient@domain.com",
        "subject": "Test Email",
        "body": "This is a test email sent via the API."
      }'
```

#### Sample Response (Success):
```json
{
  "status": "Email sent successfully!",
  "id": "msg_1234567890abcdef"
}
```

#### Sample Response (Error):
```json
{
  "error": "No credentials found for this user. Please login first."
}
```

---

### 3. Read Emails With a Contact

```bash
curl -X POST http://localhost:8080/read_with \
  -H "Content-Type: application/json" \
  -d '{
        "username": "user123",
        "email": "contact@domain.com"
      }'
```

#### Sample Response (Success):
```json
{
  "emails": [
    {
      "from": "sender@domain.com",
      "to": "recipient@domain.com",
      "cc": "cc@domain.com",
      "bcc": "",
      "date": "Mon, 01 Jan 2024 12:00:00 GMT",
      "subject": "Sample Subject",
      "body": "This is a sample email body..."
    },
    {
      "from": "reply@domain.com",
      "to": "original@domain.com",
      "cc": "",
      "bcc": "",
      "date": "Mon, 01 Jan 2024 12:30:00 GMT",
      "subject": "Re: Sample Subject",
      "body": "This is a sample reply..."
    }
  ]
}
```

#### Sample Response (Error):
```json
{
  "error": "No credentials found for this user. Please login first."
}
```

---

### 4. Search People Profiles

> ⚠️ **Note**: This endpoint requires a valid Linkd API key to be set in the `LINKD_API_KEY` environment variable.

Search for people profiles using natural language queries:

```bash
# Make sure to set your API key in .env first
export LINKD_API_KEY=your_api_key_here

curl -X POST http://localhost:8080/search_people \
  -H "Content-Type: application/json" \
  -d '{
        "query": "People working on AI at FAANG",
        "limit": 10,
        "schools": ["Stanford University", "MIT"]  # Optional school filter
      }'
```

#### Sample Response (Success):
```json
{
  "results": [
    {
      "profile": {
        "id": "p12345",
        "name": "Jane Smith",
        "location": "San Francisco, CA",
        "headline": "AI Researcher at Google",
        "description": "Working on large language models and AI applications",
        "title": "Senior Research Scientist",
        "profile_picture_url": "https://example.com/profiles/janesmith.jpg",
        "linkedin_url": "https://linkedin.com/in/janesmith"
      },
      "experience": [
        {
          "title": "Senior Research Scientist",
          "company_name": "Google",
          "start_date": "2020-01",
          "end_date": null,
          "description": "Leading AI research projects",
          "location": "Mountain View, CA"
        }
      ],
      "education": [
        {
          "degree": "PhD",
          "field_of_study": "Computer Science",
          "school_name": "Stanford University",
          "start_date": "2015",
          "end_date": "2020",
          "description": "Focus on machine learning and AI"
        }
      ]
    }
  ],
  "total": 1,
  "query": "People working on AI at FAANG",
  "error": null
}
```

#### Sample Response (Error):
```json
{
  "error": "Search query is required"
}
```

#### Query Examples:
- People working on AI at FAANG
- People who started companies in Web3 or crypto
- PhDs now working at FAANG companies
- Who works at a VC firm?
- CS graduates working on autonomous vehicles
- People working on biotech in the Bay Area

#### Parameters:
- `query` (required): The search query string
- `limit` (optional): Maximum number of results to return (default: 10, max: 30)
- `schools` (optional): Array of school names to filter results

---

## ✅ Success!

- You can now **send and read Gmail programmatically** on behalf of any user who has completed the OAuth flow
- No need to manually manage `access_token`s—everything is securely handled via Firestore