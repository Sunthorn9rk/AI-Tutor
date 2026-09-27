import { getProgress } from '../services/store'
import { course } from '../content/course'
import BottomNav from '../components/BottomNav'

export default function Progress() {
  const p = getProgress()
  const totalLessons = course.modules.reduce((n, m) => n + m.lessons.length, 0)

  // ปฏิทินเดือนปัจจุบัน
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay()
  const iso = (d: number) =>
    `${year}-${`${month + 1}`.padStart(2, '0')}-${`${d}`.padStart(2, '0')}`

  return (
    <div className="mx-auto max-w-md px-5 pb-24 pt-[calc(env(safe-area-inset-top)+20px)]">
      <h1 className="mb-5 text-2xl font-extrabold text-navy-900">สถิติของคุณ 📊</h1>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard icon="⚡" value={p.streak} label="streak (วัน)" />
        <StatCard icon="📚" value={p.wordsLearned} label="คำที่ฝึกพูด" />
        <StatCard icon="✅" value={`${p.completedLessons.length}/${totalLessons}`} label="บทเรียนจบ" />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 font-bold text-navy-900">
          เดือนนี้ ({now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })})
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d) => (
            <div key={d} className="py-1 font-bold text-gray-400">
              {d}
            </div>
          ))}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const studied = p.studyDays.includes(iso(d))
            const isToday = d === now.getDate()
            return (
              <div
                key={d}
                className={`flex aspect-square items-center justify-center rounded-full text-[13px] font-semibold ${
                  studied
                    ? 'bg-bee-400 text-navy-900'
                    : isToday
                      ? 'border-2 border-bee-300 text-navy-900'
                      : 'text-gray-400'
                }`}
              >
                {d}
              </div>
            )
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <div className="rounded-2xl bg-white px-2 py-3.5 text-center shadow-sm">
      <div className="text-xl">{icon}</div>
      <div className="font-en text-xl font-extrabold text-navy-900">{value}</div>
      <div className="text-[11px] text-gray-500">{label}</div>
    </div>
  )
}
