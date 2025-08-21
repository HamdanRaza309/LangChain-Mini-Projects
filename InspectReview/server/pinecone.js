import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

export async function initPinecone() {
    const index = pinecone.index(process.env.PINECONE_INDEX);
    await index.describeIndexStats(); // to ensure it's working
    return index;
}

export async function storeEmbeddings(index, vectors) {
    await index.upsert({ upsertRequest: { vectors } });
}

export async function searchSimilar(index, vector) {
    const query = {
        vector,
        topK: 3,
        includeMetadata: true,
    };
    const res = await index.query({ queryRequest: query });
    return res.matches;
}
