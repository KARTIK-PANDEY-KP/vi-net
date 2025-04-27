import { z } from "zod";
import { ToolConfig } from "@dainprotocol/service-sdk";
import { FormUIBuilder, CardUIBuilder, TableUIBuilder, DainResponse } from "@dainprotocol/utils";
import { getDetailedProfileInfo } from "./linkedin-profile-service";
import { getStoredProfileInfo } from "./signalhire-webhook";

// LinkedIn Profile Data Tool Configuration
export const linkedInProfileDataConfig: ToolConfig = {
  id: "linkedin-profile-data",
  name: "LinkedIn Profile Data",
  description: "Get detailed profile data for a specific LinkedIn URL",
  input: z.object({
    linkedinUrl: z.string().url(),
  }),
  output: z.object({
    profileData: z.object({
      name: z.string().optional(),
      title: z.string().optional(),
      company: z.string().optional(),
      industry: z.string().optional(),
      location: z.string().optional(),
      skills: z.array(z.string()).optional(),
      education: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional(),
      certifications: z.array(z.string()).optional(),
      profileSummary: z.string().optional(),
    }).optional(),
    success: z.boolean(),
    message: z.string(),
  }),
  handler: async ({ linkedinUrl }, agentInfo) => {
    // If no LinkedIn URL provided, show the form
    if (!linkedinUrl) {
      const formUI = new FormUIBuilder()
        .title("Get LinkedIn Profile Data")
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
          tool: "linkedin-profile-data",
          params: {},
        })
        .build();

      return new DainResponse({
        text: "Please provide a LinkedIn profile URL to get detailed profile data",
        data: null,
        ui: formUI,
      });
    }

    try {
      console.log(`[PROFILE DATA TOOL] Getting profile data for: ${linkedinUrl}`);
      
      // First, check if we already have this profile information cached
      let profileInfo = getStoredProfileInfo(linkedinUrl);
      
      // If not in cache, request it from SignalHire
      if (!profileInfo) {
        console.log(`[PROFILE DATA TOOL] Profile not in cache, requesting from SignalHire`);
        profileInfo = await getDetailedProfileInfo(linkedinUrl);
      }
      
      if (!profileInfo) {
        return new DainResponse({
          text: `Could not retrieve profile data for ${linkedinUrl}`,
          data: {
            success: false,
            message: `Could not retrieve profile data for ${linkedinUrl}. The profile may not exist or there might be an issue with the API.`,
            profileData: undefined
          },
          ui: new CardUIBuilder()
            .title("Profile Data Not Found")
            .content(`
              Could not retrieve profile data for ${linkedinUrl}.
              
              Possible reasons:
              - The LinkedIn URL might be incorrect
              - The profile may not exist
              - There might be an issue with the SignalHire API
              
              Please check the URL and try again.
            `)
            .build(),
        });
      }
      
      // Create a structured view of the profile data
      const profileDetails = [
        { key: "industry", label: "Industry", value: profileInfo.industry || "Not available" },
        { key: "company", label: "Company", value: profileInfo.company || "Not available" },
        { key: "location", label: "Location", value: profileInfo.location || "Not available" },
        { key: "skills", label: "Skills", value: profileInfo.skills?.join(", ") || "Not available" },
        { key: "education", label: "Education", value: profileInfo.education?.join(", ") || "Not available" },
        { key: "languages", label: "Languages", value: profileInfo.languages?.join(", ") || "Not available" },
        { key: "certifications", label: "Certifications", value: profileInfo.certifications?.join(", ") || "Not available" },
      ];
      
      // Create a table to display profile details
      const detailsTable = new TableUIBuilder()
        .addColumns([
          { key: "label", header: "Attribute", type: "string" },
          { key: "value", header: "Value", type: "string" },
        ])
        .rows(profileDetails)
        .build();
      
      // Format the profile data for the response
      const profileData = {
        name: "LinkedIn User", // SignalHire provides this but we're not including it in our interface
        title: "Professional", // SignalHire provides this but we're not including it in our interface
        company: profileInfo.company,
        industry: profileInfo.industry,
        location: profileInfo.location,
        skills: profileInfo.skills,
        education: profileInfo.education,
        languages: profileInfo.languages,
        certifications: profileInfo.certifications,
        profileSummary: profileInfo.profileSummary,
      };
      
      // Create the response card
      const profileCard = new CardUIBuilder()
        .title("LinkedIn Profile Data")
        .content(`
          Profile data for: ${linkedinUrl}
          
          ${profileInfo.profileSummary ? `**Summary**: ${profileInfo.profileSummary}` : ''}
        `)
        .addChild(detailsTable)
        .build();
      
      return new DainResponse({
        text: `Retrieved profile data for ${linkedinUrl}`,
        data: {
          success: true,
          message: `Successfully retrieved profile data for ${linkedinUrl}`,
          profileData: profileData
        },
        ui: profileCard,
      });
    } catch (error) {
      console.error(`[PROFILE DATA TOOL] Error retrieving profile data:`, error);
      
      const errorCard = new CardUIBuilder()
        .title("Error Retrieving Profile Data")
        .content(`
          An error occurred while retrieving the profile data:
          
          ${error.message}
          
          Please check the LinkedIn URL and try again.
        `)
        .build();
      
      return new DainResponse({
        text: `Error retrieving profile data: ${error.message}`,
        data: {
          success: false,
          message: `Error retrieving profile data: ${error.message}`,
          profileData: undefined
        },
        ui: errorCard,
      });
    }
  },
};