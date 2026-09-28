// เสียง AI ในเครื่อง (Kokoro TTS 82M) — ฟรี ไม่จำกัด ออฟไลน์ได้
// - โหลดโมเดล ~90MB ครั้งเดียว (browser cache เก็บให้) แล้ว generate เสียงในเครื่องล้วน ๆ
// - generate ครั้งแรกของแต่ละประโยคใช้เวลา ~1-5 วิ (แล้วแต่เครื่อง) → cache ลง IndexedDB เล่นซ้ำทันที
// - รันใน Web Worker กัน UI ค้าง

import { getSettings } from './store'
import { currentVoice } from './speaker'
import { ttsCacheGet, ttsCachePut } from './tts-cache'
import { getAudioContext, getSpeechOutput } from './audio-bus'

const SAMPLE_RATE = 24000 // Kokoro ให้เสียง 24kHz mono

export const LOCAL_VOICES: { id: string; label: string; labelEn: string }[] = [
  { id: 'af_heart', label: 'Heart — หญิง US (แนะนำ)', labelEn: 'Heart — female US (recommended)' },
  { id: 'af_bella', label: 'Bella — หญิง US สดใส', labelEn: 'Bella — female US, bright' },
  { id: 'af_nicole', label: 'Nicole — หญิง US นุ่มลึก', labelEn: 'Nicole — female US, smooth' },
  { id: 'af_sarah', label: 'Sarah — หญิง US สุภาพ', labelEn: 'Sarah — female US, polite' },
  { id: 'am_michael', label: 'Michael — ชาย US อบอุ่น', labelEn: 'Michael — male US, warm' },
  { id: 'am_adam', label: 'Adam — ชาย US หนักแน่น', labelEn: 'Adam — male US, firm' },
  { id: 'bf_emma', label: 'Emma — หญิง UK', labelEn: 'Emma — female UK' },
  { id: 'bm_george', label: 'George — ชาย UK', labelEn: 'George — male UK' },
]

export type LocalTTSStatus = 'idle' | 'downloading' | 'ready' | 'error'

interface StatusInfo {
  status: LocalTTSStatus
  /** 0-100 ระหว่างดาวน์โหลดโมเดล */
  progress: number
}

let state: StatusInfo = { status: 'idle', progress: 0 }
const listeners = new Set<(s: StatusInfo) => void>()

function setState(patch: Partial<StatusInfo>) {
  state = { ...state, ...patch }
  for (const cb of listeners) cb(state)
}

export function getLocalTTSStatus(): StatusInfo {
  return state
}

/** subscribe สถานะโหลดโมเดล (ให้หน้า Settings โชว์ progress) — คืน unsubscribe */
export function onLocalTTSStatus(cb: (s: StatusInfo) => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

// ---------- worker ----------

let worker: Worker | null = null
let readyPromise: Promise<void> | null = null
let nextId = 1
const pending = new Map<number, { resolve: (r: { samples: Float32Array }) => void; reject: (e: Error) => void }>()

interface WorkerMsg {
  type: 'ready' | 'error' | 'progress' | 'audio' | 'generate-error'
  id?: number
  message?: string
  progress?: number
  samples?: Float32Array
  sampleRate?: number
}

/** เริ่มโหลดโมเดล (เรียกซ้ำได้ ไม่โหลดซ้ำ) — resolve เมื่อพร้อม generate */
export function ensureLocalTTS(): Promise<void> {
  if (readyPromise) return readyPromise

  readyPromise = new Promise<void>((resolve, reject) => {
    setState({ status: 'downloading', progress: 0 })
    worker = new Worker(new URL('./kokoro-worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<WorkerMsg>) => {
      const msg = e.data
      if (msg.type === 'progress') {
        setState({ status: 'downloading', progress: Math.round(msg.progress ?? 0) })
      } else if (msg.type === 'ready') {
        setState({ status: 'ready', progress: 100 })
        resolve()
      } else if (msg.type === 'error') {
        setState({ status: 'error', progress: 0 })
        readyPromise = null
        reject(new Error(msg.message ?? 'โหลดโมเดลไม่สำเร็จ'))
      } else if (msg.type === 'audio' && msg.id !== undefined) {
        pending.get(msg.id)?.resolve({ samples: msg.samples as Float32Array })
        pending.delete(msg.id)
      } else if (msg.type === 'generate-error' && msg.id !== undefined) {
        pending.get(msg.id)?.reject(new Error(msg.message ?? 'generate ไม่สำเร็จ'))
        pending.delete(msg.id)
      }
    }
    worker.onerror = () => {
      setState({ status: 'error', progress: 0 })
      readyPromise = null
      reject(new Error('worker พัง'))
    }
    worker.postMessage({ type: 'init' })
  })
  return readyPromise
}

function generate(text: string, voice: string): Promise<{ samples: Float32Array }> {
  return new Promise((resolve, reject) => {
    if (!worker) {
      reject(new Error('worker ยังไม่พร้อม'))
      return
    }
    const id = nextId++
    pending.set(id, { resolve, reject })
    worker.postMessage({ type: 'generate', id, text, voice })
  })
}

// ---------- playback ----------

let currentSource: AudioBufferSourceNode | null = null

export function stopLocalSpeaking() {
  if (currentSource) {
    try {
      currentSource.stop()
    } catch {
      /* หยุดไปแล้ว */
    }
    currentSource = null
  }
}

async function getOrGenerate(text: string, voice: string): Promise<Float32Array> {
  const cacheKey = `local|${voice}|${text}`
  const cached = await ttsCacheGet(cacheKey)
  if (cached) return new Float32Array(cached)

  await ensureLocalTTS()
  const { samples } = await generate(text, voice)
  // copy ก่อนเก็บ เพราะ buffer เดิมถูก transfer มาแล้วใช้เล่นต่อ
  await ttsCachePut(cacheKey, samples.buffer.slice(0) as ArrayBuffer)
  return samples
}

/** พูดด้วยเสียง Kokoro — โยน error ถ้าโมเดลยังใช้ไม่ได้ (ให้ tts.ts fallback เสียงระบบ) */
export async function speakLocal(text: string, playbackRate = 1, onStart?: () => void): Promise<void> {
  const samples = await getOrGenerate(text, currentVoice().kokoro)

  const c = getAudioContext()
  await c.resume()
  const buf = c.createBuffer(1, samples.length, SAMPLE_RATE)
  buf.copyToChannel(samples as Float32Array<ArrayBuffer>, 0)

  stopLocalSpeaking()
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

// ---------- prefetch (generate ล่วงหน้า ไม่มีลิมิต แค่กัน CPU ทำงานซ้อน) ----------

// เก็บเสียงไว้กับประโยคตั้งแต่ตอนเข้าคิว — ถ้าไปอ่านตอน pump คิวที่ค้างอยู่จะได้เสียงของผู้พูดคนถัดไป
const queue: { text: string; voice: string }[] = []
let pumping = false

export function prefetchLocalTTS(texts: string[]) {
  const { ttsEngine } = getSettings()
  if (ttsEngine !== 'local') return
  const voice = currentVoice().kokoro
  for (const t of texts) {
    const text = t.trim()
    if (text && !queue.some((q) => q.text === text && q.voice === voice)) queue.push({ text, voice })
  }
  void pump()
}

async function pump() {
  if (pumping) return
  pumping = true
  try {
    while (queue.length) {
      const { ttsEngine } = getSettings()
      if (ttsEngine !== 'local') break
      const { text, voice } = queue[0]
      try {
        const cacheKey = `local|${voice}|${text}`
        if (!(await ttsCacheGet(cacheKey))) {
          await ensureLocalTTS()
          const { samples } = await generate(text, voice)
          await ttsCachePut(cacheKey, samples.buffer.slice(0) as ArrayBuffer)
        }
      } catch {
        break // โมเดลพัง/โหลดไม่ได้ — เลิก prefetch รอบนี้
      }
      queue.shift()
    }
  } finally {
    pumping = false
  }
}
