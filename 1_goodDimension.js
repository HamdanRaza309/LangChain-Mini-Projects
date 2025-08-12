import { configDotenv } from "dotenv";
configDotenv();
import { GoogleGenerativeAI } from "@google/generative-ai";
import readline from 'readline';

const genAI = new GoogleGenerativeAI(process.env.APIKEY_FOR_DIMENSION);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const state = {
    step: 1, // 1=title, 2=categories, 3=examples, 4=confirmation
    title: null,
    categories: ["NULL", "NULL", "NULL"],
    examples: [[], [], []],
    awaitingTitleConfirmation: false
};

const systemPrompt = `You are Inspectrum, a synthetic data assistant. Follow STRICT rules:

1. When user provides exact title, use it exactly as given
2. For categories, suggest 3 relevant options for the given title
3. Categories should be distinct and cover the full spectrum
4. Respond ONLY in this JSON format:
{
  "assistant_response": "message",
  "ready_to_begin": boolean,
  "title_of_dimension": "string|NULL",
  "scale_1_of_the_dimension": "string|NULL",
  "scale_2_of_the_dimension": "string|NULL",
  "scale_3_of_the_dimension": "string|NULL",
  "scale_1_examples": [],
  "scale_2_examples": [],
  "scale_3_examples": []
}`;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function formatResponse(message, ready = false) {
    return {
        assistant_response: message,
        ready_to_begin: ready,
        title_of_dimension: state.title || "NULL",
        scale_1_of_the_dimension: state.categories[0] || "NULL",
        scale_2_of_the_dimension: state.categories[1] || "NULL",
        scale_3_of_the_dimension: state.categories[2] || "NULL",
        scale_1_examples: state.examples[0] || [],
        scale_2_examples: state.examples[1] || [],
        scale_3_examples: state.examples[2] || []
    };
}

async function getAIResponse(prompt) {
    try {
        const chat = model.startChat({
            history: [{ role: "user", parts: [{ text: systemPrompt }] }],
            generationConfig: { temperature: 0.7 } // Slightly higher for creative categories
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean and parse JSON response
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        // Validate categories if in that phase
        if (state.step === 2 && parsed.scale_1_of_the_dimension === "NULL") {
            throw new Error("Invalid categories received");
        }

        return parsed;
    } catch (error) {
        console.error("AI Error:", error.message);
        return formatResponse("Let me try that again...");
    }
}

async function generateCategories() {
    const prompt = `Suggest 3 distinct, relevant categories for analyzing "${state.title}".
    Categories should cover the full spectrum of possible responses.
    Respond with the categories in the required JSON format.`;

    const response = await getAIResponse(prompt);
    return response;
}

async function startChat() {
    console.log("AI: Let's create a categorical dimension for analysis.");
    console.log(JSON.stringify(formatResponse("What would you like to analyze? (You can specify your exact title if desired)"), null, 2));

    const chatLoop = async () => {
        rl.question("You: ", async (input) => {
            if (input.toLowerCase() === 'exit') {
                rl.close();
                return;
            }

            const userConfirmed = /yes|ok|proceed|confirm/i.test(input);
            const userRejected = /no|reject|change/i.test(input);
            const looksLikeTitle = /^[A-Z][a-zA-Z ]+$/.test(input.trim());

            let aiResponse;
            switch (state.step) {
                case 1: // Title phase
                    if (!state.title) {
                        if (looksLikeTitle && !state.awaitingTitleConfirmation) {
                            state.title = input.trim();
                            state.awaitingTitleConfirmation = true;
                            aiResponse = formatResponse(`Using your specified title: "${state.title}". Shall we proceed?`);
                        } else {
                            aiResponse = await getAIResponse(`Suggest a title for analyzing: ${input}`);
                            if (aiResponse.title_of_dimension !== "NULL") {
                                state.title = aiResponse.title_of_dimension;
                                state.awaitingTitleConfirmation = true;
                                aiResponse = formatResponse(`Proceed with "${state.title}"?`);
                            }
                        }
                    } else if (state.awaitingTitleConfirmation) {
                        if (userConfirmed) {
                            state.step = 2;
                            state.awaitingTitleConfirmation = false;
                            aiResponse = await generateCategories();
                            if (aiResponse.scale_1_of_the_dimension !== "NULL") {
                                state.categories = [
                                    aiResponse.scale_1_of_the_dimension,
                                    aiResponse.scale_2_of_the_dimension,
                                    aiResponse.scale_3_of_the_dimension
                                ];
                                aiResponse = formatResponse(
                                    `Suggested categories:\n1. ${state.categories[0]}\n2. ${state.categories[1]}\n3. ${state.categories[2]}\nProceed with these?`
                                );
                            }
                        } else if (userRejected) {
                            state.title = null;
                            state.awaitingTitleConfirmation = false;
                            aiResponse = formatResponse("Please specify your exact preferred title");
                        }
                    }
                    break;

                case 2: // Category phase
                    if (userConfirmed) {
                        state.step = 3;
                        aiResponse = await getAIResponse(
                            `Generate 5 specific examples for each category:\n` +
                            `1. ${state.categories[0]}\n` +
                            `2. ${state.categories[1]}\n` +
                            `3. ${state.categories[2]}`
                        );
                        if (aiResponse.scale_1_examples?.length === 5) {
                            state.examples = [
                                aiResponse.scale_1_examples,
                                aiResponse.scale_2_examples,
                                aiResponse.scale_3_examples
                            ];
                            aiResponse = formatResponse(
                                `Examples:\n` +
                                `${state.categories[0]}: ${state.examples[0].join(', ')}\n` +
                                `${state.categories[1]}: ${state.examples[1].join(', ')}\n` +
                                `${state.categories[2]}: ${state.examples[2].join(', ')}\n` +
                                `Proceed with these examples?`
                            );
                        }
                    } else if (userRejected) {
                        aiResponse = await generateCategories();
                        if (aiResponse.scale_1_of_the_dimension !== "NULL") {
                            state.categories = [
                                aiResponse.scale_1_of_the_dimension,
                                aiResponse.scale_2_of_the_dimension,
                                aiResponse.scale_3_of_the_dimension
                            ];
                            aiResponse = formatResponse(
                                `New suggested categories:\n` +
                                `1. ${state.categories[0]}\n` +
                                `2. ${state.categories[1]}\n` +
                                `3. ${state.categories[2]}\n` +
                                `Proceed with these?`
                            );
                        }
                    }
                    break;

                case 3: // Example phase
                    if (userConfirmed) {
                        state.step = 4;
                        aiResponse = formatResponse(
                            "Dimension setup complete! Ready to generate synthetic data.",
                            true
                        );
                        console.log("AI:", JSON.stringify(aiResponse, null, 2));
                        rl.close();
                        return;
                    } else {
                        aiResponse = await getAIResponse(
                            `Generate 5 new examples for each category:\n` +
                            `1. ${state.categories[0]}\n` +
                            `2. ${state.categories[1]}\n` +
                            `3. ${state.categories[2]}`
                        );
                        if (aiResponse.scale_1_examples?.length === 5) {
                            state.examples = [
                                aiResponse.scale_1_examples,
                                aiResponse.scale_2_examples,
                                aiResponse.scale_3_examples
                            ];
                            aiResponse = formatResponse(
                                `New examples:\n` +
                                `${state.categories[0]}: ${state.examples[0].join(', ')}\n` +
                                `${state.categories[1]}: ${state.examples[1].join(', ')}\n` +
                                `${state.categories[2]}: ${state.examples[2].join(', ')}\n` +
                                `Proceed with these examples?`
                            );
                        }
                    }
                    break;
            }

            console.log("AI:", JSON.stringify(aiResponse, null, 2));
            chatLoop();
        });
    };

    chatLoop();
}

startChat();



// 3
// 3
// 3

// 3
// 3
// 3
// 3
// 3
// 3
// 33
// 3

// 3
// 3
// 3
// 3
// 3

// 3
// 3
// 3
// 3
// 3