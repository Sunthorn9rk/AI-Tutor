// cache เสียงที่ generate แล้วลง IndexedDB — ใช้ร่วมกันทั้งเสียง Gemini และเสียง local (Kokoro)
// key ตั้งเป็น `<engine>|<voice>|<text>` เพื่อไม่ชนกัน

const DB_NAME = 'ai-tutor-tts'
const STORE = 'clips'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function ttsCacheGet(key: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB()
    return await new Promise((resolve) => {
      const req = db.transaction(STORE).objectStore(STORE).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function ttsCachePut(key: string, buf: ArrayBuffer): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(buf, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    // cache เต็ม/พัง ไม่เป็นไร — แค่ต้อง generate ใหม่รอบหน้า
  }
}

/** ล้าง cache เสียงทั้งหมด (ไม่กระทบตัวโมเดล Kokoro ที่ browser cache แยกไว้) */
export async function clearTTSCache(): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    /* ignore */
  }
}
