// รายชื่อตัวละครทั้งหมด — ข้อมูลล้วน การวาดอยู่ที่ components/character.ts
// ต้นแบบที่ user อนุมัติ: design/cast.html (2026-09-28) · Mia = ครูหลัก / ค่าเริ่มต้น
//
// เพิ่มตัวใหม่: ใส่ object ใหม่ในนี้ได้เลย ประกอบจากชิ้นส่วนที่มีใน character.ts
// (face / hair / outfit) ถ้าต้องการชิ้นส่วนใหม่ค่อยไปเพิ่มที่ character.ts

export type SkinTone = 'fair' | 'light' | 'tan' | 'brown' | 'deep'
export type FaceShape = 'oval' | 'square' | 'long' | 'round'
export type HairStyle =
  | 'long' | 'bob' | 'bangs' | 'curly' | 'afro' | 'bun' | 'ponytail' | 'pigtails'
  | 'short' | 'sidepart' | 'spiky' | 'buzz' | 'balding' | 'hijab' | 'cap'
export type Outfit =
  | 'crew' | 'collar' | 'hoodie' | 'vneck' | 'turtle' | 'blazer' | 'cardigan' | 'stripe' | 'doctor' | 'apron'

export interface CharacterSpec {
  id: string
  name: string
  age: number
  /** บทบาท/บุคลิก (ไทย) โชว์ในหน้าเลือก tutor */
  desc: string
  descEn: string
  skin: SkinTone
  face: FaceShape
  hair: HairStyle
  /** สีผม (ใช้กับคิ้ว/หนวดด้วย) */
  hairColor: string
  outfit: Outfit
  shirtColor: string
  /** สีของตกแต่ง: ฮิญาบ หมวก ไท โบว์ ผ้ากันเปื้อน ฯลฯ */
  accent?: string
  glasses?: string
  earrings?: string
  mustache?: string
  beard?: boolean
  stubble?: boolean
  wrinkles?: boolean
  freckles?: boolean
  kid?: boolean
  /** พื้นหลังหลังตัวละคร */
  bg: string
  voice: VoiceProfile
}

/** เสียงประจำตัวละคร — ครบทั้ง 3 engine เพราะผู้ใช้สลับ engine ได้ในหน้าตั้งค่า
 *  pitch/rate ใช้ได้กับเสียงระบบเท่านั้น (Kokoro/Gemini เลือกได้แค่ตัวเสียง) */
export interface VoiceProfile {
  gender: 'f' | 'm'
  /** id ใน LOCAL_VOICES ของ local-tts.ts */
  kokoro: string
  /** id ใน GEMINI_VOICES ของ gemini-tts.ts */
  gemini: string
  /** speechSynthesis pitch 0..2 (1 = ปกติ) */
  pitch: number
  /** คูณกับความเร็วที่ผู้ใช้ตั้ง (1 = ตามผู้ใช้) */
  rate: number
}

export const CAST: CharacterSpec[] = [
  { id: 'mia', name: 'Mia', age: 24, desc: 'ครูหลัก ใจเย็น พูดชัด', descEn: 'Main tutor · patient, speaks clearly', skin: 'light', face: 'oval', hair: 'long', hairColor: '#6B4430', outfit: 'crew', shirtColor: '#E8833A', bg: '#DDEFFB', voice: { gender: 'f', kokoro: 'af_heart', gemini: 'Kore', pitch: 1.05, rate: 1 } },
  { id: 'emma', name: 'Emma', age: 27, desc: 'สดใส เป็นกันเอง ชวนคุยเก่ง', descEn: 'Cheerful, friendly, loves to chat', skin: 'fair', face: 'oval', hair: 'bob', hairColor: '#E0B45A', outfit: 'collar', shirtColor: '#3E7BD6', earrings: '#FFC53D', bg: '#ECE0FF', voice: { gender: 'f', kokoro: 'af_bella', gemini: 'Aoede', pitch: 1.15, rate: 1.05 } },
  { id: 'bryan', name: 'Bryan', age: 35, desc: 'มืออาชีพ เหมาะกับภาษาที่ทำงาน', descEn: 'Professional · workplace English', skin: 'tan', face: 'square', hair: 'sidepart', hairColor: '#2B2230', outfit: 'blazer', shirtColor: '#34406B', accent: '#E8833A', stubble: true, bg: '#FFE9D2', voice: { gender: 'm', kokoro: 'am_michael', gemini: 'Charon', pitch: 0.85, rate: 1 } },
  { id: 'aisha', name: 'Aisha', age: 29, desc: 'สายเที่ยว · สนามบิน โรงแรม', descEn: 'Traveler · airports, hotels', skin: 'tan', face: 'oval', hair: 'hijab', hairColor: '#2B2230', accent: '#5B8FD6', outfit: 'turtle', shirtColor: '#F0C246', bg: '#DDF8CB', voice: { gender: 'f', kokoro: 'af_nicole', gemini: 'Leda', pitch: 1.05, rate: 0.98 } },
  { id: 'leo', name: 'Leo', age: 42, desc: 'เชฟ · ร้านอาหาร สั่งอาหาร', descEn: 'Chef · restaurants, ordering food', skin: 'deep', face: 'square', hair: 'afro', hairColor: '#1E1A22', outfit: 'apron', shirtColor: '#3FA37A', accent: '#FFFFFF', beard: true, bg: '#FFF3D6', voice: { gender: 'm', kokoro: 'am_adam', gemini: 'Fenrir', pitch: 0.72, rate: 0.95 } },
  { id: 'nina', name: 'Nina', age: 52, desc: 'หัวหน้างาน · สัมภาษณ์งาน', descEn: 'Manager · job interviews', skin: 'light', face: 'long', hair: 'bob', hairColor: '#9C8E96', outfit: 'blazer', shirtColor: '#C2456B', accent: '#FFC53D', glasses: '#2B2036', bg: '#FFE4E4', voice: { gender: 'f', kokoro: 'bf_emma', gemini: 'Kore', pitch: 0.92, rate: 0.95 } },
  { id: 'noi', name: 'Grandma Noi', age: 71, desc: 'คุณยาย เล่าเรื่องช้า ๆ ฟังง่าย', descEn: 'Grandma · slow, easy-to-follow stories', skin: 'fair', face: 'round', hair: 'bun', hairColor: '#D9D6DE', outfit: 'cardigan', shirtColor: '#8E6FC9', accent: '#F3D3DC', glasses: '#8C5A3B', wrinkles: true, bg: '#DDEFFB', voice: { gender: 'f', kokoro: 'af_sarah', gemini: 'Kore', pitch: 0.9, rate: 0.82 } },
  { id: 'somchai', name: 'Grandpa Somchai', age: 74, desc: 'คุณตาใจดี', descEn: 'Kind grandpa', skin: 'tan', face: 'square', hair: 'balding', hairColor: '#D9D6DE', outfit: 'collar', shirtColor: '#5B8C6E', glasses: '#2B2036', mustache: '#D9D6DE', wrinkles: true, bg: '#FFE9D2', voice: { gender: 'm', kokoro: 'bm_george', gemini: 'Charon', pitch: 0.78, rate: 0.82 } },
  { id: 'ploy', name: 'Ploy', age: 8, desc: 'เด็กประถม ช่างสงสัย', descEn: 'Curious schoolkid', skin: 'light', face: 'round', hair: 'pigtails', hairColor: '#3B2B2B', accent: '#FF6B9A', outfit: 'stripe', shirtColor: '#FF8A00', freckles: true, kid: true, bg: '#ECE0FF', voice: { gender: 'f', kokoro: 'af_bella', gemini: 'Leda', pitch: 1.5, rate: 1.05 } },
  { id: 'jay', name: 'Jay', age: 16, desc: 'วัยรุ่น ภาษาพูด ศัพท์สแลง', descEn: 'Teen · casual talk, slang', skin: 'brown', face: 'oval', hair: 'spiky', hairColor: '#1E1A22', outfit: 'hoodie', shirtColor: '#6C5BD4', bg: '#DDF8CB', voice: { gender: 'm', kokoro: 'am_michael', gemini: 'Puck', pitch: 1.1, rate: 1.08 } },
  { id: 'ken', name: 'Ken', age: 31, desc: 'พนักงานร้านกาแฟ', descEn: 'Coffee shop barista', skin: 'fair', face: 'long', hair: 'cap', hairColor: '#2B2230', accent: '#2F7F6A', outfit: 'apron', shirtColor: '#F5E6B8', bg: '#FFF3D6', voice: { gender: 'm', kokoro: 'am_adam', gemini: 'Puck', pitch: 0.95, rate: 1.02 } },
  { id: 'sofia', name: 'Sofia', age: 22, desc: 'นักศึกษา สายกีฬา', descEn: 'Sporty college student', skin: 'brown', face: 'oval', hair: 'ponytail', hairColor: '#5A3A26', outfit: 'vneck', shirtColor: '#E35D8C', bg: '#FFE4E4', voice: { gender: 'f', kokoro: 'af_nicole', gemini: 'Zephyr', pitch: 1.12, rate: 1.05 } },
  { id: 'tom', name: 'Tom', age: 38, desc: 'คุณพ่อ เรื่องในบ้าน', descEn: 'Dad · everyday home life', skin: 'fair', face: 'square', hair: 'buzz', hairColor: '#8A6A48', outfit: 'crew', shirtColor: '#3E7BD6', beard: true, bg: '#DDEFFB', voice: { gender: 'm', kokoro: 'am_michael', gemini: 'Fenrir', pitch: 0.88, rate: 1 } },
  { id: 'mali', name: 'Mali', age: 33, desc: 'หมอ · โรงพยาบาล สุขภาพ', descEn: 'Doctor · hospital, health', skin: 'tan', face: 'oval', hair: 'bangs', hairColor: '#2B2230', outfit: 'doctor', shirtColor: '#FFFFFF', glasses: '#34406B', bg: '#FFE9D2', voice: { gender: 'f', kokoro: 'af_sarah', gemini: 'Kore', pitch: 1, rate: 0.97 } },
]

export function getCharacter(id: string): CharacterSpec {
  return CAST.find((c) => c.id === id) ?? CAST[0]
}
