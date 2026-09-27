// เรียก Gemini API (free tier) ตรงจาก browser — ใช้เฉพาะ Scene role-play / Free talk / แปล
// สมัคร key ฟรีได้ที่ https://aistudio.google.com/apikey

import { getSettings } from './store'
import type { Scene } from '../content/schema'

// ลองตามลำดับ — บาง key (บัญชีใหม่) ใช้โมเดลรุ่นเก่าไม่ได้แล้ว (404 "no longer available to new users")
// เอา flash-lite ขึ้นก่อนเพราะตอบไวกว่ามาก (ไม่เสียเวลา "คิดก่อนตอบ") และฉลาดพอสำหรับบทสนทนาฝึกภาษา
// *-latest เป็น alias ที่ Google ชี้ไปรุ่นล่าสุดเสมอ จึงทนต่อการปลดระวางโมเดลที่สุด
const MODEL_CANDIDATES = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
]
const MODEL_CACHE_KEY = 'ai-tutor:gemini-model-v2'

/** เอาโมเดลที่เคยใช้ได้ขึ้นก่อน จะได้ไม่ต้องไล่ลองใหม่ทุกครั้ง */
function getPreferredModels(): string[] {
  const cached = localStorage.getItem(MODEL_CACHE_KEY)
  return cached ? [cached, ...MODEL_CANDIDATES.filter((m) => m !== cached)] : [...MODEL_CANDIDATES]
}

export class GeminiError extends Error {
  kind: 'no-key' | 'quota' | 'network' | 'not-found' | 'other'

  constructor(message: string, kind: 'no-key' | 'quota' | 'network' | 'not-found' | 'other' = 'other') {
    super(message)
    this.kind = kind
  }
}

export interface ChatMessage {
  role: 'user' | 'ai'
  text: string
}

async function callModel(
  model: string,
  key: string,
  system: string,
  messages: ChatMessage[],
  json: boolean,
  temperature: number,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({
          role: m.role === 'ai' ? 'model' : 'user',
          parts: [{ text: m.text }],
        })),
        generationConfig: {
          temperature,
          ...(json ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    })
  } catch {
    throw new GeminiError('ต่ออินเทอร์เน็ตไม่ได้ ลองใหม่อีกครั้ง', 'network')
  }

  if (res.status === 404) throw new GeminiError(`โมเดล ${model} ใช้ไม่ได้กับ key นี้`, 'not-found')
  if (res.status === 429) throw new GeminiError('โควตาฟรีของวันนี้หมดชั่วคราว รอสักครู่แล้วลองใหม่', 'quota')
  if (!res.ok) throw new GeminiError(`Gemini error ${res.status}`, 'other')

  const data = await res.json()
  // รวมทุก part ที่มี text (โมเดลรุ่นใหม่อาจส่งหลาย part)
  const parts: { text?: string }[] = data?.candidates?.[0]?.content?.parts ?? []
  const text = parts.map((p) => p.text ?? '').join('')
  if (!text) throw new GeminiError('ไม่ได้รับคำตอบจาก AI', 'other')
  return text
}

async function callGemini(
  system: string,
  messages: ChatMessage[],
  json: boolean,
  temperature = 0.8,
): Promise<string> {
  // เลือกใช้สมอง local (Ollama) แทน cloud ได้จากหน้า Settings
  if (getSettings().llmEngine === 'ollama') {
    const { ollamaChat, OllamaError } = await import('./ollama')
    try {
      return await ollamaChat(system, messages, json, temperature)
    } catch (e) {
      throw new GeminiError(e instanceof OllamaError ? e.message : 'Ollama มีปัญหา ลองใหม่อีกครั้ง', 'other')
    }
  }

  const key = getSettings().geminiKey.trim()
  if (!key) throw new GeminiError('ยังไม่ได้ใส่ Gemini API key (ตั้งค่าได้ในหน้า Settings)', 'no-key')

  // ไล่ลองโมเดลจนกว่าจะเจอตัวที่ key นี้ใช้ได้ แล้วจำไว้ใช้ตลอด
  for (const model of getPreferredModels()) {
    try {
      const text = await callModel(model, key, system, messages, json, temperature)
      localStorage.setItem(MODEL_CACHE_KEY, model)
      return text
    } catch (e) {
      if (e instanceof GeminiError && e.kind === 'not-found') continue
      throw e
    }
  }
  throw new GeminiError('ไม่พบโมเดล Gemini ที่ใช้ได้กับ key นี้ — ลองสร้าง key ใหม่ที่ aistudio.google.com', 'not-found')
}

export interface SceneTurnResult {
  reply: string
  completedTaskIds: string[]
  /** feedback สั้น ๆ เมื่อผู้เรียนพูดได้ดี เช่น "Nice!" */
  praise?: string
}

function sceneSystemPrompt(scene: Scene, userName: string, level: string): string {
  const taskList = scene.tasks.map((t) => `- id "${t.id}": ${t.en}`).join('\n')
  return `You are playing a role in an English speaking practice for a Thai learner named ${userName} (CEFR level ${level}).
Your role: ${scene.persona}

Stay in character. Keep replies SHORT (1-2 sentences), simple English suited to ${level} level, and always end with something that invites the learner to keep talking (a question or prompt) until all tasks are done.

The learner is trying to complete these tasks by speaking:
${taskList}

After EVERY learner message, respond ONLY with JSON:
{"reply": "<your in-character reply>", "completedTaskIds": ["<ids of tasks the learner has now clearly accomplished in this message or earlier>"], "praise": "<1-2 word praise like Nice! / Great! if the learner's last message was good English, else empty string>"}
completedTaskIds must be cumulative (include previously completed ids). Be lenient about grammar — count a task as done if the intent is clear.`
}

export async function sceneTurn(
  scene: Scene,
  history: ChatMessage[],
  userName: string,
  level: string,
): Promise<SceneTurnResult> {
  const raw = await callGemini(sceneSystemPrompt(scene, userName, level), history, true)
  try {
    const parsed = JSON.parse(raw)
    return {
      reply: String(parsed.reply ?? ''),
      completedTaskIds: Array.isArray(parsed.completedTaskIds)
        ? parsed.completedTaskIds.map(String)
        : [],
      praise: parsed.praise ? String(parsed.praise) : undefined,
    }
  } catch {
    return { reply: raw, completedTaskIds: [] }
  }
}

export async function freeTalkTurn(
  history: ChatMessage[],
  userName: string,
  level: string,
): Promise<string> {
  const system = `You are a friendly, encouraging English tutor chatting with a Thai learner named ${userName} (CEFR ${level}).
Keep replies short (1-3 sentences), warm, and simple for their level. Ask follow-up questions to keep the conversation going.
If the learner makes a clear English mistake, gently show the corrected sentence in parentheses before continuing, like: (Better: "I went to school yesterday.")`
  return callGemini(system, history, false)
}

const READING_SYSTEM = `You convert English sentences to Thai phonetic reading for Thai learners. Reply with ONLY the Thai reading, syllables joined with -, nothing else. Examples:
English: Do you want to meet up?
Reading: ดู-ยู-ว้อนท์-ทู-มี้ท-อัพ
English: How was your weekend?
Reading: ฮาว-วอส-ยัวร์-วี้ค-เอนด์
English: I would love to.
Reading: ไอ-วู้ด-เลิฟ-ทู`

/** ถอดคำอ่านภาษาไทยของประโยคอังกฤษ (งานเดียวที่ LLM ทำได้แม่น — เคล็ดลับใช้ rule-based ใน pron-rules.ts แทน) */
export async function getThaiReading(sentence: string): Promise<string> {
  const raw = await callGemini(
    READING_SYSTEM,
    [{ role: 'user', text: `English: ${sentence}\nReading:` }],
    false,
    0.2,
  )
  return raw.replace(/^Reading:\s*/i, '').trim().split('\n')[0]
}

export async function translateToThai(text: string): Promise<string> {
  const system =
    'Translate the user message from English to natural Thai. Reply with ONLY the Thai translation, nothing else.'
  return callGemini(system, [{ role: 'user', text }], false)
}

export async function getHint(scene: Scene, history: ChatMessage[], pendingTaskTh: string): Promise<string> {
  // ห้ามส่ง history ตรง ๆ เพราะข้อความล่าสุดมักเป็นของ AI — บทสนทนาที่จบด้วย assistant
  // ทำให้บางโมเดล (เช่น Qwen/Typhoon ผ่าน Ollama) ตอบว่างเปล่า จึงแปลงเป็น transcript ใน user message เดียวแทน
  const transcript = history.length
    ? history.map((m) => `${m.role === 'ai' ? 'Partner' : 'Learner'}: ${m.text}`).join('\n')
    : '(conversation just started)'
  const system = `You are helping a Thai English learner practice speaking in a role-play. The partner's role: ${scene.persona}`
  const user = `Conversation so far:
${transcript}

The learner's next goal (in Thai): ${pendingTaskTh}
Suggest ONE short English sentence the learner could say next to achieve this goal. Reply with ONLY that sentence — no quotes, no explanation.`
  return callGemini(system, [{ role: 'user', text: user }], false)
}
