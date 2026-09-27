// โครงสร้างเนื้อหาคอร์ส: Course → Module → Lesson → Step[]

export type StepType = 'tutor_say' | 'speak' | 'repeat_by_ear' | 'translate'

export interface Step {
  type: StepType
  /** ประโยคภาษาอังกฤษ (เป้าหมายที่ tutor พูด หรือที่ผู้เรียนต้องพูด) */
  en: string
  /** คำแปล/โจทย์ภาษาไทย */
  th: string
}

export interface Lesson {
  id: string
  title: string
  titleTh: string
  steps: Step[]
}

export interface SceneTask {
  id: string
  /** ภารกิจ (ภาษาไทย) เช่น "ชวนเพื่อนมาเจอกันพรุ่งนี้" */
  th: string
  /** คำอธิบายภารกิจเป็นภาษาอังกฤษ ให้ LLM ใช้ตัดสินว่าสำเร็จหรือยัง */
  en: string
}

export interface Scene {
  id: string
  title: string
  titleTh: string
  emoji: string
  /** คำอธิบายสถานการณ์ (ไทย) โชว์หน้า brief */
  briefTh: string
  /** บทบาทของ AI ในซีนนี้ (ภาษาอังกฤษ ใช้เป็น system prompt) */
  persona: string
  /** ประโยคเปิดบทสนทนาจาก AI (ตายตัว ไม่ต้องเรียก API) */
  opening: string
  tasks: SceneTask[]
}

export interface Module {
  id: string
  title: string
  titleTh: string
  tutorId: string
  lessons: Lesson[]
  /** scene ปิดท้าย module (ถ้ามี) */
  sceneId?: string
}

export interface Course {
  id: string
  level: string
  title: string
  modules: Module[]
  scenes: Scene[]
}
