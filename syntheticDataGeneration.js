import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.APIKEY_FOR_DIMENSION);

const inputExamplesJson = {
    "scale_1_examples": [
        "Excellent service!",
        "Highly recommend",
        "Love this product",
        "Five stars",
        "Best I've ever had"
    ],
    "scale_2_examples": [
        "It was okay",
        "Met expectations",
        "Nothing special",
        "Adequate",
        "As expected"
    ],
    "scale_3_examples": [
        "Terrible experience",
        "Do not buy",
        "Waste of money",
        "Completely dissatisfied",
        "Horrible customer service"
    ]
};

export async function generateSimilarExamplesGemini() {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });
    const output = {};

    for (const [scaleKey, examples] of Object.entries(inputExamplesJson)) {
        console.log(`Generating examples for ${scaleKey}...`);

        const prompt = `
You are given 5 example phrases that belong to the same category:

${examples.map((e, i) => `${i + 1}. ${e}`).join('\n')}

Now, generate exactly 100 new and diverse phrases that match the same tone, emotional meaning, and sentiment as the examples above.
Make sure the new phrases are different in wording but similar in intent.

Output ONLY a valid JSON array of 5 strings. No explanation. No markdown. Just the array.
`;


        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            // console.log(`Raw output for ${scaleKey}:\n`, text);

            const jsonCleaned = text
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();

            output[scaleKey] = JSON.parse(jsonCleaned);
        } catch (err) {
            console.error(`Failed to process ${scaleKey}:`, err);
            output[scaleKey] = [];
        }
    }

    console.log("\nFinal Output:", JSON.stringify(output, null, 2));
    return output;
}

// Call the function
generateSimilarExamplesGemini();
