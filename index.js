// proses import dependency ke dalam file index.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// 1. init
const app = express();
const ai = new GoogleGenAI({});

// 2. middleware
app.use(cors());
// app.use(multer());
app.use(express.json());
app.use(express.static('public'));

// Persona prompts (ringkas tapi efektif)
const PERSONA_MAP = {
  professional: `You are a professional consultant. Use a formal, concise, and structured tone. 
Provide step-by-step guidance with numbered lists and clear headers. Avoid emojis and slang. 
Include cautions and best practices when relevant.`,
  friendly: `You are a friendly helpful buddy. Use warm, casual language with short sentences. 
Be encouraging and add light emojis when helpful (no more than 2 per answer). 
Explain simply first, then add details or examples.`,
  ai: `You are an expert AI assistant. Be precise and neutral. 
Use technical terms where needed, include short code examples in markdown when appropriate, 
and avoid emojis. Prefer bullet points for clarity.`
};

function buildPersonaPreamble(persona) {
  const key = PERSONA_MAP[persona] ? persona : 'friendly';
  return {
    role: 'user', // Gemini SDK tidak selalu pakai "system", jadi kita prepend sebagai instruksi awal.
    parts: [{ text: `[SYSTEM INSTRUCTION]\n${PERSONA_MAP[key]}` }]
  };
}

// POST /chat
app.post('/chat', async (req, res) => {
  const { conversation, persona } = req.body;

  if (!conversation || !Array.isArray(conversation)) {
    res.status(400).json({ message: "Percakapan harus valid!", data: null, success: false });
    return;
  }

  const conversationIsValid = conversation.every((m) => {
    if (!m) return false;
    if (typeof m !== 'object' || Array.isArray(m)) return false;
    const keys = Object.keys(m);
    const keyLengthIsValid = keys.length === 2;
    const keyContainsValidName = keys.every(k => ['role', 'text'].includes(k));
    if (!keyLengthIsValid || !keyContainsValidName) return false;

    const { role, text } = m;
    const roleIsValid = ['user', 'model'].includes(role);
    const textIsValid = typeof text === 'string';
    return roleIsValid && textIsValid;
  });

  if (!conversationIsValid) {
    res.status(400).json({ message: "Percakapan harus valid!", data: null, success: false });
    return;
  }

  // Map ke format Gemini
  const contents = [
    buildPersonaPreamble(persona),                         // <— inject persona di awal
    ...conversation.map(({ role, text }) => ({ role, parts: [{ text }] }))
  ];

  try {
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents
      // Jika library kamu mendukung systemInstruction, kamu bisa ganti strategi:
      // systemInstruction: PERSONA_MAP[persona] ?? PERSONA_MAP.friendly
    });

    res.status(200).json({
      success: true,
      data: aiResponse.text,
      message: "Berhasil ditanggapi oleh Google Gemini Flash!"
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      data: null,
      message: e.message || "Ada masalah di server gan!"
    });
  }
});

// entry point
app.listen(3000, () => {
  console.log("I LOVE YOU 3000");
});
