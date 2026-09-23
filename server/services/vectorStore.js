import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cosineSimilarity } from './embeddings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'vectorStore.json');

export class VectorStore {
  constructor() {
    this.documents = new Map(); // id -> document metadata
    this.chunks = new Map();    // id -> chunk object with embedding
    this.queryHistory = [];
    this.ensureDataDir();
  }

  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  addDocument(doc) {
    this.documents.set(doc.id, {
      id: doc.id,
      title: doc.title,
      filename: doc.filename || doc.title,
      department: doc.department || 'General',
      category: doc.category || 'General',
      date: doc.date || new Date().toISOString().split('T')[0],
      pageCount: doc.pageCount || 1,
      charCount: doc.charCount || 0,
      uploadedAt: doc.uploadedAt || new Date().toISOString(),
      summary: doc.summary || ''
    });
  }

  addChunks(chunkList) {
    for (const chunk of chunkList) {
      this.chunks.set(chunk.id, chunk);
    }
    this.persist();
  }

  deleteDocument(docId) {
    this.documents.delete(docId);
    for (const [chunkId, chunk] of this.chunks.entries()) {
      if (chunk.docId === docId) {
        this.chunks.delete(chunkId);
      }
    }
    this.persist();
  }

  /**
   * Search vector store using query embedding vector
   */
  search(queryEmbedding, options = {}) {
    const {
      topK = 4,
      minScore = 0.28,
      category = null,
      department = null,
      docId = null
    } = options;

    const scored = [];

    for (const chunk of this.chunks.values()) {
      // Optional metadata filters
      if (category && chunk.category !== category) continue;
      if (department && chunk.department !== department) continue;
      if (docId && chunk.docId !== docId) continue;

      if (!chunk.embedding || !Array.isArray(chunk.embedding)) continue;

      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (score >= minScore) {
        scored.push({
          ...chunk,
          // Exclude raw embedding from search result output to keep payload lean
          embedding: undefined,
          similarityScore: parseFloat(score.toFixed(4)),
          relevancePercent: Math.round(score * 100)
        });
      }
    }

    // Sort by descending similarity score
    scored.sort((a, b) => b.similarityScore - a.similarityScore);

    return scored.slice(0, topK).map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }

  getAllDocuments() {
    return Array.from(this.documents.values()).map(doc => {
      let docChunks = 0;
      for (const chunk of this.chunks.values()) {
        if (chunk.docId === doc.id) docChunks++;
      }
      return { ...doc, chunkCount: docChunks };
    });
  }

  getDocument(docId) {
    const doc = this.documents.get(docId);
    if (!doc) return null;
    let docChunks = 0;
    for (const chunk of this.chunks.values()) {
      if (chunk.docId === doc.id) docChunks++;
    }
    return { ...doc, chunkCount: docChunks };
  }

  getChunksForDocument(docId) {
    const list = [];
    for (const chunk of this.chunks.values()) {
      if (chunk.docId === docId) {
        list.push({
          ...chunk,
          embeddingPreview: chunk.embedding ? chunk.embedding.slice(0, 8) : []
        });
      }
    }
    return list.sort((a, b) => (a.pageNumber - b.pageNumber) || a.id.localeCompare(b.id));
  }

  getStats() {
    const docs = Array.from(this.documents.values());
    const totalChunks = this.chunks.size;
    let totalChars = 0;

    const categories = {};
    const departments = {};

    for (const doc of docs) {
      categories[doc.category] = (categories[doc.category] || 0) + 1;
      departments[doc.department] = (departments[doc.department] || 0) + 1;
    }

    for (const chunk of this.chunks.values()) {
      totalChars += (chunk.charCount || 0);
    }

    return {
      totalDocuments: docs.length,
      totalChunks,
      averageChunkSize: totalChunks > 0 ? Math.round(totalChars / totalChunks) : 0,
      totalWordsIndexed: Math.round(totalChars / 5),
      categories,
      departments,
      totalQueriesAnswered: this.queryHistory.length
    };
  }

  logQuery(record) {
    this.queryHistory.push({
      ...record,
      timestamp: new Date().toISOString()
    });
    if (this.queryHistory.length > 200) {
      this.queryHistory.shift();
    }
  }

  getQueryHistory(limit = 20) {
    return this.queryHistory.slice(-limit).reverse();
  }

  persist() {
    try {
      const data = {
        documents: Array.from(this.documents.entries()),
        chunks: Array.from(this.chunks.entries()),
        queryHistory: this.queryHistory
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist vector store:', err.message);
    }
  }

  load() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.documents = new Map(data.documents || []);
        this.chunks = new Map(data.chunks || []);
        this.queryHistory = data.queryHistory || [];
        console.log(`Loaded vector store: ${this.documents.size} docs, ${this.chunks.size} chunks.`);
        return true;
      }
    } catch (err) {
      console.warn('Could not load vector store from disk, starting fresh:', err.message);
    }
    return false;
  }
}

export const vectorStore = new VectorStore();
