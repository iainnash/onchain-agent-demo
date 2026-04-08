import { DynamicStructuredTool } from "@langchain/core/tools";
import z from "zod";

export const createWowTokenImagine = new DynamicStructuredTool({
  name: "wow_token_imagine",
  description: "Create WOW token with imagined image",
  schema: z.object({
    name: z.string(),
    symbol: z.string(),
    image_prompt: z.string(),
  }),
  func: async (tokenInfo: {
    name: string;
    symbol: string;
    image_prompt: string;
  }) => {
    return `Create token ${tokenInfo.name} ${tokenInfo.symbol} ${tokenInfo.image_prompt}`;
  },
});
