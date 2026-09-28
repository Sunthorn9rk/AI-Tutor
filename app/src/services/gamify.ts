// แปลง Progress ที่มีอยู่จริงให้เป็น XP / Level / Achievement
//
// ⚠️ ไฟล์นี้ "คำนวณ" อย่างเดียว ไม่เก็บ state ใหม่ ไม่แตะ store.ts
//    ทุกตัวเลขมาจากข้อมูลที่ผู้ใช้ทำจริง (บทเรียนที่จบ, คำที่ฝึก, วันที่เรียน)
//    ไม่มีค่าปลอมหรือค่าสุ่ม — ถ้ายังไม่เคยเรียน ทุกอย่างจะเป็น 0 ตามจริง

import { course } from '../content/course'
import type { Progress } from './store'

/** แต้มต่อหน่วย — ปรับที่นี่ที่เดียว */
const XP_PER_LESSON = 10
const XP_PER_SCENE = 25
const XP_PER_WORD = 1
/** XP ต่อ 1 เลเวล (คงที่ เพื่อให้ผู้ใช้เดาได้ว่าอีกกี่แต้มขึ้นเลเวล) */
const XP_PER_LEVEL = 120

export interface LevelInfo {
  xp: number
  level: number
  /** XP ที่ทำได้ในเลเวลนี้ (0..XP_PER_LEVEL) */
  xpInLevel: number
  xpPerLevel: number
  /** 0..1 ใช้กับหลอดความคืบหน้า */
  ratio: number
}

export function getXp(p: Progress): number {
  return (
    p.completedLessons.length * XP_PER_LESSON +
    p.completedScenes.length * XP_PER_SCENE +
    p.wordsLearned * XP_PER_WORD
  )
}

export function getLevel(p: Progress): LevelInfo {
  const xp = getXp(p)
  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  const xpInLevel = xp % XP_PER_LEVEL
  return { xp, level, xpInLevel, xpPerLevel: XP_PER_LEVEL, ratio: xpInLevel / XP_PER_LEVEL }
}

export interface Achievement {
  id: string
  icon: string
  title: string
  titleEn: string
  desc: string
  descEn: string
  unlocked: boolean
  /** ความคืบหน้าไปยังเป้า 0..1 */
  ratio: number
  /** เช่น "3/7" ไว้โชว์ใต้ชื่อ */
  detail: string
}

const totalLessons = () => course.modules.reduce((n, m) => n + m.lessons.length, 0)

/** เป้าหมายทั้งหมดอิงจากสิ่งที่นับได้จริงใน Progress */
export function getAchievements(p: Progress): Achievement[] {
  const mk = (
    id: string,
    icon: string,
    [title, titleEn]: [string, string],
    [desc, descEn]: [string, string],
    now: number,
    goal: number,
  ): Achievement => ({
    id,
    icon,
    title,
    titleEn,
    desc,
    descEn,
    unlocked: now >= goal,
    ratio: Math.min(1, goal === 0 ? 0 : now / goal),
    detail: `${Math.min(now, goal)}/${goal}`,
  })

  const lessons = p.completedLessons.length
  const scenes = p.completedScenes.length

  return [
    mk('first-lesson', '🌱', ['ก้าวแรก', 'First step'], ['เรียนจบบทเรียนแรก', 'Finish your first lesson'], lessons, 1),
    mk('five-lessons', '📚', ['ติดลมบน', 'On a roll'], ['เรียนจบ 5 บทเรียน', 'Finish 5 lessons'], lessons, 5),
    mk('all-lessons', '🎓', ['จบคอร์ส', 'Course complete'], ['เรียนจบทุกบทเรียน', 'Finish every lesson'], lessons, totalLessons()),
    mk('first-scene', '💬', ['คุยได้จริง', 'Real talk'], ['ผ่านบทสนทนาแรก', 'Pass your first conversation'], scenes, 1),
    mk('streak-3', '🔥', ['ไฟแรง', 'On fire'], ['เรียนต่อเนื่อง 3 วัน', '3-day streak'], p.streak, 3),
    mk('streak-7', '⚡', ['หนึ่งสัปดาห์', 'One week'], ['เรียนต่อเนื่อง 7 วัน', '7-day streak'], p.streak, 7),
    mk('words-100', '🗣️', ['ร้อยคำ', '100 words'], ['ฝึกพูดครบ 100 คำ', 'Speak 100 words'], p.wordsLearned, 100),
    mk('words-500', '🏆', ['ห้าร้อยคำ', '500 words'], ['ฝึกพูดครบ 500 คำ', 'Speak 500 words'], p.wordsLearned, 500),
  ]
}

/** ความคืบหน้าเป้าหมายรายวัน — นับจาก "วันนี้เรียนหรือยัง" ที่มีอยู่จริง
 *  (แอปยังไม่ได้เก็บจำนวนบทเรียนต่อวัน จึงเป็นเป้าแบบทำ/ยังไม่ทำ ไม่ใช่ตัวเลขปลอม) */
export function getDailyGoal(p: Progress, todayIso: string) {
  const done = p.studyDays.includes(todayIso)
  return { done, ratio: done ? 1 : 0 }
}

/** จำนวนวันที่เรียนทั้งหมด (ใช้แทน "เวลาเรียน" ที่แอปยังไม่ได้เก็บ) */
export function getStudyDayCount(p: Progress): number {
  return p.studyDays.length
}
