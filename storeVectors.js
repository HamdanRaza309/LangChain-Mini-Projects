import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Input examples
const input_examples_json = {
    scale_1_examples: [
        'Excellent service!',
        'Highly recommend',
        'Love this product',
        'Five stars',
        "Best I've ever had",
    ],
    scale_2_examples: [
        'It was okay',
        'Met expectations',
        'Nothing special',
        'Adequate',
        'As expected',
    ],
    scale_3_examples: [
        'Terrible experience',
        'Do not buy',
        'Waste of money',
        'Completely dissatisfied',
        'Horrible customer service',
    ],
};

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.APIKEY_FOR_DIMENSION);
const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });

// Main embedding + Pinecone upload function
async function embedAndStoreWithGemini(index) {
    const namespace = 'gemini-review-examples';
    const allEmbeds = [];

    for (const scaleKey of Object.keys(input_examples_json)) {
        const examples = input_examples_json[scaleKey];

        for (const example of examples) {
            console.log(`Embedding: "${example}"`);
            const res = await embeddingModel.embedContent({
                content: { parts: [{ text: example }] },
            });

            const embedding = res.embedding.values;

            allEmbeds.push({
                id: uuidv4(),
                values: embedding,
                metadata: {
                    text: example,
                    scale: scaleKey,
                },
            });
        }
    }

    // Upload in batches
    const batchSize = 100;
    for (let i = 0; i < allEmbeds.length; i += batchSize) {
        const batch = allEmbeds.slice(i, i + batchSize);
        await await index.upsert(batch, { namespace });
        console.log(`Uploaded batch ${i / batchSize + 1}`);
    }

    console.log('All embeddings stored in Pinecone!');
}

// IIFE to run the process
(async () => {
    try {
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_APIKEY,
        });
        const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

        await embedAndStoreWithGemini(index);
    } catch (error) {
        console.error('Error:', error);
    }
})();
