// แถบวันในสัปดาห์แบบใน ref: S M T W T F S + เลขวันที่
// วันที่เรียนแล้ว = วงกลมทึบ · วันนี้ = วงแหวน · เสาร์อาทิตย์ = ตัวอักษรสีส้ม
//
// ใช้ข้อมูลจริงจาก progress.studyDays ทั้งหมด ไม่มีค่าสมมติ

import type { Progress } from '../services/store'

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function iso(d: Date) {
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`
}

export default function WeekStrip({ progress }: { progress: Progress }) {
  const now = new Date()
  // ย้อนไปวันอาทิตย์ของสัปดาห์นี้
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay())

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return {
      letter: LETTERS[i],
      date: d.getDate(),
      studied: progress.studyDays.includes(iso(d)),
      isToday: iso(d) === iso(now),
      isWeekend: i === 0 || i === 6,
      future: d > now && iso(d) !== iso(now),
    }
  })

  return (
    <div className="flex justify-between gap-1">
      {days.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <span className={`text-[11px] font-bold ${d.isWeekend ? 'text-tang-500' : 'text-navy-300'}`}>
            {d.letter}
          </span>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold transition ${
              d.studied
                ? 'bg-tang-500 text-white shadow-pop'
                : d.isToday
                  ? 'ring-2 ring-tang-300 text-navy-700'
                  : d.future
                    ? 'text-navy-200'
                    : 'text-navy-300'
            }`}
          >
            {d.date}
          </span>
        </div>
      ))}
    </div>
  )
}
