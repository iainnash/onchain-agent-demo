import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { createChatbot } from "./agent";
import { HumanMessage } from "@langchain/core/messages";

dotenv.config();

const chatbot = createChatbot();

const bot = new Telegraf(process.env.BOT_TOKEN!);

// Bot command to handle conversation start
bot.start((ctx) =>
  ctx.reply("Welcome! Start your message with `!` to get a response.")
);

// Every 2 minutes
// setInterval(() => {}, 1000 * 60 * 2);

bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;

  // Check if the message starts with "!"
  if (!userMessage.startsWith("!")) {
    return;
  }

  // Extract the message text after "!"
  const cleanMessage = userMessage.slice(1).trim();

  // Use chatId as the unique key for Redis
  const chatId = ctx.chat.id.toString();

  try {
    console.log("has chat", userMessage);
    // Call chatbot agent
    const response = await chatbot.call(cleanMessage);
    console.log({ response });

    // Send response back to the user
    await ctx.reply(response);
  } catch (error) {
    console.error("Error handling message:", error);
    await ctx.reply("Oops! Something went wrong. Please try again.");
  }
});

bot.launch();

// Gracefully stop the bot on termination signals
process.once("SIGINT", () => {
  bot.stop("SIGINT");
  //   redisClient.quit();
});
process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  //   redisClient.quit();
});
