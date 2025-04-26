import { z } from "zod";
import {
  defineDAINService,
  ToolConfig,
} from "@dainprotocol/service-sdk";
import { FormUIBuilder, CardUIBuilder, TableUIBuilder, DainResponse } from "@dainprotocol/utils";

// Simulated function to fetch LinkedIn profiles
async function fetchLinkedInProfiles(preferredChatPartner: string): Promise<any[]> {
  // In a real scenario, this would make an API call to LinkedIn
  // For the hackathon, we'll return mock data
  return [
    { name: "John Doe", title: "Software Engineer at Tech Co", email: "john@example.com" },
    { name: "Jane Smith", title: "Product Manager at Startup Inc", email: "jane@example.com" },
    { name: "Bob Johnson", title: "Data Scientist at AI Corp", email: "bob@example.com" },
  ];
}

// Simulated function to send emails via Gmail
async function sendGmailInvitations(meetLink: string, resumeUrl: string, recipients: any[]): Promise<void> {
  // In a real scenario, this would use the Gmail API to send emails
  console.log(`Sending invitations to ${recipients.length} recipients`);
  console.log(`Meet Link: ${meetLink}`);
  console.log(`Resume URL: ${resumeUrl}`);
}

const scheduleCoffeeChatConfig: ToolConfig = {
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

const dainService = defineDAINService({
  metadata: {
    title: "Coffee Chat Scheduler",
    description: "A service to schedule coffee chats and send invitations",
    version: "1.0.0",
    author: "Your Name",
    tags: ["Schedule", "Coffee Chat", "Sales", "Email", "dain"],
    logo: "https://cdn-icons-png.flaticon.com/512/252/252035.png",
  },
    exampleQueries: [
    {
      category: "Schedule",
      queries: [
        "Schedule a coffee chat with a software engineer",
        "Schedule a coffee chat with a product manager",
        "Schedule a coffee chat with a data scientist",
      ],
    }
  ],
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [scheduleCoffeeChatConfig],
});

dainService.startNode().then(({ address }) => {
  console.log("DAIN Service is running at :" + address().port);
});

