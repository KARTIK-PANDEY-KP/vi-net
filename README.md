# LinkedIn & Gmail Tools DAIN Service

This DAIN service integrates LinkedIn profile search capabilities with Gmail for sending emails and scheduling coffee chats. 

## Features

- **LinkedIn Profile Search**: Search for professionals based on keywords, job titles, or other criteria
- **Coffee Chat Scheduling**: Find potential networking contacts and send them meeting invitations 
- **Gmail Email Sending**: Send custom emails using your Gmail account

## Architecture

The service is structured modularly with separate files for each major component:

- `index.ts` - Main service definition and startup
- `auth-utils.ts` - OAuth authentication utilities and token management
- `gmail-service.ts` - Gmail API interaction functions
- `gmail-tool.ts` - Gmail email sending tool definition
- `linkedin-service.ts` - LinkedIn API interaction functions
- `linkedin-tools.ts` - LinkedIn search and coffee chat tool definitions

## Setup

### Prerequisites

- Node.js 14+
- npm or yarn
- Google Developer Account (for Gmail API access)
- LinkedIn API access

### Environment Variables

Create a `.env` file with the following variables:

```
# DAIN API Key
DAIN_API_KEY=your_dain_api_key

# Google API Credentials
GMAIL_CLIENT_ID=your_google_client_id
GMAIL_CLIENT_SECRET=your_google_client_secret
OAUTH_REDIRECT_URI=your_oauth_redirect_uri

# LinkedIn API
LINKD_API_KEY=your_linkedin_api_key

# Service Configuration
TUNNEL_URL=your_public_service_url
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the service:
   ```
   npm start
   ```

## OAuth Integration

This service uses DAIN's context feature to store OAuth tokens securely. When a user authorizes the service to access their Gmail account, the tokens are stored in the context and can be retrieved for subsequent requests.

### OAuth Flow

1. User initiates an action requiring Gmail access
2. Service redirects to Google authorization page
3. User grants permission
4. Google redirects back to service with authorization code
5. Service exchanges code for tokens
6. Tokens are stored in DAIN context for future use

## Tools

### 1. LinkedIn Search

Search for LinkedIn profiles matching specific criteria.

**Inputs:**
- `query` - Search keywords (e.g., "software engineer at Google")
- `limit` - Maximum number of results (default: 5)

### 2. Schedule Coffee Chat

Schedule coffee chats with LinkedIn professionals and send Gmail invitations.

**Inputs:**
- `googleMeetLink` - Google Meet URL for the meeting
- `resumeUrl` - URL to your resume
- `preferredChatPartner` - Type of professional you want to meet

### 3. Send Email

Send custom emails via Gmail.

**Inputs:**
- `to` - Recipient email address
- `subject` - Email subject
- `body` - Email body content (supports HTML)

## Customization

### Adding New Tools

To add a new tool:

1. Create the core functionality in a service file
2. Define the tool configuration in a tool file
3. Import and add the tool to the `tools` array in `index.ts`

### Modifying Email Templates

Email templates for coffee chat invitations can be customized in the `sendGmailInvitations` function in `gmail-service.ts`.

## Security Considerations

- OAuth tokens are stored in DAIN context for persistence
- The service implements token refresh logic to handle expired tokens
- User credentials are never stored directly; only OAuth tokens are kept

## Troubleshooting

Common issues and solutions:

- **OAuth Error**: Ensure your Google API credentials and redirect URI are correctly configured
- **LinkedIn API Error**: Verify your LinkedIn API key is valid and has the necessary permissions
- **Email Sending Failure**: Check that the user has authorized Gmail access and that their token is still valid

## Further Development

Potential enhancements:

- Add support for attachments in emails
- Implement LinkedIn message sending (requires additional API permissions)
- Create templates for common email types
- Add calendar integration for scheduling