import type { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { RedisChatMessageHistory } from "@langchain/redis";
import { pull } from "langchain/hub";
import { ChatAnthropic } from "@langchain/anthropic";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";

import { createWowToken } from "./tools/createWowToken";
import { createWowTokenImagine } from "./tools/createWowTokenImagine";
import { createRetriever } from "./tools/retriever";

export const createChatbot = async () => {
  const tools = [
    await createRetriever(),
    createWowToken,
    createWowTokenImagine,
  ];

  const llm = new ChatAnthropic({
    modelName: "claude-3-opus-20240229",
    temperature: 0.5,
  });

  const prompt = await pull<ChatPromptTemplate>("wow-prompt-prototype");

  const agent = await createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
  });

  const messageHistory = new RedisChatMessageHistory({
    sessionId: new Date().toISOString(),
    sessionTTL: 300,

    config: { url: "redis://localhost:6379/" },
  });

  await messageHistory.ensureReadiness();

  const agentWithChatHistory = new RunnableWithMessageHistory({
    runnable: agentExecutor,
    // This is needed because in most real world scenarios, a session id is needed per user.
    // It isn't really used here because we are using a simple in memory ChatMessageHistory.
    getMessageHistory: (_sessionId) => messageHistory,
    inputMessagesKey: "input",
    historyMessagesKey: "chat_history",
  });

  return {
    call: async (input: string, sessionId: string) => {
      let response = await agentWithChatHistory.invoke(
        {
          input,
        },
        {
          configurable: {
            sessionId: sessionId,
          },
        }
      );
      return response.output;
    },
  };
};
