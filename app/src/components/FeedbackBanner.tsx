const PRAISE = ['Amazing!', 'Perfect!', 'Wonderful!', 'Great job!', 'You rule!', 'Excellent!']

export function randomPraise(): string {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)]
}

interface Props {
  kind: 'success' | 'retry'
  title: string
  en?: string
  th?: string
}

/** แถบ feedback แบบต้นฉบับ: เขียวเมื่อผ่าน เหลืองเมื่อให้ลองใหม่ */
export default function FeedbackBanner({ kind, title, en, th }: Props) {
  return (
    <div className="pop-in w-full overflow-hidden rounded-2xl bg-white shadow-lg">
      <div
        className={`px-4 py-2 text-center text-sm font-bold text-white ${
          kind === 'success' ? 'bg-leaf-500' : 'bg-bee-500'
        }`}
      >
        {title}
      </div>
      {(en || th) && (
        <div className="px-4 py-3 text-center">
          {en && <div className="font-en text-lg font-bold text-leaf-600">{en}</div>}
          {th && <div className="mt-0.5 text-sm text-gray-500">{th}</div>}
        </div>
      )}
    </div>
  )
}
