// env cofig
import { configDotenv } from 'dotenv'
configDotenv()

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";

const prompt = new PromptTemplate({
    template: "Suggest a creative name for a company that makes {product1} and {product2}.",
    inputVariables: ["product1", "product2"],
});

const formattedPrompt = await prompt.format({
    product1: "cheese",
    product2: "butter",
});

console.log(formattedPrompt);

// Next: send formattedPrompt to LLM
const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.APIKEY,
    model: "gemini-2.0-flash",
    temperature: 0.5,
});

const result = await model.invoke(formattedPrompt);
console.log("Gemini:", result.content);
