import { configDotenv } from "dotenv";
configDotenv();

import { ConversationChain } from 'langchain/chains';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { BufferMemory } from 'langchain/memory';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.APIKEY,
    model: "gemini-2.0-flash",
    temperature: 0.5,
});

// Correct prompt construction
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

// Run the conversation
const response = await chain.invoke({
    input: "What's my name?",
});

console.log(response.response);