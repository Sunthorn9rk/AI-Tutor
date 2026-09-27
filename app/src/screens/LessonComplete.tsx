import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { completeLesson, recordStudyDay, getProgress } from '../services/store'

interface CompleteState {
  lessonId?: string
  sceneId?: string
  steps: number
  words: number
  seconds: number
}

export default function LessonComplete() {
  const nav = useNavigate()
  const state = (useLocation().state ?? { steps: 0, words: 0, seconds: 0 }) as CompleteState

  const [progress, setProgress] = useState(getProgress())

  useEffect(() => {
    if (state.lessonId) completeLesson(state.lessonId)
    setProgress(recordStudyDay())
  }, [state.lessonId])
  const mins = Math.floor(state.seconds / 60)
  const secs = state.seconds % 60

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-navy-800 px-8 text-center">
      <div className="pop-in flex h-20 w-20 items-center justify-center rounded-full bg-leaf-500 text-4xl text-white shadow-lg">
        ✓
      </div>
      <h1 className="mt-5 text-2xl font-extrabold text-white">
        {state.sceneId ? 'Scene completed!' : 'Lesson complete!'}
      </h1>
      <p className="mt-1 text-sm text-gray-300">การพูดออกเสียงคือทางลัดสู่ความคล่อง 🎉</p>

      <div className="mt-8 grid w-full grid-cols-3 gap-3">
        <Stat icon="🧩" value={`${state.steps}`} label="แบบฝึก" />
        <Stat icon="📚" value={`+${state.words}`} label="คำที่พูด" />
        <Stat icon="⏱️" value={mins ? `${mins}:${`${secs}`.padStart(2, '0')}` : `${secs}s`} label="เวลา" />
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-2 text-sm font-bold text-orange-300">
        ⚡ streak {progress.streak} วันติดกัน!
      </div>

      <button
        type="button"
        onClick={() => nav('/', { replace: true })}
        className="mt-10 w-full rounded-2xl bg-bee-400 py-4 text-lg font-bold text-navy-900 shadow-md transition active:scale-[0.98]"
      >
        เรียนต่อ
      </button>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-2 py-3">
      <div className="text-lg">{icon}</div>
      <div className="font-en text-xl font-extrabold text-white">{value}</div>
      <div className="text-[11px] text-gray-300">{label}</div>
    </div>
  )
}
