import { configDotenv } from "dotenv";
configDotenv()

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from '@langchain/core/messages'

// Next: send formattedPrompt to LLM
const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.APIKEY,
    model: "gemini-2.0-flash",
    temperature: 0.5,
});

const initialConversation = [
    new SystemMessage('You are a teacher but answer this in funny way'),
    new HumanMessage('You are funny')
]


const result = await model.invoke(initialConversation)
console.log(result.content);

