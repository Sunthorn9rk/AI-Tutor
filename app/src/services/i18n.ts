// ภาษาของหน้าแอป (ไทย/อังกฤษ) — เปลี่ยนได้ในหน้าตั้งค่า
//
// เขียนคู่ข้อความไว้ตรงจุดใช้ tx('ไทย', 'English') แทน dictionary แยกไฟล์:
// มีแค่ 2 ภาษา และอ่านโค้ดแล้วเห็นทั้งสองภาษาพร้อมบริบทเลย
//
// ที่ตั้งใจไม่แปล: เนื้อหาคอร์ส (course-a2.json คำแปลไทยคือตัวช่วยเรียน), เคล็ดลับออกเสียงใน
// pron-rules.ts (อ้างตัวอักษรไทย เช่น "ไม่ใช่ ต หรือ ด"), prompt ของ AI

import { getSettings } from './store'

export type UiLang = 'th' | 'en'

export function uiLang(): UiLang {
  return getSettings().uiLang
}

/** คืนข้อความตามภาษาที่ผู้ใช้เลือก — อ่านค่าทุกครั้ง หน้าจอที่ render ใหม่จะได้ภาษาล่าสุดเสมอ */
export function tx(th: string, en: string): string {
  return uiLang() === 'en' ? en : th
}

/** ให้ <html lang> ตรงกับภาษาที่เลือก (screen reader / ตัดคำของเบราว์เซอร์) */
export function applyDocumentLang() {
  document.documentElement.lang = uiLang()
  document.title = tx('AI Tutor — ฝึกพูดภาษาอังกฤษ', 'AI Tutor — English speaking practice')
}
