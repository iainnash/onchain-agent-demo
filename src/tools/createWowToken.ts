import { DynamicStructuredTool } from "@langchain/core/tools";
import z from "zod";

export const createWowToken = new DynamicStructuredTool({
  name: "wow_advanced",
  description: "Create WOW token advanced",
  schema: z.object({
    name: z.string(),
    symbol: z.string(),
    image_url: z.string(),
  }),
  func: async (tokenInfo: {
    name: string;
    symbol: string;
    image_url: string;
  }) => {
    return `Create token ${tokenInfo.name} ${tokenInfo.symbol} ${tokenInfo.image_url}`;
  },
});
