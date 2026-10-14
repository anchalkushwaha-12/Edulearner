import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { db, ChatMessage } from '../db.js';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../auth.js';

export const aiRouter = Router();

// Candidate models in preference order (all valid @google/genai non-paid models per guidelines)
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

// Initialize GoogleGenAI SDK on the server only
let genAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Math detection & calculation helper for offline or fallback
function trySolveMathQuestion(message: string, isHindi: boolean): string | null {
  const clean = message.toLowerCase().trim();

  // Pattern: square root of X / sqrt(X) / X का वर्गमूल
  const sqrtMatch = clean.match(/(?:square\s*root\s*(?:of)?|sqrt|वर्गमूल)\s*(?:of)?\s*[:\s]*([0-9.]+)/i)
    || clean.match(/([0-9.]+)\s*(?:का)?\s*वर्गमूल/i);

  if (sqrtMatch) {
    const num = parseFloat(sqrtMatch[1]);
    if (!isNaN(num) && num >= 0) {
      const sqrtVal = Math.sqrt(num);
      const rounded = Math.round(sqrtVal * 10000) / 10000;
      const isPerfect = Math.floor(sqrtVal) === sqrtVal;

      if (isHindi) {
        return `### 📐 गणितीय समाधान: $\\sqrt{${num}}$ का मान\n\n` +
          `**परिणाम:** $\\sqrt{${num}} \\approx \\mathbf{${rounded}}$\n\n` +
          `#### चरणबद्ध विधि (भाग विधि / Long Division Method):\n` +
          `1. **दहाई व इकाई के जोड़े बनाना:** दाईं ओर से 2-2 अंकों के जोड़े बनाएँ।\n` +
          `2. **प्रथम अंक का वर्ग:** सबसे बड़ा पूर्णांक जिसका वर्ग पहले जोड़े से छोटा या बराबर हो।\n` +
          `3. **दशमलव मान:** लगातार जोड़े नीचे लाएँ और भाजक को दोगुना करें।\n\n` +
          `*अतः ${num} का वर्गमूल लगभग **${rounded}** है।*`;
      }

      return `### 📐 Mathematical Solution: $\\sqrt{${num}}$\n\n` +
        `**Result:** $\\sqrt{${num}} \\approx \\mathbf{${rounded}}$\n\n` +
        `#### Step-by-Step Calculation (Long Division Method):\n` +
        `1. **Pairing Digits:** Group digits into pairs of two from the decimal point moving left and right.\n` +
        `2. **First Group:** Find the largest integer whose square is $\\le$ the first group.\n` +
        `3. **Division & Doubling:** Bring down the next pair, double the current quotient, and determine the next decimal digit.\n\n` +
        `*Therefore, the square root of ${num} is approximately **${rounded}**.*`;
    }
  }

  // Simple arithmetic evaluation e.g. "what is 25 * 14"
  const arithMatch = clean.match(/(?:what\s+is\s+|calculate\s+|मान\s+बताएँ\s+)?([0-9.]+)\s*([\+\-\*\/xX÷])\s*([0-9.]+)/);
  if (arithMatch) {
    const a = parseFloat(arithMatch[1]);
    let op = arithMatch[2].toLowerCase();
    const b = parseFloat(arithMatch[3]);

    if (!isNaN(a) && !isNaN(b)) {
      let res = 0;
      let opSymbol = op;
      if (op === '+' ) res = a + b;
      else if (op === '-') res = a - b;
      else if (op === '*' || op === 'x') { res = a * b; opSymbol = '×'; }
      else if (op === '/' || op === '÷') {
        if (b === 0) return isHindi ? 'शून्य (0) से भाग परिभाषित नहीं है।' : 'Division by zero is undefined.';
        res = a / b;
        opSymbol = '÷';
      }

      const resRounded = Math.round(res * 10000) / 10000;
      if (isHindi) {
        return `### 📐 गणितीय हल:\n\n$$${a} ${opSymbol} ${b} = \\mathbf{${resRounded}}$$\n\n*गणना पूर्ण हुई।*`;
      }
      return `### 📐 Calculation Result:\n\n$$${a} ${opSymbol} ${b} = \\mathbf{${resRounded}}$$\n\n*Calculation complete.*`;
    }
  }

  return null;
}

// Helper: Provide rich educational fallback if Gemini API is offline or temporarily unavailable
function generateEducationalFallback(params: {
  message: string;
  language: 'hi' | 'en';
  grade: number;
  subject: string;
  topic?: string;
  request_type?: 'hint' | 'explanation' | 'followup';
}): { reply: string; hints: string[]; is_live_provider: boolean } {
  const { message, language, grade, subject, topic, request_type } = params;
  const isHindi = language === 'hi';

  // Check if it's a direct mathematical problem first
  const mathSolution = trySolveMathQuestion(message, isHindi);
  if (mathSolution) {
    return {
      reply: mathSolution,
      hints: isHindi
        ? ['क्या आप इसे अभाज्य गुणनखंड विधि से देखना चाहते हैं?', 'क्या आप एक अभ्यास प्रश्न हल करना चाहते हैं?']
        : ['Would you like to see the prime factorization?', 'Would you like a practice problem on this topic?'],
      is_live_provider: false
    };
  }

  if (request_type === 'hint') {
    if (isHindi) {
      return {
        reply: `💡 **कक्षा ${grade} संकेत:**\n\n` +
          `1. प्रश्न को ध्यान से पढ़ें और मुख्य मानों को अलग लिखें: "*${message}*"\n` +
          `2. गणित या विज्ञान में पहले बुनियादी परिभाषा और सूत्र याद करें।\n` +
          `3. चरणबद्ध तरीके से मान रखकर जाँच करें।`,
        hints: [
          'चरण 1: ज्ञात और अज्ञात मानों की सूची बनाएँ।',
          'चरण 2: संबंधित मूल नियम या सूत्र लागू करें।',
          'चरण 3: अपनी गणना को दोबारा जाँचें।'
        ],
        is_live_provider: false
      };
    }
    return {
      reply: `💡 **Grade ${grade} Socratic Hint:**\n\n` +
        `1. Identify what given data you have in: "*${message}*"\n` +
        `2. Write down the core formula or theorem that connects these variables.\n` +
        `3. Work step by step without skipping intermediate arithmetic.`,
      hints: [
        'Step 1: Write down the known values and what to find.',
        'Step 2: Apply the relevant fundamental rule or formula.',
        'Step 3: Double-check your calculation.'
      ],
      is_live_provider: false
    };
  }

  if (isHindi) {
    return {
      reply: `नमस्ते! मैं आपका लर्नमेट (LearnMate) सहायक शिक्षक हूँ।\n\n` +
        `**कक्षा ${grade} • ${subject}${topic ? ` (${topic})` : ''}**\n\n` +
        `आपके प्रश्न: "*${message}*"\n\n` +
        `### अवधारणा एवं मार्गदर्शन:\n` +
        `• **मुख्य विचार:** इस विषय को व्यावहारिक जीवन के उदाहरणों से जोड़कर समझें।\n` +
        `• **सूत्र/नियम:** NCERT कक्षा ${grade} के आधार पर संबंधित अध्याय के मूल सिद्धांतों को लागू करें।\n` +
        `• **अभ्यास:** यदि यह गणना से जुड़ा है, तो मानों को समीकरण में रखकर हल करें।\n\n` +
        `क्या आप चाहते हैं कि मैं इस पर विस्तृत संकेत दूँ या कोई अभ्यास प्रश्न हल कराऊँ?`,
      hints: [
        'क्या आप इस पर 1 अभ्यास प्रश्न हल करना चाहते हैं?',
        'क्या आप इस पर कोई संकेत चाहते हैं?'
      ],
      is_live_provider: false
    };
  }

  return {
    reply: `Hello! I am your LearnMate AI rural education tutor.\n\n` +
      `**Grade ${grade} • ${subject}${topic ? ` (${topic})` : ''}**\n\n` +
      `Regarding your question: "*${message}*"\n\n` +
      `### Educational Explanation:\n` +
      `• **Key Concept:** Grounded in Grade ${grade} ${subject} syllabus.\n` +
      `• **Method:** Start with primary definitions, set up the problem systematically, and double-check units.\n` +
      `• **Application:** Apply the foundational rules to solve step by step.\n\n` +
      `Would you like a step-by-step hint, a practice question, or a simpler breakdown?`,
    hints: [
      'Would you like a quick practice quiz question?',
      'Would you like a Socratic hint on how to proceed?'
    ],
    is_live_provider: false
  };
}

// POST /api/ai/tutor - Chat with AI Tutor
aiRouter.post('/tutor', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      message,
      session_id = `sess-${Date.now()}`,
      language = req.user?.language || 'hi',
      grade = req.user?.grade || 8,
      subject = 'Mathematics',
      topic,
      request_type = 'explanation', // 'explanation' | 'hint' | 'followup'
      document_context,
    } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    const userId = req.user?.id || 'guest-student';
    const lang = language === 'en' ? 'en' : 'hi';

    // Build system instruction
    const systemPrompt = `You are "LearnMate AI", an exceptionally clear, friendly, and expert personal AI tutor designed specifically for school students in rural India studying under CBSE and State Boards.
Target Student Profile:
- Grade: ${grade}
- Current Subject: ${subject}
${topic ? `- Current Topic: ${topic}` : ''}
- Student's Preferred Language: ${lang === 'hi' ? 'Hindi (हिन्दी / सरल हिंग्लिश जब आवश्यक हो)' : 'Simple English with bilingual support'}
- Mode: ${request_type === 'hint' ? 'Give a subtle Socratic hint and guide them to solve it themselves without spoiling the complete answer immediately' : 'Provide a thorough, accurate, step-by-step explanation. If asked to calculate or find an answer (e.g. square roots, equations, science facts), perform the exact calculation and explain the steps clearly with clean mathematical notation.'}

Safety & Pedagogical Guidelines:
1. Speak in an encouraging, respectful tone (जैसे "बहुत अच्छा सवाल!", "शाबाश!").
2. Answer the specific question directly and accurately. For calculations (like square roots, algebra, physics numericals), show the full working and the numerical answer.
3. Use clear headings, bullet points, and clean mathematical notation.
4. Keep sentences concise and easy to read on mobile screens.
5. If Document Context is provided below, ground your response strictly on that document, citing sections accurately.

${document_context ? `=== DOCUMENT RETRIEVED CONTEXT (GROUNDING SOURCE) ===\n${document_context}\n======================================================` : ''}
`;

    let aiReply = '';
    let isLive = false;
    let providerInfo = 'LearnMate Offline Educational Engine';

    // Call Gemini with candidate models fallback chain & retry for transient errors
    if (process.env.GEMINI_API_KEY) {
      const client = genAI || new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      // Retrieve last 4 chat messages for context
      const recentMessages = db.chat_messages
        .filter(m => m.user_id === userId && m.session_id === session_id)
        .slice(-4)
        .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
        .join('\n');

      const userPrompt = recentMessages
        ? `Conversation history:\n${recentMessages}\n\nStudent's new question:\n${message}`
        : message;

      for (const modelName of CANDIDATE_MODELS) {
        try {
          console.log(`[AI Tutor] Attempting generation with model '${modelName}'...`);
          const response = await client.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7,
            },
          });

          if (response && response.text) {
            aiReply = response.text;
            isLive = true;
            providerInfo = `Gemini (${modelName})`;
            console.log(`[AI Tutor] Success with model '${modelName}'!`);
            break;
          }
        } catch (geminiError: any) {
          console.warn(`[AI Tutor] Model '${modelName}' returned error:`, geminiError?.message || geminiError);
          // Continue to next candidate model in chain
        }
      }
    }

    // Fallback if live call wasn't available or all models were busy
    let hints: string[] = [];
    if (!aiReply) {
      const fallback = generateEducationalFallback({
        message,
        language: lang,
        grade: Number(grade),
        subject,
        topic,
        request_type,
      });
      aiReply = fallback.reply;
      hints = fallback.hints;
      isLive = false;
      providerInfo = 'LearnMate Offline Math & Education Engine';
    }

    // Store user message & assistant message in history
    const now = new Date().toISOString();
    const userMsgRecord: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      user_id: userId,
      session_id,
      role: 'user',
      content: message.trim(),
      language: lang,
      subject,
      topic,
      created_at: now,
    };
    const botMsgRecord: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      user_id: userId,
      session_id,
      role: 'assistant',
      content: aiReply,
      language: lang,
      subject,
      topic,
      created_at: new Date(Date.now() + 100).toISOString(),
    };

    db.chat_messages.push(userMsgRecord, botMsgRecord);
    // Keep max 500 messages in memory
    if (db.chat_messages.length > 500) {
      db.chat_messages.splice(0, db.chat_messages.length - 500);
    }
    db.save();

    res.json({
      reply: aiReply,
      session_id,
      language: lang,
      is_live_provider: isLive,
      provider_info: providerInfo,
      suggested_hints: hints,
    });
  } catch (err: any) {
    console.error('AI Tutor endpoint error:', err);
    res.status(500).json({ error: 'Failed to process AI tutoring request.' });
  }
});

// GET /api/ai/history - Get student chat session history
aiRouter.get('/history', optionalAuthenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'guest-student';
  const sessionId = req.query.session_id as string;

  let messages = db.chat_messages.filter(m => m.user_id === userId);
  if (sessionId) {
    messages = messages.filter(m => m.session_id === sessionId);
  }

  res.json({
    messages: messages.slice(-50),
  });
});
