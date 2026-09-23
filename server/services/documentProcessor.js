import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Process an uploaded or local file and extract raw text along with structured page/section info
 */
export async function processDocumentFile(filePath, originalFilename) {
  const ext = path.extname(originalFilename || filePath).toLowerCase();
  let fullText = '';
  let pages = [];

  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    // pdf-parse provides page-by-page inspection with custom render
    const pdfData = await pdfParse(dataBuffer, {
      pagerender: function(pageData) {
        return pageData.getTextContent().then(function(textContent) {
          let lastY, text = '';
          for (let item of textContent.items) {
            if (lastY == item.transform[5] || !lastY) {
              text += item.str;
            } else {
              text += '\n' + item.str;
            }
            lastY = item.transform[5];
          }
          return `\n--- PAGE ${pageData.pageIndex + 1} ---\n` + text;
        });
      }
    });

    fullText = pdfData.text || '';
    pages = splitIntoPages(fullText);
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    fullText = result.value || '';
    pages = splitIntoPages(fullText);
  } else {
    // Plain text, markdown or circular text
    fullText = fs.readFileSync(filePath, 'utf-8');
    pages = splitIntoPages(fullText);
  }

  return {
    rawText: fullText,
    pages,
    pageCount: pages.length
  };
}

/**
 * Splits extracted text into page items by detecting explicit page markers or heuristic chunking
 */
function splitIntoPages(text) {
  const pageRegex = /--- PAGE (\d+) ---/gi;
  const matches = [...text.matchAll(pageRegex)];

  if (matches.length > 0) {
    const pages = [];
    for (let i = 0; i < matches.length; i++) {
      const pageNum = parseInt(matches[i][1], 10);
      const startIndex = matches[i].index + matches[i][0].length;
      const endIndex = (i < matches.length - 1) ? matches[i + 1].index : text.length;
      const pageText = text.substring(startIndex, endIndex).trim();
      pages.push({
        pageNumber: pageNum,
        content: pageText
      });
    }
    return pages;
  }

  // Check for explicit "Page X of Y" or "Page X" patterns in text
  const explicitPageRegex = /(?:^|\n)\s*(?:Page|PAGE)\s+(\d+)(?:\s+of\s+\d+)?\s*(?:\n|$)/g;
  const expMatches = [...text.matchAll(explicitPageRegex)];
  if (expMatches.length > 1) {
    const pages = [];
    for (let i = 0; i < expMatches.length; i++) {
      const pageNum = parseInt(expMatches[i][1], 10);
      const startIndex = expMatches[i].index + expMatches[i][0].length;
      const endIndex = (i < expMatches.length - 1) ? expMatches[i + 1].index : text.length;
      pages.push({
        pageNumber: pageNum,
        content: text.substring(startIndex, endIndex).trim()
      });
    }
    return pages;
  }

  // Heuristic: estimate 1,800 characters per page if no explicit markers
  const PAGE_CHAR_LEN = 1800;
  const totalLength = text.length;
  if (totalLength === 0) return [{ pageNumber: 1, content: '' }];

  const pages = [];
  let currentOffset = 0;
  let pageNum = 1;

  while (currentOffset < totalLength) {
    let nextOffset = Math.min(currentOffset + PAGE_CHAR_LEN, totalLength);
    // Find next paragraph or newline break near end
    if (nextOffset < totalLength) {
      const nextBreak = text.indexOf('\n\n', nextOffset - 200);
      if (nextBreak !== -1 && nextBreak <= nextOffset + 200) {
        nextOffset = nextBreak + 2;
      }
    }
    pages.push({
      pageNumber: pageNum++,
      content: text.substring(currentOffset, nextOffset).trim()
    });
    currentOffset = nextOffset;
  }

  return pages;
}
