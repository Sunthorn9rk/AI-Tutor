// เก็บ settings + progress ทั้งหมดใน localStorage (ใช้คนเดียว ไม่ต้องมี backend)

export type VoiceRate = 'words' | 'calm' | 'natural'

export interface Settings {
  /** ภาษาหน้าแอป (ดู services/i18n.ts) */
  uiLang: 'th' | 'en'
  name: string
  level: string
  tutorId: string
  voiceRate: VoiceRate
  geminiKey: string
  onboarded: boolean
  /** เปิดไมค์ให้อัตโนมัติหลัง AI พูดจบ */
  autoMic: boolean
  /** โชว์เคล็ดลับการออกเสียง (คำอ่านไทย + วิธีวางลิ้น/ปาก) ตอนพูดไม่ตรง */
  pronTips: boolean
  /** เครื่องเสียงพูด: device = เสียงระบบ, gemini = เสียง AI cloud (โควตาจำกัด), local = Kokoro AI ในเครื่อง (ไม่จำกัด) */
  ttsEngine: 'device' | 'gemini' | 'local'
  /** ให้แต่ละตัวละครพูดด้วยเสียงของตัวเอง (ดู services/speaker.ts) — ปิดแล้วใช้เสียงที่เลือกเองด้านล่าง */
  voicePerCharacter: boolean
  /** ชื่อเสียงในเครื่องที่เลือกเอง (ว่าง = ให้แอปเลือกให้) */
  deviceVoice: string
  /** ชื่อเสียง Gemini TTS เช่น Kore, Puck */
  geminiVoice: string
  /** ชื่อเสียง Kokoro เช่น af_heart */
  localVoice: string
  /** สมองของบทสนทนา: gemini = cloud, ollama = โมเดล local บนเครื่อง (ฟรี ไม่จำกัด) */
  llmEngine: 'gemini' | 'ollama'
  ollamaUrl: string
  ollamaModel: string
}

export interface Progress {
  completedLessons: string[]
  completedScenes: string[]
  wordsLearned: number
  /** วันที่เรียน (ISO date เช่น "2026-07-10") */
  studyDays: string[]
  streak: number
}

const SETTINGS_KEY = 'ai-tutor:settings'
const PROGRESS_KEY = 'ai-tutor:progress'

const defaultSettings: Settings = {
  uiLang: 'th',
  name: '',
  level: 'A2',
  tutorId: 'mia',
  voiceRate: 'natural',
  geminiKey: '',
  onboarded: false,
  autoMic: true,
  pronTips: true,
  ttsEngine: 'device',
  voicePerCharacter: true,
  deviceVoice: '',
  geminiVoice: 'Kore',
  localVoice: 'af_heart',
  llmEngine: 'gemini',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: '',
}

const defaultProgress: Progress = {
  completedLessons: [],
  completedScenes: [],
  wordsLearned: 0,
  studyDays: [],
  streak: 0,
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

export function getSettings(): Settings {
  return load(SETTINGS_KEY, defaultSettings)
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  return next
}

export function getProgress(): Progress {
  return load(PROGRESS_KEY, defaultProgress)
}

function saveProgress(patch: Partial<Progress>): Progress {
  const next = { ...getProgress(), ...patch }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(next))
  return next
}

export function todayISO(): string {
  const d = new Date()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** บันทึกว่าวันนี้ได้เรียนแล้ว + อัปเดต streak */
export function recordStudyDay(): Progress {
  const p = getProgress()
  const today = todayISO()
  if (p.studyDays.includes(today)) return p

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yISO = `${yesterday.getFullYear()}-${`${yesterday.getMonth() + 1}`.padStart(2, '0')}-${`${yesterday.getDate()}`.padStart(2, '0')}`

  const streak = p.studyDays.includes(yISO) ? p.streak + 1 : 1
  return saveProgress({ studyDays: [...p.studyDays, today], streak })
}

export function addWords(count: number): Progress {
  const p = getProgress()
  return saveProgress({ wordsLearned: p.wordsLearned + count })
}

export function completeLesson(lessonId: string): Progress {
  const p = getProgress()
  if (p.completedLessons.includes(lessonId)) return p
  return saveProgress({ completedLessons: [...p.completedLessons, lessonId] })
}

export function completeScene(sceneId: string): Progress {
  const p = getProgress()
  if (p.completedScenes.includes(sceneId)) return p
  return saveProgress({ completedScenes: [...p.completedScenes, sceneId] })
}

export function resetProgress() {
  localStorage.removeItem(PROGRESS_KEY)
}

export function resetAll() {
  localStorage.removeItem(PROGRESS_KEY)
  localStorage.removeItem(SETTINGS_KEY)
}
