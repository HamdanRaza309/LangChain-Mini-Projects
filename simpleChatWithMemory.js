import { configDotenv } from "dotenv";
configDotenv();

import { ConversationChain } from 'langchain/chains';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { BufferMemory } from 'langchain/memory';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import readline from 'readline';

// Initialize the AI model
const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.APIKEY,
    model: "gemini-2.0-flash",
    temperature: 0.5,
});

// Set up the conversation prompt
const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", "The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of details."],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
]);

// Create conversation chain
const chain = new ConversationChain({
    memory: new BufferMemory({ returnMessages: true, memoryKey: "history" }),
    prompt: chatPrompt,
    llm: model,
});

// Set up readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to start the chat
async function startChat() {
    console.log("AI: Hello! How can I help you today? (Type 'exit' to end the conversation)");

    const chatLoop = async () => {
        rl.question("You: ", async (input) => {
            if (input.toLowerCase() === 'exit') {
                console.log("AI: Goodbye! Have a great day!");
                rl.close();
                return;
            }

            try {
                const response = await chain.invoke({
                    input: input,
                });

                console.log(`AI: ${response.response}`);
                chatLoop(); // Continue the conversation
            } catch (error) {
                console.error("Error:", error);
                rl.close();
            }
        });
    };

    chatLoop();
}

// Start the chat
startChat();