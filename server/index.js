import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import { processDocumentFile } from './services/documentProcessor.js';
import { chunkDocument } from './services/chunker.js';
import { generateEmbedding } from './services/embeddings.js';
import { vectorStore } from './services/vectorStore.js';
import { executeRagPipeline, FALLBACK_MESSAGE } from './services/ragEngine.js';
import { SEED_DOCUMENTS } from './data/seedDocuments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, 'data/uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Global server settings state (can be changed via /api/settings)
let serverSettings = {
  topK: 3,
  minScore: 0.28,
  provider: 'local', // 'local' | 'gemini' | 'openai'
  apiKey: '',
  modelName: 'gemini-1.5-flash',
  chunkSize: 650,
  chunkOverlap: 120
};

// In-memory conversation sessions
const conversations = new Map();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

/**
 * Initialize and seed documents if store is empty
 */
async function initializeSystem() {
  const loaded = vectorStore.load();
  if (!loaded || vectorStore.documents.size === 0) {
    console.log('Seeding default college documents into vector store...');
    for (const seedDoc of SEED_DOCUMENTS) {
      vectorStore.addDocument(seedDoc);
      const chunks = chunkDocument(seedDoc, {
        chunkSize: serverSettings.chunkSize,
        chunkOverlap: serverSettings.chunkOverlap
      });

      for (const chunk of chunks) {
        chunk.embedding = await generateEmbedding(chunk.content, { provider: 'local' });
      }

      vectorStore.addChunks(chunks);
    }
    console.log(`Initial seeding complete: ${vectorStore.documents.size} documents, ${vectorStore.chunks.size} chunks.`);
  } else {
    console.log(`Vector store ready: ${vectorStore.documents.size} documents, ${vectorStore.chunks.size} chunks.`);
  }
}

// --- API ROUTES ---

// Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    name: 'CampusIQ RAG Engine',
    version: '1.0.0',
    documentsCount: vectorStore.documents.size,
    chunksCount: vectorStore.chunks.size,
    activeProvider: serverSettings.provider
  });
});

// Settings
app.get('/api/settings', (req, res) => {
  res.json({
    ...serverSettings,
    apiKey: serverSettings.apiKey ? '••••••••' + serverSettings.apiKey.slice(-4) : ''
  });
});

app.post('/api/settings', (req, res) => {
  const { topK, minScore, provider, apiKey, modelName, chunkSize, chunkOverlap } = req.body;
  if (topK !== undefined) serverSettings.topK = Math.max(1, Math.min(10, parseInt(topK, 10)));
  if (minScore !== undefined) serverSettings.minScore = Math.max(0.1, Math.min(0.9, parseFloat(minScore)));
  if (provider !== undefined) serverSettings.provider = provider;
  if (apiKey !== undefined && apiKey !== '••••••••' && !apiKey.startsWith('••••')) {
    serverSettings.apiKey = apiKey;
  }
  if (modelName !== undefined) serverSettings.modelName = modelName;
  if (chunkSize !== undefined) serverSettings.chunkSize = parseInt(chunkSize, 10);
  if (chunkOverlap !== undefined) serverSettings.chunkOverlap = parseInt(chunkOverlap, 10);

  res.json({
    message: 'Settings updated successfully',
    settings: {
      ...serverSettings,
      apiKey: serverSettings.apiKey ? '••••••••' + serverSettings.apiKey.slice(-4) : ''
    }
  });
});

// List all documents
app.get('/api/documents', (req, res) => {
  const docs = vectorStore.getAllDocuments();
  res.json(docs);
});

// Get chunks for a specific document
app.get('/api/documents/:id/chunks', (req, res) => {
  const doc = vectorStore.getDocument(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  const chunks = vectorStore.getChunksForDocument(req.params.id);
  res.json({
    document: doc,
    chunks
  });
});

// Upload and ingest new document (PDF, DOCX, TXT)
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No document file uploaded' });
    }

    const {
      title = file.originalname,
      department = 'Academic Affairs',
      category = 'General',
      date = new Date().toISOString().split('T')[0]
    } = req.body;

    console.log(`Processing uploaded document: ${file.originalname} (${file.mimetype})`);

    // 1. Process document file & extract pages
    const { rawText, pages, pageCount } = await processDocumentFile(file.path, file.originalname);

    if (!rawText.trim()) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Could not extract text from document.' });
    }

    const docId = `doc_${uuidv4().substring(0, 8)}`;
    const documentObj = {
      id: docId,
      title: title.trim(),
      filename: file.originalname,
      department,
      category,
      date,
      pageCount,
      charCount: rawText.length,
      uploadedAt: new Date().toISOString(),
      summary: rawText.substring(0, 200).replace(/\s+/g, ' ').trim() + '...',
      pages
    };

    // 2. Register document
    vectorStore.addDocument(documentObj);

    // 3. Chunk document
    const chunks = chunkDocument(documentObj, {
      chunkSize: serverSettings.chunkSize,
      chunkOverlap: serverSettings.chunkOverlap
    });

    console.log(`Created ${chunks.length} chunks for "${title}". Generating embeddings...`);

    // 4. Generate embeddings for each chunk
    for (const chunk of chunks) {
      chunk.embedding = await generateEmbedding(chunk.content, {
        provider: serverSettings.provider,
        apiKey: serverSettings.apiKey
      });
    }

    // 5. Store in vector database
    vectorStore.addChunks(chunks);

    res.json({
      message: 'Document successfully processed and indexed into vector database',
      document: {
        ...documentObj,
        chunkCount: chunks.length,
        pages: undefined // avoid huge payload in list response
      },
      chunkCount: chunks.length
    });
  } catch (err) {
    console.error('Error during document ingestion:', err);
    res.status(500).json({ error: 'Document ingestion failed: ' + err.message });
  }
});

// Delete document and associated chunks
app.delete('/api/documents/:id', (req, res) => {
  const docId = req.params.id;
  const doc = vectorStore.getDocument(docId);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  vectorStore.deleteDocument(docId);
  res.json({ message: `Document "${doc.title}" deleted successfully.` });
});

// Reset to seed documents
app.post('/api/documents/reset-seed', async (req, res) => {
  try {
    vectorStore.documents.clear();
    vectorStore.chunks.clear();
    for (const seedDoc of SEED_DOCUMENTS) {
      vectorStore.addDocument(seedDoc);
      const chunks = chunkDocument(seedDoc, {
        chunkSize: serverSettings.chunkSize,
        chunkOverlap: serverSettings.chunkOverlap
      });
      for (const chunk of chunks) {
        chunk.embedding = await generateEmbedding(chunk.content, { provider: 'local' });
      }
      vectorStore.addChunks(chunks);
    }
    res.json({
      message: 'Vector database re-seeded with official college policy documents.',
      documentsCount: vectorStore.documents.size,
      chunksCount: vectorStore.chunks.size
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Core RAG Query Endpoint
app.post('/api/query', async (req, res) => {
  try {
    const {
      query,
      conversationId,
      category,
      department,
      docId,
      topK = serverSettings.topK,
      minScore = serverSettings.minScore
    } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query text is required' });
    }

    // Get conversation history if provided
    let conversationHistory = [];
    if (conversationId && conversations.has(conversationId)) {
      conversationHistory = conversations.get(conversationId);
    }

    // Execute RAG Pipeline
    const result = await executeRagPipeline(query.trim(), {
      topK: parseInt(topK, 10) || serverSettings.topK,
      minScore: parseFloat(minScore) || serverSettings.minScore,
      category: category || null,
      department: department || null,
      docId: docId || null,
      provider: serverSettings.provider,
      apiKey: serverSettings.apiKey,
      modelName: serverSettings.modelName,
      conversationHistory
    });

    // Save to conversation history
    if (conversationId) {
      if (!conversations.has(conversationId)) {
        conversations.set(conversationId, []);
      }
      const history = conversations.get(conversationId);
      history.push({ role: 'user', content: query.trim() });
      history.push({
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
        isGrounded: result.isGrounded,
        pipelineTrace: result.pipelineTrace
      });
    }

    res.json(result);
  } catch (err) {
    console.error('RAG Pipeline Query error:', err);
    res.status(500).json({
      answer: FALLBACK_MESSAGE,
      sources: [],
      error: err.message
    });
  }
});

// Conversation management
app.get('/api/conversations/:id', (req, res) => {
  const history = conversations.get(req.params.id) || [];
  res.json({ conversationId: req.params.id, messages: history });
});

app.delete('/api/conversations/:id', (req, res) => {
  conversations.delete(req.params.id);
  res.json({ message: 'Conversation cleared' });
});

// Analytics & Stats
app.get('/api/stats', (req, res) => {
  const stats = vectorStore.getStats();
  const recentQueries = vectorStore.getQueryHistory(10);
  res.json({
    ...stats,
    recentQueries
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(` CampusIQ RAG Backend Server Started`);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(`=========================================`);
  await initializeSystem();
});
