const API_BASE = 'http://localhost:5000/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to connect to backend server');
  return res.json();
}

export async function fetchDocuments() {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function fetchDocumentChunks(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}/chunks`);
  if (!res.ok) throw new Error('Failed to fetch document chunks');
  return res.json();
}

export async function uploadDocument(formData) {
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export async function deleteDocument(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete document');
  return res.json();
}

export async function resetSeedDocuments() {
  const res = await fetch(`${API_BASE}/documents/reset-seed`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reset seed documents');
  return res.json();
}

export async function submitRagQuery(payload) {
  const res = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Query processing failed' }));
    throw new Error(err.error || 'Query processing failed');
  }
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(settings) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}
