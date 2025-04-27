import { ToolConfig } from "@dainprotocol/service-sdk";
import { CardUIBuilder, ChartUIBuilder, TableUIBuilder, DainResponse } from '@dainprotocol/utils';
import { z } from "zod";
import { getContactsForVisualization } from './firestore';
import { enforceOnboarding } from './utils';

export const getContactVisualizationTool: ToolConfig = {
  id: "get-contact-visualization",
  name: "Get Contact Visualization",
  description: "Provides a visualization of contacts ranked by their scores",
  input: z.object({}),
  output: z.object({
    contacts: z.array(z.object({
      contactId: z.string(),
      name: z.string(),
      email: z.string().nullable(),
      responseScore: z.number(),
      similarityScore: z.number(),
      additionalData: z.record(z.any())
    }))
  }),
  handler: enforceOnboarding(async (_, agentInfo) => {
    // Get contacts data
    const contactsData = await getContactsForVisualization(agentInfo.id);
    
    // Sort contacts by average score
    const sortedContacts = [...contactsData.contacts].sort((a, b) => {
      const avgA = (a.similarityScore + a.responseScore) / 2;
      const avgB = (b.similarityScore + b.responseScore) / 2;
      return avgB - avgA; // Sort in descending order
    });
    
    // Create visualization UI
    const visualizationUI = new CardUIBuilder()
      .setRenderMode('page')
      .title('Contact Network Visualization')
      .addChild(
        new ChartUIBuilder()
          .setRenderMode('page')
          .type('bar')
          .title('Contact Rankings')
          .chartData(sortedContacts.map(contact => ({
            name: contact.name,
            value: contact.similarityScore,
            color: `rgb(${Math.floor((100 - contact.responseScore) * 2.55)}, ${Math.floor(contact.responseScore * 2.55)}, 0)`,
            additionalData: contact.additionalData
          })))
          .build()
      )
      .addChild(
        new TableUIBuilder()
          .setRenderMode('page')
          .addColumns([
            { key: "name",            header: "Name",             type: "string" },
            { key: "email",           header: "Email",            type: "string" },
            { key: "responseScore",   header: "Response Score",   type: "number" },
            { key: "similarityScore", header: "Similarity Score", type: "number" }
          ])
          .rows(sortedContacts.map(contact => ({
            name: contact.name,
            email: contact.email || 'N/A',
            responseScore: contact.responseScore.toFixed(2),
            similarityScore: contact.similarityScore.toFixed(2)
          })))
          .build()
      )
      .build();

    return new DainResponse({
      text: `Generated contact visualization for user ${agentInfo.id}. Click the link to view the ranked contacts.`,
      data: { contacts: sortedContacts },
      ui: visualizationUI
    });
  }, z.object({
    contacts: z.array(z.object({
      contactId: z.string(),
      name: z.string(),
      email: z.string().nullable(),
      responseScore: z.number(),
      similarityScore: z.number(),
      additionalData: z.record(z.any())
    }))
  }))
};
