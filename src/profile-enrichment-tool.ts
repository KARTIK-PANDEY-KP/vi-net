import { z } from "zod";
import { ToolConfig } from "@dainprotocol/service-sdk";
import { FormUIBuilder, CardUIBuilder, TableUIBuilder, DainResponse } from "@dainprotocol/utils";
import { searchLinkedInUsers, LinkedInProfile } from "./linkedin-service";
import { getDetailedProfilesInfo, extractTalkingPoints } from "./linkedin-profile-service";
import { enforceOnboarding } from "./utils";

// Define output schema
const profileEnrichmentOutputSchema = z.object({
  profiles: z.array(z.object({
    name: z.string(),
    title: z.string(),
    email: z.string(),
    profileUrl: z.string().optional(),
    profilePicture: z.string().optional(),
    talkingPoints: z.array(z.string()).optional(),
    industry: z.string().optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    skills: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
  })),
});

// LinkedIn Profile Enrichment Tool
export const profileEnrichmentConfig: ToolConfig = {
  id: "profile-enrichment",
  name: "Research LinkedIn Profile",
  description: "This tool takes in a LinkedIn URL and returns detailed information about their profile. ONLY use this tool when the user needs detailed information about specific LinkedIn profiles to personalize outreach. This tool gets additional data beyond basic profile details, such as talking points, skills, interests, and education.",
  input: z.object({
    query: z.string().describe("Search query to find specific profiles that need enrichment"),
    limit: z.number().optional().default(3).describe("Maximum number of profiles to enrich (default: 3)"),
    enrichmentPurpose: z.enum(["personalization", "research", "outreach"]).default("personalization")
      .describe("Purpose of enrichment - helps determine what details to focus on")
  }),
  output: profileEnrichmentOutputSchema,
  handler: enforceOnboarding(async ({ query, limit }, agentInfo) => {
    if (!query) {
      const formUI = new FormUIBuilder()
        .title("LinkedIn Profile Enrichment")
        .addFields([
          {
            name: "query",
            label: "Search Query (job title, company, keywords)",
            type: "string",
            widget: "text",
            required: true,
          },
          {
            name: "limit",
            label: "Max Results",
            type: "number",
            widget: "text",
            default: 3,
            required: false,
          },
        ])
        .onSubmit({
          tool: "profile-enrichment",
          params: {},
        })
        .build();

      return new DainResponse({
        text: "Please provide search criteria to find LinkedIn profiles to enrich",
        data: null,
        ui: formUI,
      });
    }

    try {
      const profiles = await searchLinkedInUsers(query, limit);
      const enrichedProfiles = await getDetailedProfilesInfo(profiles);
      
      // Create a table to display results
      const profilesTable = new TableUIBuilder()
        .addColumns([
          { key: "name", header: "Name", type: "string" },
          { key: "title", header: "Title", type: "string" },
          { key: "email", header: "Email", type: "string" },
          { key: "company", header: "Company", type: "string" },
          { key: "location", header: "Location", type: "string" }
        ])
        .rows(profiles)
        .build();
        
      // Create detailed cards for each profile
      const profileCards = profiles.map(profile => {
        const details = enrichedProfiles[profile.email];
        const talkingPoints = details ? extractTalkingPoints(details) : [];
        
        return new CardUIBuilder()
          .title(profile.name)
          .content(`
            <h3>${profile.title}</h3>
            <p><strong>Company:</strong> ${details?.company || 'N/A'}</p>
            <p><strong>Location:</strong> ${details?.location || 'N/A'}</p>
            <p><strong>Industry:</strong> ${details?.industry || 'N/A'}</p>
            <h4>Skills:</h4>
            <ul>
              ${(details?.skills || []).map(skill => `<li>${skill}</li>`).join('')}
            </ul>
            <h4>Interests:</h4>
            <ul>
              ${(details?.interests || []).map(interest => `<li>${interest}</li>`).join('')}
            </ul>
            <h4>Talking Points:</h4>
            <ul>
              ${talkingPoints.map(point => `<li>${point}</li>`).join('')}
            </ul>
          `)
          .build();
      });

      const resultsCard = new CardUIBuilder()
        .title(`Enriched LinkedIn Profiles: ${query}`)
        .content(`Found and enriched ${profiles.length} profiles matching your search for "${query}"`)
        .addChild(profilesTable)
        .addChild(new CardUIBuilder().addChild(profileCards[0]).build())
        .build();

      return new DainResponse({
        text: `Found and enriched ${profiles.length} LinkedIn profiles matching "${query}"`,
        data: {
          profiles: profiles,
        },
        ui: resultsCard,
      });
    } catch (error) {
      console.error(`[PROFILE ENRICHMENT] Error enriching profiles: ${error.message}`);
      
      const errorCard = new CardUIBuilder()
        .title("Profile Enrichment Error")
        .content(`
          An error occurred while enriching LinkedIn profiles:
          
          ${error.message}
          
          Please check your API configuration or try a different search query.
        `)
        .build();
      
      return new DainResponse({
        text: `Error enriching LinkedIn profiles: ${error.message}`,
        data: {
          profiles: [],
        },
        ui: errorCard,
      });
    }
  }, profileEnrichmentOutputSchema)
};