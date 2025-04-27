import { z } from "zod";
import { ToolConfig } from "@dainprotocol/service-sdk";
import { FormUIBuilder, CardUIBuilder, TableUIBuilder, DainResponse } from "@dainprotocol/utils";
import { searchLinkedInUsers, LinkedInProfile } from "./linkedin-service";
import { getDetailedProfilesInfo } from "./linkedin-profile-service";
import { sendGmailInvitations } from "./gmail-service";

// Advanced Personalized Outreach Tool
export const personalizedOutreachConfig: ToolConfig = {
  id: "personalized-outreach",
  name: "Personalized LinkedIn Outreach",
  description: "Search for contacts, enrich their profiles, and send personalized emails in a single workflow",
  input: z.object({
    fullName: z.string(),
    meetingLink: z.string().url(),
    calendarLink: z.string().url(),
    resumeUrl: z.string().url(),
    searchQuery: z.string(),
    maxContacts: z.number().optional().default(3),
  }),
  output: z.object({
    message: z.string(),
    sentCount: z.number(),
    failedCount: z.number(),
    profiles: z.array(z.object({
      name: z.string(),
      title: z.string(),
      email: z.string(),
      talkingPoints: z.array(z.string()).optional(),
    })),
  }),
  handler: async ({ fullName, meetingLink, calendarLink, resumeUrl, searchQuery, maxContacts }, agentInfo) => {
    if (!fullName || !meetingLink || !calendarLink || !resumeUrl || !searchQuery) {
      const formUI = new FormUIBuilder()
        .title("Personalized LinkedIn Outreach")
        .addFields([
          {
            name: "fullName",
            label: "Your Full Name",
            type: "string",
            widget: "text",
            required: true,
          },
          {
            name: "meetingLink",
            label: "Meeting Link (Zoom/Meet)",
            type: "string",
            widget: "url",
            required: true,
          },
          {
            name: "calendarLink",
            label: "Calendar Link (Calendly/Notion)",
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
            name: "searchQuery",
            label: "LinkedIn Search Query",
            type: "string",
            widget: "text",
            required: true,
          },
          {
            name: "maxContacts",
            label: "Maximum Number of Contacts",
            type: "number",
            widget: "text",
            default: 3,
            required: false,
          },
        ])
        .onSubmit({
          tool: "personalized-outreach",
          params: {},
        })
        .build();

      return new DainResponse({
        text: "Please fill out the form to start personalized outreach",
        data: null,
        ui: formUI,
      });
    }

    try {
      // Step 1: Search for LinkedIn profiles
      console.log(`[OUTREACH] Starting search for query: "${searchQuery}" with limit: ${maxContacts}`);
      const profiles = await searchLinkedInUsers(searchQuery, maxContacts);
      
      if (profiles.length === 0) {
        return new DainResponse({
          text: "No profiles found matching your search criteria",
          data: {
            message: "No profiles found",
            sentCount: 0,
            failedCount: 0,
            profiles: []
          },
          ui: new CardUIBuilder()
            .title("No Profiles Found")
            .content(`No LinkedIn profiles were found matching your search for "${searchQuery}"`)
            .build(),
        });
      }
      
      // Step 2: Get detailed profile information
      console.log(`[OUTREACH] Enriching ${profiles.length} profiles with detailed information`);
      const profileDetails = await getDetailedProfilesInfo(profiles);
      
      // Step 3: Send personalized emails
      console.log(`[OUTREACH] Sending personalized emails to ${profiles.length} contacts`);
      const emailResult = await sendGmailInvitations(agentInfo.id, meetingLink, resumeUrl, profiles);
      
      // Step 4: Prepare result report
      const enrichedProfiles = profiles.map(profile => {
        const details = profileDetails[profile.email];
        const talkingPoints = details ? [
          details.industry ? `Industry: ${details.industry}` : null,
          details.company ? `Company: ${details.company}` : null,
          details.skills?.length > 0 ? `Skills: ${details.skills.slice(0, 3).join(', ')}` : null,
          details.interests?.length > 0 ? `Interests: ${details.interests.slice(0, 3).join(', ')}` : null
        ].filter(Boolean) : [`Role: ${profile.title}`];
        
        return {
          ...profile,
          talkingPoints
        };
      });
      
      // Create a table to display results
      const resultsTable = new TableUIBuilder()
        .addColumns([
          { key: "name", header: "Name", type: "string" },
          { key: "title", header: "Title", type: "string" },
          { key: "email", header: "Email", type: "string" },
          { key: "talkingPoints", header: "Personalization Used", type: "list" }
        ])
        .rows(enrichedProfiles)
        .build();
      
      // Create response message based on email sending result
      let resultMessage = "";
      if (emailResult.success) {
        resultMessage = `
          Your personalized outreach was successful!
          Sent: ${emailResult.sentCount}, Failed: ${emailResult.failedCount}
        `;
      } else if (emailResult.sentCount > 0) {
        resultMessage = `
          Your outreach was partially successful.
          Sent: ${emailResult.sentCount}, Failed: ${emailResult.failedCount}
        `;
      } else {
        resultMessage = `
          Your outreach was not successful. We were unable to send the emails.
          Please check your Gmail connection or try again later.
        `;
      }
      
      const confirmationCard = new CardUIBuilder()
        .title("Personalized Outreach Complete")
        .content(`
          ${resultMessage}
          
          Search Query: ${searchQuery}
          Your Name: ${fullName}
          Meeting Link: ${meetingLink}
          Calendar: ${calendarLink}
          Resume: ${resumeUrl}
        `)
        .addChild(resultsTable)
        .build();
      
      return new DainResponse({
        text: `Personalized outreach complete. Sent: ${emailResult.sentCount}, Failed: ${emailResult.failedCount}`,
        data: {
          message: `Personalized outreach complete. Sent: ${emailResult.sentCount}, Failed: ${emailResult.failedCount}`,
          sentCount: emailResult.sentCount,
          failedCount: emailResult.failedCount,
          profiles: enrichedProfiles
        },
        ui: confirmationCard,
      });
    } catch (error) {
      console.error(`[OUTREACH] Error in personalized outreach:`, error);
      
      const errorCard = new CardUIBuilder()
        .title("Outreach Error")
        .content(`
          An error occurred during the personalized outreach process:
          
          ${error.message}
          
          Please check your configuration or try again later.
        `)
        .build();
      
      return new DainResponse({
        text: `Error during personalized outreach: ${error.message}`,
        data: {
          message: `Error: ${error.message}`,
          sentCount: 0,
          failedCount: 0,
          profiles: []
        },
        ui: errorCard
      });
    }
  }
};