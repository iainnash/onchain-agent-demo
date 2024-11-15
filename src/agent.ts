import { ChatOpenAI } from "@langchain/openai";
import { Annotation, END } from "@langchain/langgraph";

import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { mintTool } from "./tools/mint";
import { resetTool } from "./tools/reset";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { readFileSync } from "fs";

export interface ConversationState {
  history: BaseMessage[];
  current_message: string;
  tool_result?: string;
  conversation_id: string;
}

const PROMPT_MESSAGE = readFileSync("./prompt.txt");

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
});

const shouldContinue = (state: typeof AgentState.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  // If there is no function call, then we finish
  if (!lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
    return END;
  }
  // Otherwise if there is, we continue
  return "tools";
};

export const createChatbot = () => {
  const tools = [mintTool, resetTool];
  const toolNode = new ToolNode<typeof AgentState.State>(tools);

  // Initialize OpenAI LLM configuration
  const model = new ChatOpenAI({
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY!,
  });

  const boundModel = model.bindTools(tools);

  const messageHistory = new InMemoryChatMessageHistory();

  return {
    call: async (text: string) => {
      messageHistory.addMessage(new HumanMessage(text));
      const incomingMessages = [
        new SystemMessage(PROMPT_MESSAGE.toString("utf-8")),
        ...(await messageHistory.getMessages()),
      ];
      console.log({ incomingMessages });
      let response = await boundModel.invoke(incomingMessages);

      await messageHistory.addMessage(response);

      if (response.tool_calls) {
        for (const toolCall of response.tool_calls!) {
          const selectedTool = tools.find(
            (tool) => tool.name === toolCall.name
          )!;
          // Clear messages
          if (selectedTool.name === "reset") {
            await messageHistory.clear();
          }

          // Call function for tool
          const toolMessage = await selectedTool.invoke(toolCall);
          // Add message in the tool history for ai response
          messageHistory.addMessage(toolMessage);
        }

        const lastMessages = await messageHistory.getMessages();
        console.log(lastMessages);
        const toolResponse = await model.invoke(lastMessages);
        messageHistory.addMessage(
          new AIMessage(toolResponse.content.toString())
        );
        response = toolResponse;
      } else {
        messageHistory.addMessage(new AIMessage(response.content.toString()));
      }

      return response.content.toString();
    },
  };
};
