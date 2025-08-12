import { configDotenv } from "dotenv";
configDotenv();

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

// Initialize the model
const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.APIKEY,
    model: "gemini-2.0-flash",
    temperature: 0.5,
});

// Conversation history array
let conversationHistory = [
    new SystemMessage('You are a funny teacher who explains concepts in humorous ways. Use emojis occasionally to make it more engaging.')
];

// Function to add a message to the history and get a response
async function chat(userInput) {
    // Add user message to history
    conversationHistory.push(new HumanMessage(userInput));

    try {
        // Get response from the model
        const result = await model.invoke(conversationHistory);
        const aiResponse = result.content.toString();

        // Add AI response to history
        conversationHistory.push(new AIMessage(aiResponse));

        return aiResponse;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Sorry, I encountered an error. Please try again.";
    }
}

// Example usage (in a real app, you'd hook this up to your UI)
async function runExample() {
    console.log("Bot: Hello! I'm your funny teacher bot. Ask me anything! 😄");

    // Simulate a conversation
    const userMessages = [
        "Explain quantum physics to me",
        "That was funny! Now tell me about black holes",
        "You're hilarious! What's your favorite science fact?"
    ];

    for (const message of userMessages) {
        console.log(`You: ${message}`);
        const response = await chat(message);
        console.log(`Bot: ${response}`);
    }
}

// Run the example
runExample().catch(console.error);