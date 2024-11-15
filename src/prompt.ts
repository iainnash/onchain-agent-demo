import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

// Create a prompt template for the conversation
export const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful AI assistant."],
  new MessagesPlaceholder("messages"),
  ["human", "{input}"],
]);

