import { DynamicStructuredTool } from "@langchain/core/tools";
import z from "zod";

export const mintTool = new DynamicStructuredTool({
  name: "mint",
  description: "Mint this NFT from a url",
  schema: z.object({
    url: z.string().describe("The URL to mint with"),
  }),
  func: async ({ url }: { url: string }) => {
    return `Minted ${url}`;
  },
});
