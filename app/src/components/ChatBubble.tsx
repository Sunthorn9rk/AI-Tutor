import { useState } from 'react'
import { speak } from '../services/tts'
import { translateToThai } from '../services/gemini'

interface Props {
  role: 'ai' | 'user'
  text: string
  /** feedback เล็ก ๆ ข้างข้อความผู้ใช้ เช่น "Nice!" */
  praise?: string
}

/** bubble แชท — ของ AI มีปุ่ม ฟังซ้ำ / ฟังช้า / แปลไทย เหมือนต้นฉบับ */
export default function ChatBubble({ role, text, praise }: Props) {
  const [translation, setTranslation] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)

  const doTranslate = async () => {
    if (translation) {
      setTranslation(null)
      return
    }
    setTranslating(true)
    try {
      setTranslation(await translateToThai(text))
    } catch {
      setTranslation('(แปลไม่สำเร็จ — เช็ค API key ในหน้าตั้งค่า)')
    } finally {
      setTranslating(false)
    }
  }

  if (role === 'user') {
    return (
      <div className="pop-in flex items-center justify-end gap-2">
        {praise && (
          <span className="rounded-full bg-leaf-500/15 px-2 py-0.5 text-xs font-bold text-leaf-600">
            ✓ {praise}
          </span>
        )}
        <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-blue-600 px-4 py-2.5 font-en text-[15px] text-white shadow">
          {text}
        </div>
      </div>
    )
  }

  return (
    <div className="pop-in max-w-[85%]">
      <div className="rounded-2xl rounded-bl-sm bg-bee-200 px-4 py-2.5 font-en text-[15px] text-navy-900 shadow">
        {text}
        {translation && <div className="mt-1.5 border-t border-bee-400/40 pt-1.5 text-sm text-navy-700">{translation}</div>}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        <BubbleBtn label="ฟังซ้ำ" onClick={() => speak(text, { rate: 'natural' })}>
          🔊
        </BubbleBtn>
        <BubbleBtn label="ฟังช้า" onClick={() => speak(text, { rateValue: 0.55 })}>
          🐢
        </BubbleBtn>
        <BubbleBtn label="แปลไทย" onClick={doTranslate}>
          {translating ? '…' : '🇹🇭'}
        </BubbleBtn>
      </div>
    </div>
  )
}

function BubbleBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs shadow-sm transition active:scale-90"
    >
      {children}
    </button>
  )
}
