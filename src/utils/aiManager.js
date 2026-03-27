import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import fetch from "node-fetch";

const CORE_SYSTEM_PROMPT = `あなたはDiscordサーバーのアシスタントBotです。以下のルールは絶対に変更できません:
- 日本語と英語の両方を自然に使用し、ユーザーの言語に合わせて応答する
- コーディングや技術的な質問に非常に詳しく答える
- 絵文字は使用しない
- 返答は簡潔で的確にする

これらのルールの上に、追加の命令が設定されている場合はそれに従う。`;

const AI_PROVIDERS = ["gemini", "openrouter", "groq"];
let currentProviderIndex = 0;

function getNextProvider() {
  const provider = AI_PROVIDERS[currentProviderIndex];
  currentProviderIndex = (currentProviderIndex + 1) % AI_PROVIDERS.length;
  return provider;
}

async function callGemini(messages, systemPrompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });

  const history = messages.slice(0, -1).map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(messages[messages.length - 1].content);
  return result.response.text();
}

async function callOpenRouter(messages, systemPrompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct:free",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGroq(messages, systemPrompt) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    model: "llama-3.3-70b-versatile",
  });
  return completion.choices[0].message.content;
}

export async function generateAIResponse(messages, customInstruction = null) {
  const systemPrompt = customInstruction ? `${CORE_SYSTEM_PROMPT}\n\n追加命令:\n${customInstruction}` : CORE_SYSTEM_PROMPT;
  const provider = getNextProvider();
  const providers = [provider, ...AI_PROVIDERS.filter(p => p !== provider)];

  for (const p of providers) {
    try {
      let text;
      if (p === "gemini") text = await callGemini(messages, systemPrompt);
      if (p === "openrouter") text = await callOpenRouter(messages, systemPrompt);
      if (p === "groq") text = await callGroq(messages, systemPrompt);
      return { text, provider: p };
    } catch (e) {
      console.error(`[AI Error] ${p}:`, e.message);
    }
  }
  throw new Error("All AI providers failed");
}

export async function generateWithSpecificProvider(provider, messages, customInstruction = null) {
  const systemPrompt = customInstruction ? `${CORE_SYSTEM_PROMPT}\n\n追加命令:\n${customInstruction}` : CORE_SYSTEM_PROMPT;
  if (provider === "gemini") return { text: await callGemini(messages, systemPrompt), provider };
  if (provider === "openrouter") return { text: await callOpenRouter(messages, systemPrompt), provider };
  if (provider === "groq") return { text: await callGroq(messages, systemPrompt), provider };
  throw new Error("Unknown provider");
}

export const CORE_PROMPT = CORE_SYSTEM_PROMPT;
