import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Building2,
  Calendar,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';
import { uploadDocument, deleteDocument, fetchDocumentChunks, resetSeedDocuments } from '../services/api';

export default function DocumentManager({
  documents = [],
  onRefreshDocs,
  onNotification
}) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Academic Affairs');
  const [category, setCategory] = useState('Academics');
  const [date, setDate] = useState('2025-08-01');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Search & chunk inspection state
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDocChunks, setSelectedDocChunks] = useState(null);
  const [loadingChunks, setLoadingChunks] = useState(false);

  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (selectedFile) => {
    setFile(selectedFile);
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      if (onNotification) onNotification('Please select a PDF, DOCX, or TXT file to upload', 'error');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('department', department);
      formData.append('category', category);
      formData.append('date', date);

      const res = await uploadDocument(formData);
      if (onNotification) onNotification(`Success! Processed & indexed ${res.chunkCount} chunks.`, 'success');

      // Reset form
      setFile(null);
      setTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onRefreshDocs) onRefreshDocs();
    } catch (err) {
      if (onNotification) onNotification('Upload failed: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, docTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${docTitle}" and all its vector chunks?`)) return;
    try {
      await deleteDocument(docId);
      if (onNotification) onNotification(`Deleted "${docTitle}"`, 'success');
      if (onRefreshDocs) onRefreshDocs();
    } catch (err) {
      if (onNotification) onNotification(err.message, 'error');
    }
  };

  const handleInspectChunks = async (docId) => {
    try {
      setLoadingChunks(true);
      const data = await fetchDocumentChunks(docId);
      setSelectedDocChunks(data);
    } catch (err) {
      if (onNotification) onNotification('Failed to load chunks: ' + err.message, 'error');
    } finally {
      setLoadingChunks(false);
    }
  };

  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    doc.department.toLowerCase().includes(searchFilter.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Document Hub & Vector Ingestion</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Upload official university documents (PDF, DOCX, TXT). Text will be extracted, split into section-aware chunks, and embedded in the vector database.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Upload Form Card */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={20} color="var(--primary)" />
            <span>Upload New College Document</span>
          </h3>

          <form onSubmit={handleUploadSubmit}>
            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-subtle)'}`,
                borderRadius: '12px',
                padding: '1.75rem 1rem',
                textAlign: 'center',
                background: dragActive ? 'var(--primary-glow)' : 'var(--bg-input)',
                cursor: 'pointer',
                marginBottom: '1rem',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
              />
              <UploadCloud size={32} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                {file ? file.name : 'Click or drop PDF / DOCX / TXT file here'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Official handbooks, policies, or notifications (up to 25MB)'}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Document Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Academic Regulations 2025–26"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  className="form-select"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                >
                  <option value="Academic Affairs">Academic Affairs</option>
                  <option value="Hostel Administration">Hostel Administration</option>
                  <option value="Training & Placement">Training & Placement</option>
                  <option value="Student Welfare">Student Welfare</option>
                  <option value="Accounts & Scholarships">Accounts & Scholarships</option>
                  <option value="Controller of Examinations">Controller of Examinations</option>
                  <option value="General Administration">General Administration</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="Academics">Academics</option>
                  <option value="Hostel & Residence">Hostel & Residence</option>
                  <option value="Placement & Career">Placement & Career</option>
                  <option value="Student Welfare & Leave">Student Welfare & Leave</option>
                  <option value="Financial Aid & Scholarships">Financial Aid & Scholarships</option>
                  <option value="Examinations">Examinations</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Effective Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={uploading || !file}
            >
              {uploading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Extracting & Chunking Document...</span>
                </>
              ) : (
                <>
                  <Layers size={16} />
                  <span>Process & Index Document</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Documents Table Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Indexed College Documents ({documents.length})
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                All documents registered in vector store
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '30px', fontSize: '0.82rem', padding: '0.4rem 0.65rem 0.4rem 30px', width: '180px' }}
                  placeholder="Filter documents..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '1rem 1.15rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1 }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: 'var(--primary-glow)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {doc.title}
                    </h4>
                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{doc.department}</span>
                      <span>•</span>
                      <span>{doc.category}</span>
                      <span>•</span>
                      <span>{doc.pageCount} Pages</span>
                      <span>•</span>
                      <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{doc.chunkCount} Chunks</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                    onClick={() => handleInspectChunks(doc.id)}
                    title="View all extracted text chunks and vector embeddings"
                  >
                    <Eye size={14} />
                    <span>Chunks</span>
                  </button>

                  <button
                    className="icon-btn"
                    style={{ width: '32px', height: '32px' }}
                    onClick={() => handleDelete(doc.id, doc.title)}
                    title="Delete document"
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chunk Inspector Modal */}
      {selectedDocChunks && (
        <div className="modal-overlay" onClick={() => setSelectedDocChunks(null)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-purple-bg)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                    Chunk Inspector: {selectedDocChunks.document.title}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Total {selectedDocChunks.chunks.length} Chunks indexed into the Vector Store
                  </p>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setSelectedDocChunks(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {selectedDocChunks.chunks.map((chk, idx) => (
                <div
                  key={chk.id}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      Chunk #{idx + 1} ({chk.id})
                    </span>
                    <div style={{ display: 'flex', gap: '0.65rem', color: 'var(--text-dim)' }}>
                      <span>Page: <strong>{chk.pageNumber}</strong></span>
                      <span>Section: <strong>{chk.section}</strong></span>
                      <span>Chars: <strong>{chk.charCount}</strong></span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--text-main)', whiteSpace: 'pre-wrap', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    {chk.content}
                  </p>

                  {chk.embeddingPreview && (
                    <div style={{ marginTop: '0.45rem', fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      Dense Embedding Preview (First 8 dims): [{chk.embeddingPreview.map(v => v.toFixed(3)).join(', ')}...]
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-card)' }}>
              <button className="btn-primary" onClick={() => setSelectedDocChunks(null)}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
