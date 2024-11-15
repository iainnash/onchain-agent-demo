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

  const boundModel = model.bind({promptIndex: 0, tools: tools});

  const messageHistory = new InMemoryChatMessageHistory();

  async function getMessagesAndPrompt() {
      const incomingMessages = [
        new SystemMessage(PROMPT_MESSAGE.toString("utf-8")),
        ...(await messageHistory.getMessages()),
      ];
      console.log({incomingMessages});
      return incomingMessages;
  }

  return {
    call: async (text: string) => {
      messageHistory.addMessage(new HumanMessage(text));
      let response = await boundModel.invoke(await getMessagesAndPrompt());


      if (response.tool_calls && response.tool_calls.length > 0) {
        await messageHistory.addMessage(response);
        for (const toolCall of response.tool_calls!) {
          const selectedTool = tools.find(
            (tool) => tool.name === toolCall.name
          )!;

          // reset clear messages
          if (selectedTool.name === "reset") {
            await messageHistory.clear();
          }

          const toolMessage = await selectedTool.invoke(toolCall);
          messageHistory.addMessage(toolMessage);
        }

        const toolResponse = await model.invoke(await getMessagesAndPrompt());
        messageHistory.addMessage(
          new AIMessage(toolResponse.content.toString())
        );
        response = toolResponse;
      } else {
        messageHistory.addMessage(new AIMessage(response.content.toString()));
      }

      console.log('response: ', response.content)
      return response.content.toString();
    },
  };
};
