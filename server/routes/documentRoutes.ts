import { Router, Response } from 'express';
import { db, DocumentRecord, DocumentChunk } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../auth.js';
import { GoogleGenAI } from '@google/genai';

export const documentRouter = Router();

// Simple text chunker
function chunkText(text: string, chunkSize: number = 400, overlap: number = 50): DocumentChunk[] {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const chunks: DocumentChunk[] = [];
  let chunkIdx = 1;

  for (const para of paragraphs) {
    if (para.length <= chunkSize) {
      chunks.push({
        id: `chk-${chunkIdx++}`,
        text: para.trim(),
      });
    } else {
      // Split into sentences or word chunks
      let start = 0;
      while (start < para.length) {
        const end = Math.min(start + chunkSize, para.length);
        const segment = para.slice(start, end).trim();
        if (segment) {
          chunks.push({
            id: `chk-${chunkIdx++}`,
            text: segment,
          });
        }
        start += chunkSize - overlap;
      }
    }
  }

  // If no paragraphs were found, fallback to linear split
  if (chunks.length === 0 && text.trim().length > 0) {
    chunks.push({
      id: `chk-1`,
      text: text.slice(0, chunkSize).trim(),
    });
  }

  return chunks;
}

// Retrieve relevant passages using TF/IDF-style keyword similarity
function retrievePassages(chunks: DocumentChunk[], query: string, topK: number = 3): DocumentChunk[] {
  const queryTerms = query.toLowerCase().replace(/[^a-z0-9\u0900-\u097F\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  if (queryTerms.length === 0) {
    return chunks.slice(0, topK);
  }

  const scored = chunks.map(chunk => {
    const chunkLower = chunk.text.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      if (chunkLower.includes(term)) {
        // Count occurrences
        const occurrences = (chunkLower.match(new RegExp(term, 'g')) || []).length;
        score += occurrences;
      }
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).slice(0, topK).map(s => s.chunk);
}

// Upload document (text payload or paste)
documentRouter.post('/upload', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { filename, content, mime_type = 'text/plain' } = req.body;

    if (!filename || !content) {
      res.status(400).json({ error: 'Filename and document content are required.' });
      return;
    }

    if (typeof content !== 'string' || content.trim().length < 10) {
      res.status(400).json({ error: 'Document must contain at least 10 characters of readable text.' });
      return;
    }

    // Limit to ~2MB text
    if (content.length > 2 * 1024 * 1024) {
      res.status(400).json({ error: 'Document size exceeds maximum allowable limit of 2MB.' });
      return;
    }

    const chunks = chunkText(content);
    const newDoc: DocumentRecord = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      filename: filename.trim(),
      file_size: Buffer.byteLength(content, 'utf8'),
      mime_type,
      chunks,
      created_at: new Date().toISOString(),
    };

    db.documents.push(newDoc);
    db.save();

    res.status(201).json({
      message: 'Document processed and indexed successfully.',
      document: {
        id: newDoc.id,
        filename: newDoc.filename,
        file_size: newDoc.file_size,
        total_chunks: newDoc.chunks.length,
        created_at: newDoc.created_at,
      },
    });
  } catch (err: any) {
    console.error('Document upload error:', err);
    res.status(500).json({ error: 'Failed to process document upload.' });
  }
});

// List user's documents (strictly user-isolated)
documentRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const docs = db.documents
    .filter(d => d.user_id === userId)
    .map(d => ({
      id: d.id,
      filename: d.filename,
      file_size: d.file_size,
      total_chunks: d.chunks.length,
      created_at: d.created_at,
    }));

  res.json({ documents: docs });
});

// Delete document (strictly user-isolated)
documentRouter.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const index = db.documents.findIndex(d => d.id === req.params.id && d.user_id === userId);

  if (index === -1) {
    res.status(404).json({ error: 'Document not found or access unauthorized.' });
    return;
  }

  db.documents.splice(index, 1);
  db.save();

  res.json({ message: 'Document deleted successfully.' });
});

// Ask grounded question against an uploaded document
documentRouter.post('/:id/ask', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const doc = db.documents.find(d => d.id === req.params.id && d.user_id === userId);

    if (!doc) {
      res.status(404).json({ error: 'Document not found or access unauthorized.' });
      return;
    }

    const { question, language = req.user?.language || 'hi' } = req.body;
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      res.status(400).json({ error: 'Question is required.' });
      return;
    }

    const relevantChunks = retrievePassages(doc.chunks, question, 3);

    if (relevantChunks.length === 0) {
      const msg = language === 'hi'
        ? `दस्तावेज़ "${doc.filename}" में इस प्रश्न से संबंधित पर्याप्त जानकारी नहीं मिली। कृपया अपने दस्तावेज़ के अनुसार प्रश्न पूछें।`
        : `Insufficient evidence found in document "${doc.filename}" to answer this question. Please ask a question related to the uploaded content.`;
      res.json({
        answer: msg,
        citations: [],
        has_sufficient_evidence: false,
      });
      return;
    }

    const contextText = relevantChunks.map((c, i) => `[Passage ${i + 1} (${c.id})]:\n${c.text}`).join('\n\n');

    let groundedAnswer = '';
    let isLive = false;

    if (process.env.GEMINI_API_KEY) {
      const client = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const prompt = `You are a strict, helpful educational assistant grounding your answers ONLY on the provided document excerpts.
Document Name: "${doc.filename}"
Excerpts:
${contextText}

Question:
"${question}"

Instructions:
1. Answer in ${language === 'hi' ? 'Hindi (सरल और स्पष्ट हिन्दी)' : 'Simple English'}.
2. Use ONLY facts explicitly stated in the excerpts above. Do not hallucinate or assume facts not present.
3. Explicitly cite which passage supports your statement (e.g. "[Passage 1]").
4. If the excerpt does NOT contain enough details to answer fully, state clearly: "${language === 'hi' ? 'इस दस्तावेज़ में इसका पूरा विवरण उपलब्ध नहीं है' : 'The document does not contain sufficient details to answer this completely'}".`;

      const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      for (const m of CANDIDATE_MODELS) {
        try {
          const response = await client.models.generateContent({
            model: m,
            contents: prompt,
          });

          if (response && response.text) {
            groundedAnswer = response.text;
            isLive = true;
            break;
          }
        } catch (e: any) {
          console.warn(`[Document Q&A] Model '${m}' failed, trying next:`, e?.message || e);
        }
      }
    }

    if (!groundedAnswer) {
      if (language === 'hi') {
        groundedAnswer = `दस्तावेज़ "${doc.filename}" के मुख्य उद्धरणों के आधार पर:\n\n` +
          relevantChunks.map((c, i) => `**[उद्धरण ${i + 1}]:** ${c.text}`).join('\n\n') +
          `\n\n📌 *संकेत:* उपरोक्त अंश आपके प्रश्न से सबसे अधिक मिलते-जुलते हैं।`;
      } else {
        groundedAnswer = `Based on relevant excerpts from "${doc.filename}":\n\n` +
          relevantChunks.map((c, i) => `**[Passage ${i + 1}]:** ${c.text}`).join('\n\n') +
          `\n\n📌 *Note:* These excerpts match the key concepts of your question.`;
      }
    }

    res.json({
      answer: groundedAnswer,
      citations: relevantChunks.map(c => ({ chunk_id: c.id, snippet: c.text.slice(0, 120) + '...' })),
      has_sufficient_evidence: true,
      is_live_provider: isLive,
    });
  } catch (err: any) {
    console.error('Document ask error:', err);
    res.status(500).json({ error: 'Failed to process grounded question.' });
  }
});
