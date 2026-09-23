import assert from 'assert';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting CampusIQ End-to-End RAG Test Suite...\n');
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  // Test 1: Health
  await test('Backend Health and Initial Seed Check', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'healthy');
    assert.ok(data.documentsCount >= 6, `Expected >= 6 documents, got ${data.documentsCount}`);
    assert.ok(data.chunksCount >= 30, `Expected >= 30 chunks, got ${data.chunksCount}`);
  });

  // Test 2: Documents list
  await test('Retrieve Document Catalog', async () => {
    const res = await fetch(`${BASE_URL}/documents`);
    const docs = await res.json();
    assert.ok(Array.isArray(docs));
    const acadDoc = docs.find(d => d.title.includes('Academic Regulations'));
    assert.ok(acadDoc, 'Academic Regulations document not found in catalog');
    assert.ok(acadDoc.chunkCount > 0, 'Document chunks missing');
  });

  // Test 3: Document Chunks inspection
  await test('Chunk Inspector with Page and Section Extraction', async () => {
    const res = await fetch(`${BASE_URL}/documents/doc_academic_regulations_2025_26/chunks`);
    const data = await res.json();
    assert.ok(data.chunks.length > 0);
    const page42Chunk = data.chunks.find(c => c.pageNumber === 42);
    assert.ok(page42Chunk, 'Page 42 chunk not found');
    assert.ok(page42Chunk.content.includes('75%'), '75% attendance rule missing in Page 42 chunk');
  });

  // Test 4: Primary Prompt Attendance Query
  await test('RAG Query: Attendance Requirements for Exam Eligibility', async () => {
    const res = await fetch(`${BASE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What are the attendance requirements for semester examination eligibility?' })
    });
    const data = await res.json();
    assert.strictEqual(data.isGrounded, true);
    assert.ok(data.answer.includes('Academic Regulations 2025–26'));
    assert.ok(data.answer.includes('75%'));
    assert.ok(data.sources.length > 0);

    const topSource = data.sources[0];
    assert.strictEqual(topSource.pageNumber, 42);
    assert.ok(topSource.documentTitle.includes('Academic Regulations'));
    assert.ok(topSource.similarityScore > 0.4);
    assert.ok(data.retrievalLatencyMs < 100);
  });

  // Test 5: Hostel Curfew and Pass Query
  await test('RAG Query: Hostel Gate Curfew and Night Out Pass', async () => {
    const res = await fetch(`${BASE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What is the hostel gate curfew time and night out pass procedure?' })
    });
    const data = await res.json();
    assert.strictEqual(data.isGrounded, true);
    assert.ok(data.answer.includes('8:30 PM') || data.answer.includes('Hostel Rules'));
    assert.ok(data.sources.some(s => s.pageNumber === 8 && s.documentTitle.includes('Hostel Rules')));
  });

  // Test 6: Placement Policy Query
  await test('RAG Query: One-Student-One-Job Policy', async () => {
    const res = await fetch(`${BASE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What is the One-Student-One-Job policy?' })
    });
    const data = await res.json();
    assert.strictEqual(data.isGrounded, true);
    assert.ok(data.answer.toLowerCase().includes('one-student-one-job') || data.answer.toLowerCase().includes('dream'));
    assert.ok(data.sources.some(s => s.pageNumber === 14));
  });

  // Test 7: Leave / OD Query
  await test('RAG Query: On-Duty (OD) limit for hackathons and symposiums', async () => {
    const res = await fetch(`${BASE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What is the maximum allowable On-Duty OD limit for hackathons?' })
    });
    const data = await res.json();
    assert.strictEqual(data.isGrounded, true);
    assert.ok(data.answer.includes('10 days') || data.answer.includes('On-Duty'));
    assert.ok(data.sources.some(s => s.pageNumber === 6));
  });

  // Test 8: Negative / Guardrail Test (Anti-Hallucination)
  await test('RAG Guardrail: Ungrounded Out-of-Domain Question', async () => {
    const res = await fetch(`${BASE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'How do I build a rocket to travel to Mars?' })
    });
    const data = await res.json();
    assert.strictEqual(data.isGrounded, false);
    assert.strictEqual(data.answer, "I couldn't find enough information in the provided college documents to answer this question.");
    assert.strictEqual(data.sources.length, 0);
  });

  // Test 9: Document Upload via multipart/form-data
  await test('Document Ingestion: Upload New Policy Document', async () => {
    const sampleFilePath = path.resolve('../sample_documents/Sports_and_Cultural_Quota_Policy_2025_26.txt');
    const fileContent = fs.readFileSync(sampleFilePath);

    const formData = new FormData();
    const blob = new Blob([fileContent], { type: 'text/plain' });
    formData.append('file', blob, 'Sports_and_Cultural_Quota_Policy_2025_26.txt');
    formData.append('title', 'Sports & Cultural Excellence Policy 2025–26');
    formData.append('department', 'Student Welfare');
    formData.append('category', 'Student Welfare & Leave');
    formData.append('date', '2025-08-12');

    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.chunkCount > 0);
  });

  // Test 10: Query Newly Uploaded Document
  await test('RAG Query on Newly Ingested Document', async () => {
    const res = await fetch(`${BASE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What are the scholarship fee waivers for international level athletes in Olympics?' })
    });
    const data = await res.json();
    assert.strictEqual(data.isGrounded, true);
    assert.ok(data.answer.includes('100% Tuition fee waiver') || data.answer.includes('Sports & Cultural Excellence'));
    assert.ok(data.sources.some(s => s.documentTitle.includes('Sports & Cultural')));
  });

  // Test 11: Analytics and Stats
  await test('Analytics and Query Audit Logging', async () => {
    const res = await fetch(`${BASE_URL}/stats`);
    const data = await res.json();
    assert.ok(data.totalDocuments >= 7, 'Expected totalDocuments >= 7 after upload');
    assert.ok(data.totalQueriesAnswered > 0, 'Queries should be recorded');
    assert.ok(Array.isArray(data.recentQueries), 'Recent queries log missing');
    assert.ok(data.recentQueries.length > 0);
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} / ${total} Passed (${Math.round((passed / total) * 100)}%)`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
