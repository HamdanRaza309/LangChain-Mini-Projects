import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function analyzeReview(review) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an API that analyzes product reviews. Return your response ONLY in raw JSON.

Tasks:
- Generate 5 similar synthetic reviews
- Detect the mood (happy, angry, etc.)
- Rate the review out of 10
- Classify as Good, Average, or Bad

Respond ONLY like this (no explanation, no markdown):

{
  "syntheticReviews": ["..."],
  "mood": "...",
  "rating": ...,
  "type": "..."
}

Analyze this review:
"${review}"
`;

    const result = await model.generateContent(prompt);
    let response = await result.response.text();

    // 🧹 Clean up if it includes ```json ... ```
    response = response.replace(/```json|```/g, '').trim();

    console.log("Gemini Cleaned Response:", response);

    return JSON.parse(response);
}


export async function getEmbeddings(text) {
    const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await embeddingModel.embedContent({ content: text });
    return result.embedding.values;
}
