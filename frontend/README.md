# Project Dave

A modern networking platform that helps you connect with the right people.

## Setup

### Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Backend
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Run development server
python app.py
```

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=your_backend_url
```

### Backend (.env)
```
GMAIL_CREDENTIALS_PATH=./GCP_gmail_api_credentials.json
FIRESTORE_CREDENTIALS_PATH=./firestore-creds.json
LINKD_API_KEY=your_linkd_api_key
APOLLO_API_KEY=your_apollo_api_key
GEMINI_API_KEY=your_gemini_api_key
```

## Deployment

1. Fork this repository
2. Connect to Render.com
3. Create a new Web Service
4. Add environment variables
5. Deploy!
