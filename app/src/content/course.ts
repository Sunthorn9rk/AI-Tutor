import type { Course, Lesson, Module, Scene } from './schema'
import courseData from './course-a2.json'
import { CAST, getCharacter, type CharacterSpec } from './cast'

export const course = courseData as Course

// รายชื่อ tutor มาจาก content/cast.ts (ตัวละครทั้งหมด) — Mia อยู่ลำดับแรก = ค่าเริ่มต้น
export type TutorInfo = CharacterSpec
export const tutors: TutorInfo[] = CAST

export function getTutor(id: string): TutorInfo {
  return getCharacter(id)
}

export function findLesson(lessonId: string): { module: Module; lesson: Lesson } | null {
  for (const m of course.modules) {
    const lesson = m.lessons.find((l) => l.id === lessonId)
    if (lesson) return { module: m, lesson }
  }
  return null
}

export function findScene(sceneId: string): Scene | null {
  return course.scenes.find((s) => s.id === sceneId) ?? null
}
