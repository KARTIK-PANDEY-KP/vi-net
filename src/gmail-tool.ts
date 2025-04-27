import { z } from "zod";
import { ToolConfig } from "@dainprotocol/service-sdk";
import { FormUIBuilder, CardUIBuilder, DainResponse } from "@dainprotocol/utils";
import { sendGmailEmail } from "./gmail-service";
import { enforceOnboarding } from "./utils";

// Define output schema
const sendEmailOutputSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional()
});

// Gmail Send Email Tool Configuration
export const sendEmailConfig: ToolConfig = {
  id: "send-email",
  name: "Send Email",
  description: "Sends an email to any given person. ONLY use this tool when the user explicitly wants to send an email without scheduling a coffee chat. For coffee chat invitations, use the Schedule Coffee Chat tool instead.",
  input: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string()
  }),
  output: sendEmailOutputSchema,
  handler: enforceOnboarding(async ({ to, subject, body }, agentInfo) => {
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
      
      const successCard = new CardUIBuilder()
        .title("Email Sent Successfully")
        .content(`
          Your email has been sent successfully!
          
          To: ${to}
          Subject: ${subject}
          Message ID: ${result.messageId}
        `)
        .build();

      return new DainResponse({
        text: "Email sent successfully",
        data: result,
        ui: successCard,
      });
    } catch (error) {
      console.error(`[GMAIL TOOL] Error sending email: ${error.message}`);
      
      const errorCard = new CardUIBuilder()
        .title("Error Sending Email")
        .content(`
          An error occurred while sending your email:
          
          ${error.message}
          
          Please check your Gmail connection or try again later.
        `)
        .build();
      
      return new DainResponse({
        text: `Error sending email: ${error.message}`,
        data: {
          success: false,
          message: error.message
        },
        ui: errorCard,
      });
    }
  }, sendEmailOutputSchema)
};