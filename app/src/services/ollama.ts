// สมอง AI แบบ local ผ่าน Ollama (http://localhost:11434) — ฟรี ไม่จำกัด ไม่ต้องใช้ key
// ใช้ได้เมื่อเปิดแอปบนเครื่องเดียวกับที่รัน Ollama (เช่น Mac)

import { getSettings } from './store'
import { tx } from './i18n'
import type { ChatMessage } from './gemini'

export class OllamaError extends Error {
  kind: 'unreachable' | 'no-model' | 'other'

  constructor(message: string, kind: 'unreachable' | 'no-model' | 'other' = 'other') {
    super(message)
    this.kind = kind
  }
}

interface OllamaTag {
  name: string
  details?: { family?: string }
}

/** รายชื่อโมเดล chat ที่มีในเครื่อง (กรองโมเดล embedding ออก) */
export async function listOllamaModels(url?: string): Promise<string[]> {
  const base = (url ?? getSettings().ollamaUrl).replace(/\/$/, '')
  let res: Response
  try {
    res = await fetch(`${base}/api/tags`)
  } catch {
    throw new OllamaError(tx('ต่อ Ollama ไม่ได้', "Can't connect to Ollama"), 'unreachable')
  }
  if (!res.ok) throw new OllamaError(`Ollama error ${res.status}`)
  const data = await res.json()
  const models: OllamaTag[] = data.models ?? []
  return models
    .filter((m) => !['bert', 'nomic-bert'].includes(m.details?.family ?? ''))
    .map((m) => m.name)
}

/** คุยกับโมเดล local — คืนข้อความตอบ (json=true บังคับตอบเป็น JSON) */
export async function ollamaChat(
  system: string,
  messages: ChatMessage[],
  json: boolean,
  temperature = 0.8,
): Promise<string> {
  const { ollamaUrl, ollamaModel } = getSettings()
  if (!ollamaModel) throw new OllamaError(tx('ยังไม่ได้เลือกโมเดล Ollama (ตั้งค่าได้ในหน้า Settings)', 'No Ollama model selected yet (choose one in Settings)'), 'no-model')

  const base = ollamaUrl.replace(/\/$/, '')
  let res: Response
  try {
    res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        stream: false,
        ...(json ? { format: 'json' } : {}),
        messages: [
          { role: 'system', content: system },
          ...messages.map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
        ],
        options: { temperature },
      }),
    })
  } catch {
    throw new OllamaError(tx('ต่อ Ollama ไม่ได้ — เช็คว่าแอป Ollama เปิดอยู่บนเครื่องนี้', "Can't connect to Ollama — make sure the Ollama app is running on this computer"), 'unreachable')
  }
  if (res.status === 404) throw new OllamaError(tx(`ไม่พบโมเดล ${ollamaModel} — ลองเลือกใหม่ในหน้าตั้งค่า`, `Model ${ollamaModel} not found — pick another one in Settings`), 'no-model')
  if (!res.ok) throw new OllamaError(`Ollama error ${res.status}`)

  const data = await res.json()
  let text: string = data?.message?.content ?? ''
  // กันโมเดลสาย reasoning แอบใส่ความคิดมาในคำตอบ
  text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  if (!text) throw new OllamaError(tx('ไม่ได้รับคำตอบจากโมเดล', 'No response from the model'))
  return text
}
