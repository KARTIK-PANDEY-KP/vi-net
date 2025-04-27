import { z } from "zod";
import { ToolConfig } from "@dainprotocol/service-sdk";
import { FormUIBuilder, CardUIBuilder, TableUIBuilder, DainResponse } from "@dainprotocol/utils";
import axios from 'axios';
import { enforceOnboarding } from "./utils";

// Define output schema
const emailFinderOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  emails: z.array(z.string()).optional(),
  requestId: z.number().optional(),
});

// Email Finder Tool Configuration
export const emailFinderConfig: ToolConfig = {
  id: "email-finder",
  name: "LinkedIn Email Finder",
  description: "Finds email addresses associated with a LinkedIn profile URL. Use this tool when the user wants to find email addresses linked to a specific LinkedIn profile. If the user asks to send a coffee chat based on a linkedin url, call this tool, use the email outputted from this to use for the email tool.",
  input: z.object({
    linkedinUrl: z.string().url().describe("LinkedIn profile URL"),
  }),
  output: emailFinderOutputSchema,
  handler: enforceOnboarding(async ({ linkedinUrl }, agentInfo) => {
    if (!linkedinUrl) {
      const formUI = new FormUIBuilder()
        .title("Find Email from LinkedIn URL")
        .addFields([
          {
            name: "linkedinUrl",
            label: "LinkedIn Profile URL",
            type: "string",
            widget: "url",
            required: true,
          },
        ])
        .onSubmit({
          tool: "email-finder",
          params: {},
        })
        .build();

      return new DainResponse({
        text: "Please provide a LinkedIn profile URL to find associated email addresses",
        data: null,
        ui: formUI,
      });
    }

    try {
      console.log(`[EMAIL FINDER] Submitting request for LinkedIn URL: ${linkedinUrl}`);
      
      // Step 1: Submit the initial request to get a request_id
      const submitResponse = await axios.post('http://localhost:5000/get-email', {
        linkedin_url: linkedinUrl
      });
      
      if (!submitResponse.data || !submitResponse.data.request_id) {
        throw new Error('Failed to submit email finder request');
      }
      
      const requestId = submitResponse.data.request_id;
      console.log(`[EMAIL FINDER] Request submitted successfully. Request ID: ${requestId}`);
      
      // Step 2: Poll for results (with a reasonable timeout)
      let retries = 0;
      const maxRetries = 5;
      let result = null;
      
      while (retries < maxRetries) {
        try {
          // Wait a bit between requests
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          console.log(`[EMAIL FINDER] Checking results for request ID: ${requestId}`);
          const resultResponse = await axios.get(`http://localhost:5000/results/${requestId}`);
          
          if (resultResponse.data && resultResponse.data.status === "success") {
            result = resultResponse.data;
            break;
          }
          
          // If still processing, continue polling
          if (resultResponse.data && resultResponse.data.status === "processing") {
            console.log(`[EMAIL FINDER] Request still processing, retrying...`);
            retries++;
            continue;
          }
          
          // If there's an error or unexpected status
          if (resultResponse.data && resultResponse.data.status === "error") {
            throw new Error(`Error finding emails: ${resultResponse.data.message || 'Unknown error'}`);
          }
          
          retries++;
        } catch (error) {
          console.error(`[EMAIL FINDER] Error checking results: ${error.message}`);
          retries++;
        }
      }
      
      if (!result) {
        return new DainResponse({
          text: "Unable to find emails for the provided LinkedIn URL after multiple attempts",
          data: {
            success: false,
            message: "Email finding process timed out. Please try again later.",
            requestId
          },
          ui: new CardUIBuilder()
            .title("Email Finding Process Timed Out")
            .content(`
              We were unable to find emails for ${linkedinUrl} after multiple attempts.
              
              Your request (ID: ${requestId}) is still being processed. You can check the status later.
              
              Please try again in a few minutes.
            `)
            .build(),
        });
      }
      
      // Create a table to display results
      const emailsTable = new TableUIBuilder()
        .addColumns([
          { key: "email", header: "Email Address", type: "string" },
        ])
        .rows(result.emails.map(email => ({ email })))
        .build();
      
      return new DainResponse({
        text: `Found ${result.emails.length} email(s) for ${linkedinUrl}`,
        data: {
          success: true,
          message: `Found ${result.emails.length} email(s) for ${linkedinUrl}`,
          emails: result.emails,
          requestId
        },
        ui: new CardUIBuilder()
          .title("LinkedIn Email Finder Results")
          .content(`
            Found ${result.emails.length} email address(es) associated with:
            ${linkedinUrl}
          `)
          .addChild(emailsTable)
          .build(),
      });
    } catch (error) {
      console.error(`[EMAIL FINDER] Error: ${error.message}`);
      
      return new DainResponse({
        text: `Error finding emails: ${error.message}`,
        data: {
          success: false,
          message: `Error finding emails: ${error.message}`,
          emails: []
        },
        ui: new CardUIBuilder()
          .title("Email Finder Error")
          .content(`
            An error occurred while finding emails for ${linkedinUrl}:
            
            ${error.message}
            
            Please check the LinkedIn URL and try again.
          `)
          .build(),
      });
    }
  }, emailFinderOutputSchema)
};