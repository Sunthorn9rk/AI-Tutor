// Speech-to-Text ผ่าน Web Speech API (ฟรี, built-in browser)
// ใช้แบบ tap-to-talk: กดไมค์ → ฟังจนพูดจบ → คืน transcript

interface SpeechRecognitionResultEvent {
  resultIndex: number
  results: {
    length: number
    [i: number]: { isFinal: boolean; length: number; [j: number]: { transcript: string } }
  }
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: SpeechRecognitionResultEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionLike)
    | null
}

export function isSTTSupported(): boolean {
  return getRecognitionCtor() !== null
}

export interface ListenController {
  /** หยุดฟังและเอาผลที่ได้ตอนนี้ */
  stop(): void
  /** ยกเลิก ไม่เอาผล */
  abort(): void
}

export interface ListenCallbacks {
  /** ข้อความระหว่างพูด (interim) สำหรับโชว์สด ๆ */
  onInterim?: (text: string) => void
  /** ข้อความสุดท้ายเมื่อฟังจบ (ว่าง = ไม่ได้ยิน) */
  onFinal: (text: string) => void
  onError?: (error: string) => void
}

export function listen(cb: ListenCallbacks): ListenController | null {
  const Ctor = getRecognitionCtor()
  if (!Ctor) {
    cb.onError?.('unsupported')
    return null
  }

  const rec = new Ctor()
  rec.lang = 'en-US'
  rec.continuous = false
  rec.interimResults = true
  rec.maxAlternatives = 1

  let finalText = ''
  let aborted = false
  let done = false

  rec.onresult = (e) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i]
      if (res.isFinal) finalText += res[0].transcript
      else interim += res[0].transcript
    }
    if (interim) cb.onInterim?.(finalText + interim)
    else if (finalText) cb.onInterim?.(finalText)
  }

  rec.onerror = (e) => {
    // "no-speech" / "aborted" ไม่ใช่ error จริง ปล่อยให้ onend จัดการ
    if (e.error !== 'no-speech' && e.error !== 'aborted') {
      done = true
      cb.onError?.(e.error)
    }
  }

  rec.onend = () => {
    if (done) return
    done = true
    if (!aborted) cb.onFinal(finalText.trim())
  }

  try {
    rec.start()
  } catch {
    cb.onError?.('start-failed')
    return null
  }

  return {
    stop: () => rec.stop(),
    abort: () => {
      aborted = true
      rec.abort()
    },
  }
}
