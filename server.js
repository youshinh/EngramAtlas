const express = require('express');
const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// In-memory mock database for fallback
let mockEngrams = [];
let isMongoActive = false;

// Load AGENT.MD system instructions
let systemInstruction = "あなたは計算生命体進化エンジン「EngramAtlas-Core」です。";
try {
  const agentMdPath = path.join(__dirname, '.antigravity', 'AGENT.MD');
  if (fs.existsSync(agentMdPath)) {
    systemInstruction = fs.readFileSync(agentMdPath, 'utf8');
  }
} catch (err) {
  console.warn("⚠️ AGENT.MD の読み込みに失敗しました。デフォルトの指示を使用します。");
}

// ----------------------------------------------------
// 🧠 Core Helper Functions for Evolution Engine
// ----------------------------------------------------

// Cosine Similarity computation
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Highly Intelligent Deterministic Mock Embedding generator (3,072 dimensions)
function getMockEmbedding(text) {
  const vector = [];
  const textLen = text.length || 1;
  
  const charCounts = new Array(256).fill(0);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) % 256;
    charCounts[code]++;
  }
  
  for (let i = 0; i < 3072; i++) {
    const baseWave = Math.sin(i * 0.05) * 0.04;
    const charIndex = i % 256;
    const count = charCounts[charIndex];
    const semanticWeight = (count / textLen) * Math.cos(i + charIndex) * 0.08;
    vector.push(baseWave + semanticWeight);
  }
  return vector;
}

// Pre-populate mock database with initial beautiful engrams to prevent empty canvas
const initialNoise1 = "階段の段板における木目の『反り』を構造強度に組み込む逆限定設計。DMR加工による気流と滑り止め制御。";
const initialNoise2 = "不均質マテリアル（癖木や端材）の長所を活かす匠の技と、境界面における流体抵抗削減（DMR）技術の共振。";
const initialNoise3 = "関係性の規約としての自己組織化メモリ。静的なドキュメント管理を超えて、意味のゆらぎをリアルタイムにマッピングする。";

mockEngrams = [
  {
    _id: "sample_1",
    content: initialNoise1,
    raw_input_type: "text",
    created_at: new Date(Date.now() - 7200000),
    metadata: { scope: "PERSONAL", tags: ["architecture", "wood-physics", "DMR"], entropy_score: 0.85 },
    vector_embeddings: getMockEmbedding(initialNoise1),
    related_links: [
      { to_engram_id: "sample_2", strength: 0.88, reason_of_connection: "不均質マテリアルの性質を最大限活用する設計哲学において共鳴" }
    ],
    evolution_history: [{ timestamp: new Date(Date.now() - 7200000), action: "create", comment: "Initial sample node" }]
  },
  {
    _id: "sample_2",
    content: initialNoise2,
    raw_input_type: "text",
    created_at: new Date(Date.now() - 3600000),
    metadata: { scope: "PERSONAL", tags: ["material-science", "craftsmanship"], entropy_score: 0.72 },
    vector_embeddings: getMockEmbedding(initialNoise2),
    related_links: [
      { to_engram_id: "sample_1", strength: 0.88, reason_of_connection: "不均質マテリアルの性質を最大限活用する設計哲学において共鳴" }
    ],
    evolution_history: [{ timestamp: new Date(Date.now() - 3600000), action: "create", comment: "Initial sample node" }]
  },
  {
    _id: "sample_3",
    content: initialNoise3,
    raw_input_type: "text",
    created_at: new Date(),
    metadata: { scope: "PERSONAL", tags: ["philosophy", "memory-network"], entropy_score: 0.55 },
    vector_embeddings: getMockEmbedding(initialNoise3),
    related_links: [],
    evolution_history: [{ timestamp: new Date(), action: "create", comment: "Initial sample node" }]
  }
];

// ----------------------------------------------------
// 🛡️ Day 6-8 Resilience and Triage Core Logic
// ----------------------------------------------------

// Triage error classification
function triageError(err) {
  const message = err.message || "";
  
  if (
    message.includes('429') || 
    message.includes('rate limit') || 
    message.includes('ResourceExhausted') || 
    message.includes('timeout') || 
    message.includes('ECONNRESET') ||
    message.includes('ETIMEDOUT') ||
    message.includes('TRANSIENT')
  ) {
    return 'TRANSIENT';
  }
  
  return 'FATAL';
}

// Exponential Backoff retry helper
async function retryWithBackoff(fn, retries = 3, initialDelay = 500, currentLang = 'en', onRetry = null) {
  let delay = initialDelay;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const errorType = triageError(err);
      
      console.warn(`⚠️ [Attempt ${attempt}/${retries}] Error type: ${errorType} | Message: ${err.message}`);
      
      if (onRetry) {
        onRetry(attempt, errorType, err.message);
      }
      
      if (errorType === 'FATAL' || attempt === retries) {
        throw err;
      }
      
      console.log(`🔌 [Triage: TRANSIENT] Exponential backoff triggered. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

// Get embedding vector via Google Gen AI SDK or fallback mock
async function getEmbedding(text, apiKey) {
  const embedModel = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2-preview';
  
  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.embedContent({
        model: embedModel,
        contents: text
      });
      return response.embeddings[0].values;
    } catch (err) {
      console.warn(`⚠️ [Gemini Embeddings API Error using ${embedModel}] Fallback to mock:`, err.message);
    }
  }
  return getMockEmbedding(text);
}

// Ask Gemini for connection reasoning
async function generateReasonOfConnection(textA, textB, currentLang, apiKey) {
  const cleanA = textA || "";
  const cleanB = textB || "";

  const prompt = currentLang === 'ja'
    ? `以下の2つの思考ノイズは概念的類似性が高く、深いレベルで関係しています。
【思考A】: "${cleanA}"
【思考B】: "${cleanB}"

この2つの思考が繋がる背景にある文脈や、共鳴する意味（関係性の理由）を、日本語1〜2文で知的かつ簡潔に説明してください。余計な挨拶や前置きは省いて理由のみを返してください。`
    : `The following two thought noises have high conceptual similarity and are connected on a deep level.
[Thought A]: "${cleanA}"
[Thought B]: "${cleanB}"

Please explain the context or resonant meaning (reason of connection) between these two thoughts in 1 or 2 elegant and concise sentences in English. Do not include any greeting or conversational filler.`;

  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { systemInstruction: systemInstruction, temperature: 0.7 }
      });
      return response.text.trim();
    } catch (err) {
      console.warn("⚠️ [Gemini Content API Error in reasoning] Fallback connection reason used.");
    }
  }

  const isPoetry = cleanA.includes('道') || cleanA.includes('流') || cleanA.includes('いのち') || cleanA.includes('静');
  if (isPoetry) {
    return currentLang === 'ja'
      ? `自己の歩む孤独な道の選択と、相反する静的・動的境界の調和が「自己同一と動的平衡」の精神において美しく共鳴しています。`
      : `The internal journey of walking one's own path and the harmony of opposite forces beautifully resonate in the spirit of dynamic equilibrium.`;
  }

  return currentLang === 'ja'
    ? `マテリアルの不均質性・癖を受容する構造設計アプローチと、境界面の摩擦気流を制御するDMR技術が「環境への逆限定」という境界面の哲学を通じて完全に共鳴しています。`
    : `The structural design approach of accepting material imperfection/warp completely resonates with the DMR technique of controlling friction and airflow through the philosophy of boundary limit.`;
}

const https = require('https');
const http = require('http');
const dns = require('dns');

// Helper to fetch remote web page title and text preview (supporting User-Agent, redirects, & SSRF protection)
// Helper to fetch remote web page title and text preview (supporting User-Agent, redirects, & SSRF protection)
function fetchUrlTitleAndText(targetUrl, redirectCount = 0, visitedUrls = []) {
  return new Promise((resolve) => {
    if (redirectCount > 5) {
      console.warn(`↪️ [Redirect Limit Exceeded] Max redirect limit of 5 hit for: ${targetUrl}`);
      return resolve({ title: "Redirect Limit Exceeded", content: "Too many redirects" });
    }

    if (visitedUrls.includes(targetUrl)) {
      console.warn(`↪️ [Redirect Loop Detected] Loop on: ${targetUrl}`);
      return resolve({ title: "Redirect Loop Detected", content: "Authentication required or infinite redirect loop." });
    }

    // Check for authorization/signin URLs commonly causing redirect loops
    if (
      targetUrl.includes('oauth2authorize') || 
      targetUrl.includes('accounts.google.com') || 
      targetUrl.includes('oauth2callback') ||
      targetUrl.includes('/signin') ||
      targetUrl.includes('/login')
    ) {
      console.warn(`↪️ [Auth Page Detected] Skipping fetch for security/auth page: ${targetUrl}`);
      return resolve({ title: "Authentication Required", content: "This page requires authentication (Google Account/OAuth2) and cannot be crawled." });
    }

    visitedUrls.push(targetUrl);

    try {
      const parsedUrl = new URL(targetUrl);

      // 🛡️ SSRF Protection: Restrict protocols
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return resolve({ title: "Security Block", content: "Protocol not allowed" });
      }

      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3'
        },
        timeout: 2500,
        // 🛡️ SSRF Protection: Block internal IPs on DNS resolution
        lookup: (hostname, dnsOptions, callback) => {
          dns.lookup(hostname, dnsOptions, (err, address, family) => {
            if (err) return callback(err);

            let addresses = Array.isArray(address) ? address.map(a => a.address || a) : [address];

            if (addresses.length === 0) return callback(new Error('No IP found'));

            for (let addressStr of addresses) {
              if (
                addressStr === '127.0.0.1' ||
                addressStr === '::1' ||
                addressStr === '0.0.0.0' ||
                addressStr === '169.254.169.254' ||
                addressStr.startsWith('192.168.') ||
                addressStr.startsWith('10.') ||
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(addressStr)
              ) {
                return callback(new Error('Security Block: Internal IP accessed'));
              }
            }

            callback(null, address, family);
          });
        }
      };
      
      const client = parsedUrl.protocol === 'https:' ? https : http;
      const req = client.get(targetUrl, options, (res) => {
        // Handle HTTP Redirects (301, 302, 303, 307, 308)
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          let location = res.headers.location;
          if (location) {
            if (!location.startsWith('http://') && !location.startsWith('https://')) {
              location = new URL(location, targetUrl).href;
            }
            console.log(`↪️ [HTTP Redirect]: ${targetUrl} -> ${location} (${res.statusCode})`);
            return resolve(fetchUrlTitleAndText(location, redirectCount + 1, visitedUrls));
          }
        }
        
        // Block unsuccessful HTTP status codes
        if (res.statusCode < 200 || res.statusCode >= 300) {
          console.warn(`⚠️ [Fetch URL Rejected]: ${targetUrl} returned status ${res.statusCode}`);
          return resolve({ 
            title: parsedUrl.hostname, 
            content: `HTTP Request failed with status code ${res.statusCode}` 
          });
        }
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          const titleMatch = data.match(/<title>([^<]*)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;
          const cleanText = data
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .substring(0, 2000)
            .trim();
          resolve({ title, content: cleanText || "No content extracted" });
        });
      });
      
      req.on('error', (err) => {
        console.warn(`⚠️ [Fetch URL Network Error]: ${targetUrl} - ${err.message}`);
        resolve({ title: parsedUrl.hostname, content: `Request failed: ${err.message}` });
      });
      
      req.on('timeout', () => {
        req.destroy();
        console.warn(`⏳ [Fetch URL Timeout]: ${targetUrl}`);
        resolve({ title: parsedUrl.hostname, content: "Request timeout" });
      });
      
      req.end();
    } catch (e) {
      resolve({ title: "Invalid URL", content: "Parsing failed" });
    }
  });
}

// Generate poetry Summary of remote URL using Gemini Flash
async function generateUrlSummaryNoise(linkUrl, currentLang, apiKey) {
  const webData = await fetchUrlTitleAndText(linkUrl);
  console.log(`🌐 [Web Scraping Audit]: Scraped "${webData.title}" (Content: ${webData.content.substring(0, 150)}...)`);
  
  const prompt = currentLang === 'ja'
    ? `以下のWebページの情報を解釈し、背後にあるコンセプト、思考、あるいは技術的・思想的なエッセンスを日本語1〜2段落の「思考ノイズ（未分化の思考断片）」として翻訳・再構成してください。余計な挨拶や前置きは完全に省き、要要約された思考テキストのみを返してください。
 
【WebページのURL】: ${linkUrl}
【タイトル】: ${webData.title}
【本文抜粋】: ${webData.content}`
    : `Please interpret the following Web page information and translate/reconstruct its core concept, underlying thoughts, or technical/philosophical essence into 1 or 2 elegant paragraphs of "thought noise" in English. Do not include any greeting or conversational filler. Return ONLY the translated thought text.
 
[URL]: ${linkUrl}
[Title]: ${webData.title}
[Content Extract]: ${webData.content}`;

  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { systemInstruction: systemInstruction, temperature: 0.7 }
      });
      return response.text.trim();
    } catch (err) {
      console.warn("⚠️ [Gemini URL Summarization API Error] Fallback default used:", err.message);
    }
  }

  return currentLang === 'ja'
    ? `[Web参照: ${webData.title}] ${linkUrl} の中に流れる情報代謝と関係性の潮流を観測しました。この界面の奥に潜む知識のエッセンスが、私たちの記憶の動的平衡と共鳴しています。`
    : `[Web Reference: ${webData.title}] Observed the flow of information metabolism and relation streams within ${linkUrl}. The essence of knowledge behind this interface resonates with our dynamic memory equilibrium.`;
}

// Translate physical visual details or document elements via Gemini Multimodal into text thoughts
async function generateMultimodalNoise(attachment, currentLang, apiKey) {
  const isAudio = attachment.mimeType.startsWith('audio/');
  const isPdf = attachment.mimeType === 'application/pdf';

  let prompt = "";
  if (currentLang === 'ja') {
    if (isAudio) {
      prompt = `添付された音声ファイルを聴いてください。ここに含まれる思考、会話、物理的なノイズ、またはアイデアを深く解釈し、背後に潜む「思考ノイズ（未完のアイデアや直感的なひらめき）」として日本語1〜2段落で言語化・翻訳してください。余計な解説や前置きは完全に省き、要約された思考テキストのみを返してください。`;
    } else {
      prompt = `添付された画像（またはドキュメント）を深く観察してください。ここに描かれているスケッチ、物理的な不均質特性（木目や反りなど）、図面、あるいは物理的な美学・デザイン意図を解釈し、背後に潜む「思考ノイズ（未完のアイデアや直感的なひらめき）」として日本語1〜2段落で言語化・翻訳してください。余計な解説や前置きは完全に省き、要約された思考テキストのみを返してください。`;
    }
  } else {
    if (isAudio) {
      prompt = `Please carefully listen to the attached audio. Interpret the thoughts, spoken ideas, or raw background context, and translate/verbalize it into 1 or 2 elegant paragraphs of "thought noise" (raw intuition, unfinished idea) in English. Do not include any greetings or commentary. Return ONLY the translated thought text.`;
    } else {
      prompt = `Please carefully observe the attached image or document. Interpret the sketch, physical characteristics (wood warp, material texture, etc.), drawing, or design aesthetics/intent displayed, and translate/verbalize it into 1 or 2 elegant paragraphs of "thought noise" (raw intuition, unfinished idea) in English. Do not include any greetings or commentary. Return ONLY the translated thought text.`;
    }
  }

  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      
      const contents = [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: attachment.data,
                mimeType: attachment.mimeType
              }
            },
            {
              text: prompt
            }
          ]
        }
      ];

      const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: { systemInstruction: systemInstruction, temperature: 0.7 }
      });
      return response.text.trim();
    } catch (err) {
      console.warn("⚠️ [Gemini Multimodal API Error] Fallback default used:", err.message);
    }
  }

  let mediaTypeStrJa = 'ビジュアルコンテキスト（画像）';
  let mediaTypeStrEn = 'visual context (image)';
  if (isPdf) {
    mediaTypeStrJa = '情報構造（PDF）';
    mediaTypeStrEn = 'information structure (PDF)';
  } else if (isAudio) {
    mediaTypeStrJa = '聴覚コンテキスト（音声）';
    mediaTypeStrEn = 'auditory context (audio)';
  }

  return currentLang === 'ja'
    ? `[添付メディア: ${attachment.name}] 物理的境界面から放射された${mediaTypeStrJa}を、マテリアルの反りや不均質性を受容するアプローチにおいて美しく解読しました。`
    : `[Attached Media: ${attachment.name}] Successfully decoded the ${mediaTypeStrEn} projected from the physical interface, embracing its material imperfection and boundaries.`;
}

// ----------------------------------------------------
// 🌐 Route Definitions
// ----------------------------------------------------

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'InputForm.html'));
});

app.post('/api/sendNoise', async (req, res) => {
  const { userInput, lang, simulateError, attachment, linkUrl } = req.body;
  const currentLang = lang || 'en';
  const apiKey = process.env.GEMINI_API_KEY;
  const mongoUri = process.env.MONGODB_URI;
  const embedModel = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2-preview';

  if (!userInput && !attachment && !linkUrl) {
    const emptyError = currentLang === 'ja' ? "ユーザーの入力が空です。" : "User input is empty.";
    return res.status(400).json({ error: emptyError });
  }

  // 1.5. Detect Autonomous Intent (Approach A: Forget via Dialogue)
  const lowerInput = userInput ? userInput.toLowerCase() : "";
  const isForgetIntent = userInput && (
    lowerInput.includes("忘却") ||
    lowerInput.includes("消去") ||
    lowerInput.includes("忘れて") ||
    lowerInput.includes("削除") ||
    lowerInput.includes("forget") ||
    lowerInput.includes("delete") ||
    lowerInput.includes("discard")
  );

  if (isForgetIntent) {
    console.log(`🧹 [Autonomous Forget Detected via Dialogue]: "${userInput}"`);
    
    // Generate embedding for target search
    const embedding = await getEmbedding(userInput, apiKey);
    
    let targetEngram = null;
    let maxScore = -1;
    let useMongo = false;
    let targetId = null;

    if (isMongoActive && mongoUri && mongoUri !== 'mongodb_connection_string_here') {
      const dbClient = new MongoClient(mongoUri);
      await dbClient.connect();
      try {
        const db = dbClient.db('engram_atlas');
        const engramsCollection = db.collection('engrams');
        // 1. Gather all high-similarity candidates (>= 0.70)
        const pastEngrams = await engramsCollection.find({ 
          vector_embeddings: { $exists: true }
        }).toArray();

        const candidates = [];
        for (const past of pastEngrams) {
          const score = cosineSimilarity(embedding, past.vector_embeddings);
          if (score >= 0.70) {
            candidates.push({ engram: past, score });
          }
        }

        if (candidates.length > 0) {
          // If high-similarity matches exist, pick the one with the absolute newest database insertion timestamp
          let maxTime = -1;
          candidates.forEach(c => {
            const time = c.engram._id.getTimestamp ? c.engram._id.getTimestamp().getTime() : 0;
            if (time > maxTime) {
              maxTime = time;
              targetEngram = c.engram;
              maxScore = c.score;
            }
          });
        } else {
          // Fallback to highest similarity score >= 0.50
          for (const past of pastEngrams) {
            const score = cosineSimilarity(embedding, past.vector_embeddings);
            if (score >= 0.50 && score > maxScore) {
              maxScore = score;
              targetEngram = past;
            }
          }
        }

        if (targetEngram) {
          targetId = targetEngram._id.toString();
          // Delete target
          const deleteRes = await engramsCollection.deleteOne({ _id: targetEngram._id });
          // References cleanup ($pull)
          const updateRes = await engramsCollection.updateMany(
            {},
            { $pull: { related_links: { to_engram_id: targetId } } }
          );
          console.log(`🗑️ [MongoDB] Autonomously forgotten engram: ${targetId}. Success: ${deleteRes.deletedCount > 0}. Cleared references: ${updateRes.modifiedCount}`);
          useMongo = true;
        }
      } finally {
        await dbClient.close();
      }
    }

    if (!useMongo) {
      // Mock DB: Gather high-similarity candidates
      const candidates = [];
      for (const past of mockEngrams) {
        const score = cosineSimilarity(embedding, past.vector_embeddings);
        if (score >= 0.70) {
          candidates.push({ engram: past, score });
        }
      }

      if (candidates.length > 0) {
        let maxTime = -1;
        candidates.forEach(c => {
          const time = c.engram.created_at ? new Date(c.engram.created_at).getTime() : 0;
          if (time > maxTime) {
            maxTime = time;
            targetEngram = c.engram;
            maxScore = c.score;
          }
        });
      } else {
        for (const past of mockEngrams) {
          const score = cosineSimilarity(embedding, past.vector_embeddings);
          if (score >= 0.50 && score > maxScore) {
            maxScore = score;
            targetEngram = past;
          }
        }
      }

      if (targetEngram) {
        targetId = targetEngram._id;
        mockEngrams = mockEngrams.filter(e => e._id !== targetId);
        mockEngrams.forEach(e => {
          if (e.related_links) {
            e.related_links = e.related_links.filter(link => link.to_engram_id !== targetId);
          }
        });
        console.log(`🗑️ [Mock DB] Autonomously forgotten mock engram ID: ${targetId}`);
      }
    }

    if (targetId) {
      // Success response
      let cognitiveResponse = "";
      if (apiKey && apiKey !== 'your_gemini_api_key_here') {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
          const prompt = currentLang === 'ja'
            ? `ユーザーからの指示: "${userInput}"\n\n削除対象となった思考テキスト: "${targetEngram.content}"\n\nこの思考ノイズを特定して完全に忘却し、記憶から消去して関係性の代謝（Metabolism）をクリーンアップしたことを、極めて優美で知的、かつコグニティブな文脈（『記憶の海へ還元しました』等）を用いて、日本語で報告してください。余計な挨拶や前置きは省いて結果とコグニティブな意味のみを返してください。`
            : `User Instruction: "${userInput}"\n\nForgotten thought text: "${targetEngram.content}"\n\nPlease report that you have autonomously identified and completely forgotten this engram, clearing it from the memory network and metabolising (cleaning up) its associations gracefully. Use a cognitive, poetic tone in English.`;

          const response = await ai.models.generateContent({
            model: model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { systemInstruction: systemInstruction, temperature: 0.7 }
          });
          cognitiveResponse = response.text.trim();
        } catch (aiErr) {
          console.error("❌ [Gemini Error on Autonomous Forget] Fallback response applied:", aiErr.message);
        }
      }

      if (!cognitiveResponse) {
        cognitiveResponse = currentLang === 'ja'
          ? `ご指示に基づき、該当の思考ノイズ（『${targetEngram.content.substring(0, 40)}...』）を記憶の海へ優美に還元（忘却・消去）しました。これに伴い、記憶空間上の関連リンクは完全に代謝（Metabolism）され、ネットワークの動的平衡が再調整されました。`
          : `Based on your request, the specified thought noise ("${targetEngram.content.substring(0, 40)}...") has been gracefully forgotten and returned to the ocean of memory. All associated links within the network have been fully metabolised and cleared to maintain equilibrium.`;
      }

      return res.json({
        response: cognitiveResponse,
        db_id: targetId,
        mode: useMongo ? "production" : "mock",
        relations: [],
        metadata: {
          model: embedModel,
          entropy: 0.0,
          scope: "PERSONAL"
        }
      });
    } else {
      // target not found fallback
      const errorMsg = currentLang === 'ja'
        ? "指示に合致する忘却対象の思考ノイズを記憶ネットワークから特定できませんでした。"
        : "Could not identify any matching thought noise to forget from the memory network.";
      return res.status(404).json({ error: errorMsg });
    }
  }

  // 1. Process Multimodal (Image/PDF) or Web Link inputs into translated thoughts
  let translatedNoise = "";
  let inputType = "text";
  let detailTags = ["liftoff", "day3", currentLang];

  if (attachment) {
    console.log(`📸 [Processing Multimodal Input]: "${attachment.name}" (${attachment.mimeType})`);
    translatedNoise = await generateMultimodalNoise(attachment, currentLang, apiKey);
    inputType = attachment.mimeType.startsWith('image/') ? 'image' : 
                attachment.mimeType.startsWith('audio/') ? 'audio' : 'pdf';
    detailTags.push(inputType);
  }

  if (linkUrl) {
    console.log(`🌐 [Processing Web Link Input]: "${linkUrl}"`);
    const urlSummary = await generateUrlSummaryNoise(linkUrl, currentLang, apiKey);
    translatedNoise = translatedNoise 
      ? `${translatedNoise}\n\n${urlSummary}`
      : urlSummary;
    inputType = attachment ? 'mixed' : 'url';
    detailTags.push('url');
  }

  // Merge original user raw text with translated multimodal thoughts
  let processedInputText = userInput || "";
  if (translatedNoise) {
    processedInputText = processedInputText
      ? `${processedInputText}\n\n${translatedNoise}`
      : translatedNoise;
  }

  console.log(`\n🔮 [Received Noise in ${currentLang.toUpperCase()}]: "${processedInputText.substring(0, 60)}..."`);

  // 2. Generate Embeddings for current processed input
  const embedding = await getEmbedding(processedInputText, apiKey);
  console.log(`⚡ Generated Embedding Vector (${embedding.length} dimensions using ${embedModel}).`);

  let dbResultId = null;
  let useMongo = false;
  let dbClient = null;
  let matchedRelations = [];
  
  let retryLogs = [];
  let selfHealCount = 0;

  // Define new Engram structure
  const newEngram = {
    content: processedInputText,
    raw_input_type: inputType,
    created_at: new Date(),
    metadata: {
      scope: "PERSONAL",
      tags: detailTags,
      entropy_score: 0.5,
      attachment: attachment ? { name: attachment.name, mimeType: attachment.mimeType } : null,
      linkUrl: linkUrl || null
    },
    vector_embeddings: embedding,
    related_links: [],
    evolution_history: [
      {
        timestamp: new Date(),
        action: "create",
        comment: `Initial entry registered (Language: ${currentLang}, Mode: ${inputType})`
      }
    ]
  };

  // 2. Perform DB Insertion and Bi-directional Self-Organization
  try {
    let currentAttempt = 0;
    
    await retryWithBackoff(async () => {
      currentAttempt++;
      
      // Trigger error simulation for EDD validation scenario
      if (simulateError === 'transient' && currentAttempt < 3) {
        throw new Error(`[TRANSIENT] Simulated API Rate Limit Exceeded (429) - Attempt ${currentAttempt}`);
      }

      if (mongoUri && mongoUri !== 'mongodb_connection_string_here') {
        dbClient = new MongoClient(mongoUri);
        await dbClient.connect();
        const db = dbClient.db('engram_atlas');
        const engramsCollection = db.collection('engrams');

        // Create new engram document
        const insertRes = await engramsCollection.insertOne(newEngram);
        dbResultId = insertRes.insertedId.toString();
        newEngram._id = insertRes.insertedId;
        useMongo = true;
        isMongoActive = true;

        // Find all past engrams to perform vector search locally
        const pastEngrams = await engramsCollection.find({ 
          _id: { $ne: newEngram._id },
          vector_embeddings: { $exists: true }
        }).toArray();

        console.log(`🔍 [MongoDB] Scanning ${pastEngrams.length} past engrams for similarities...`);

        // Optimized live similarity threshold to 0.55 for real embeddings
        const similarityThreshold = 0.55;

        for (const past of pastEngrams) {
          const score = cosineSimilarity(embedding, past.vector_embeddings);
          if (score >= similarityThreshold) {
            console.log(`🔗 [Match Found] ID: ${past._id}, Score: ${score.toFixed(4)}`);
            
            // Generate connection reason
            const reason = await generateReasonOfConnection(userInput, past.content, currentLang, apiKey);
            
            const newLinkForCurrent = {
              to_engram_id: past._id.toString(),
              strength: score,
              reason_of_connection: reason
            };
            matchedRelations.push(newLinkForCurrent);

            // Update current doc
            await engramsCollection.updateOne(
              { _id: newEngram._id },
              { 
                $push: { 
                  related_links: newLinkForCurrent,
                  evolution_history: {
                    timestamp: new Date(),
                    action: "self_organize_link",
                    comment: `Connected to ${past._id.toString()} with similarity ${score.toFixed(2)}`
                  }
                }
              }
            );

            // Update past doc
            const newLinkForPast = {
              to_engram_id: dbResultId,
              strength: score,
              reason_of_connection: reason
            };
            await engramsCollection.updateOne(
              { _id: past._id },
              { 
                $push: { 
                  related_links: newLinkForPast,
                  evolution_history: {
                    timestamp: new Date(),
                    action: "self_organize_link",
                    comment: `Connected to newly created ${dbResultId} with similarity ${score.toFixed(2)}`
                  }
                }
              }
            );
          }
        }
      }
    }, 3, 500, currentLang, (attempt, type, msg) => {
      selfHealCount = attempt;
      retryLogs.push(`Attempt ${attempt}: Detected ${type} error (${msg.substring(0, 45)}...). Retrying...`);
    });
  } catch (resilienceErr) {
    console.error("❌ [Resilience Engine] Fallback to in-memory mode.", resilienceErr.message);
  }

  // Fallback Mock Storage execution if Mongo wasn't active
  if (!useMongo && dbResultId === null) {
    const mockId = "mock_" + Math.random().toString(36).substr(2, 9);
    newEngram._id = mockId;
    dbResultId = mockId;

    console.log(`🔍 [Mock DB] Scanning ${mockEngrams.length} past mock engrams for similarities...`);

    const similarityThreshold = 0.55; // 0.55 for mock too for consistency

    // Perform Similarity Search on in-memory collection
    for (const past of mockEngrams) {
      const score = cosineSimilarity(embedding, past.vector_embeddings);
      if (score >= similarityThreshold) {
        console.log(`🔗 [Mock Match Found] ID: ${past._id}, Score: ${score.toFixed(4)}`);

        const reason = await generateReasonOfConnection(userInput, past.content, currentLang, apiKey);
        
        const newLinkForCurrent = {
          to_engram_id: past._id,
          strength: score,
          reason_of_connection: reason
        };
        matchedRelations.push(newLinkForCurrent);
        newEngram.related_links.push(newLinkForCurrent);
        
        newEngram.evolution_history.push({
          timestamp: new Date(),
          action: "self_organize_link",
          comment: `Mock connected to ${past._id} with similarity ${score.toFixed(2)}`
        });

        past.related_links.push({
          to_engram_id: mockId,
          strength: score,
          reason_of_connection: reason
        });
        past.evolution_history.push({
          timestamp: new Date(),
          action: "self_organize_link",
          comment: `Mock connected to newly created ${mockId} with similarity ${score.toFixed(2)}`
        });
      }
    }

    mockEngrams.push(newEngram);
    console.log(`💾 [Mock DB] Engram created and metabolised. ID: ${dbResultId}`);
  }

  // 3. Generate Agent Cognitive Explanation response
  let agentResponse = "";
  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

      const langDirective = currentLang === 'ja'
        ? "IMPORTANT: Respond in Japanese. Explain your plan, the vector embedding generation, and how you linked with past nodes if any."
        : "IMPORTANT: Respond in English. Explain your plan, the vector embedding generation, and how you linked with past nodes if any.";

      const response = await ai.models.generateContent({
        model: model,
        contents: [
          { 
            role: 'user', 
            parts: [{ 
              text: `Processed Input: "${processedInputText}"\n\nThis noise was saved (ID: ${dbResultId}). Connections made: ${JSON.stringify(matchedRelations)}\n\nReport your thinking process and how you dynamically weaved these connections.\n\n${langDirective}` 
            }] 
          },
        ],
        config: { systemInstruction: systemInstruction, temperature: 0.7 }
      });

      agentResponse = response.text;
    } catch (aiErr) {
      console.error("❌ [Gemini Error] Fallback response applied:", aiErr.message);
    }
  }

  // Inject Self-Healing logs trace in the output if any recovery occurred
  let healTraceMarkdown = "";
  if (selfHealCount > 0) {
    if (currentLang === 'ja') {
      healTraceMarkdown = `\n\n### [Self-Healing / 自己修復成功ログ]\n一時的な障害を検知し、自律修復エンジンが指数バックオフ付きリトライを実行しました：\n`;
      retryLogs.forEach(log => {
        healTraceMarkdown += `* \`[Triage: TRANSIENT]\` ${log}\n`;
      });
      healTraceMarkdown += `* **自己修復結果**: ${selfHealCount}回目のリトライでデータ永続化およびセマンティックマッピングに成功し、動的平衡を復旧しました。\n`;
    } else {
      healTraceMarkdown = `\n\n### [Self-Healing Success Log]\nTransient anomaly detected. The resilience engine performed exponential backoff retries:\n`;
      retryLogs.forEach(log => {
        healTraceMarkdown += `* \`[Triage: TRANSIENT]\` ${log}\n`;
      });
      healTraceMarkdown += `* **Recovery Result**: Successfully restored equilibrium on retry attempt #${selfHealCount}, securing data persistence and semantic mapping.\n`;
    }
    
    // Add self-healing logs to evolution history
    newEngram.evolution_history.push({
      timestamp: new Date(),
      action: "self_heal_success",
      comment: `Recovered from transient error after ${selfHealCount} attempts.`
    });
  }

  // Append self-healing logs even if we got a real agent response from Gemini API!
  if (agentResponse && healTraceMarkdown) {
    agentResponse += healTraceMarkdown;
  }

  // Fallback formatting for agent responses if API key is not active or failed
  if (!agentResponse) {
    if (currentLang === 'ja') {
      let relationshipReport = "既存の記憶（Engram）との交差共鳴は検知されませんでした。";
      if (matchedRelations.length > 0) {
        relationshipReport = `### 過去の記憶との「共鳴（リンク）」を検知しました：\n\n`;
        matchedRelations.forEach((r, idx) => {
          relationshipReport += `* **[共鳴ノード #${idx+1}]** 類似度スコア: \`${r.strength.toFixed(2)}\` | 接続先ID: \`${r.to_engram_id}\`\n  * *接続の文脈*: ${r.reason_of_connection}\n`;
        });
      }

      agentResponse = `### EngramAtlas-Core 自己組織化プロセス (Day 3-5 Active)

1. **境界面での情報代謝**:
   - 新規インプットを細胞膜で受容し、最新の \`${embedModel}\` モデルを用いて 3,072次元 の Gemini Embeddings ベクトルを動的に生成しました。

2. **記憶の代謝・探索結果**:
   - ${relationshipReport}
   - 新規ドキュメント (\`db_id: ${dbResultId}\`) に \`related_links\` が双方向で正しく結線されました。

3. **進化履歴の記録**:
   - アクション \`"self_organize_link"\` を代謝ログに追加。システムのエントロピーが削減されました。${healTraceMarkdown}

---
> **自己組織化ステータス**: GREEN (適合 / 記憶の動的平衡が確立されました)`;
    } else {
      let relationshipReport = "No overlapping resonance detected with past memories.";
      if (matchedRelations.length > 0) {
        relationshipReport = `### Conceptual Resonance Detected with Past Memories:\n\n`;
        matchedRelations.forEach((r, idx) => {
          relationshipReport += `* **[Resonant Node #${idx+1}]** Similarity: \`${r.strength.toFixed(2)}\` | target ID: \`${r.to_engram_id}\`\n  * *Resonant Context*: ${r.reason_of_connection}\n`;
        });
      }

      agentResponse = `### EngramAtlas-Core Self-Organization Process (Day 3-5 Active)

1. **Information Metabolism at the Interface**:
   - Ingested raw input and dynamically generated a 3,072-dimensional Gemini Embeddings vector utilizing \`${embedModel}\`.

2. **Memory Resonance & Search**:
   - ${relationshipReport}
   - Bi-directional \`related_links\` successfully established for the new node (\`db_id: ${dbResultId}\`).

3. **Evolution Log**:
   - Recorded \`"self_organize_link"\` action to the metabolism log. System entropy has been successfully regulated.${healTraceMarkdown}

---
> **Metabolism Status**: GREEN (Dynamic equilibrium and memory weaving active)`;
    }
  }

  res.json({
    response: agentResponse,
    db_id: dbResultId,
    mode: useMongo ? "production" : "mock",
    relations: matchedRelations,
    metadata: {
      model: embedModel,
      entropy: newEngram.metadata.entropy_score || 0.5,
      scope: newEngram.metadata.scope || "PERSONAL"
    }
  });
});

// ----------------------------------------------------
// 🧠 Verification and Semantic Navigation API (Day 12-14)
// ----------------------------------------------------

app.get('/api/getEngram', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "ID is required" });

  const mongoUri = process.env.MONGODB_URI;

  try {
    if (isMongoActive && mongoUri && mongoUri !== 'mongodb_connection_string_here') {
      const dbClient = new MongoClient(mongoUri);
      await dbClient.connect();
      try {
        const db = dbClient.db('engram_atlas');
        const engramsCollection = db.collection('engrams');
        
        let objId;
        try {
          objId = new ObjectId(id);
        } catch (e) {
          return res.status(400).json({ error: "Invalid ObjectId format" });
        }
        
        const engram = await engramsCollection.findOne({ _id: objId });
        if (!engram) {
          return res.status(404).json({ error: "Engram not found" });
        }

        // Resolving to_engram_content for related_links to assist client-side AI exports
        if (engram.related_links && engram.related_links.length > 0) {
          const resolvedLinks = [];

          // ⚡ Bolt: Fix N+1 query problem by batching fetching related contents
          const targetIds = engram.related_links.map(link => {
            try {
              return new ObjectId(link.to_engram_id);
            } catch (e) {
              return null;
            }
          }).filter(id => id !== null);

          let targetDocsMap = {};
          if (targetIds.length > 0) {
            const targetDocs = await engramsCollection.find(
              { _id: { $in: targetIds } },
              { projection: { content: 1 } }
            ).toArray();

            targetDocs.forEach(doc => {
              targetDocsMap[doc._id.toString()] = doc.content;
            });
          }

          for (const link of engram.related_links) {
            resolvedLinks.push({
              ...link,
              to_engram_content: targetDocsMap[link.to_engram_id] || ""
            });
          }
          engram.related_links = resolvedLinks;
        }

        return res.json(engram);
      } finally {
        await dbClient.close();
      }
    } else {
      const engram = mockEngrams.find(e => e._id === id);
      if (!engram) {
        return res.status(404).json({ error: "Engram not found" });
      }

      // Resolving to_engram_content for mock related_links
      if (engram.related_links && engram.related_links.length > 0) {
        engram.related_links = engram.related_links.map(link => {
          const targetDoc = mockEngrams.find(e => e._id === link.to_engram_id);
          return {
            ...link,
            to_engram_content: targetDoc ? targetDoc.content : ""
          };
        });
      }

      return res.json(engram);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/forgetEngram', async (req, res) => {
  const { db_id } = req.body;
  if (!db_id) return res.status(400).json({ error: "db_id is required" });

  const mongoUri = process.env.MONGODB_URI;
  console.log(`🧹 [Forget Request] ID: ${db_id}`);

  try {
    if (isMongoActive && mongoUri && mongoUri !== 'mongodb_connection_string_here') {
      const dbClient = new MongoClient(mongoUri);
      await dbClient.connect();
      try {
        const db = dbClient.db('engram_atlas');
        const engramsCollection = db.collection('engrams');
        
        let objId;
        try {
          objId = new ObjectId(db_id);
        } catch (e) {
          return res.status(400).json({ error: "Invalid ObjectId format" });
        }

        // 1. 指定ドキュメントの削除
        const deleteRes = await engramsCollection.deleteOne({ _id: objId });
        
        // 2. 参照のちぎり取り（他のすべての related_links から db_id への参照を pull する）
        const updateRes = await engramsCollection.updateMany(
          {},
          { $pull: { related_links: { to_engram_id: db_id.toString() } } }
        );

        console.log(`🗑️ [MongoDB] Deleted engram. Success: ${deleteRes.deletedCount > 0}. Cleared references: ${updateRes.modifiedCount}`);
        return res.json({ success: true, message: "Engram forgotten and relationships metabolised" });
      } finally {
        await dbClient.close();
      }
    } else {
      // Mock DB
      const exists = mockEngrams.some(e => e._id === db_id);
      mockEngrams = mockEngrams.filter(e => e._id !== db_id);
      
      // 参照のちぎり取り
      mockEngrams.forEach(e => {
        if (e.related_links) {
          e.related_links = e.related_links.filter(link => link.to_engram_id !== db_id);
        }
      });
      
      console.log(`🗑️ [Mock DB] Deleted engram ID: ${db_id}. Success: ${exists}.`);
      return res.json({ success: true, message: "Mock engram forgotten and relationships metabolised" });
    }
  } catch (err) {
    console.error(`❌ [Forget Error]:`, err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/updateEngram', async (req, res) => {
  const { db_id, userInput, lang, linkUrl, attachment } = req.body;
  if (!db_id) return res.status(400).json({ error: "db_id is required" });
  if (!userInput && !attachment && !linkUrl) {
    return res.status(400).json({ error: "Update content is empty" });
  }

  const currentLang = lang || 'en';
  const apiKey = process.env.GEMINI_API_KEY;
  const mongoUri = process.env.MONGODB_URI;
  const embedModel = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2-preview';

  console.log(`📝 [Update/Refine Request] ID: ${db_id}`);

  // 1. メディア・リンクの処理（sendNoise と同様）
  let translatedNoise = "";
  let inputType = "text";
  let detailTags = ["liftoff", "day3", currentLang, "refined"];

  if (attachment) {
    translatedNoise = await generateMultimodalNoise(attachment, currentLang, apiKey);
    inputType = attachment.mimeType.startsWith('image/') ? 'image' : 'pdf';
    detailTags.push(inputType);
  }

  if (linkUrl) {
    const urlSummary = await generateUrlSummaryNoise(linkUrl, currentLang, apiKey);
    translatedNoise = translatedNoise ? `${translatedNoise}\n\n${urlSummary}` : urlSummary;
    inputType = attachment ? 'mixed' : 'url';
    detailTags.push('url');
  }

  let processedInputText = userInput || "";
  if (translatedNoise) {
    processedInputText = processedInputText ? `${processedInputText}\n\n${translatedNoise}` : translatedNoise;
  }

  // 2. 新しいベクトルの生成
  const embedding = await getEmbedding(processedInputText, apiKey);

  try {
    if (isMongoActive && mongoUri && mongoUri !== 'mongodb_connection_string_here') {
      const dbClient = new MongoClient(mongoUri);
      await dbClient.connect();
      try {
        const db = dbClient.db('engram_atlas');
        const engramsCollection = db.collection('engrams');
        
        let objId;
        try {
          objId = new ObjectId(db_id);
        } catch (e) {
          return res.status(400).json({ error: "Invalid ObjectId format" });
        }

        // a. 相手ノードからの古い参照の完全クリーンアップ（この db_id への参照を pull する）
        await engramsCollection.updateMany(
          {},
          { $pull: { related_links: { to_engram_id: db_id.toString() } } }
        );

        // b. 自身の更新（related_links を一旦空にする）
        const updateDoc = {
          $set: {
            content: processedInputText,
            raw_input_type: inputType,
            related_links: [], // 一度リセット
            'metadata.linkUrl': linkUrl || null,
            'metadata.attachment': attachment ? { name: attachment.name, mimeType: attachment.mimeType } : null,
            vector_embeddings: embedding
          },
          $push: {
            evolution_history: {
              timestamp: new Date(),
              action: "refine",
              comment: `Engram refined and re-metabolized (Language: ${currentLang})`
            }
          }
        };

        await engramsCollection.updateOne({ _id: objId }, updateDoc);

        // c. 新しい類似性に基づく双方向リンクの再構築
        const pastEngrams = await engramsCollection.find({ 
          _id: { $ne: objId },
          vector_embeddings: { $exists: true }
        }).toArray();

        const similarityThreshold = 0.55;
        const matchedRelations = [];

        for (const past of pastEngrams) {
          const score = cosineSimilarity(embedding, past.vector_embeddings);
          if (score >= similarityThreshold) {
            const reason = await generateReasonOfConnection(userInput, past.content, currentLang, apiKey);
            
            const newLinkForCurrent = {
              to_engram_id: past._id.toString(),
              strength: score,
              reason_of_connection: reason
            };
            matchedRelations.push(newLinkForCurrent);

            // 自分側に追加
            await engramsCollection.updateOne(
              { _id: objId },
              { 
                $push: { 
                  related_links: newLinkForCurrent,
                  evolution_history: {
                    timestamp: new Date(),
                    action: "self_organize_link",
                    comment: `Connected to ${past._id.toString()} during refine with similarity ${score.toFixed(2)}`
                  }
                }
              }
            );

            // 相手側にも追加
            const newLinkForPast = {
              to_engram_id: db_id,
              strength: score,
              reason_of_connection: reason
            };
            await engramsCollection.updateOne(
              { _id: past._id },
              { 
                $push: { 
                  related_links: newLinkForPast,
                  evolution_history: {
                    timestamp: new Date(),
                    action: "self_organize_link",
                    comment: `Connected to refined ${db_id} with similarity ${score.toFixed(2)}`
                  }
                }
              }
            );
          }
        }

        // d. 思考プロセスの生成（sendNoise と同様）
        let agentResponse = "";
        if (apiKey && apiKey !== 'your_gemini_api_key_here') {
          try {
            const ai = new GoogleGenAI({ apiKey });
            const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
            const langDirective = currentLang === 'ja'
              ? "IMPORTANT: Respond in Japanese. Explain your plan, the vector embedding generation, and how you refined and re-linked with past nodes if any."
              : "IMPORTANT: Respond in English. Explain your plan, the vector embedding generation, and how you refined and re-linked with past nodes if any.";

            const response = await ai.models.generateContent({
              model: model,
              contents: [
                { 
                  role: 'user', 
                  parts: [{ 
                    text: `User Input: "${userInput}"\n\nThis noise was refined and updated (ID: ${db_id}). Connections re-made: ${JSON.stringify(matchedRelations)}\n\nReport your thinking process and how you dynamically weaved these connections.\n\n${langDirective}` 
                  }] 
                },
              ],
              config: { systemInstruction: systemInstruction, temperature: 0.7 }
            });
            agentResponse = response.text;
          } catch (aiErr) {
            console.error("⚠️ Gemini Error on Refine response:", aiErr.message);
          }
        }

        if (!agentResponse) {
          agentResponse = currentLang === 'ja'
            ? `### EngramAtlas-Core 自己組織化プロセス（推敲完了）\n\n1. **推敲による代謝**: エングラムID \`${db_id}\` の内容が更新され、新ベクトルが生成されました。\n2. **再結線**: 既存の記憶との類似度を再計算し、双方向リンクを再構築しました。\n\n--- \n> **ステータス**: GREEN (推敲および動的平衡の再調整が成功しました)`
            : `### EngramAtlas-Core Self-Organization Process (Refined)\n\n1. **Refinement Metabolism**: Updated content for ID \`${db_id}\` and generated new vector.\n2. **Re-connection**: Recalculated similarities and rebuilt bi-directional links.\n\n--- \n> **Status**: GREEN (Refinement and re-equilibrium complete)`;
        }

        return res.json({
          response: agentResponse,
          db_id: db_id,
          mode: "production",
          relations: matchedRelations,
          metadata: {
            model: embedModel,
            entropy: 0.4,
            scope: "PERSONAL"
          }
        });
      } finally {
        await dbClient.close();
      }
    } else {
      // Mock DB
      const engram = mockEngrams.find(e => e._id === db_id);
      if (!engram) return res.status(404).json({ error: "Mock engram not found" });

      // a. 相手ノードからの古い参照のクリーンアップ
      mockEngrams.forEach(e => {
        if (e.related_links) {
          e.related_links = e.related_links.filter(link => link.to_engram_id !== db_id);
        }
      });

      // b. 自身の更新
      engram.content = processedInputText;
      engram.raw_input_type = inputType;
      engram.related_links = [];
      if (linkUrl) engram.metadata.linkUrl = linkUrl;
      if (attachment) engram.metadata.attachment = { name: attachment.name, mimeType: attachment.mimeType };
      engram.vector_embeddings = embedding;
      engram.evolution_history.push({
        timestamp: new Date(),
        action: "refine",
        comment: `Mock engram refined and re-metabolized (Language: ${currentLang})`
      });

      // c. 再結線
      const similarityThreshold = 0.55;
      const matchedRelations = [];

      for (const past of mockEngrams) {
        if (past._id === db_id) continue;
        const score = cosineSimilarity(embedding, past.vector_embeddings);
        if (score >= similarityThreshold) {
          const reason = await generateReasonOfConnection(userInput, past.content, currentLang, apiKey);
          
          const newLinkForCurrent = {
            to_engram_id: past._id,
            strength: score,
            reason_of_connection: reason
          };
          matchedRelations.push(newLinkForCurrent);
          engram.related_links.push(newLinkForCurrent);
          
          engram.evolution_history.push({
            timestamp: new Date(),
            action: "self_organize_link",
            comment: `Connected to ${past._id} during mock refine with similarity ${score.toFixed(2)}`
          });

          past.related_links.push({
            to_engram_id: db_id,
            strength: score,
            reason_of_connection: reason
          });
          past.evolution_history.push({
            timestamp: new Date(),
            action: "self_organize_link",
            comment: `Connected to mock refined ${db_id} with similarity ${score.toFixed(2)}`
          });
        }
      }

      const agentResponse = currentLang === 'ja'
        ? `### EngramAtlas-Core 自己組織化プロセス（推敲完了・Mock）\n\n1. **推敲による代謝**: エングラムID \`${db_id}\` の内容が更新され、新ベクトルが生成されました。\n2. **再結線**: 既存の記憶との類似度を再計算し、双方向リンクを再構築しました。\n\n--- \n> **ステータス**: GREEN (推敲および動的平衡の再調整が成功しました)`
        : `### EngramAtlas-Core Self-Organization Process (Refined - Mock)\n\n1. **Refinement Metabolism**: Updated content for ID \`${db_id}\` and generated new vector.\n2. **Re-connection**: Recalculated similarities and rebuilt bi-directional links.\n\n--- \n> **Status**: GREEN (Refinement and re-equilibrium complete)`;

      return res.json({
        response: agentResponse,
        db_id: db_id,
        mode: "mock",
        relations: matchedRelations,
        metadata: {
          model: embedModel,
          entropy: 0.4,
          scope: "PERSONAL"
        }
      });
    }
  } catch (err) {
    console.error(`❌ [Refine Error]:`, err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/getAllEngrams', async (req, res) => {
  const mongoUri = process.env.MONGODB_URI;

  try {
    if (isMongoActive && mongoUri && mongoUri !== 'mongodb_connection_string_here') {
      const dbClient = new MongoClient(mongoUri);
      await dbClient.connect();
      try {
        const db = dbClient.db('engram_atlas');
        const engramsCollection = db.collection('engrams');
        
        // 3,072次元ベクトルは可視化に不要なので除外してトラフィックを節約
        const engrams = await engramsCollection.find(
          {},
          { projection: { vector_embeddings: 0 } }
        ).toArray();
        
        return res.json(engrams);
      } finally {
        await dbClient.close();
      }
    } else {
      // Mock DB - ベクトルを除外してコピー
      const engrams = mockEngrams.map(e => {
        const { vector_embeddings, ...rest } = e;
        return rest;
      });
      return res.json(engrams);
    }
  } catch (err) {
    console.error("❌ [getAllEngrams Error]:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 ===================================================`);
  console.log(`🧬 EngramAtlas Local Development Server`);
  console.log(`🔗 URL: http://localhost:3000/`);
  console.log(`📂 Working Dir: ${__dirname}`);
  console.log(`=====================================================\n`);
});
