// ตัวละคร tutor แบบ flat vector (SVG ล้วน) — ไม่ใช้ WebGL ไม่มีไฟล์โมเดล
//
// ทำไมไม่ใช้ React render ทั้งก้อน: อนิเมชันแตะแค่ attribute `transform` ของแต่ละ group
// ทุกเฟรม ถ้าให้ React re-render จะเสียของฟรี ๆ จึงสร้าง DOM ครั้งเดียวแล้วคุมด้วย ref
// (วาดด้วย components/character.ts)
//
// ⚠️ ลำดับการวาดมีกับดัก 3 จุด อย่าสลับ:
//   1. คิ้วต้องวาด "หลัง" เปลือกตา — เปลือกตาเป็นสีผิว ถ้าวาดทีหลังจะทาทับคิ้วหาย
//   2. คอต้องวาด "ก่อน" เสื้อ — ไม่งั้นกลายเป็นแท่งสีผิวพาดทับเสื้อ
//   3. แต่คอต้องขยับ "ตามหัว" — จึงแยกเป็นกลุ่ม .neck ที่รับ transform ของตัวเอง
//      และต้องขยับแค่ ~35% ของหัว ไม่งั้นโคนคอหลุดออกจากคอเสื้อตอนหัวเอียง

import { useEffect, useRef } from 'react'
import { getCharacter } from '../content/cast'
import { buildCharacterSvg, eyeMetrics, DARK, WHITE as TEETH, TONGUE } from './character'
import { getSpeechVolume } from '../services/audio-bus'

interface Props {
  tutorId: string
  speaking: boolean
  size?: number
  className?: string
}

/** ปาก 13 แบบ วาดที่ศูนย์กลาง (0,0) กว้างราว ±26 · open = ระดับการอ้า 0..1 */
const VISEMES: Record<string, { open: number; svg: string }> = {
  rest: { open: 0, svg: `<path d="M-17 -2 Q0 12 17 -2" fill="none" stroke="${DARK}" stroke-width="7" stroke-linecap="round"/>` },
  MBP: { open: 0, svg: `<rect x="-18" y="-4" width="36" height="7.5" rx="3.75" fill="${DARK}"/>` },
  FV: { open: 0.12, svg: `<rect x="-17" y="-1" width="34" height="6" rx="3" fill="${DARK}"/><rect x="-13" y="-7" width="26" height="6" rx="2.4" fill="${TEETH}"/>` },
  SS: { open: 0.16, svg: `<ellipse rx="18" ry="5.5" fill="${DARK}"/><rect x="-13" y="-4.5" width="26" height="4.5" rx="2.2" fill="${TEETH}"/>` },
  E: { open: 0.5, svg: `<ellipse rx="21" ry="10" fill="${DARK}"/><rect x="-16" y="-8.5" width="32" height="5" rx="2.5" fill="${TEETH}"/><ellipse cy="6" rx="11" ry="3.6" fill="${TONGUE}"/>` },
  AA: { open: 1, svg: `<ellipse cy="2" rx="17" ry="17" fill="${DARK}"/><rect x="-12" y="-13.5" width="24" height="5" rx="2.5" fill="${TEETH}"/><ellipse cy="11" rx="9.5" ry="5" fill="${TONGUE}"/>` },
  KG: { open: 0.5, svg: `<ellipse rx="16" ry="12" fill="${DARK}"/><rect x="-11" y="-10" width="22" height="4.5" rx="2.2" fill="${TEETH}"/>` },
  O: { open: 0.62, svg: `<ellipse rx="12" ry="14.5" fill="${DARK}"/>` },
  U: { open: 0.34, svg: `<ellipse rx="7.5" ry="9.5" fill="${DARK}"/>` },
  CH: { open: 0.42, svg: `<ellipse rx="12" ry="12.5" fill="${DARK}"/><ellipse rx="12" ry="12.5" fill="none" stroke="${TONGUE}" stroke-width="3"/>` },
  RR: { open: 0.3, svg: `<ellipse rx="11" ry="9" fill="${DARK}"/>` },
  DDTN: { open: 0.32, svg: `<ellipse rx="13.5" ry="9.5" fill="${DARK}"/><ellipse cy="-3.5" rx="8.5" ry="4" fill="${TONGUE}"/>` },
  TH: { open: 0.3, svg: `<ellipse rx="14" ry="8.5" fill="${DARK}"/><rect x="-10" y="-6.5" width="20" height="3.8" rx="1.9" fill="${TEETH}"/><ellipse cy="4" rx="7.5" ry="4.5" fill="${TONGUE}"/>` },
}

// ระดับความดัง → กลุ่มรูปปากที่เข้าคู่กัน (สุ่มภายในกลุ่มเพื่อไม่ให้ซ้ำซาก)
const LEVELS: { max: number; shapes: string[] }[] = [
  { max: 0.06, shapes: ['MBP', 'rest'] },
  { max: 0.16, shapes: ['SS', 'FV'] },
  { max: 0.3, shapes: ['U', 'DDTN', 'RR'] },
  { max: 0.46, shapes: ['E', 'KG', 'TH'] },
  { max: 0.66, shapes: ['O', 'CH'] },
  { max: 1.01, shapes: ['AA', 'E'] },
]

export default function FlatTutor({ tutorId, speaking, size = 220, className = '' }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const speakingRef = useRef(speaking)
  speakingRef.current = speaking

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    // ตัวละครทั้งตัวมาจาก builder กลาง (content/cast.ts + components/character.ts)
    const spec = getCharacter(tutorId)
    const eye = eyeMetrics(spec)
    host.innerHTML = buildCharacterSvg(spec, { uid: `stage-${tutorId}` })

    const q = (cls: string) => host.querySelector<SVGElement>('.' + cls)!
    const headEl = q('head'), neckEl = q('neck'), bodyEl = q('body')
    const jawEl = q('jaw'), mouthEl = q('mouth')
    const lidsEl = q('lids'), pupilsEl = q('pupils'), browsEl = q('brows')

    let current = 'rest'
    const setViseme = (n: string) => {
      current = VISEMES[n] ? n : 'rest'
      mouthEl.innerHTML = VISEMES[current].svg
    }
    setViseme('rest')

    // ---- สถานะอนิเมชัน ----
    let shownOpen = 0, blink = 0, nextBlink = 1.5, browLift = 0, nextBrow = 2
    let lidBase = eye.lidBase, lidBaseTo = eye.lidBase, nextLidBase = 3
    let dartX = 0, dartY = 0, dartTo: [number, number] = [0, 0], nextDart = 2.5
    let lastShapeAt = 0, lastBand = -1
    // ท่าทางหัว: "ไปหยุดที่ท่า → ค้าง → เปลี่ยนท่า" ไม่ใช่แกว่ง sine (ดู design/README.md)
    const pose = { rot: 0, x: 0, y: 0 }, poseTo = { rot: 0, x: 0, y: 0 }
    let nextPose = 1
    // สุ่ม "ขนาด" ในช่วงที่เห็นชัดก่อนแล้วค่อยสุ่มทิศ — uniform ตรง ๆ ได้ค่าใกล้ศูนย์บ่อย
    const signed = (a: number, b: number) => (Math.random() < 0.5 ? -1 : 1) * (a + Math.random() * (b - a))

    const t0 = performance.now()
    let last = t0, raf = 0

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const t = (now - t0) / 1000
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const talking = speakingRef.current

      // ปาก: ใช้ความดังจริงจาก audio-bus (Kokoro/Gemini) — เสียงระบบไม่ผ่าน bus จึงใช้คลื่นจำลอง
      let level = 0
      if (talking) {
        const vol = getSpeechVolume()
        level = vol > 0.03 ? Math.min(1, vol * 2.4) : (Math.sin(t * 13) + 1) * 0.3
      }
      // เปลี่ยนรูปปาก "เฉพาะตอนข้ามระดับความดัง" เท่านั้น + ต้องค้างอย่างน้อย 150ms
      // (เคยตั้งให้สุ่มรูปใหม่ทุก 110ms แม้ระดับเท่าเดิม → ปากกระพริบรัว)
      const band = LEVELS.findIndex((l) => level < l.max)
      if (band >= 0 && band !== lastBand && now - lastShapeAt > 150) {
        const opts = LEVELS[band].shapes
        setViseme(opts[(Math.random() * opts.length) | 0])
        lastBand = band
        lastShapeAt = now
        // ยักคิ้วเฉพาะตอนอ้ากว้างจริง และไม่ถี่กว่า 1 ครั้ง/2 วิ
        // (เดิมยิงทุกครั้งที่ข้ามระดับ ≈ 2 ครั้ง/วินาที → คิ้วเด้งรัวทั้งประโยค)
        if (band >= 4 && t >= nextBrow) { browLift = 1; nextBrow = t + 2 + Math.random() }
      }

      // หายใจ
      const breath = Math.sin(t * 1.15) * 2.6
      bodyEl.setAttribute('transform', `translate(0 ${breath})`)

      // ท่าทางหัว — ค่าพวกนี้ตั้งไว้ตอนดูบนกรอบใหญ่ พอมาอยู่ใน avatar 220px แล้วแรงเกินจนดูสั่น
      // จึงลดระยะลงครึ่งหนึ่งและยืดจังหวะให้ค้างท่านานขึ้น
      if (t >= nextPose) {
        const amp = talking ? 1 : 0.7
        poseTo.rot = signed(1.8, 4.5) * amp
        poseTo.x = signed(2, 5.5) * amp
        poseTo.y = signed(1, 3) * amp
        nextPose = t + (talking ? 1.4 + Math.random() * 1.2 : 2.4 + Math.random() * 2.5)
      }
      const k = Math.min(1, dt * 2.6)
      pose.rot += (poseTo.rot - pose.rot) * k
      pose.x += (poseTo.x - pose.x) * k
      pose.y += (poseTo.y - pose.y) * k
      const hx = pose.x + Math.sin(t * 0.9) * 0.8
      const hy = pose.y + breath * 0.5
      const hr = pose.rot + Math.sin(t * 0.7) * 0.35
      headEl.setAttribute('transform', `translate(${hx} ${hy}) rotate(${hr} 200 306)`)
      // คอตามหัวแค่ 35% และหมุนรอบโคนคอ ไม่งั้นโคนคอหลุดจากคอเสื้อ
      neckEl.setAttribute('transform', `translate(${hx * 0.35} ${hy * 0.35}) rotate(${hr * 0.3} 200 382)`)

      // กะพริบตา + ระดับเปลือกตาพื้นฐานที่เปลี่ยนไปมา
      if (t >= nextBlink) { blink = 1; nextBlink = t + 2 + Math.random() * 3.5 }
      if (blink > 0) blink = Math.max(0, blink - dt * 8)
      if (t >= nextLidBase) { lidBaseTo = Math.max(0, eye.lidBase - 0.1 + Math.random() * 0.25); nextLidBase = t + 2.5 + Math.random() * 3.5 }
      lidBase += (lidBaseTo - lidBase) * Math.min(1, dt * 1.8)
      const blinkAmt = Math.sin(Math.min(1, 1 - blink) * Math.PI)
      lidsEl.setAttribute('transform', `translate(0 ${eye.top + (lidBase + (1 - lidBase) * blinkAmt) * eye.travel})`)

      // ยักคิ้ว
      if (browLift > 0) browLift = Math.max(0, browLift - dt * 2.8)
      browsEl.setAttribute('transform', `translate(0 ${-browLift * 5})`)

      // ม่านตาเหลือบ
      if (t >= nextDart) { dartTo = [(Math.random() - 0.5) * 7, (Math.random() - 0.5) * 4]; nextDart = t + 2 + Math.random() * 4 }
      dartX += (dartTo[0] - dartX) * Math.min(1, dt * 9)
      dartY += (dartTo[1] - dartY) * Math.min(1, dt * 9)
      pupilsEl.setAttribute('transform', `translate(${dartX} ${dartY})`)

      // ขากรรไกร
      shownOpen += (VISEMES[current].open - shownOpen) * Math.min(1, dt * 16)
      jawEl.setAttribute('transform', `translate(0 ${shownOpen * 7})`)
      mouthEl.setAttribute('transform', `translate(200 ${262 + shownOpen * 4})`)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      host.innerHTML = ''
    }
  }, [tutorId])

  return (
    <div
      ref={hostRef}
      className={`overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10 ${className}`}
      style={{ width: size, height: Math.round(size * 1.2) }}
    />
  )
}
