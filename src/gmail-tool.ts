import { z } from "zod";
import { ToolConfig } from "@dainprotocol/service-sdk";
import { FormUIBuilder, CardUIBuilder, DainResponse } from "@dainprotocol/utils";
import { sendGmailEmail } from "./gmail-service";

// Gmail Send Email Tool Configuration
export const sendEmailConfig: ToolConfig = {
  id: "send-email",
  name: "Send Email",
  description: "Sends an email using the user's Gmail account based on a linkedIn profile",
  input: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string()
  }),
  output: z.object({
    success: z.boolean(),
    messageId: z.string().optional()
  }),
  handler: async ({ to, subject, body }, agentInfo) => {
    if (!to || !subject || !body) {
      const formUI = new FormUIBuilder()
        .title("Send Email")
        .addFields([
          {
            name: "to",
            label: "Recipient Email",
            type: "string",
            widget: "email",
            required: true,
          },
          {
            name: "subject",
            label: "Email Subject",
            type: "string",
            widget: "text",
            required: true,
          },
          {
            name: "body",
            label: "Email Body",
            type: "string",
            widget: "textarea",
            required: true,
          },
        ])
        .onSubmit({
          tool: "send-email",
          params: {},
        })
        .build();

      return new DainResponse({
        text: "Please fill out the form to send an email",
        data: null,
        ui: formUI,
      });
    }

    try {
      const result = await sendGmailEmail(agentInfo.id, to, subject, body);
      
      if (result.success) {
        const successCard = new CardUIBuilder()
          .title("Email Sent")
          .content(`
            Your email has been sent successfully!
            
            To: ${to}
            Subject: ${subject}
          `)
          .build();
        
        return new DainResponse({
          text: "Email sent successfully",
          data: {
            success: true,
            messageId: result.messageId
          },
          ui: successCard,
        });
      } else {
        const errorCard = new CardUIBuilder()
          .title("Email Sending Failed")
          .content(`
            There was an error sending your email.
            
            Please check your Gmail connection or try again later.
          `)
          .build();
        
        return new DainResponse({
          text: "Failed to send email",
          data: {
            success: false
          },
          ui: errorCard,
        });
      }
    } catch (error) {
      console.error('[GMAIL TOOL] Error sending email:', error);
      
      const errorCard = new CardUIBuilder()
        .title("Email Error")
        .content(`
          An error occurred while sending your email:
          
          ${error.message}
          
          Please check your Gmail connection or try again later.
        `)
        .build();
      
      return new DainResponse({
        text: `Error sending email: ${error.message}`,
        data: {
          success: false
        },
        ui: errorCard,
      });
    }
  }
};