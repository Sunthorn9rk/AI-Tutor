import type { WordDiff } from '../services/matcher'
import { tx } from '../services/i18n'

interface Props {
  diff: WordDiff[]
  /** ข้อความที่ได้ยิน (อัปเดตสดระหว่างพูดรอบใหม่) */
  heard: string
  /** คำอ่านภาษาไทย เช่น "ทู-มี้ท-อัพ" (null = ปิดเคล็ดลับ/ยังไม่มา) */
  reading: string | null
  readingLoading: boolean
  /** เคล็ดลับ rule-based ของคำที่พลาด */
  tricks: string[]
  listening: boolean
  onListen: (slow: boolean) => void
}

/** การ์ดติวออกเสียงตอนตอบไม่ตรง: ไฮไลต์คำที่พลาด + คำอ่านไทย + เคล็ดลับ + ปุ่มฟังซ้ำ/ช้า */
export default function RetryCoach({ diff, heard, reading, readingLoading, tricks, listening, onListen }: Props) {
  return (
    <div className="pop-in w-full overflow-hidden rounded-2xl bg-white shadow-lg">
      <div className="bg-bee-500 px-4 py-2 text-center text-sm font-bold text-white">
        {listening ? tx('🎤 กำลังฟัง… ลองพูดอีกครั้ง', '🎤 Listening… try again') : tx('เกือบแล้ว! ลองพูดอีกครั้ง 💪', 'Almost! Try again 💪')}
      </div>
      <div className="px-4 py-3">
        {/* เป้าหมาย: เขียว = พูดได้แล้ว, แดงขีดเส้น = ยังพลาด */}
        <div className="text-center font-en text-xl font-bold leading-8">
          {diff.map((d, i) => (
            <span
              key={i}
              className={d.hit ? 'text-leaf-600' : 'text-red-500 underline decoration-red-300 decoration-2 underline-offset-4'}
            >
              {d.word}{' '}
            </span>
          ))}
        </div>
        {(reading || readingLoading) && (
          <div className="mt-1 text-center text-sm text-navy-700">
            {readingLoading ? (
              <span className="animate-pulse text-gray-400">🔤 {tx('กำลังถอดคำอ่าน…', 'Getting Thai reading…')}</span>
            ) : (
              <>
                🔤 {tx('อ่านว่า', 'Reads as')} <b>{reading}</b>
              </>
            )}
          </div>
        )}
        {heard && <div className="mt-1 text-center text-xs italic text-gray-400">{tx('ได้ยินว่า:', 'Heard:')} "{heard}"</div>}

        {tricks.length > 0 && (
          <ul className="mt-2.5 space-y-1 rounded-xl bg-bee-100/70 px-3 py-2 text-[13px] leading-6 text-navy-800">
            {tricks.map((t, i) => (
              <li key={i}>💡 {t}</li>
            ))}
          </ul>
        )}

        <div className="mt-2.5 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => onListen(false)}
            className="rounded-full bg-bee-100 px-3.5 py-1.5 text-xs font-bold text-navy-800 active:scale-95"
          >
            🔊 {tx('ฟังตัวอย่าง', 'Listen')}
          </button>
          <button
            type="button"
            onClick={() => onListen(true)}
            className="rounded-full bg-bee-100 px-3.5 py-1.5 text-xs font-bold text-navy-800 active:scale-95"
          >
            🐢 {tx('ฟังช้า ๆ', 'Listen slowly')}
          </button>
        </div>
      </div>
    </div>
  )
}
