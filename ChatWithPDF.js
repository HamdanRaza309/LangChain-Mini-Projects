// Import Libraries
import { configDotenv } from "dotenv";
configDotenv();

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RetrievalQAChain } from "langchain/chains";

// npm i pdf-parser
// Load PDF
const loader = new PDFLoader("./Rule_based_FAQs_chatbot.pdf");
const docs = await loader.load();

// Split PDF Document into Chunks
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});
const ChunkedDocuments = await splitter.splitDocuments(docs);

// Create Embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.APIKEY,
    model: "embedding-001",
});

// Store Chunked Documents and Embeddings into Vector Store
const vectorStore = await MemoryVectorStore.fromDocuments(ChunkedDocuments, embeddings);
const vectorStoreRetriever = vectorStore.asRetriever();

// Create Chat Model
const chatModel = new ChatGoogleGenerativeAI({
    apiKey: process.env.APIKEY,
    model: "gemini-2.0-flash",
    temperature: 0.5,
});

// Create a Questions-Answer Chain
const qaChain = RetrievalQAChain.fromLLM(chatModel, vectorStoreRetriever);

// Example Usage
// Summarize the PDF.
// Whats the input output flow
// Can you tell what is the table of content?
const question = "Who are the students that worked in this project? and what is the name of Instructor?";
const answer = await qaChain.invoke({ query: question });
console.log(answer.text);
