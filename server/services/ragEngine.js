import { generateEmbedding } from './embeddings.js';
import { vectorStore } from './vectorStore.js';

export const FALLBACK_MESSAGE = "I couldn't find enough information in the provided college documents to answer this question.";

const SYSTEM_PROMPT = `You are CampusIQ, an official AI Knowledge Assistant for college students.
Your job is to answer students' academic, administrative, and campus questions ACCURATELY and FACTUALLY based ONLY on the provided college document excerpts.

STRICT RULES:
1. Grounding: Answer ONLY using the information provided in the Context below. Do NOT use outside general knowledge or assumptions.
2. If the context does not contain the answer, or if the information is incomplete, you MUST reply EXACTLY with:
"${FALLBACK_MESSAGE}"
3. Tone: Professional, student-friendly, clear, and direct.
4. Formatting: Use clear headings or bullet points where appropriate.
5. In-text attribution: Refer to the official policy, section, or handbook when stating rules (e.g., "According to Section 4.1 of the Academic Regulations...").
6. Never make up dates, fees, percentages, or attendance criteria.`;

/**
 * Execute the complete RAG Query Pipeline:
 * 1. User Query -> 2. Query Embedding -> 3. Vector DB Retrieval -> 4. Top-K Context Selection
 * -> 5. Grounding Check & Prompt Assembly -> 6. LLM/Synthesis -> 7. Grounded Answer + Source Citations
 */
export async function executeRagPipeline(query, options = {}) {
  const startTime = Date.now();
  const {
    topK = 3,
    minScore = 0.28,
    category = null,
    department = null,
    docId = null,
    provider = 'local',
    apiKey = '',
    modelName = 'gemini-1.5-flash',
    conversationHistory = []
  } = options;

  const pipelineTrace = {
    query,
    steps: []
  };

  // Step 1: Embed Query
  pipelineTrace.steps.push({
    name: 'Query Embedding',
    status: 'completed',
    description: `Generated dense vector embedding for student query (${provider} provider)`
  });
  const queryEmbedding = await generateEmbedding(query, { provider, apiKey });

  // Step 2: Retrieve Top-K relevant chunks from vector database
  const retrievedChunks = vectorStore.search(queryEmbedding, {
    topK,
    minScore,
    category,
    department,
    docId
  });

  pipelineTrace.steps.push({
    name: 'Vector Retrieval',
    status: 'completed',
    description: `Scored against ${vectorStore.chunks.size} chunks. Retrieved ${retrievedChunks.length} relevant chunks (threshold >= ${minScore})`,
    retrievedCount: retrievedChunks.length,
    chunks: retrievedChunks.map(c => ({
      id: c.id,
      docTitle: c.docTitle,
      pageNumber: c.pageNumber,
      section: c.section,
      similarityScore: c.similarityScore,
      preview: c.content.substring(0, 120) + '...'
    }))
  });

  // Step 3: Check relevance threshold
  // If no chunks retrieved or top chunk similarity is too low, return fallback immediately
  if (retrievedChunks.length === 0 || retrievedChunks[0].similarityScore < minScore) {
    const elapsed = Date.now() - startTime;
    pipelineTrace.steps.push({
      name: 'Context Sufficiency Check',
      status: 'rejected',
      description: 'Insufficient context found in college documents.'
    });

    const result = {
      answer: FALLBACK_MESSAGE,
      sources: [],
      isGrounded: false,
      retrievalLatencyMs: elapsed,
      pipelineTrace
    };

    vectorStore.logQuery({
      query,
      hasAnswer: false,
      retrievalLatencyMs: elapsed,
      sourcesCount: 0
    });

    return result;
  }

  // Step 4: Assemble Context
  const contextString = retrievedChunks
    .map((chunk, i) => `--- [Source ${i + 1}] Document: "${chunk.docTitle}" | Dept: ${chunk.department} | Page: ${chunk.pageNumber} | Section: "${chunk.section}" ---\n${chunk.content}`)
    .join('\n\n');

  pipelineTrace.steps.push({
    name: 'Context Assembly',
    status: 'completed',
    description: `Assembled context window with ${retrievedChunks.length} chunks (${contextString.length} characters)`
  });

  // Step 5: Answer Generation (LLM or Built-in Local Engine)
  let answer = '';
  let generatorUsed = provider;

  if (provider === 'gemini' && apiKey) {
    try {
      answer = await callGeminiLLM(query, contextString, conversationHistory, apiKey, modelName);
      generatorUsed = 'Gemini LLM';
    } catch (err) {
      console.warn('Gemini LLM call failed, falling back to local grounded generator:', err.message);
      answer = generateLocalGroundedAnswer(query, retrievedChunks);
      generatorUsed = 'Local Grounded Engine (Fallback)';
    }
  } else if (provider === 'openai' && apiKey) {
    try {
      answer = await callOpenAILLM(query, contextString, conversationHistory, apiKey);
      generatorUsed = 'OpenAI GPT';
    } catch (err) {
      console.warn('OpenAI LLM call failed, falling back to local grounded generator:', err.message);
      answer = generateLocalGroundedAnswer(query, retrievedChunks);
      generatorUsed = 'Local Grounded Engine (Fallback)';
    }
  } else {
    answer = generateLocalGroundedAnswer(query, retrievedChunks);
    generatorUsed = 'Built-in Grounded RAG Engine';
  }

  pipelineTrace.steps.push({
    name: 'Grounded Answer Generation',
    status: 'completed',
    description: `Generated grounded response using ${generatorUsed}`
  });

  // Step 6: Format Source Citations
  const sources = retrievedChunks.map((chunk, index) => ({
    citationIndex: index + 1,
    documentId: chunk.docId,
    documentTitle: chunk.docTitle,
    department: chunk.department,
    category: chunk.category,
    date: chunk.date,
    pageNumber: chunk.pageNumber,
    section: chunk.section,
    similarityScore: chunk.similarityScore,
    relevancePercent: chunk.relevancePercent,
    snippet: chunk.content.length > 280 ? chunk.content.substring(0, 280) + '...' : chunk.content,
    fullContent: chunk.content
  }));

  const elapsed = Date.now() - startTime;
  const isGrounded = answer.trim() !== FALLBACK_MESSAGE;

  const responsePayload = {
    answer,
    sources: isGrounded ? sources : [],
    isGrounded,
    generatorUsed,
    retrievalLatencyMs: elapsed,
    pipelineTrace
  };

  vectorStore.logQuery({
    query,
    hasAnswer: isGrounded,
    retrievalLatencyMs: elapsed,
    sourcesCount: sources.length
  });

  return responsePayload;
}

/**
 * Built-in Intelligent Grounded Answer Generator:
 * Extracts and synthesizes exact policy facts, numbers, clauses, and lists from retrieved chunks.
 * Guarantees zero hallucination when external APIs are not connected.
 */
function generateLocalGroundedAnswer(query, retrievedChunks) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/[^a-z0-9_%-]+/).filter(w => w.length > 2);

  // Check if chunks have actual substantive content matching query concepts
  let totalMatchPoints = 0;
  for (const chunk of retrievedChunks) {
    const chunkLower = chunk.content.toLowerCase();
    for (const w of queryWords) {
      if (chunkLower.includes(w)) totalMatchPoints++;
    }
  }

  if (totalMatchPoints < 2) {
    return FALLBACK_MESSAGE;
  }

  // Rank sentences in the top chunks by relevance to query
  const scoredSentences = [];
  const primaryChunk = retrievedChunks[0];

  for (const chunk of retrievedChunks) {
    // Split chunk into sentences
    const sentences = chunk.content.split(/(?<=[.?!])\s+(?=[A-Z0-9])/);
    for (const sentence of sentences) {
      const sTrim = sentence.trim();
      if (sTrim.length < 20) continue;
      const sLower = sTrim.toLowerCase();

      let score = 0;
      for (const w of queryWords) {
        if (sLower.includes(w)) {
          score += 1.5;
          // Exact bonus if contains crucial numbers or constraints
          if (/\b(\d+%|\d+\s*(?:marks|credits|lpa|pm|am|days|semesters?))\b/i.test(sTrim)) {
            score += 1.0;
          }
        }
      }

      if (score > 1.0) {
        scoredSentences.push({
          text: sTrim,
          score,
          docTitle: chunk.docTitle,
          pageNumber: chunk.pageNumber,
          section: chunk.section
        });
      }
    }
  }

  if (scoredSentences.length === 0) {
    // Fall back to primary chunk's key paragraph
    return formatChunkIntoAnswer(primaryChunk);
  }

  // Deduplicate and pick top relevant sentences
  scoredSentences.sort((a, b) => b.score - a.score);
  const selectedSentences = [];
  const seenTexts = new Set();

  for (const item of scoredSentences) {
    if (!seenTexts.has(item.text) && selectedSentences.length < 5) {
      seenTexts.add(item.text);
      selectedSentences.push(item);
    }
  }

  // Format synthesized grounded answer with bold key terms and structure
  let answer = `Based on the official **${primaryChunk.docTitle}** (Section: *${primaryChunk.section}*, Page ${primaryChunk.pageNumber}):\n\n`;

  if (selectedSentences.length === 1) {
    answer += selectedSentences[0].text;
  } else {
    for (const item of selectedSentences) {
      // Clean leading dashes or numbers
      const cleanSentence = item.text.replace(/^[-•*]\s*/, '');
      answer += `• ${cleanSentence}\n`;
    }
  }

  return answer.trim();
}

function formatChunkIntoAnswer(chunk) {
  return `According to **${chunk.docTitle}** (Section: *${chunk.section}*, Page ${chunk.pageNumber}):\n\n${chunk.content}`;
}

/**
 * Call Google Gemini LLM API
 */
async function callGeminiLLM(query, context, history, apiKey, modelName = 'gemini-1.5-flash') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const prompt = `${SYSTEM_PROMPT}

CONTEXT INFORMATION:
${context}

STUDENT QUESTION:
${query}

GROUNDED ANSWER:`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 800
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini LLM error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? text.trim() : FALLBACK_MESSAGE;
}

/**
 * Call OpenAI API
 */
async function callOpenAILLM(query, context, history, apiKey) {
  const url = 'https://api.openai.com/v1/chat/completions';

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `CONTEXT:\n${context}\n\nSTUDENT QUESTION:\n${query}` }
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.1,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || FALLBACK_MESSAGE;
}
