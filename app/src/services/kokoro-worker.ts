// Web Worker สำหรับ Kokoro TTS — โหลดโมเดล + generate เสียงนอก main thread กัน UI ค้าง

import { KokoroTTS } from 'kokoro-js'

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'

interface InitMsg {
  type: 'init'
}

interface GenerateMsg {
  type: 'generate'
  id: number
  text: string
  voice: string
}

type InMsg = InitMsg | GenerateMsg

const wctx = self as unknown as {
  postMessage(msg: unknown, transfer?: Transferable[]): void
  onmessage: ((e: MessageEvent<InMsg>) => void) | null
}

let tts: KokoroTTS | null = null
let initPromise: Promise<KokoroTTS> | null = null

interface ProgressInfo {
  status: string
  file?: string
  progress?: number
}

function loadModel(): Promise<KokoroTTS> {
  if (!initPromise) {
    initPromise = KokoroTTS.from_pretrained(MODEL_ID, {
      dtype: 'q8', // ~90MB ใช้ได้ทุกเครื่อง (wasm)
      device: 'wasm',
      progress_callback: (p: ProgressInfo) => {
        // รายงานเฉพาะไฟล์โมเดลหลัก (ไฟล์ใหญ่สุด) กัน progress กระโดดไปมา
        if (p.status === 'progress' && p.file?.endsWith('.onnx')) {
          wctx.postMessage({ type: 'progress', progress: p.progress ?? 0 })
        }
      },
    })
  }
  return initPromise
}

wctx.onmessage = async (e: MessageEvent<InMsg>) => {
  const msg = e.data
  if (msg.type === 'init') {
    try {
      tts = await loadModel()
      wctx.postMessage({ type: 'ready' })
    } catch (err) {
      initPromise = null
      wctx.postMessage({ type: 'error', message: String(err) })
    }
    return
  }

  if (msg.type === 'generate') {
    try {
      if (!tts) tts = await loadModel()
      const audio = await tts.generate(msg.text, { voice: msg.voice as never })
      const samples = audio.audio as Float32Array
      wctx.postMessage(
        { type: 'audio', id: msg.id, sampleRate: audio.sampling_rate, samples },
        [samples.buffer],
      )
    } catch (err) {
      wctx.postMessage({ type: 'generate-error', id: msg.id, message: String(err) })
    }
  }
}
