import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getSettings, recordStudyDay } from '../services/store'
import { speak, stopSpeaking } from '../services/tts'
import { listen, type ListenController } from '../services/stt'
import { tx } from '../services/i18n'
import { freeTalkTurn, GeminiError, type ChatMessage } from '../services/gemini'
import ChatBubble from '../components/ChatBubble'
import MicButton from '../components/MicButton'

export default function FreeTalk() {
  const nav = useNavigate()
  const settings = getSettings()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [listening, setListening] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)

  const listener = useRef<ListenController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const greeted = useRef(false)

  useEffect(() => {
    if (!greeted.current) {
      greeted.current = true
      const greeting = `Hello, ${settings.name || 'friend'}! 👋 What would you like to talk about today?`
      const greet = async () => {
        setThinking(true)
        // bubble ทักทายโผล่พร้อมเสียงเริ่มพูด (เสียง AI ต้องรอ generate)
        await speak(greeting, {
          rate: settings.voiceRate,
          onStart: () => {
            setMessages([{ role: 'ai', text: greeting }])
            setThinking(false)
          },
        })
        setThinking(false)
        // ทักทายจบ → เปิดไมค์รอเลย
        if (settings.autoMic) setTimeout(startListening, 300)
      }
      greet()
    }
    return () => {
      stopSpeaking()
      listener.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

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

  const handleUserText = async (text: string) => {
    setError(null)
    const history: ChatMessage[] = [...messages, { role: 'user', text }]
    setMessages(history)
    setThinking(true)
    recordStudyDay()
    try {
      const reply = await freeTalkTurn(history, settings.name, settings.level)
      // bubble คำตอบโผล่พร้อมเสียงเริ่มพูด
      await speak(reply, {
        rate: settings.voiceRate,
        onStart: () => {
          setMessages([...history, { role: 'ai', text: reply }])
          setThinking(false)
        },
      })
      // AI ตอบจบ → เปิดไมค์ต่อเลย
      if (settings.autoMic) setTimeout(startListening, 300)
    } catch (e) {
      setError(e instanceof GeminiError ? e.message : tx('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง', 'Something went wrong. Please try again.'))
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

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-bee-50">
      <header className="flex items-center gap-3 border-b border-bee-200 bg-white px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-2.5">
        <button type="button" onClick={() => nav('/')} aria-label={tx('ออก', 'Exit')} className="text-lg text-gray-400">
          ✕
        </button>
        <div className="flex-1 text-center font-en text-sm font-bold text-navy-900">🗣️ Free talk</div>
        <span className="w-5" />
      </header>

      {!settings.geminiKey && (
        <div className="bg-orange-50 px-4 py-2.5 text-sm text-orange-700">
          ⚠️ {tx('โหมดนี้ต้องใช้ Gemini API key (ฟรี)', 'This mode needs a (free) Gemini API key')} —{' '}
          <Link to="/settings" className="font-bold underline">
            {tx('ไปตั้งค่า', 'Open settings')}
          </Link>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} text={m.text} />
        ))}
        {thinking && <div className="text-sm text-gray-400">{tx('กำลังพิมพ์…', 'Typing…')}</div>}
        {error && <div className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>}
      </div>

      <div className="flex flex-col items-center border-t border-bee-200 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
        {listening && interim && <div className="mb-1 max-w-64 truncate text-xs italic text-blue-500">"{interim}"</div>}
        <MicButton listening={listening} disabled={thinking} onPress={handleMic} />
        <span className="mt-1 text-[11px] text-gray-400">{listening ? tx('แตะเพื่อส่ง', 'Tap to send') : tx('แตะแล้วพูด', 'Tap to speak')}</span>
      </div>
    </div>
  )
}
