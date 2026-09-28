// ปุ่มหลักของแอป — ขอบล่างหนาแล้วยุบลงตอนกด ให้ความรู้สึก "กดติด" แบบแอปเรียนภาษา
//
// ห้ามเขียนสีปุ่มเองในหน้าจอ ให้เพิ่ม variant ที่นี่แทน จะได้คุมธีมที่เดียว

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'warm' | 'soft' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  // ขอบล่างใช้สีเข้มกว่าอีกเฉด → ตอนกดจะยุบลงไปทับพอดี
  primary: 'bg-aqua-500 text-white shadow-[0_4px_0_0_var(--color-aqua-700)] hover:bg-aqua-400',
  warm: 'bg-tang-500 text-white shadow-[0_4px_0_0_var(--color-tang-700)] hover:bg-tang-400',
  soft: 'bg-aqua-50 text-aqua-700 shadow-[0_4px_0_0_var(--color-aqua-200)] hover:bg-aqua-100',
  ghost: 'bg-surface text-navy-700 ring-1 ring-navy-200/60 shadow-[0_4px_0_0_rgb(174_182_198_/_0.35)] hover:bg-bee-50',
  danger: 'bg-berry-500 text-white shadow-[0_4px_0_0_var(--color-berry-600)] hover:bg-berry-400',
}

const SIZES: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-sm rounded-input gap-1.5',
  md: 'px-5 py-2.5 text-[15px] rounded-btn gap-2',
  lg: 'px-6 py-3.5 text-base rounded-btn gap-2',
}

const BASE =
  'inline-flex items-center justify-center font-bold transition-[transform,background-color,box-shadow] duration-100 ' +
  'active:translate-y-[3px] active:shadow-none ' +
  'disabled:opacity-45 disabled:shadow-none disabled:active:translate-y-0 disabled:cursor-default ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua-500'

interface Common {
  variant?: Variant
  size?: Size
  full?: boolean
  icon?: ReactNode
  children?: ReactNode
  className?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  full,
  icon,
  children,
  className = '',
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

/** ปุ่มที่เป็นลิงก์ — หน้าตาเหมือนกันเป๊ะ แต่ใช้ react-router ไม่ใช่ onClick */
export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  full,
  icon,
  children,
  className = '',
}: Common & { to: string }) {
  return (
    <Link
      to={to}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
    >
      {icon}
      {children}
    </Link>
  )
}

/** ปุ่มกลมไอคอนเดียว (ฟังเสียง / ไมค์ / เล่นซ้ำ) แบบที่ reference ใช้เยอะ */
export function IconButton({
  variant = 'warm',
  className = '',
  children,
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${BASE} ${VARIANTS[variant]} h-12 w-12 rounded-full text-lg ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
