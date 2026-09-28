import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { findLesson } from '../content/course'
import { getSettings, addWords } from '../services/store'
import { speak, stopSpeaking, prefetchTTS } from '../services/tts'
import { setSpeaker } from '../services/speaker'
import { tx } from '../services/i18n'
import { listen, type ListenController } from '../services/stt'
import { matchAnswer, wordCount, diffWords, type WordDiff } from '../services/matcher'
import { getThaiReading } from '../services/gemini'
import { pronTricks } from '../services/pron-rules'
import TutorAvatar from '../components/TutorAvatar'
import ExerciseCard from '../components/ExerciseCard'
import FeedbackBanner, { randomPraise } from '../components/FeedbackBanner'
import RetryCoach from '../components/RetryCoach'
import MicButton from '../components/MicButton'

type Phase = 'tutor' | 'await' | 'listening' | 'success' | 'retry'

export default function LessonPlayer() {
  const { lessonId } = useParams()
  const nav = useNavigate()
  const found = findLesson(lessonId ?? '')
  const settings = getSettings()

  const [stepIndex, setStepIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('tutor')
  const [speaking, setSpeaking] = useState(false)
  const [interim, setInterim] = useState('')
  const [praise, setPraise] = useState('')
  const [words, setWords] = useState(0)
  const [startTime] = useState(() => Date.now())
  // ข้อมูลติวออกเสียงตอนตอบไม่ตรง (คงอยู่จนกว่าจะผ่าน/ข้าม)
  const [retryInfo, setRetryInfo] = useState<{ heard: string; diff: WordDiff[] } | null>(null)
  const [reading, setReading] = useState<string | null>(null)
  const [readingLoading, setReadingLoading] = useState(false)
  const [tricks, setTricks] = useState<string[]>([])

  // กันเอฟเฟกต์ซ้อน/ผลค้างจาก step ก่อนหน้า
  const runId = useRef(0)
  const listener = useRef<ListenController | null>(null)
  const wordsRef = useRef(0)
  const readingCache = useRef(new Map<string, string>())

  const clearRetry = () => {
    setRetryInfo(null)
    setReading(null)
    setReadingLoading(false)
    setTricks([])
  }

  const fetchReading = async (target: string, id: number) => {
    const cached = readingCache.current.get(target)
    if (cached) {
      setReading(cached)
      return
    }
    setReadingLoading(true)
    try {
      const r = await getThaiReading(target)
      readingCache.current.set(target, r)
      if (runId.current === id) setReading(r)
    } catch {
      // ไม่มี AI ให้ถาม (ไม่มี key/Ollama ปิด) — เคล็ดลับ rule-based กับปุ่มฟังช้ายังใช้ได้
    } finally {
      if (runId.current === id) setReadingLoading(false)
    }
  }

  const lesson = found?.lesson
  const step = lesson?.steps[stepIndex]
  const total = lesson?.steps.length ?? 0

  // ผู้พูดในบทเรียน = tutor ของ module นี้ → เสียงตรงกับตัวละครบนจอ
  // (ต้องประกาศก่อน effect prefetch ด้านล่าง เพราะ effect รันตามลำดับ และ prefetch ผูกเสียงไว้ตอนเข้าคิว)
  const moduleTutor = found?.module.tutorId ?? null
  useEffect(() => {
    setSpeaker(moduleTutor)
    return () => setSpeaker(null)
  }, [moduleTutor])

  // ทยอยโหลด/generate เสียง AI ของทุก step ล่วงหน้า ระหว่างที่ฝึกอยู่
  useEffect(() => {
    if (!lesson) return
    const phrases = [...new Set(lesson.steps.filter((s) => s.type !== 'translate').map((s) => s.en))]
    prefetchTTS(phrases)
  }, [lesson])

  const finishLesson = useCallback(() => {
    runId.current += 1
    stopSpeaking()
    listener.current?.abort()
    const seconds = Math.round((Date.now() - startTime) / 1000)
    nav(`/lesson-complete`, {
      replace: true,
      state: { lessonId, steps: total, words: wordsRef.current, seconds },
    })
  }, [nav, lessonId, total, startTime])

  const goNext = useCallback(() => {
    runId.current += 1 // ตัด timeout/ผลฟังที่ค้างของ step เก่าทิ้งทันที
    listener.current?.abort()
    listener.current = null
    stopSpeaking()
    setInterim('')
    clearRetry()
    if (stepIndex + 1 >= total) finishLesson()
    else setStepIndex((i) => i + 1)
  }, [stepIndex, total, finishLesson])

  /** เปิดไมค์ฟังคำตอบ (ใช้ทั้งกดเองและเปิดอัตโนมัติ) */
  const startListening = useCallback(() => {
    const s = lesson?.steps[stepIndex]
    if (!s || s.type === 'tutor_say') return
    stopSpeaking()
    setSpeaking(false)
    setPhase('listening')
    setInterim('')
    const id = runId.current
    listener.current = listen({
      onInterim: (t) => runId.current === id && setInterim(t),
      onFinal: (text) => {
        if (runId.current !== id) return
        listener.current = null
        if (!text) {
          // ไม่ได้ยินอะไรเลย — กลับไปรอให้กดเอง (ไม่เปิดวนซ้ำ กันไมค์ค้าง)
          setPhase('await')
          return
        }
        const result = matchAnswer(text, s.en)
        if (result.pass) {
          clearRetry()
          const n = wordCount(s.en)
          addWords(n)
          wordsRef.current += n
          setWords(wordsRef.current)
          setPraise(randomPraise())
          setPhase('success')
          setTimeout(() => {
            if (runId.current === id) goNext()
          }, 1600)
        } else {
          setInterim(text)
          const diff = diffWords(text, s.en)
          setRetryInfo({ heard: text, diff })
          if (getSettings().pronTips) {
            setTricks(pronTricks(diff.filter((d) => !d.hit).map((d) => d.word)))
            void fetchReading(s.en, id)
          } else {
            setTricks([])
            setReading(null)
          }
          setPhase('retry')
          // เว้นเวลาให้อ่านเคล็ดลับก่อน แล้วเปิดไมค์รอให้ลองใหม่เอง
          if (getSettings().autoMic) {
            setTimeout(() => {
              if (runId.current === id) startListening()
            }, 3500)
          }
        }
      },
      onError: () => {
        if (runId.current !== id) return
        listener.current = null
        setPhase('await')
      },
    })
    if (!listener.current) setPhase('await')
  }, [lesson, stepIndex, goNext])

  // รันแต่ละ step: tutor พูดก่อน (ถ้ามีเสียง) → เปิดไมค์รอฟังอัตโนมัติ
  useEffect(() => {
    if (!step) return
    runId.current += 1
    const id = runId.current
    setPhase('tutor')
    setInterim('')
    clearRetry()

    const run = async () => {
      const shouldSpeak = step.type !== 'translate'
      if (shouldSpeak) {
        // ปากขยับเมื่อเสียงเริ่มดังจริง (เสียง AI อาจต้องรอ generate ครู่หนึ่ง)
        await speak(step.en, {
          rate: settings.voiceRate,
          onStart: () => runId.current === id && setSpeaking(true),
        })
        if (runId.current !== id) return
        setSpeaking(false)
      }
      if (step.type === 'tutor_say') {
        // ค้างซับให้อ่านแป๊บนึงแล้วไปต่อ
        setTimeout(() => {
          if (runId.current === id) goNext()
        }, 900)
      } else {
        setPhase('await')
        if (settings.autoMic) {
          // เว้นจังหวะสั้น ๆ หลังเสียงจบ แล้วเปิดไมค์เลย ไม่ต้องกด
          setTimeout(() => {
            if (runId.current === id) startListening()
          }, 300)
        }
      }
    }
    run()

    return () => {
      stopSpeaking()
      setSpeaking(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, lesson?.id])

  const handleMic = () => {
    if (!step || step.type === 'tutor_say') return
    if (phase === 'listening') {
      listener.current?.stop()
      return
    }
    startListening()
  }

  /** ฟังประโยคเป้าหมายซ้ำ (ปกติ/ช้า) — ใช้จากการ์ดติวออกเสียง */
  const playTarget = async (slow: boolean) => {
    if (!step) return
    listener.current?.abort()
    listener.current = null
    setPhase('retry')
    const id = runId.current
    await speak(step.en, {
      ...(slow ? { rateValue: 0.55 } : { rate: settings.voiceRate }),
      onStart: () => runId.current === id && setSpeaking(true),
    })
    if (runId.current === id) setSpeaking(false)
  }

  const restartStep = () => {
    listener.current?.abort()
    listener.current = null
    runId.current += 1
    const id = runId.current
    setPhase('tutor')
    setInterim('')
    clearRetry()
    const replay = async () => {
      if (!step) return
      if (step.type !== 'translate') {
        await speak(step.en, {
          rate: settings.voiceRate,
          onStart: () => runId.current === id && setSpeaking(true),
        })
        if (runId.current !== id) return
        setSpeaking(false)
      }
      if (runId.current !== id) return
      if (step.type === 'tutor_say') {
        goNext()
      } else {
        setPhase('await')
        if (settings.autoMic) {
          setTimeout(() => {
            if (runId.current === id) startListening()
          }, 300)
        }
      }
    }
    replay()
  }

  useEffect(
    () => () => {
      stopSpeaking()
      listener.current?.abort()
    },
    [],
  )

  if (!found || !step) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <div>{tx('ไม่พบบทเรียนนี้', 'Lesson not found')}</div>
        <button type="button" onClick={() => nav('/')} className="rounded-xl bg-bee-400 px-4 py-2 font-bold">
          {tx('กลับหน้าหลัก', 'Back to home')}
        </button>
      </div>
    )
  }

  const isExercise = step.type !== 'tutor_say'

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-navy-900">
      {/* top bar */}
      <div className="flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-2">
        <button type="button" onClick={() => nav('/')} aria-label={tx('ปิดบทเรียน', 'Close lesson')} className="text-xl text-white/70">
          ✕
        </button>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-bee-300">⚡ {words}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-bee-400 transition-all duration-500"
            style={{ width: `${((stepIndex + 1) / total) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold text-white/60">
          {stepIndex + 1}/{total}
        </span>
      </div>

      {/* tutor area */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <TutorAvatar tutorId={found.module.tutorId} speaking={speaking} size={220} stage />
        {step.type === 'tutor_say' && (
          <div className="pop-in mt-6 max-w-xs rounded-2xl bg-black/40 px-4 py-2.5 text-center">
            <div className="font-en font-bold text-white">{step.en}</div>
            <div className="mt-0.5 text-sm text-gray-300">{step.th}</div>
          </div>
        )}
      </div>

      {/* exercise / feedback area */}
      <div className="px-4 pb-3">
        {isExercise && phase === 'success' && (
          <FeedbackBanner kind="success" title={praise} en={step.en} th={step.th} />
        )}
        {isExercise && phase !== 'success' && retryInfo && (
          <RetryCoach
            diff={retryInfo.diff}
            heard={interim || retryInfo.heard}
            reading={reading}
            readingLoading={readingLoading}
            tricks={tricks}
            listening={phase === 'listening'}
            onListen={playTarget}
          />
        )}
        {isExercise && phase !== 'success' && !retryInfo && (
          <ExerciseCard
            type={step.type as 'speak' | 'repeat_by_ear' | 'translate'}
            en={step.en}
            th={step.th}
            interim={phase === 'listening' ? interim : undefined}
          />
        )}
      </div>

      {/* bottom controls */}
      <div className="flex items-center justify-between px-8 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-1">
        <ControlBtn label="Restart" onClick={restartStep} icon="↻" />
        <MicButton
          listening={phase === 'listening'}
          disabled={!isExercise || phase === 'success'}
          onPress={handleMic}
        />
        <ControlBtn label="Next" onClick={goNext} icon="▶︎" />
      </div>
    </div>
  )
}

function ControlBtn({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-0.5 text-white/70 active:text-white">
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-[11px]">{label}</span>
    </button>
  )
}
