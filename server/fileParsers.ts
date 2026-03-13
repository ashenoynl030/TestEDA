import JSZip from 'jszip';
import * as XLSX from 'xlsx';

/**
 * Extract all text content from a PowerPoint (.pptx) file.
 *
 * PPTX files are ZIP archives containing XML slides. We extract text from:
 * - Slide content (ppt/slides/slideN.xml)
 * - Slide notes (ppt/notesSlides/notesSlideN.xml)
 *
 * This runs server-side so no secrets are exposed to the browser.
 */
export async function extractTextFromPptx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const textParts: string[] = [];

  // Get all slide files sorted by slide number
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });

  for (const slidePath of slideFiles) {
    const slideNum = slidePath.match(/slide(\d+)/)?.[1] || '?';
    const xml = await zip.files[slidePath].async('text');

    // Extract text from <a:t> tags (PowerPoint text elements)
    const texts = extractXmlTextNodes(xml);
    if (texts.length > 0) {
      textParts.push(`[Slide ${slideNum}]`);
      textParts.push(texts.join(' '));
      textParts.push('');
    }
  }

  // Also extract from notes slides
  const noteFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(name))
    .sort();

  for (const notePath of noteFiles) {
    const noteNum = notePath.match(/notesSlide(\d+)/)?.[1] || '?';
    const xml = await zip.files[notePath].async('text');
    const texts = extractXmlTextNodes(xml);
    if (texts.length > 0) {
      textParts.push(`[Notes - Slide ${noteNum}]`);
      textParts.push(texts.join(' '));
      textParts.push('');
    }
  }

  return textParts.join('\n');
}

/**
 * Extract text from XML by finding all <a:t>...</a:t> elements.
 * Simple regex-based extraction — sufficient for text content.
 */
function extractXmlTextNodes(xml: string): string[] {
  const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
  return matches
    .map(m => m.replace(/<\/?a:t>/g, '').trim())
    .filter(t => t.length > 0);
}

/**
 * Extract all text content from an Excel (.xlsx/.xls) file.
 *
 * Converts each sheet to CSV-like text, preserving headers and data.
 * This runs server-side so no secrets are exposed to the browser.
 */
export function extractTextFromXlsx(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const textParts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    if (csv.trim()) {
      textParts.push(`[Sheet: ${sheetName}]`);
      textParts.push(csv);
      textParts.push('');
    }
  }

  return textParts.join('\n');
}
