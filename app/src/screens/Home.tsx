import { Link } from 'react-router-dom'
import { course, findScene } from '../content/course'
import { getProgress, getSettings, todayISO } from '../services/store'
import TutorAvatar from '../components/TutorAvatar'
import BottomNav from '../components/BottomNav'

export default function Home() {
  const settings = getSettings()
  const progress = getProgress()
  const studiedToday = progress.studyDays.includes(todayISO())

  return (
    <div className="mx-auto max-w-md pb-24">
      {/* header */}
      <header className="sticky top-0 z-10 border-b border-bee-200 bg-bee-50/95 px-5 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">สวัสดี {settings.name} 👋</div>
            <div className="font-en text-lg font-extrabold text-navy-900">Level {settings.level}</div>
          </div>
          <div
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-bold ${
              studiedToday ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
            }`}
          >
            ⚡ {progress.streak} วัน
          </div>
        </div>
      </header>

      <main className="px-5 pt-5">
        {/* course path */}
        {course.modules.map((m) => {
          const scene = m.sceneId ? findScene(m.sceneId) : null
          return (
            <section key={m.id} className="mb-8">
              <div className="mb-3 flex flex-col items-center text-center">
                <TutorAvatar tutorId={m.tutorId} size={64} />
                <h2 className="mt-2 font-bold text-navy-900">{m.title}</h2>
                <div className="text-sm text-gray-500">{m.titleTh}</div>
              </div>
              <div className="space-y-2.5">
                {m.lessons.map((l) => {
                  const done = progress.completedLessons.includes(l.id)
                  return (
                    <Link
                      key={l.id}
                      to={`/lesson/${l.id}`}
                      className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm transition active:scale-[0.98]"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-bee-100 text-lg">📖</span>
                      <div className="flex-1">
                        <div className="font-en font-bold text-navy-900">{l.title}</div>
                        <div className="text-xs text-gray-500">{l.titleTh}</div>
                      </div>
                      <Check done={done} />
                    </Link>
                  )
                })}
                {scene && (
                  <Link
                    to={`/scene/${scene.id}`}
                    className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-bee-300 bg-bee-100/60 px-4 py-3 transition active:scale-[0.98]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg">{scene.emoji}</span>
                    <div className="flex-1">
                      <div className="font-en font-bold text-navy-900">{scene.title}</div>
                      <div className="text-xs text-gray-500">บทสนทนาจริง — {scene.titleTh}</div>
                    </div>
                    <Check done={progress.completedScenes.includes(scene.id)} />
                  </Link>
                )}
              </div>
            </section>
          )
        })}

        {/* practice zone */}
        <section className="mb-8">
          <h2 className="mb-3 font-bold text-navy-900">ฝึกสนทนาเพิ่มเติม 💬</h2>
          <div className="space-y-2.5">
            <Link
              to="/scene/job-interview"
              className="flex items-center gap-3 rounded-2xl bg-navy-800 px-4 py-3.5 shadow-sm transition active:scale-[0.98]"
            >
              <span className="text-2xl">💼</span>
              <div className="flex-1">
                <div className="font-en font-bold text-white">Job interview</div>
                <div className="text-xs text-gray-300">ฝึกสัมภาษณ์งานเป็นภาษาอังกฤษ</div>
              </div>
            </Link>
            <Link
              to="/freetalk"
              className="flex items-center gap-3 rounded-2xl bg-bee-400 px-4 py-3.5 shadow-sm transition active:scale-[0.98]"
            >
              <span className="text-2xl">🗣️</span>
              <div className="flex-1">
                <div className="font-en font-bold text-navy-900">Free talk</div>
                <div className="text-xs text-navy-700">คุยกับ tutor เรื่องอะไรก็ได้</div>
              </div>
            </Link>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}

function Check({ done }: { done: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
        done ? 'bg-leaf-500 text-white' : 'border-2 border-gray-200 text-transparent'
      }`}
    >
      ✓
    </span>
  )
}
