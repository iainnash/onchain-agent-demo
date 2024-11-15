import { DynamicStructuredTool } from "@langchain/core/tools";
import z from "zod";

export const resetTool = new DynamicStructuredTool({
  name: "reset",
  description: "Reset conversation",
  schema: z.object({}),
  func: async ({}: {}) => {
    return `reset conversation`;
  },
});
