import { z } from "zod";
import { ToolConfig } from "@dainprotocol/service-sdk";
import { FormUIBuilder, CardUIBuilder, TableUIBuilder, DainResponse } from "@dainprotocol/utils";
import { fetchLinkedInProfiles, sendGmailInvitations, searchLinkedInUsers } from "./functions";

export const scheduleCoffeeChatConfig: ToolConfig = {
  id: "schedule-coffee-chat",
  name: "Schedule Coffee Chat",
  description: "Schedule a coffee chat by providing necessary details and send invitations",
  input: z.object({
    googleMeetLink: z.string().url(),
    resumeUrl: z.string().url(),
    preferredChatPartner: z.string(),
  }),
  output: z.object({
    message: z.string(),
    invitedProfiles: z.array(z.object({
      name: z.string(),
      title: z.string(),
      email: z.string(),
    })),
  }),
  handler: async ({ googleMeetLink, resumeUrl, preferredChatPartner }, agentInfo) => {
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

    // Fetch LinkedIn profiles
    const profiles = await fetchLinkedInProfiles(preferredChatPartner);

    // Send Gmail invitations
    await sendGmailInvitations(googleMeetLink, resumeUrl, profiles);

    // Create a table to display invited profiles
    const profilesTable = new TableUIBuilder()
      .addColumns([
        { key: "name", header: "Name", type: "string" },
        { key: "title", header: "Title", type: "string" },
        { key: "email", header: "Email", type: "string" },
      ])
      .rows(profiles)
      .build();

    const confirmationCard = new CardUIBuilder()
      .title("Coffee Chat Scheduled")
      .content(`
        Your coffee chat has been scheduled and invitations sent!
        
        Google Meet Link: ${googleMeetLink}
        Resume: ${resumeUrl}
        Preferred Chat Partner: ${preferredChatPartner}
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
    profiles: z.array(z.object({
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
        profiles: profiles,
      },
      ui: resultsCard,
    });
  },
}; 