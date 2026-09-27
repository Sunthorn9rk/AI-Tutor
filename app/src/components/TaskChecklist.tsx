import { useState } from 'react'
import type { SceneTask } from '../content/schema'

interface Props {
  tasks: SceneTask[]
  completed: Set<string>
}

/** แถบ "Your tasks 0/4" พับ/กางได้ เหมือนต้นฉบับ */
export default function TaskChecklist({ tasks, completed }: Props) {
  const [open, setOpen] = useState(true)
  const done = tasks.filter((t) => completed.has(t.id)).length

  return (
    <div className="border-b border-bee-200 bg-white/90 backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5"
      >
        <span className="text-sm font-bold text-navy-900">
          Your tasks{' '}
          <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold text-white ${done === tasks.length ? 'bg-leaf-500' : 'bg-bee-500'}`}>
            {done}/{tasks.length}
          </span>
        </span>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <ul className="space-y-1.5 px-4 pb-3">
          {tasks.map((t) => {
            const isDone = completed.has(t.id)
            return (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isDone ? 'bg-leaf-500 text-white' : 'border-2 border-gray-300 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className={isDone ? 'text-gray-400 line-through' : 'text-navy-800'}>{t.th}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
