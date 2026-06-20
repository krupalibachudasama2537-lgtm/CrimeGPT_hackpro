import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChromaClient } from 'chromadb';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_DIR = path.resolve(__dirname, '..');

const VECTOR_CACHE_PATH = path.resolve(BACKEND_DIR, 'vector_store_cache.json');
const CORPUS_DIR = path.resolve(BACKEND_DIR, 'legal-corpus');

let chromaCollection = null;
let useChroma = false;
let fallbackVectorStore = []; // Array of { text, source, embedding }

// Helper: Compute cosine similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper: Get embeddings from Gemini API
async function getEmbedding(text) {
  if (!genAI) {
    // Return mock random vector if API key is not present for safety during builds/tests
    return Array.from({ length: 768 }, () => Math.random() - 0.5);
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Chunking Pipeline: Splits text files into sections based on double newlines or Section headings
function chunkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath);
  
  // Split by double newlines or explicit section headers
  const parts = content.split(/\n\s*\n+/);
  return parts
    .map(p => p.trim())
    .filter(p => p.length > 20)
    .map(chunk => ({
      text: chunk,
      source: filename
    }));
}

// Initialize RAG Database
export async function initializeRAG() {
  console.log('Initializing RAG Legal Database...');

  // 1. Read and chunk all files in corpus
  let allChunks = [];
  if (fs.existsSync(CORPUS_DIR)) {
    const files = fs.readdirSync(CORPUS_DIR);
    for (const file of files) {
      if (file.endsWith('.txt')) {
        const chunks = chunkFile(path.join(CORPUS_DIR, file));
        allChunks.push(...chunks);
      }
    }
  } else {
    console.warn('Corpus directory not found at:', CORPUS_DIR);
  }

  console.log(`Split legal documents into ${allChunks.length} chunks.`);

  // 2. Attempt ChromaDB connection
  try {
    const client = new ChromaClient({ path: 'http://localhost:8000' });
    // Quick ping/heartbeat test
    await client.heartbeat();
    console.log('ChromaDB server detected. Initializing Chroma collection...');
    
    chromaCollection = await client.getOrCreateCollection({
      name: 'legal_provisions',
      metadata: { description: 'BNS, BNSS, BSA and precedents' }
    });
    
    // Add documents to ChromaDB
    const ids = allChunks.map((_, idx) => `chunk_${idx}`);
    const documents = allChunks.map(c => c.text);
    const metadatas = allChunks.map(c => ({ source: c.source }));
    
    // Generate embeddings
    const embeddings = [];
    for (const chunk of allChunks) {
      const emb = await getEmbedding(chunk.text);
      embeddings.push(emb);
    }
    
    await chromaCollection.upsert({
      ids,
      embeddings,
      metadatas,
      documents
    });
    
    useChroma = true;
    console.log('ChromaDB successfully loaded with legal corpus.');
  } catch (chromaError) {
    console.log('ChromaDB not running or failed to connect. Falling back to local vector store...');
    useChroma = false;
  }

  // 3. Fallback to Local Vector Store
  if (!useChroma) {
    // Try to load cached vector store if exists to prevent constant API calls
    if (fs.existsSync(VECTOR_CACHE_PATH)) {
      try {
        console.log('Loading local vector store cache from:', VECTOR_CACHE_PATH);
        fallbackVectorStore = JSON.parse(fs.readFileSync(VECTOR_CACHE_PATH, 'utf-8'));
        console.log(`Local cache loaded: ${fallbackVectorStore.length} embedded chunks.`);
        return;
      } catch (cacheError) {
        console.error('Failed to parse vector cache file, rebuilding...', cacheError);
      }
    }

    // Generate embeddings and cache them
    console.log('Generating embeddings for fallback vector store...');
    fallbackVectorStore = [];
    for (const chunk of allChunks) {
      try {
        const embedding = await getEmbedding(chunk.text);
        fallbackVectorStore.push({
          text: chunk.text,
          source: chunk.source,
          embedding
        });
      } catch (err) {
        console.error(`Skipping chunk due to embedding failure: ${chunk.text.substring(0, 30)}...`);
      }
    }

    // Save cache
    try {
      fs.writeFileSync(VECTOR_CACHE_PATH, JSON.stringify(fallbackVectorStore, null, 2));
      console.log('Local vector store cache saved successfully.');
    } catch (saveError) {
      console.error('Failed to save vector store cache file:', saveError);
    }
  }
}

// Retrieval Pipeline: Retrieve relevant context
export async function retrieveContext(query, limit = 5) {
  if (useChroma && chromaCollection) {
    try {
      const queryEmbedding = await getEmbedding(query);
      const results = await chromaCollection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit
      });
      
      const documents = results.documents[0] || [];
      const metadatas = results.metadatas[0] || [];
      
      return documents.map((doc, idx) => ({
        text: doc,
        source: metadatas[idx]?.source || 'unknown'
      }));
    } catch (err) {
      console.error('ChromaDB query failed, running search on local store:', err);
    }
  }

  // Fallback Cosine Similarity Search
  if (fallbackVectorStore.length === 0) {
    await initializeRAG();
  }

  try {
    const queryEmbedding = await getEmbedding(query);
    const scoredChunks = fallbackVectorStore.map(chunk => {
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        text: chunk.text,
        source: chunk.source,
        similarity
      };
    });

    // Sort by similarity descending
    scoredChunks.sort((a, b) => b.similarity - a.similarity);
    
    // Return top matching chunks
    return scoredChunks.slice(0, limit);
  } catch (err) {
    console.error('Search in local vector store failed:', err);
    return [];
  }
}
