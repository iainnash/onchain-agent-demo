import { App, Assistant } from '@slack/bolt';
import { createChatbot } from './src/agent';

async function run() {

    const chatbot = await createChatbot();

    const app = new App({
        token: process.env.SLACK_BOT_TOKEN,
        signingSecret: process.env.SLACK_SIGNING_SECRET,
        socketMode: true,
        appToken: process.env.SLACK_APP_TOKEN
    });

    new Assistant({
        threadStarted: async ({ event, say }) => {
            console.log(event.assistant_thread.channel_id);
            await say("How i can i help?")
        },
        userMessage: async ({ message, say }) => {
            const msg = message as any;
            const response = await chatbot.call(msg.text, msg.thread_id);
            await say(response.content);
        }
    })

    await app.start();
    console.log('⚡️ Bolt app is running!');
}

run();