import { lazy, Suspense, useId, useMemo } from 'react'
import { getCharacter } from '../content/cast'
import { buildCharacterSvg } from './character'

// ตัวละครใหญ่ในบทเรียน = FlatTutor (ขยับปาก/หัว/ตา)
// เคยมีโหมด 3D (VRM/GLB ผ่าน three.js) — ถอดออกแล้ว ดู git history ถ้าต้องการย้อน
const FlatTutor = lazy(() => import('./FlatTutor'))

interface Props {
  tutorId: string
  speaking?: boolean
  size?: number
  className?: string
  /** true = ตัวใหญ่กลางบทเรียนที่ขยับได้ · false = ไอคอนหน้าวงกลมนิ่ง (ใช้ในรายการ หลายตัวต่อหน้า) */
  stage?: boolean
}

export default function TutorAvatar({ tutorId, speaking = false, size = 160, className = '', stage = false }: Props) {
  const icon = <CharacterIcon tutorId={tutorId} speaking={speaking} size={size} className={className} />
  if (!stage) return icon
  return (
    <Suspense fallback={icon}>
      <FlatTutor tutorId={tutorId} speaking={speaking} size={size} className={className} />
    </Suspense>
  )
}

/** หน้าตัวละครตัวเดียวกับในบทเรียน แต่ครอปเฉพาะหัวในวงกลม และไม่มีอนิเมชัน
 *  (หน้า Home มีหลายตัวพร้อมกัน ถ้าใช้ตัวที่ขยับได้จะรัน rAF ซ้อนหลายลูป) */
function CharacterIcon({
  tutorId,
  speaking,
  size,
  className,
}: {
  tutorId: string
  speaking: boolean
  size: number
  className: string
}) {
  const uid = useId().replace(/:/g, '')
  // ครอปกรอบรอบหัว: กว้างพอให้ผมแอฟโฟร/ฮิญาบ/มวยผมไม่ถูกตัด
  const html = useMemo(
    () => buildCharacterSvg(getCharacter(tutorId), { uid: `icon-${uid}`, viewBox: '62 40 276 276' }),
    [tutorId, uid],
  )
  return (
    <div
      className={`relative inline-flex overflow-hidden rounded-full ${speaking ? 'talking-ring' : ''} ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
