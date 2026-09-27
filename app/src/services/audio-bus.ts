// AudioContext กลางของแอป — เสียง TTS (Kokoro/Gemini) วิ่งผ่าน AnalyserNode
// เพื่อให้ตัวละคร 3D อ่านระดับเสียงจริงไปขยับปากแบบ lip-sync

let ctx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let timeData: Uint8Array<ArrayBuffer> | null = null

export function getAudioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

/** โหนดปลายทางที่ source เสียงพูดต้องต่อเข้า (analyser → ลำโพง) */
export function getSpeechOutput(): AudioNode {
  const c = getAudioContext()
  if (!analyser) {
    analyser = c.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.6
    analyser.connect(c.destination)
    timeData = new Uint8Array(analyser.fftSize)
  }
  return analyser
}

/** ระดับเสียงพูดปัจจุบัน 0..1 (RMS) — คืน 0 ถ้ายังไม่มีเสียงผ่านระบบ */
export function getSpeechVolume(): number {
  if (!analyser || !timeData) return 0
  analyser.getByteTimeDomainData(timeData)
  let sum = 0
  for (let i = 0; i < timeData.length; i++) {
    const v = (timeData[i] - 128) / 128
    sum += v * v
  }
  const rms = Math.sqrt(sum / timeData.length)
  // ขยายให้ช่วงพูดปกติ (~0.05-0.3) กลายเป็น 0..1
  return Math.min(1, rms * 4)
}
