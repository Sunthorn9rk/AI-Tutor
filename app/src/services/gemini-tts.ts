// เสียงพูดธรรมชาติจาก Gemini TTS (free tier ใช้ key เดียวกับแชท)
//
// ข้อจำกัด free tier ของรุ่น TTS: ~3 requests/นาที และ ~15 ประโยคใหม่/วัน ดังนั้น:
// - เสียงทุกประโยคถูก cache ลง IndexedDB → ประโยคเดิมไม่กินโควตาซ้ำ + เล่นทันที
// - มี prefetch queue เว้นจังหวะ ~21 วิ/ครั้ง เพื่อทยอยโหลดเสียงล่วงหน้าโดยไม่ชนลิมิต
// - ประโยคที่ยังไม่มี cache และยิงตอนนี้ไม่ได้ → โยน error ให้ tts.ts fallback เสียงในเครื่อง
//   แล้วเข้าคิวโหลดเงียบ ๆ ไว้ให้รอบหน้า

import { getSettings } from './store'
import { ttsCacheGet as cacheGet, ttsCachePut as cachePut } from './tts-cache'
import { getAudioContext, getSpeechOutput } from './audio-bus'

const TTS_MODEL = 'gemini-2.5-flash-preview-tts'
const SAMPLE_RATE = 24000 // Gemini ส่ง PCM16 mono 24kHz
const MIN_INTERVAL_MS = 21000 // free tier ~3 req/นาที → เว้น 21 วิ
const QUOTA_BLOCK_MS = 10 * 60_000 // โดน 429 → พัก 10 นาทีค่อยลองใหม่

/** เสียงที่คัดมาให้เลือก (จาก ~30 เสียงของ Gemini) */
export const GEMINI_VOICES: { id: string; label: string }[] = [
  { id: 'Kore', label: 'Kore — หญิง มั่นใจ ชัดเจน' },
  { id: 'Aoede', label: 'Aoede — หญิง สดใส เป็นธรรมชาติ' },
  { id: 'Leda', label: 'Leda — หญิง อ่อนเยาว์' },
  { id: 'Zephyr', label: 'Zephyr — หญิง สดชื่น กระตือรือร้น' },
  { id: 'Puck', label: 'Puck — ชาย ร่าเริง' },
  { id: 'Charon', label: 'Charon — ชาย ทุ้ม ให้ความรู้' },
  { id: 'Fenrir', label: 'Fenrir — ชาย หนักแน่น' },
]

let currentSource: AudioBufferSourceNode | null = null

// ---------- rate limiter + fetch ----------

export class GeminiTTSError extends Error {
  kind: 'no-key' | 'quota' | 'network' | 'other'

  constructor(message: string, kind: 'no-key' | 'quota' | 'network' | 'other' = 'other') {
    super(message)
    this.kind = kind
  }
}

let lastFetchAt = 0
let blockedUntil = 0
/** กันยิงซ้ำประโยคเดียวกันพร้อมกัน (speak กับ prefetch ชนกัน) */
const inflight = new Map<string, Promise<ArrayBuffer>>()

function canFetchNow(): boolean {
  const now = Date.now()
  return now >= blockedUntil && now - lastFetchAt >= MIN_INTERVAL_MS
}

async function fetchTTS(text: string, voice: string, key: string): Promise<ArrayBuffer> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${encodeURIComponent(key)}`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }),
    })
  } catch {
    throw new GeminiTTSError('network', 'network')
  }
  if (res.status === 429) throw new GeminiTTSError('quota', 'quota')
  if (!res.ok) throw new GeminiTTSError(`tts ${res.status}`, 'other')

  const data = await res.json()
  const b64: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
  if (!b64) throw new GeminiTTSError('no-audio', 'other')

  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

function fetchAndCache(text: string, voice: string, key: string, cacheKey: string): Promise<ArrayBuffer> {
  const existing = inflight.get(cacheKey)
  if (existing) return existing

  lastFetchAt = Date.now()
  const p = (async () => {
    try {
      const pcm = await fetchTTS(text, voice, key)
      await cachePut(cacheKey, pcm)
      return pcm
    } catch (e) {
      if (e instanceof GeminiTTSError && e.kind === 'quota') {
        blockedUntil = Date.now() + QUOTA_BLOCK_MS
      }
      throw e
    } finally {
      inflight.delete(cacheKey)
    }
  })()
  inflight.set(cacheKey, p)
  return p
}

// ---------- prefetch queue (โหลดเสียงล่วงหน้าแบบเว้นจังหวะตามลิมิต) ----------

const queue: string[] = []
let pumping = false

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** เข้าคิวโหลดเสียงล่วงหน้า (ข้ามที่ cache แล้ว, เว้นจังหวะกันชนลิมิตฟรี) */
export function prefetchGeminiTTS(texts: string[]) {
  const { geminiKey, ttsEngine } = getSettings()
  if (!geminiKey || ttsEngine !== 'gemini') return
  for (const t of texts) {
    const text = t.trim()
    if (text && !queue.includes(text)) queue.push(text)
  }
  void pump()
}

async function pump() {
  if (pumping) return
  pumping = true
  try {
    while (queue.length) {
      const { geminiKey, geminiVoice, ttsEngine } = getSettings()
      if (!geminiKey || ttsEngine !== 'gemini') break
      if (Date.now() < blockedUntil) break // โควตาหมดชั่วคราว — เลิกรอบนี้

      const text = queue[0]
      const cacheKey = `${geminiVoice}|${text}`
      if (await cacheGet(cacheKey)) {
        queue.shift()
        continue
      }

      const wait = lastFetchAt + MIN_INTERVAL_MS - Date.now()
      if (wait > 0) {
        await sleep(wait)
        continue // เช็คเงื่อนไขใหม่หลังตื่น (settings/blocked อาจเปลี่ยน)
      }

      try {
        await fetchAndCache(text, geminiVoice, geminiKey, cacheKey)
      } catch {
        // quota → blockedUntil ถูกตั้งแล้ว จะหลุด loop เอง / error อื่นข้ามประโยคนี้ไป
      }
      queue.shift()
    }
  } finally {
    pumping = false
  }
}

// ---------- playback ----------

export function stopGeminiSpeaking() {
  if (currentSource) {
    try {
      currentSource.stop()
    } catch {
      /* หยุดไปแล้ว */
    }
    currentSource = null
  }
}

/** พูดด้วยเสียง Gemini — โยน GeminiTTSError ถ้าใช้ไม่ได้ตอนนี้ (ให้ผู้เรียก fallback)
 *  ประโยคที่ยังไม่ cache และติดลิมิต จะถูกเข้าคิวโหลดเงียบ ๆ ให้ใช้ครั้งหน้า */
export async function speakGemini(text: string, playbackRate = 1, onStart?: () => void): Promise<void> {
  const { geminiKey, geminiVoice } = getSettings()
  if (!geminiKey) throw new GeminiTTSError('no-key', 'no-key')

  const cacheKey = `${geminiVoice}|${text}`
  let pcm = await cacheGet(cacheKey)
  if (!pcm) {
    const pending = inflight.get(cacheKey)
    if (pending) {
      // prefetch กำลังโหลดประโยคนี้พอดี — รอใช้เลย ไม่ยิงซ้ำ
      pcm = await pending
    } else if (canFetchNow()) {
      pcm = await fetchAndCache(text, geminiVoice, geminiKey, cacheKey)
    } else {
      // ติดลิมิต — ให้เสียงในเครื่องพูดไปก่อน แล้วเข้าคิวโหลดไว้ใช้รอบหน้า
      prefetchGeminiTTS([text])
      throw new GeminiTTSError('rate-limited', 'quota')
    }
  }

  // PCM16 mono 24kHz → AudioBuffer (ตัดเศษ byte คี่ กัน Int16Array พัง)
  const even = pcm.byteLength - (pcm.byteLength % 2)
  const i16 = new Int16Array(pcm.slice(0, even))
  const f32 = new Float32Array(i16.length)
  for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768

  const c = getAudioContext()
  await c.resume()
  const buf = c.createBuffer(1, f32.length, SAMPLE_RATE)
  buf.copyToChannel(f32, 0)

  stopGeminiSpeaking()
  await new Promise<void>((resolve) => {
    const src = c.createBufferSource()
    src.buffer = buf
    src.playbackRate.value = playbackRate
    src.connect(getSpeechOutput())
    src.onended = () => {
      if (currentSource === src) currentSource = null
      resolve()
    }
    currentSource = src
    onStart?.()
    src.start()
  })
}
