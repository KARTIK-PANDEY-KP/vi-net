import { z } from "zod";
import { ToolConfig } from "@dainprotocol/service-sdk";
import { FormUIBuilder, CardUIBuilder, TableUIBuilder, DainResponse } from "@dainprotocol/utils";
import { searchLinkedInUsers, LinkedInProfile } from "./linkedin-service";
import { getDetailedProfilesInfo, extractTalkingPoints } from "./linkedin-profile-service";

// LinkedIn Profile Enrichment Tool
export const profileEnrichmentConfig: ToolConfig = {
  id: "profile-enrichment",
  name: "LinkedIn Profile Enrichment",
  description: "Get detailed LinkedIn profile information to personalize your outreach",
  input: z.object({
    query: z.string(),
    limit: z.number().optional().default(3),
  }),
  output: z.object({
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
  }),
  handler: async ({ query, limit }, agentInfo) => {
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
      console.log(`[PROFILE ENRICHMENT] Starting search for query: "${query}" with limit: ${limit}`);
      
      // Step 1: Search for LinkedIn profiles
      const profiles = await searchLinkedInUsers(query, limit);
      
      if (profiles.length === 0) {
        return new DainResponse({
          text: "No profiles found matching your search criteria",
          data: { profiles: [] },
          ui: new CardUIBuilder()
            .title("No Results")
            .content(`No LinkedIn profiles were found matching your search for "${query}"`)
            .build(),
        });
      }
      
      // Step 2: Get detailed profile information
      const profileDetails = await getDetailedProfilesInfo(profiles);
      
      // Step 3: Enrich profiles with detailed information
      const enrichedProfiles = profiles.map(profile => {
        const details = profileDetails[profile.email];
        
        // Create enriched profile
        const enriched = {
          ...profile,
          industry: details?.industry,
          company: details?.company,
          location: details?.location,
          skills: details?.skills,
          interests: details?.interests,
          talkingPoints: [] as string[], // Initialize talkingPoints
        };
        
        // Extract talking points if details available
        if (details) {
          enriched.talkingPoints = extractTalkingPoints(details);
        } else {
          enriched.talkingPoints = [
            `Experience as ${profile.title}`,
            `Professional background`
          ];
        }
        
        return enriched;
      });
      
      // Create table to display enriched profiles
      const talkingPointsColumns = [
        { key: "profilePicture", header: "Picture", type: "image" },
        { key: "name", header: "Name", type: "string" },
        { key: "title", header: "Title", type: "string" },
        { key: "company", header: "Company", type: "string" },
        { key: "talkingPoints", header: "Talking Points", type: "list" }
      ];
      
      const profilesTable = new TableUIBuilder()
        .addColumns(talkingPointsColumns)
        .rows(enrichedProfiles)
        .build();
        
      // Create response
      const resultsCard = new CardUIBuilder()
        .title(`Enriched LinkedIn Profiles: ${query}`)
        .content(`
          Found ${enrichedProfiles.length} profiles matching your search for "${query}".
          Each profile includes personalized talking points that can be used in your outreach messages.
        `)
        .addChild(profilesTable)
        .build();
        
      return new DainResponse({
        text: `Found and enriched ${enrichedProfiles.length} LinkedIn profiles for "${query}"`,
        data: { profiles: enrichedProfiles },
        ui: resultsCard
      });
    } catch (error) {
      console.error(`[PROFILE ENRICHMENT] Error in profile enrichment:`, error);
      
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
        data: { profiles: [] },
        ui: errorCard
      });
    }
  }
};