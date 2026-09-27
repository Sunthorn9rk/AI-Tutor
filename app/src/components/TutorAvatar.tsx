import { lazy, Suspense, useEffect, useState } from 'react'
import { getTutor } from '../content/course'
import { getSettings } from '../services/store'
import { getAvatarUrl } from '../services/avatar-file'

// โหลด three.js เฉพาะตอนใช้ตัวละคร 3D จริง ๆ (ไฟล์ใหญ่)
const VrmAvatar = lazy(() => import('./VrmAvatar'))

interface Props {
  tutorId: string
  speaking?: boolean
  size?: number
  className?: string
  /** true = avatar ตัวใหญ่กลางบทเรียน (ใช้ตัวละคร 3D ได้) — ที่อื่นใช้การ์ตูนเสมอ */
  stage?: boolean
}

export default function TutorAvatar({ tutorId, speaking = false, size = 160, className = '', stage = false }: Props) {
  const useVrm = stage && getSettings().avatarStyle === 'vrm'
  const [vrmUrl, setVrmUrl] = useState<string | null>(null)

  useEffect(() => {
    if (useVrm) getAvatarUrl().then(setVrmUrl)
  }, [useVrm])

  if (useVrm && vrmUrl) {
    return (
      <Suspense fallback={<CartoonAvatar tutorId={tutorId} speaking={speaking} size={size} className={className} />}>
        <VrmAvatar vrmUrl={vrmUrl} speaking={speaking} size={size} className={className} />
      </Suspense>
    )
  }
  return <CartoonAvatar tutorId={tutorId} speaking={speaking} size={size} className={className} />
}

/** Avatar การ์ตูน SVG — ปากขยับตอนพูด กะพริบตาเอง (เบา ใช้ได้ทุกที่) */
function CartoonAvatar({
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
  const t = getTutor(tutorId)
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-white ${speaking ? 'talking-ring' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 120" width={size} height={size} className="rounded-full">
        {/* พื้นหลัง */}
        <circle cx="60" cy="60" r="60" fill="#fff3d6" />
        {/* ผมด้านหลัง (ทรงยาวเท่านั้น) */}
        {t.hairStyle === 'long' && <ellipse cx="60" cy="66" rx="34" ry="42" fill={t.hair} />}
        {/* คอ + เสื้อ */}
        <rect x="52" y="86" width="16" height="14" rx="6" fill={t.skin} />
        <path d="M28 120 Q60 92 92 120 Z" fill={t.shirt} />
        {/* หน้า */}
        <ellipse cx="60" cy="58" rx="26" ry="28" fill={t.skin} />
        {/* ผม */}
        {t.hairStyle === 'long' ? (
          <path d="M34 52 Q36 24 60 24 Q84 24 86 52 Q78 34 60 34 Q42 34 34 52 Z" fill={t.hair} />
        ) : (
          <path d="M33 54 Q33 26 60 25 Q87 26 87 54 Q87 42 78 40 Q70 32 54 34 Q38 37 36 46 Q34 49 33 54 Z" fill={t.hair} />
        )}
        {/* ตา */}
        <g className="eye-blink">
          <circle cx="50" cy="56" r="3.4" fill="#2b2b2b" />
          <circle cx="70" cy="56" r="3.4" fill="#2b2b2b" />
          <circle cx="51.2" cy="54.8" r="1" fill="#fff" />
          <circle cx="71.2" cy="54.8" r="1" fill="#fff" />
        </g>
        {/* คิ้ว */}
        <path d="M45 48 Q50 45 55 48" stroke="#5a4632" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M65 48 Q70 45 75 48" stroke="#5a4632" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* แก้ม */}
        <circle cx="44" cy="66" r="4" fill="#ffb3a0" opacity="0.5" />
        <circle cx="76" cy="66" r="4" fill="#ffb3a0" opacity="0.5" />
        {/* ปาก: วงรีขยับตอนพูด / รอยยิ้มตอนเงียบ */}
        {speaking ? (
          <ellipse cx="60" cy="74" rx="7" ry="5.5" fill="#8c3b2e" className="mouth-talking" />
        ) : (
          <path d="M52 73 Q60 80 68 73" stroke="#8c3b2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
      </svg>
    </div>
  )
}
