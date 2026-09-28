// "ตอนนี้ใครพูด" — ให้เสียงเข้ากับตัวละคร
//
// ทำไมเป็น state กลางแทนการส่ง option เข้า speak(): มีคนเรียก speak()/prefetchTTS() อยู่ ~15 จุด
// ทั้งใน tts.ts, local-tts.ts, gemini-tts.ts (คิว prefetch เบื้องหลัง) ถ้าส่งผ่าน option ต้องแก้ทุกจุด
// และคิว prefetch จะไม่รู้ว่าประโยคนั้นของใคร
//
// ลำดับการเลือก: ผู้พูดที่หน้าจอตั้งไว้ (เช่น tutor ของ module ในบทเรียน) → tutor ที่ผู้ใช้เลือกในตั้งค่า
// ถ้าผู้ใช้ปิด "เสียงตามตัวละคร" จะกลับไปใช้เสียงที่เลือกเองในหน้าตั้งค่าเหมือนเดิม

import { getCharacter, type CharacterSpec } from '../content/cast'
import { getSettings } from './store'

let activeId: string | null = null

/** หน้าจอที่รู้ว่าใครพูด (LessonPlayer) เรียกตอนเข้า · ส่ง null ตอนออก */
export function setSpeaker(id: string | null) {
  activeId = id
}

export function getSpeaker(): CharacterSpec {
  return getCharacter(activeId ?? getSettings().tutorId)
}

/** เสียงที่ต้องใช้ตอนนี้ — ถ้าผู้ใช้ปิดเสียงตามตัวละคร จะคืนค่าที่ตั้งเองในหน้าตั้งค่า */
export function currentVoice() {
  const s = getSettings()
  if (!s.voicePerCharacter) {
    return { kokoro: s.localVoice, gemini: s.geminiVoice, pitch: 1.05, rate: 1, gender: null as 'f' | 'm' | null }
  }
  const v = getSpeaker().voice
  return { kokoro: v.kokoro, gemini: v.gemini, pitch: v.pitch, rate: v.rate, gender: v.gender as 'f' | 'm' | null }
}
