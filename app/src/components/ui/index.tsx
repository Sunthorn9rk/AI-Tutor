// ชุด primitive ของ UI — ทุกหน้าจอควรประกอบจากที่นี่ ไม่เขียน class สี/เงา/มุมโค้งเอง
// (Button / ButtonLink / IconButton แยกอยู่ใน ./Button)

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export { Button, ButtonLink, IconButton } from './Button'

/* ============================================================
   Card — ใบใหญ่มุมโค้ง 24px เงานุ่ม · เป็นหน่วยหลักของทุกหน้า
   ============================================================ */
type CardTone = 'plain' | 'aqua' | 'tang' | 'grape' | 'leaf' | 'bee' | 'dark'

const CARD_TONE: Record<CardTone, string> = {
  plain: 'bg-surface text-navy-900',
  aqua: 'bg-aqua-500 text-white',
  tang: 'bg-tang-500 text-white',
  grape: 'bg-grape-500 text-white',
  leaf: 'bg-leaf-500 text-white',
  bee: 'bg-bee-400 text-navy-900',
  dark: 'bg-navy-800 text-white',
}

export function Card({
  tone = 'plain',
  className = '',
  children,
  onClick,
  to,
  delay,
}: {
  tone?: CardTone
  className?: string
  children: ReactNode
  onClick?: () => void
  /** ใส่ to แล้วจะกลายเป็นลิงก์ (ใช้กับการ์ดบทเรียน) */
  to?: string
  /** หน่วงให้การ์ดไล่กันโผล่ (วินาที) */
  delay?: number
}) {
  const cls =
    `rounded-card p-4 shadow-card ${CARD_TONE[tone]} ` +
    `${to || onClick ? 'transition active:scale-[0.985] active:shadow-none cursor-pointer' : ''} ` +
    `${delay !== undefined ? 'rise-in' : ''} ${className}`
  const style = delay !== undefined ? { animationDelay: `${delay}s` } : undefined

  if (to) return <Link to={to} className={`block ${cls}`} style={style}>{children}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={`w-full text-left ${cls}`} style={style}>{children}</button>
  return <div className={cls} style={style}>{children}</div>
}

/* ============================================================
   Badge / Chip
   ============================================================ */
type BadgeTone = 'aqua' | 'tang' | 'grape' | 'leaf' | 'bee' | 'muted' | 'berry'

const BADGE_TONE: Record<BadgeTone, string> = {
  aqua: 'bg-aqua-100 text-aqua-700',
  tang: 'bg-tang-100 text-tang-700',
  grape: 'bg-grape-100 text-grape-700',
  leaf: 'bg-leaf-100 text-leaf-600',
  bee: 'bg-bee-100 text-bee-600',
  muted: 'bg-navy-200/30 text-navy-500',
  berry: 'bg-berry-100 text-berry-600',
}

export function Badge({
  tone = 'muted',
  className = '',
  children,
}: {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${BADGE_TONE[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

/* ============================================================
   ProgressBar — วิ่งจาก 0 ไปค่าจริงตอนโผล่ (ดู .bar-fill ใน index.css)
   ============================================================ */
export function ProgressBar({
  ratio,
  tone = 'aqua',
  className = '',
  height = 'md',
}: {
  ratio: number
  tone?: 'aqua' | 'tang' | 'leaf' | 'grape' | 'bee'
  className?: string
  height?: 'sm' | 'md'
}) {
  const fill = {
    aqua: 'bg-aqua-500',
    tang: 'bg-tang-500',
    leaf: 'bg-leaf-500',
    grape: 'bg-grape-500',
    bee: 'bg-bee-400',
  }[tone]
  const pct = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-navy-200/25 ${height === 'sm' ? 'h-1.5' : 'h-2.5'} ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`bar-fill h-full rounded-full ${fill}`} style={{ width: pct, ['--to' as string]: pct }} />
    </div>
  )
}

/* ============================================================
   StatCard — ตัวเลขสถิติใบเล็ก (แถวละ 3 ใบ)
   ============================================================ */
export function StatCard({
  icon,
  value,
  label,
  tone = 'plain',
  delay,
}: {
  icon: ReactNode
  value: ReactNode
  label: string
  tone?: CardTone
  delay?: number
}) {
  return (
    <Card tone={tone} className="px-2 py-3.5 text-center" delay={delay}>
      <div className="text-2xl leading-none">{icon}</div>
      <div className="font-en mt-1 text-xl font-extrabold">{value}</div>
      <div className={`mt-0.5 text-[11px] ${tone === 'plain' ? 'text-navy-400' : 'opacity-80'}`}>{label}</div>
    </Card>
  )
}

/* ============================================================
   StatRow — แถวตัวเลขแบ่งคอลัมน์ด้วยเส้นคั่นบาง ๆ (ใน ref เป็นการ์ดฟ้า 3 ช่อง)
   ============================================================ */
export function StatRow({
  items,
  tone = 'aqua',
  className = '',
}: {
  items: { icon: ReactNode; value: ReactNode; label: string }[]
  tone?: 'aqua' | 'grape' | 'tang' | 'plain'
  className?: string
}) {
  const skin = {
    aqua: 'bg-aqua-500 text-white divide-white/25',
    grape: 'bg-grape-500 text-white divide-white/25',
    tang: 'bg-tang-500 text-white divide-white/25',
    plain: 'bg-surface text-navy-900 divide-navy-200/40',
  }[tone]
  return (
    <div className={`flex divide-x rounded-tile ${skin} ${className}`}>
      {items.map((it, i) => (
        <div key={i} className="flex-1 px-2 py-3 text-center">
          <div className="text-base leading-none opacity-90">{it.icon}</div>
          <div className="font-en mt-1 text-lg font-extrabold leading-none">{it.value}</div>
          <div className={`mt-1 text-[10px] leading-tight ${tone === 'plain' ? 'text-navy-400' : 'opacity-75'}`}>
            {it.label}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ============================================================
   Chip — แท็กพาสเทล rounded-full (ref ใช้เป็นแถวคำสำคัญ)
   ============================================================ */
const CHIP_TONE = {
  aqua: 'bg-aqua-100 text-aqua-700',
  tang: 'bg-tang-100 text-tang-700',
  grape: 'bg-grape-100 text-grape-700',
  leaf: 'bg-leaf-100 text-leaf-600',
  bee: 'bg-bee-100 text-bee-600',
} as const

export function Chip({
  tone = 'aqua',
  children,
}: {
  tone?: keyof typeof CHIP_TONE
  children: ReactNode
}) {
  return <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${CHIP_TONE[tone]}`}>{children}</span>
}

/* ============================================================
   Ring — ครอบ avatar ด้วยวงแหวนสี (ref ใช้กับรูปคนทุกที่)
   ============================================================ */
export function Ring({
  tone = 'bee',
  size = 56,
  children,
}: {
  tone?: 'bee' | 'aqua' | 'tang' | 'grape' | 'leaf'
  size?: number
  children: ReactNode
}) {
  const ring = {
    bee: 'bg-bee-100 ring-bee-300',
    aqua: 'bg-aqua-50 ring-aqua-300',
    tang: 'bg-tang-50 ring-tang-300',
    grape: 'bg-grape-50 ring-grape-300',
    leaf: 'bg-leaf-50 ring-leaf-300',
  }[tone]
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ${ring}`}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  )
}

/* ============================================================
   SectionHeader
   ============================================================ */
export function SectionHeader({
  title,
  action,
  className = '',
}: {
  title: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`mb-3 flex items-end justify-between gap-3 ${className}`}>
      <h2 className="text-base font-extrabold text-navy-900">{title}</h2>
      {action}
    </div>
  )
}

/* ============================================================
   EmptyState — ใช้กับหน้าที่ยังไม่มีข้อมูล (มีที่ให้วาง mascot)
   ============================================================ */
export function EmptyState({
  emoji = '🌱',
  title,
  desc,
  action,
}: {
  emoji?: ReactNode
  title: string
  desc?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-bee-100 text-4xl">{emoji}</div>
      <div className="font-bold text-navy-900">{title}</div>
      {desc && <p className="mt-1 max-w-[16rem] text-sm leading-relaxed text-navy-400">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ============================================================
   Skeleton — สถานะกำลังโหลด
   ============================================================ */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-tile bg-navy-200/25 ${className}`} />
}
