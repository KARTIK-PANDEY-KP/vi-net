import { defineDAINService } from "@dainprotocol/service-sdk";
import { scheduleCoffeeChatConfig, linkedInSearchConfig } from "./tools";

const dainService = defineDAINService({
  metadata: {
    title: "LinkedIn Tools",
    description: "A service to search LinkedIn profiles and schedule coffee chats",
    version: "1.0.0",
    author: "Your Name",
    tags: ["LinkedIn", "Schedule", "Coffee Chat", "Sales", "Email", "dain"],
    logo: "https://cdn-icons-png.flaticon.com/512/174/174857.png",
  },
  exampleQueries: [
    {
      category: "Schedule",
      queries: [
        "Schedule a coffee chat with a software engineer",
        "Schedule a coffee chat with a product manager",
        "Schedule a coffee chat with a data scientist",
      ],
    },
    {
      category: "Search",
      queries: [
        "Find people who are in the software engineering field",
        "Find product managers in San Francisco",
        "Find data scientists at Google",
      ],
    }
  ],
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [scheduleCoffeeChatConfig, linkedInSearchConfig],
});

dainService.startNode().then(({ address }) => {
  console.log("DAIN Service is running at :" + address().port);
});
