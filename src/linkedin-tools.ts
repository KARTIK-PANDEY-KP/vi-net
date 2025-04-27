import { z } from "zod";
import { ToolConfig } from "@dainprotocol/service-sdk";
import { FormUIBuilder, CardUIBuilder, TableUIBuilder, DainResponse } from "@dainprotocol/utils";
import { searchLinkedInUsers, fetchLinkedInProfiles } from "./linkedin-service";
import { sendGmailInvitations } from "./gmail-service";
import { enforceOnboarding } from "./utils";

// Define output schemas
const linkedInSearchOutputSchema = z.object({
  message: z.string(),
  profiles: z.array(z.object({
    name: z.string(),
    title: z.string(),
    email: z.string().optional(),
    profileUrl: z.string().optional(),
    profilePicture: z.string().optional(),
  })),
});

const scheduleCoffeeChatOutputSchema = z.object({
  message: z.string(),
  invitedProfiles: z.array(z.object({
    name: z.string(),
    title: z.string(),
    email: z.string(),
  })),
});

// LinkedIn Search Tool Configuration
export const linkedInSearchConfig: ToolConfig = {
  id: "linkedin-search",
  name: "LinkedIn Search",
  description: "Uses a user query on a broad subject such as job title or education and returns information about their LinkedIn profile and other information. ONLY use this tool to search for LinkedIn profiles based on keywords, job titles, or companies. This tool performs initial discovery of profiles but does NOT provide enriched data or allow sending invitations.",
  input: z.object({
    query: z.string().describe("Search keywords like job title, company name, or skills"),
    limit: z.number().optional().default(5).describe("Maximum number of results to return (default: 5)"),
    searchPurpose: z.enum(["general_search", "research"]).default("general_search")
      .describe("Purpose of the search - use 'general_search' for basic profile discovery")
  }),
  output: linkedInSearchOutputSchema,
  handler: enforceOnboarding(async ({ query, limit }, agentInfo) => {
    process.stdout.write('[LINKEDIN SEARCH] Starting handler with enforceOnboarding\n');
    process.stdout.write(`[LINKEDIN SEARCH] Agent Info: ${JSON.stringify(agentInfo)}\n`);
    
    if (!query) {
      process.stdout.write('[LINKEDIN SEARCH] No query provided, showing form\n');
      const formUI = new FormUIBuilder()
        .title("LinkedIn Profile Search")
        .addFields([
          {
            name: "query",
            label: "Search Query (job title, field, or keywords)",
            type: "string",
            widget: "text",
            required: true,
          },
          {
            name: "limit",
            label: "Max Results",
            type: "number",
            widget: "text",
            default: 5,
            required: false,
          },
        ])
        .onSubmit({
          tool: "linkedin-search",
          params: {},
        })
        .build();

      return new DainResponse({
        text: "Please provide search criteria to find LinkedIn profiles",
        data: null,
        ui: formUI,
      });
    }

    try {
      process.stdout.write('[LINKEDIN SEARCH] Query provided, proceeding with search\n');
      process.stdout.write(`[LINKD SEARCH TOOL] Starting search for query: "${query}" with limit: ${limit}\n`);
      
      // Search LinkedIn profiles
      const profiles = await searchLinkedInUsers(query, limit);
      console.log(`[LINKD SEARCH TOOL] Search completed successfully with ${profiles.length} results`);
      
      // Create a table to display profiles
      const profilesTable = new TableUIBuilder()
        .addColumns([
          { key: "profilePicture", header: "Picture", type: "image" },
          { key: "name", header: "Name", type: "string" },
          { key: "title", header: "Role", type: "string" },
          { key: "profileUrl", header: "Profile URL", type: "link" },
        ])
        .rows(profiles)
        .build();

      const resultsCard = new CardUIBuilder()
        .title(`LinkedIn Profiles: ${query}`)
        .content(`Found ${profiles.length} profiles matching your search for "${query}"`)
        .addChild(profilesTable)
        .build();

      return new DainResponse({
        text: `Found ${profiles.length} LinkedIn profiles matching "${query}"`,
        data: {
          message: `Found ${profiles.length} LinkedIn profiles matching "${query}"`,
          profiles: profiles,
        },
        ui: resultsCard,
      });
    } catch (error) {
      console.error(`[LINKD SEARCH TOOL] Error in LinkedIn search: ${error.message}`);
      
      // Create an error card
      const errorCard = new CardUIBuilder()
        .title("LinkedIn Search Error")
        .content(`
          An error occurred while searching LinkedIn profiles:
          
          ${error.message}
          
          Please check your API configuration or try a different search query.
        `)
        .build();
      
      return new DainResponse({
        text: `Error searching LinkedIn profiles: ${error.message}`,
        data: {
          message: `Error searching LinkedIn profiles: ${error.message}`,
          profiles: [],
        },
        ui: errorCard,
      });
    }
  }, linkedInSearchOutputSchema)
};

// Schedule Coffee Chat Tool Configuration
export const scheduleCoffeeChatConfig: ToolConfig = {
  id: "schedule-coffee-chat",
  name: "Schedule Coffee Chat",
  description: "Schedule a coffee chat by providing necessary details and send invitations",
  input: z.object({
    googleMeetLink: z.string().url(),
    resumeUrl: z.string().url(),
    preferredChatPartner: z.string(),
  }),
  output: scheduleCoffeeChatOutputSchema,
  handler: enforceOnboarding(async ({ googleMeetLink, resumeUrl, preferredChatPartner }, agentInfo) => {
    if (!googleMeetLink || !resumeUrl || !preferredChatPartner) {
      const formUI = new FormUIBuilder()
        .title("Schedule Coffee Chat")
        .addFields([
          {
            name: "googleMeetLink",
            label: "Google Meet Link",
            type: "string",
            widget: "url",
            required: true,
          },
          {
            name: "resumeUrl",
            label: "Resume URL",
            type: "string",
            widget: "url",
            required: true,
          },
          {
            name: "preferredChatPartner",
            label: "Preferred Chat Partner Type",
            type: "string",
            widget: "text",
            required: true,
          },
        ])
        .onSubmit({
          tool: "schedule-coffee-chat",
          params: {},
        })
        .build();

      return new DainResponse({
        text: "Please fill out the form to schedule a coffee chat",
        data: null,
        ui: formUI,
      });
    }

    try {
      // Fetch LinkedIn profiles
      const profiles = await fetchLinkedInProfiles(preferredChatPartner);
      
      if (profiles.length === 0) {
        return new DainResponse({
          text: "No matching profiles found for your preferred chat partner criteria",
          data: {
            message: "No matching profiles found",
            invitedProfiles: []
          },
          ui: new CardUIBuilder()
            .title("No Profiles Found")
            .content(`
              No LinkedIn profiles were found matching your criteria: "${preferredChatPartner}"
              
              Please try again with different search terms.
            `)
            .build(),
        });
      }
      
      // Send Gmail invitations
      const emailResult = await sendGmailInvitations(agentInfo.id, googleMeetLink, resumeUrl, profiles);
      
      // Create a table to display invited profiles
      const profilesTable = new TableUIBuilder()
        .addColumns([
          { key: "profilePicture", header: "Picture", type: "image" },
          { key: "name", header: "Name", type: "string" },
          { key: "title", header: "Title", type: "string" },
          { key: "email", header: "Email", type: "string" },
        ])
        .setRenderMode('page')
        .rows(profiles)
        .build();
        
      // Create response message based on email sending result
      let resultMessage = "";
      if (emailResult.success) {
        resultMessage = `
          Your coffee chat has been scheduled and invitations sent successfully!
          Sent: ${emailResult.sentCount}, Failed: ${emailResult.failedCount}
        `;
      } else if (emailResult.sentCount > 0) {
        resultMessage = `
          Your coffee chat has been scheduled, but some invitations failed to send.
          Sent: ${emailResult.sentCount}, Failed: ${emailResult.failedCount}
        `;
      } else {
        resultMessage = `
          Your coffee chat has been scheduled, but we were unable to send invitations.
          Please check your Gmail connection or try again later.
        `;
      }

      const confirmationCard = new CardUIBuilder()
        .title("Coffee Chat Scheduled")
        .content(`
          ${resultMessage}
          
          Google Meet Link: ${googleMeetLink}
          Resume: ${resumeUrl}
          Preferred Chat Partner: ${preferredChatPartner}
        `)
        .addChild(profilesTable)
        .build();

      return new DainResponse({
        text: "Coffee chat scheduled successfully" + (emailResult.success ? " and invitations sent" : ""),
        data: {
          message: "Coffee chat scheduled successfully" + (emailResult.success ? " and invitations sent" : ""),
          invitedProfiles: profiles,
        },
        ui: confirmationCard,
      });
    } catch (error) {
      console.error(`[COFFEE CHAT TOOL] Error scheduling coffee chat: ${error.message}`);
      
      const errorCard = new CardUIBuilder()
        .title("Error Scheduling Coffee Chat")
        .content(`
          An error occurred while scheduling your coffee chat:
          
          ${error.message}
          
          Please try again later.
        `)
        .build();
      
      return new DainResponse({
        text: `Error scheduling coffee chat: ${error.message}`,
        data: {
          message: `Error: ${error.message}`,
          invitedProfiles: [],
        },
        ui: errorCard,
      });
    }
  }, scheduleCoffeeChatOutputSchema)
};