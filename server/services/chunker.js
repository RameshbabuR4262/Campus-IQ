/**
 * Document chunker service with section heading detection and page preservation
 */

export function chunkDocument(document, options = {}) {
  const {
    chunkSize = 650,      // target characters per chunk
    chunkOverlap = 120,   // overlap characters
  } = options;

  const chunks = [];
  const { id: docId, title: docTitle, department, category, date, pages = [] } = document;

  let globalChunkIndex = 0;

  for (const page of pages) {
    const pageNumber = page.pageNumber;
    const pageText = page.content || '';

    if (!pageText.trim()) continue;

    // Split page into paragraphs or sections
    const paragraphs = pageText.split(/\n\s*\n/);
    let currentChunkText = '';
    let currentSection = detectSectionTitle(pageText) || 'General Guidelines';

    for (let p of paragraphs) {
      p = p.trim();
      if (!p) continue;

      // Check if this paragraph starts with a new section title
      const newSection = detectSectionTitle(p);
      if (newSection) {
        currentSection = newSection;
      }

      if ((currentChunkText + '\n\n' + p).length <= chunkSize) {
        currentChunkText = currentChunkText ? `${currentChunkText}\n\n${p}` : p;
      } else {
        // Current chunk has reached limit, flush it
        if (currentChunkText.trim()) {
          chunks.push(createChunkObj({
            docId,
            docTitle,
            department,
            category,
            date,
            pageNumber,
            section: currentSection,
            content: currentChunkText.trim(),
            chunkIndex: globalChunkIndex++
          }));
        }

        // If paragraph alone is longer than chunkSize, split it by sentence or window
        if (p.length > chunkSize) {
          const subChunks = splitLongParagraph(p, chunkSize, chunkOverlap);
          for (let i = 0; i < subChunks.length; i++) {
            const isLast = (i === subChunks.length - 1);
            if (isLast && subChunks[i].length < chunkSize / 2) {
              currentChunkText = subChunks[i];
            } else {
              chunks.push(createChunkObj({
                docId,
                docTitle,
                department,
                category,
                date,
                pageNumber,
                section: currentSection,
                content: subChunks[i].trim(),
                chunkIndex: globalChunkIndex++
              }));
              currentChunkText = '';
            }
          }
        } else {
          // Carry over overlap if possible
          const overlapText = getOverlapSnippet(currentChunkText, chunkOverlap);
          currentChunkText = overlapText ? `${overlapText}\n${p}` : p;
        }
      }
    }

    // Flush remaining text on page
    if (currentChunkText.trim()) {
      chunks.push(createChunkObj({
        docId,
        docTitle,
        department,
        category,
        date,
        pageNumber,
        section: currentSection,
        content: currentChunkText.trim(),
        chunkIndex: globalChunkIndex++
      }));
    }
  }

  return chunks;
}

function detectSectionTitle(text) {
  // Matches patterns like:
  // "Section 4.1: Attendance Requirements"
  // "Section 5 - Eligibility Criteria"
  // "ARTICLE II: Hostel Timings"
  // "### Placement Guidelines"
  // "POLICY 2: One-Student-One-Job Policy"
  // "Rule 8: Leave of Absence"
  const lines = text.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const headingMatch = line.match(/^(?:#+\s*|(?:Section|SECTION|Article|ARTICLE|Policy|POLICY|Rule|RULE|Clause|CLAUSE)\s+[\d\.\w]+[:\-\s]+)(.+)/i);
    if (headingMatch) {
      return line.replace(/^#+\s*/, '').trim();
    }
    // Uppercase headings e.g. "ATTENDANCE AND CONDONATION RULES"
    if (line.length >= 5 && line.length <= 60 && line === line.toUpperCase() && /^[A-Z\s\d\:\-\,\(\)\.\/]+$/.test(line)) {
      return line.trim();
    }
  }
  return null;
}

function splitLongParagraph(text, chunkSize, overlap) {
  const result = [];
  let start = 0;
  while (start < text.length) {
    let end = start + chunkSize;
    if (end < text.length) {
      // Find sentence boundary or period
      const lastPeriod = text.lastIndexOf('. ', end);
      if (lastPeriod > start + chunkSize * 0.6) {
        end = lastPeriod + 1;
      } else {
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start + chunkSize * 0.7) {
          end = lastSpace;
        }
      }
    }
    result.push(text.substring(start, end).trim());
    start = end - overlap;
    if (start < 0) start = 0;
    if (end >= text.length) break;
  }
  return result;
}

function getOverlapSnippet(text, overlapSize) {
  if (!text || text.length <= overlapSize) return '';
  return text.substring(text.length - overlapSize).trim();
}

function createChunkObj({ docId, docTitle, department, category, date, pageNumber, section, content, chunkIndex }) {
  return {
    id: `${docId}_chunk_${chunkIndex}`,
    docId,
    docTitle,
    department: department || 'General',
    category: category || 'Academic',
    date: date || new Date().toISOString().split('T')[0],
    pageNumber: pageNumber || 1,
    section: section || 'General',
    content,
    charCount: content.length,
    approxTokens: Math.ceil(content.length / 4)
  };
}
