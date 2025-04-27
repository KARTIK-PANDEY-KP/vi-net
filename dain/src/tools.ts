import { z } from "zod";
import { ToolConfig } from "@dainprotocol/service-sdk";
import { FormUIBuilder, CardUIBuilder, TableUIBuilder, DainResponse } from "@dainprotocol/utils";
import { fetchLinkedInProfiles, searchLinkedInUsers } from "./functions";
import { sendGmailInvitations } from "./gmail-service";

export const scheduleCoffeeChatConfig: ToolConfig = {
  id: "schedule-coffee-chat",
  name: "Schedule Coffee Chat",
  description: "This sends a coffee chat invitation through email when provided with a query that targets a broad range of people, such as job title or education. ONLY use this tool when the user explicitly wants to schedule a coffee chat with people that fit a certain query. Requires a meeting link, scheduling link, resume URL, and search criteria for finding potential chat partners. This tool will search for profiles AND send invitations.",
  input: z.object({
    meetingLink: z.string().url().describe("Google Meet or Zoom link for the coffee chat"),
    schedulingLink: z.string().url().describe("Calendly or other scheduling platform link"),
    resumeUrl: z.string().url().describe("URL to your resume or LinkedIn profile"),
    preferredChatPartner: z.string().describe("Specific type of professional you want to meet (e.g., 'software engineer at Google')"),
    personalMessage: z.string().optional().describe("Optional custom message to include in the invitation")
  }),
  output: z.object({
    message: z.string(),
    invitedProfiles: z.array(z.object({
      name: z.string(),
      title: z.string(),
      email: z.string(),
    })),
  }),
  handler: async ({ meetingLink, schedulingLink, resumeUrl, preferredChatPartner, personalMessage }, agentInfo) => {
    if (!meetingLink || !schedulingLink || !resumeUrl || !preferredChatPartner) {
      const formUI = new FormUIBuilder()
        .title("Schedule Coffee Chat")
        .addFields([
          {
            name: "meetingLink",
            label: "Google Meet Link or Zoom Link",
            type: "string",
            widget: "url",
            required: true,
          },
          {
            name: "schedulingLink",
            label: "Calendly Link or Scheduling Link",
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
          {
            name: "personalMessage",
            label: "Personal Message (Optional)",
            type: "string",
            widget: "textarea",
            required: false,
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

    // Fetch LinkedIn profiles
    const profiles = await fetchLinkedInProfiles(preferredChatPartner);
    
    if (profiles.length === 0) {
      return new DainResponse({
        text: "No profiles found matching your criteria",
        data: {
          message: "No profiles found matching your criteria",
          invitedProfiles: []
        },
        ui: new CardUIBuilder()
          .title("No Profiles Found")
          .content(`No LinkedIn profiles were found matching your criteria: "${preferredChatPartner}"`)
          .build(),
      });
    }

    // Send Gmail invitations using the proper function from gmail-service.ts
    const emailResult = await sendGmailInvitations(agentInfo.id, meetingLink, resumeUrl, profiles);

    // Create a table to display invited profiles
    const profilesTable = new TableUIBuilder()
      .addColumns([
        { key: "name", header: "Name", type: "string" },
        { key: "title", header: "Title", type: "string" },
        { key: "email", header: "Email", type: "string" },
      ])
      .rows(profiles)
      .build();

    // Create response message based on email sending result
    let resultMessage = "";
    if (emailResult.success) {
      resultMessage = `
        Your coffee chat invitations have been sent successfully!
        Sent: ${emailResult.sentCount}, Failed: ${emailResult.failedCount}
      `;
    } else if (emailResult.sentCount > 0) {
      resultMessage = `
        Your coffee chat invitations have been partially sent.
        Sent: ${emailResult.sentCount}, Failed: ${emailResult.failedCount}
      `;
    } else {
      resultMessage = `
        Unable to send your coffee chat invitations.
        Please check your Gmail connection or try again later.
      `;
    }

    const confirmationCard = new CardUIBuilder()
      .title("Coffee Chat Scheduled")
      .content(`
        ${resultMessage}
        
        Meeting Link: ${meetingLink}
        Scheduling Link: ${schedulingLink}
        Resume: ${resumeUrl}
        Preferred Chat Partner: ${preferredChatPartner}
        ${personalMessage ? `Personal Message: ${personalMessage}` : ''}
      `)
      .addChild(profilesTable)
      .build();

    return new DainResponse({
      text: "Coffee chat scheduled successfully and invitations sent",
      data: {
        message: "Coffee chat scheduled successfully and invitations sent",
        invitedProfiles: profiles,
      },
      ui: confirmationCard,
    });
  },
};

export const linkedInSearchConfig: ToolConfig = {
  id: "linkedin-search",
  name: "LinkedIn Search",
  description: "Search for people based on field, role, or keywords",
  input: z.object({
    query: z.string(),
    limit: z.number().optional().default(10),
  }),
  output: z.object({
    message: z.string(),
    invitedProfiles: z.array(z.object({
      name: z.string(),
      title: z.string(),
      email: z.string().optional(),
      profileUrl: z.string().optional(),
      profilePicture: z.string().optional(),
    })),
  }),
  handler: async ({ query, limit }, agentInfo) => {
    if (!query) {
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

    // Search LinkedIn profiles
    const profiles = await searchLinkedInUsers(query, limit);

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
        profiles,
      },
      ui: resultsCard,
    });
  },
};