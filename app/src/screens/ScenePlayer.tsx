import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { findScene } from '../content/course'
import { getSettings, completeScene, addWords } from '../services/store'
import { speak, stopSpeaking, prefetchTTS } from '../services/tts'
import { listen, type ListenController } from '../services/stt'
import { wordCount } from '../services/matcher'
import { sceneTurn, getHint, GeminiError, type ChatMessage } from '../services/gemini'
import TaskChecklist from '../components/TaskChecklist'
import ChatBubble from '../components/ChatBubble'
import MicButton from '../components/MicButton'

interface Msg extends ChatMessage {
  praise?: string
}

export default function ScenePlayer() {
  const { sceneId } = useParams()
  const nav = useNavigate()
  const scene = findScene(sceneId ?? '')
  const settings = getSettings()

  const [started, setStarted] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [listening, setListening] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [interim, setInterim] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)

  const listener = useRef<ListenController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const startTime = useRef(Date.now())
  const spokenWords = useRef(0)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking, hint])

  // โหลดเสียงประโยคเปิดบทไว้ล่วงหน้า ระหว่างผู้ใช้ยังอ่านหน้า brief
  useEffect(() => {
    if (scene) prefetchTTS([scene.opening])
  }, [scene])

  useEffect(
    () => () => {
      stopSpeaking()
      listener.current?.abort()
    },
    [],
  )

  if (!scene) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <div>ไม่พบสถานการณ์นี้</div>
        <button type="button" onClick={() => nav('/')} className="rounded-xl bg-bee-400 px-4 py-2 font-bold">
          กลับหน้าหลัก
        </button>
      </div>
    )
  }

  const startListening = () => {
    stopSpeaking()
    setListening(true)
    setInterim('')
    listener.current = listen({
      onInterim: setInterim,
      onFinal: (text) => {
        setListening(false)
        setInterim('')
        listener.current = null
        if (text) handleUserText(text)
      },
      onError: () => {
        setListening(false)
        listener.current = null
      },
    })
    if (!listener.current) setListening(false)
  }

  const start = async () => {
    setStarted(true)
    setThinking(true)
    startTime.current = Date.now()
    const opening: Msg = { role: 'ai', text: scene.opening }
    // โชว์ "กำลังพิมพ์…" จนกว่าเสียงจะพร้อม แล้วให้ bubble โผล่พร้อมเสียงเริ่มพูดพอดี
    await speak(scene.opening, {
      rate: settings.voiceRate,
      onStart: () => {
        setMessages([opening])
        setThinking(false)
      },
    })
    setThinking(false)
    // AI พูดจบ → เปิดไมค์รอเลย ไม่ต้องกด
    if (settings.autoMic) setTimeout(startListening, 300)
  }

  const handleUserText = async (text: string) => {
    setError(null)
    setHint(null)
    const n = wordCount(text)
    spokenWords.current += n
    addWords(n)

    const history: Msg[] = [...messages, { role: 'user', text }]
    setMessages(history)
    setThinking(true)
    try {
      const result = await sceneTurn(scene, history, settings.name, settings.level)
      const nextCompleted = new Set(completed)
      for (const id of result.completedTaskIds) nextCompleted.add(id)
      setCompleted(nextCompleted)

      // ติ๊ก praise ให้ข้อความผู้ใช้ได้เลย แต่ bubble คำตอบ AI รอโผล่พร้อมเสียง
      if (result.praise) {
        setMessages((cur) => {
          const withPraise = [...cur]
          withPraise[withPraise.length - 1] = { ...withPraise[withPraise.length - 1], praise: result.praise }
          return withPraise
        })
      }

      const allDone = nextCompleted.size >= scene.tasks.length

      await speak(result.reply, {
        rate: settings.voiceRate,
        onStart: () => {
          setMessages((cur) => [...cur, { role: 'ai', text: result.reply }])
          setThinking(false)
        },
      })
      if (allDone) setFinished(true)
      // AI ตอบจบ → เปิดไมค์ต่อเลย (ถ้าภารกิจยังไม่ครบ)
      else if (settings.autoMic) setTimeout(startListening, 300)
    } catch (e) {
      setError(e instanceof GeminiError ? e.message : 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง')
    } finally {
      setThinking(false)
    }
  }

  const handleMic = () => {
    if (listening) {
      listener.current?.stop()
      return
    }
    startListening()
  }

  const askHint = async () => {
    const pending = scene.tasks.find((t) => !completed.has(t.id))
    setHint('…')
    try {
      setHint(await getHint(scene, messages, pending?.th ?? 'จบบทสนทนาอย่างสุภาพ'))
    } catch (e) {
      setHint(null)
      setError(e instanceof GeminiError ? e.message : 'ขอ hint ไม่สำเร็จ')
    }
  }

  const finish = () => {
    completeScene(scene.id)
    stopSpeaking()
    const seconds = Math.round((Date.now() - startTime.current) / 1000)
    nav('/lesson-complete', {
      replace: true,
      state: { sceneId: scene.id, steps: scene.tasks.length, words: spokenWords.current, seconds },
    })
  }

  // ---------- brief screen ----------
  if (!started) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-[calc(env(safe-area-inset-top)+16px)] pb-8">
        <button type="button" onClick={() => nav(-1)} aria-label="กลับ" className="self-start text-xl text-gray-400">
          ✕
        </button>
        <div className="pop-in mt-6 rounded-3xl bg-white p-6 shadow-md">
          <div className="text-4xl">{scene.emoji}</div>
          <h1 className="mt-3 font-en text-xl font-extrabold text-navy-900">{scene.title}</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">{scene.briefTh}</p>
          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="mb-2 text-sm font-bold text-navy-900">
              ภารกิจของคุณ <span className="text-bee-600">0/{scene.tasks.length}</span>
            </div>
            <ul className="space-y-2">
              {scene.tasks.map((t) => (
                <li key={t.id} className="flex items-start gap-2 text-sm text-navy-800">
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-gray-300" />
                  {t.th}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {!settings.geminiKey && (
          <div className="mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-700">
            ⚠️ โหมดนี้ต้องใช้ Gemini API key (ฟรี) —{' '}
            <Link to="/settings" className="font-bold underline">
              ไปตั้งค่า
            </Link>
          </div>
        )}
        <button
          type="button"
          onClick={start}
          className="mt-auto w-full rounded-2xl bg-bee-400 py-4 text-lg font-bold text-navy-900 shadow-md transition active:scale-[0.98]"
        >
          เริ่มบทสนทนา 🎬
        </button>
      </div>
    )
  }

  // ---------- chat screen ----------
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-bee-50">
      <header className="flex items-center gap-3 border-b border-bee-200 bg-white px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-2.5">
        <button type="button" onClick={() => nav('/')} aria-label="ออก" className="text-lg text-gray-400">
          ✕
        </button>
        <div className="flex-1 truncate text-center font-en text-sm font-bold text-navy-900">
          {scene.emoji} {scene.title}
        </div>
        <span className="w-5" />
      </header>

      <TaskChecklist tasks={scene.tasks} completed={completed} />

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} text={m.text} praise={m.praise} />
        ))}
        {thinking && <div className="text-sm text-gray-400">กำลังพิมพ์…</div>}
        {hint && (
          <div className="pop-in rounded-2xl border-2 border-dashed border-bee-300 bg-bee-100 px-4 py-2.5 text-sm">
            💡 ลองพูดว่า: <b className="font-en">{hint}</b>
          </div>
        )}
        {error && <div className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>}
      </div>

      {finished && (
        <div className="border-t border-bee-200 bg-white p-4">
          <button
            type="button"
            onClick={finish}
            className="w-full rounded-2xl bg-leaf-500 py-3.5 font-bold text-white shadow-md transition active:scale-[0.98]"
          >
            🎉 ภารกิจครบแล้ว — สรุปผล
          </button>
        </div>
      )}

      <div className="flex items-center justify-center gap-6 border-t border-bee-200 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
        <button
          type="button"
          onClick={askHint}
          aria-label="ขอคำใบ้"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-bee-100 text-lg shadow-sm active:scale-90"
        >
          💡
        </button>
        <div className="flex flex-col items-center">
          {listening && interim && <div className="mb-1 max-w-60 truncate text-xs italic text-blue-500">"{interim}"</div>}
          <MicButton listening={listening} disabled={thinking} onPress={handleMic} />
          <span className="mt-1 text-[11px] text-gray-400">{listening ? 'แตะเพื่อส่ง' : 'แตะแล้วพูด'}</span>
        </div>
        <span className="h-11 w-11" />
      </div>
    </div>
  )
}
