import { google } from 'googleapis';
import { getValidGoogleClient } from './auth-utils';
import { LinkedInProfile } from './linkedin-service';

/**
 * Sends an email via Gmail API
 */
async function sendGmailEmail(
  agentId: string, 
  to: string, 
  subject: string, 
  body: string
): Promise<{success: boolean, messageId?: string}> {
  console.log(`[GMAIL API] Preparing to send email to: ${to}`);
  console.log(`[GMAIL API] Subject: ${subject}`);
  
  try {
    // Get authenticated client
    const auth = await getValidGoogleClient(agentId);
    if (!auth) {
      console.error('[GMAIL API] No valid authentication found');
      throw new Error('Authentication required. Please connect your Gmail account first.');
    }
    
    // Create Gmail API client
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Prepare email message
    const message = [
      'From: "DAIN LinkedIn Tools" <me@gmail.com>',
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      body
    ].join('\n');
    
    // Encode message in base64url format
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    console.log('[GMAIL API] Sending email...');
    
    // Send the message
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    console.log(`[GMAIL API] Email sent successfully. Message ID: ${response.data.id}`);
    
    return {
      success: true,
      messageId: response.data.id
    };
  } catch (error) {
    console.error('[GMAIL API] Error sending email:', error);
    
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      console.error('[GMAIL API] Token expired or invalid');
      return {
        success: false,
        messageId: undefined
      };
    }
    
    // Handle other errors
    return {
      success: false,
      messageId: undefined
    };
  }
}

/**
 * Sends email invitations to multiple recipients via Gmail
 */
async function sendGmailInvitations(
  agentId: string, 
  meetLink: string, 
  resumeUrl: string, 
  recipients: LinkedInProfile[]
): Promise<{success: boolean, sentCount: number, failedCount: number}> {
  console.log(`[GMAIL API] Sending invitations to ${recipients.length} recipients`);
  
  let sentCount = 0;
  let failedCount = 0;
  
  for (const recipient of recipients) {
    try {
      const subject = "Coffee Chat Invitation";
      const body = `
        <html>
        <body>
          <h2>Coffee Chat Invitation</h2>
          <p>Hello ${recipient.name},</p>
          <p>I would like to invite you to a coffee chat to discuss potential opportunities.</p>
          <p><strong>Google Meet Link:</strong> <a href="${meetLink}">${meetLink}</a></p>
          <p>I've attached my resume for your reference: <a href="${resumeUrl}">My Resume</a></p>
          <p>Looking forward to our conversation!</p>
          <p>Best regards,</p>
        </body>
        </html>
      `;
      
      const result = await sendGmailEmail(agentId, recipient.email, subject, body);
      
      if (result.success) {
        sentCount++;
        console.log(`[GMAIL API] Successfully sent invitation to ${recipient.name} <${recipient.email}>`);
      } else {
        failedCount++;
        console.error(`[GMAIL API] Failed to send invitation to ${recipient.name} <${recipient.email}>`);
      }
    } catch (error) {
      failedCount++;
      console.error(`[GMAIL API] Error sending invitation to ${recipient.name}:`, error);
    }
  }
  
  console.log(`[GMAIL API] Invitation sending complete. Sent: ${sentCount}, Failed: ${failedCount}`);
  
  return {
    success: sentCount > 0,
    sentCount,
    failedCount
  };
}

export {
  sendGmailEmail,
  sendGmailInvitations
};