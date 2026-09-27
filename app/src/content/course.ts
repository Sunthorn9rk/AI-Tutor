import type { Course, Lesson, Module, Scene } from './schema'
import courseData from './course-a2.json'

export const course = courseData as Course

export interface TutorInfo {
  id: string
  name: string
  desc: string
  /** สีผม/ผิว สำหรับ avatar SVG */
  hair: string
  skin: string
  shirt: string
  hairStyle: 'long' | 'short'
}

export const tutors: TutorInfo[] = [
  {
    id: 'mia',
    name: 'Mia',
    desc: 'ครูเสียงอบอุ่น พูดชัด ใจเย็น',
    hair: '#8a5a3b',
    skin: '#ffd9b8',
    shirt: '#e8b4a0',
    hairStyle: 'long',
  },
  {
    id: 'emma',
    name: 'Emma',
    desc: 'สดใส เป็นกันเอง ชวนคุยเก่ง',
    hair: '#e3b04b',
    skin: '#ffe3c4',
    shirt: '#7ea8d8',
    hairStyle: 'long',
  },
  {
    id: 'bryan',
    name: 'Bryan',
    desc: 'มืออาชีพ เหมาะกับภาษาที่ทำงาน',
    hair: '#3b2f2f',
    skin: '#f0c49a',
    shirt: '#4a5d7e',
    hairStyle: 'short',
  },
]

export function getTutor(id: string): TutorInfo {
  return tutors.find((t) => t.id === id) ?? tutors[0]
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
