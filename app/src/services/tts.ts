// Text-to-Speech ผ่าน speechSynthesis (ฟรี, เสียงในเครื่อง)
//
// ข้อควรระวัง (บั๊กที่รู้จักกันดีของ speechSynthesis):
// 1. speak() ทันทีหลัง cancel() → ต้นประโยคถูกกลืน ต้องหน่วงสั้น ๆ ก่อน
// 2. getVoices() ครั้งแรกมักว่าง (โหลด async) → ประโยคแรกได้เสียง default เพี้ยน ๆ
// 3. engine init แบบ lazy → utterance แรกสุดโดนตัดหัวเสียง ต้อง warm-up ด้วยเสียงเงียบก่อน

import { getSettings, type VoiceRate } from './store'
import { speakGemini, stopGeminiSpeaking, prefetchGeminiTTS } from './gemini-tts'
import { speakLocal, stopLocalSpeaking, prefetchLocalTTS } from './local-tts'
import { currentVoice } from './speaker'

const RATE_PRESETS: Record<VoiceRate, number> = {
  words: 0.6, // เน้นทีละคำ ช้า
  calm: 0.82, // ช้ากว่าปกติเล็กน้อย ฟังชัด
  natural: 1.0, // ความเร็วธรรมชาติ
}

// จำเสียงที่เลือกได้แล้ว แยกตามเพศ/ชื่อที่ตั้งเอง — getVoices() ช้าและบางทีคืนลำดับไม่เหมือนเดิม
const voiceCache = new Map<string, SpeechSynthesisVoice>()

// ชื่อเสียงในเครื่องที่รู้เพศแน่นอน (macOS/iOS/Chrome/Windows) — ใช้เลือกเสียงให้เข้ากับตัวละคร
const FEMALE = ['samantha', 'ava', 'allison', 'susan', 'zoe', 'nicky', 'joelle', 'karen', 'moira', 'tessa', 'victoria', 'fiona', 'serena', 'kate', 'google us english', 'google uk english female', 'microsoft aria', 'microsoft jenny', 'microsoft zira']
const MALE = ['alex', 'daniel', 'aaron', 'arthur', 'fred', 'tom', 'oliver', 'rishi', 'reed', 'eddy', 'evan', 'nathan', 'gordon', 'lee', 'google uk english male', 'microsoft guy', 'microsoft david', 'microsoft mark']

/** รายชื่อเสียงอังกฤษทั้งหมดในเครื่อง (ให้หน้า Settings ทำ dropdown) */
export function listEnglishVoices(): SpeechSynthesisVoice[] {
  const voices = window.speechSynthesis?.getVoices() ?? []
  return voices
    .filter((v) => v.lang.toLowerCase().startsWith('en'))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** เลือกเสียงในเครื่อง: ถ้าเปิดเสียงตามตัวละคร เลือกตามเพศของผู้พูด ·
 *  ไม่งั้นใช้ตัวที่ผู้ใช้เลือกเอง หรือเลือกเสียง enhanced/premium ให้ */
export function pickVoice(): SpeechSynthesisVoice | null {
  const { gender } = currentVoice()
  const wanted = gender ? '' : getSettings().deviceVoice
  const key = gender ? `g:${gender}` : `m:${wanted}`
  const cached = voiceCache.get(key)
  if (cached) return cached

  const voices = window.speechSynthesis?.getVoices() ?? []
  if (!voices.length) return null
  const remember = (v: SpeechSynthesisVoice) => (voiceCache.set(key, v), v)

  if (wanted) {
    const hit = voices.find((v) => v.name === wanted)
    if (hit) return remember(hit)
  }

  const en = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
  const us = en.filter((v) => v.lang.startsWith('en-US') || v.lang.startsWith('en_US'))
  if (!en.length) return null

  if (gender) {
    // US ก่อน แล้วค่อย UK/AU — ถ้าเครื่องไม่มีเสียงเพศนั้นเลย ตกไปใช้เสียงปกติ (pitch ยังช่วยแยกได้)
    for (const pool of [us, en]) {
      for (const name of gender === 'm' ? MALE : FEMALE) {
        const hit = pool.find((v) => v.name.toLowerCase().includes(name))
        if (hit) return remember(hit)
      }
    }
  }

  const pool = us.length ? us : en
  for (const name of ['samantha', 'ava', 'allison', 'google us english', 'zoe', 'nicky', 'joelle']) {
    const hit = pool.find((v) => v.name.toLowerCase().includes(name))
    if (hit) return remember(hit)
  }
  return remember(pool.find((v) => v.default) ?? pool[0])
}

/** เรียกเมื่อผู้ใช้เปลี่ยนเสียงในหน้า Settings เพื่อให้เลือกใหม่ */
export function resetVoiceCache() {
  voiceCache.clear()
}

// voice list โหลด async ในบาง browser
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    voiceCache.clear()
    pickVoice()
  }
}

/** รอจนรายชื่อ voice โหลดเสร็จ (หรือหมดเวลา) — กันประโยคแรกได้เสียง default ผิดตัว */
function waitForVoices(timeoutMs = 1500): Promise<void> {
  const synth = window.speechSynthesis
  if (synth.getVoices().length) return Promise.resolve()
  return new Promise((resolve) => {
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      synth.removeEventListener('voiceschanged', done)
      resolve()
    }
    synth.addEventListener('voiceschanged', done)
    setTimeout(done, timeoutMs)
  })
}

let warmupPromise: Promise<void> | null = null

/** อุ่นเครื่อง engine ด้วย utterance เงียบ 1 ครั้ง — กันเสียงต้นประโยคแรกหาย/เพี้ยน */
export function warmUpTTS(): Promise<void> {
  if (!isTTSSupported()) return Promise.resolve()
  if (!warmupPromise) {
    warmupPromise = (async () => {
      await waitForVoices()
      const synth = window.speechSynthesis
      await new Promise<void>((resolve) => {
        const u = new SpeechSynthesisUtterance('hi')
        u.volume = 0 // เงียบสนิท แค่ปลุก engine + โหลด voice
        u.rate = 2
        u.lang = 'en-US'
        const voice = pickVoice()
        if (voice) u.voice = voice
        let settled = false
        const finish = () => {
          if (!settled) {
            settled = true
            resolve()
          }
        }
        u.onend = finish
        u.onerror = finish
        setTimeout(finish, 700)
        synth.resume()
        synth.speak(u)
      })
    })()
  }
  return warmupPromise
}

// อุ่นเครื่องตั้งแต่ gesture แรกของผู้ใช้ (บาง browser ต้องมี gesture ก่อนถึงจะยอมให้พูด)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.addEventListener('pointerdown', () => void warmUpTTS(), { once: true })
}

export interface SpeakOptions {
  rate?: VoiceRate
  /** override rate ตรง ๆ (เช่นปุ่มฟังช้า) */
  rateValue?: number
  /** เรียกทุกครั้งที่ขึ้นคำใหม่ (ใช้ทำ animation ปาก) */
  onBoundary?: () => void
  /** เรียกครั้งเดียวตอนเสียงเริ่มดังจริง — ใช้ sync ข้อความให้โผล่พร้อมเสียง (เสียง AI ต้อง generate ก่อน) */
  onStart?: () => void
}

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel()
  stopGeminiSpeaking()
  stopLocalSpeaking()
}

/** โหลด/generate เสียงล่วงหน้าตาม engine ที่เลือก (device ไม่ต้องเตรียมอะไร) */
export function prefetchTTS(texts: string[]) {
  const engine = getSettings().ttsEngine
  if (engine === 'gemini') prefetchGeminiTTS(texts)
  else if (engine === 'local') prefetchLocalTTS(texts)
}

/** พูดข้อความ คืน Promise ที่ resolve เมื่อพูดจบ (หรือถูก cancel)
 *  เลือก engine ตาม Settings: เสียง Gemini (ธรรมชาติ) → ถ้าพัง/โควตาหมด fallback เสียงในเครื่อง */
export async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  // onStart ต้องถูกเรียกเสมอไม่ว่าเส้นทางไหน (ไม่งั้นข้อความที่รอ sync จะไม่โผล่)
  let startFired = false
  const fireStart = () => {
    if (!startFired) {
      startFired = true
      opts.onStart?.()
    }
  }

  if (!text.trim()) {
    fireStart()
    return
  }
  const settings = getSettings()
  const profile = currentVoice()
  // ความเร็วประจำตัวละคร (เช่น คุณยายพูดช้า) คูณกับความเร็วที่ผู้ใช้เลือก
  const rate = (opts.rateValue ?? RATE_PRESETS[opts.rate ?? 'natural']) * profile.rate

  // เสียง AI (cloud/local) คุมความเร็วด้วย playbackRate (map ให้แคบกว่า กันเสียงเพี้ยน)
  const playbackRate = Math.min(1, Math.max(0.75, 0.6 + 0.4 * rate))

  if (settings.ttsEngine === 'gemini' && settings.geminiKey) {
    try {
      stopSpeaking()
      await speakGemini(text, playbackRate, fireStart)
      return
    } catch {
      // โควตาหมด/ออฟไลน์/key ใช้ไม่ได้ → ใช้เสียงระบบแทนเงียบ ๆ
    }
  }

  if (settings.ttsEngine === 'local') {
    try {
      stopSpeaking()
      await speakLocal(text, playbackRate, fireStart)
      return
    } catch {
      // โมเดลยังโหลดไม่เสร็จ/พัง → ใช้เสียงระบบแทนเงียบ ๆ
    }
  }

  if (!isTTSSupported()) {
    fireStart()
    return
  }

  // รอ warm-up ให้จบก่อน (หลังครั้งแรกเป็น no-op) แล้วค่อยเคลียร์คิว
  await warmUpTTS()
  const synth = window.speechSynthesis
  synth.cancel()
  // หน่วงให้ engine เคลียร์คิวหลัง cancel — ไม่งั้นต้นประโยคถูกกลืน
  await new Promise((r) => setTimeout(r, 60))

  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    const voice = pickVoice()
    if (voice) u.voice = voice
    u.rate = rate
    u.pitch = profile.pitch

    let settled = false
    const finish = () => {
      if (!settled) {
        settled = true
        fireStart() // กันกรณี onstart ไม่ยิง — อย่างน้อยข้อความต้องโผล่
        resolve()
      }
    }
    u.onstart = fireStart
    u.onend = finish
    u.onerror = finish
    if (opts.onBoundary) u.onboundary = opts.onBoundary

    // กัน onend ไม่ยิงในบาง browser (iOS บางเวอร์ชัน) — เผื่อเวลาตามความเร็วพูดจริง
    const estimateMs = Math.max(3000, (text.length * 130) / rate)
    setTimeout(finish, estimateMs)

    synth.resume() // กันสถานะ paused ค้าง (บั๊ก Chrome)
    synth.speak(u)
  })
}
