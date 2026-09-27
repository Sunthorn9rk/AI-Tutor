// เก็บไฟล์ตัวละคร .vrm ที่ผู้ใช้เลือกเองลง IndexedDB (โหลดครั้งเดียว ใช้ออฟไลน์ได้)
// เลือกตัวละครที่มากับแอปได้จาก BUNDLED_AVATARS หรืออัปโหลดไฟล์เอง ('custom')

import { getSettings } from './store'

/** ตัวละคร 3D ที่มากับแอป (ไฟล์ใน public/avatars/) */
export const BUNDLED_AVATARS: { file: string; name: string; desc: string }[] = [
  { file: 'tutor.vrm', name: 'Seed-san', desc: 'มาสคอต VRM ทางการ' },
  // shino.vrm และ lia.vrm ไม่ได้อยู่ใน repo สาธารณะ — โมเดลของครีเอเตอร์คนอื่นบน VRoid Hub
  // มักมีเงื่อนไขห้ามแจกจ่ายต่อ (ดู CREDITS.md) ไฟล์ยังอยู่ในเครื่อง ถ้าจะใช้ในเครื่องให้เอา
  // คอมเมนต์ 2 บรรทัดนี้ออก · ผู้ใช้ทั่วไปอัปโหลด .vrm ของตัวเองได้จากหน้า Settings อยู่แล้ว
  // { file: 'shino.vrm', name: 'Shino', desc: 'สาวสไตล์ VRoid ทางการ' },
  // { file: 'lia.vrm', name: 'Lia', desc: 'โดย WierdlyA (VRoid Hub)' },
]

const DB_NAME = 'ai-tutor-avatar'
const STORE = 'files'
const KEY = 'custom-vrm'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

let cachedUrl: string | null = null

export async function saveCustomAvatar(buf: ArrayBuffer): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(buf, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  invalidateAvatarUrl()
}

export async function clearCustomAvatar(): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })
  invalidateAvatarUrl()
}

async function loadCustomAvatar(): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB()
    return await new Promise((resolve) => {
      const req = db.transaction(STORE).objectStore(STORE).get(KEY)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function hasCustomAvatar(): Promise<boolean> {
  return (await loadCustomAvatar()) !== null
}

export function invalidateAvatarUrl() {
  if (cachedUrl?.startsWith('blob:')) URL.revokeObjectURL(cachedUrl)
  cachedUrl = null
}

/** URL ของไฟล์ตัวละครตามที่เลือกใน Settings ('custom' = ไฟล์ใน IndexedDB, อื่น ๆ = ไฟล์ที่มากับแอป) */
export async function getAvatarUrl(): Promise<string> {
  const choice = getSettings().avatarFile
  if (choice === 'custom') {
    if (cachedUrl?.startsWith('blob:')) return cachedUrl
    const custom = await loadCustomAvatar()
    if (custom) {
      cachedUrl = URL.createObjectURL(new Blob([custom]))
      return cachedUrl
    }
    // ไฟล์ custom หาย → ตกไปใช้ตัวเริ่มต้น
  }
  const file = BUNDLED_AVATARS.some((a) => a.file === choice) ? choice : BUNDLED_AVATARS[0].file
  return `${import.meta.env.BASE_URL}avatars/${file}`
}
