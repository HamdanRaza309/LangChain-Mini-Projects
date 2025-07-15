// Import Libraries
import { configDotenv } from "dotenv";
configDotenv();

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RetrievalQAChain } from "langchain/chains";
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from "@langchain/community/vectorstores/pinecone";

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_APIKEY,
});
const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

// npm i pdf-parser
// Load PDF
const loader = new PDFLoader("./Rule_based_FAQs_chatbot.pdf");
const docs = await loader.load();
// console.log("Loader\n");
// console.log("Docs\n", docs);

// Split PDF Document into Chunks
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});
const ChunkedDocuments = await splitter.splitDocuments(docs);
// console.log('Splitter\n', splitter);
// console.log("Chunked Documents\n", ChunkedDocuments);



// Create Embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.APIKEY,
    model: "embedding-001",
});
// console.log("Create Embeddings\n", embeddings);


// Store Chunked Documents and Embeddings into Vector Store
const vectorStore = await PineconeStore.fromDocuments(ChunkedDocuments, embeddings, {
    pineconeIndex: index,
    namespace: "pdf-chatbot",
});
const vectorStoreRetriever = vectorStore.asRetriever();
// console.log("Vector Store\n", vectorStore);
// console.log("Vector Store Retriever\n", vectorStoreRetriever.vectorStore);
// const memoryVectors = vectorStoreRetriever.vectorStore.memoryVectors;
// console.log(memoryVectors); // embeddings

// Create Chat Model
const chatModel = new ChatGoogleGenerativeAI({
    apiKey: process.env.APIKEY,
    model: "gemini-2.0-flash",
    temperature: 0.5,
});
// console.log("Create Chat Model\n", chatModel);


// Create a Questions-Answer Chain
const qaChain = RetrievalQAChain.fromLLM(chatModel, vectorStoreRetriever);
// console.log("Create a Questions-Answer Chain\n", qaChain);


// Example Usage
// Summarize the PDF.
// Whats the input output flow
// Can you tell what is the table of content?
// What sections are included in the PDF?
const question = "Whats the input output flow";
const answer = await qaChain.invoke({ query: question });
console.log("Final Response:\n", answer.text);