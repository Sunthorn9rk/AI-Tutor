import type { StepType } from '../content/schema'
import { blanks } from '../services/matcher'

const LABELS: Record<Exclude<StepType, 'tutor_say'>, { icon: string; text: string }> = {
  speak: { icon: '🎤', text: 'Speak now' },
  repeat_by_ear: { icon: '👂', text: 'Repeat by ear' },
  translate: { icon: '🔄', text: 'Translate now' },
}

interface Props {
  type: Exclude<StepType, 'tutor_say'>
  en: string
  th: string
  /** ข้อความที่ได้ยินระหว่างพูด (โชว์สด) */
  interim?: string
}

/** การ์ดโจทย์ 3 แบบ: Speak now (โชว์ EN+TH) / Repeat by ear (ฟังอย่างเดียว) / Translate now (โชว์ TH + ช่องว่าง) */
export default function ExerciseCard({ type, en, th, interim }: Props) {
  const label = LABELS[type]
  return (
    <div className="pop-in w-full overflow-hidden rounded-2xl bg-white shadow-lg">
      <div className="bg-bee-200 px-4 py-2 text-center text-sm font-bold text-navy-800">
        {label.icon} {label.text}
      </div>
      <div className="px-4 py-4 text-center">
        {type === 'speak' && (
          <>
            <div className="font-en text-xl font-bold text-navy-900">{en}</div>
            <div className="mt-1 text-sm text-gray-500">{th}</div>
          </>
        )}
        {type === 'repeat_by_ear' && (
          <>
            <div className="font-en text-xl font-bold tracking-widest text-navy-900">{blanks(en)}</div>
            <div className="mt-1 text-sm text-gray-500">{th}</div>
          </>
        )}
        {type === 'translate' && (
          <>
            <div className="text-lg font-semibold text-navy-900">{th}</div>
            <div className="mt-2 font-en text-lg font-bold tracking-widest text-bee-600">{blanks(en)}</div>
          </>
        )}
        {interim && <div className="mt-2 text-sm italic text-blue-500">"{interim}"</div>}
      </div>
    </div>
  )
}
