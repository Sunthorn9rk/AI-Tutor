import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSettings, saveSettings, type VoiceRate } from '../services/store'
import { tutors } from '../content/course'
import { setSpeaker } from '../services/speaker'
import TutorAvatar from '../components/TutorAvatar'
import { speak } from '../services/tts'
import { tx, applyDocumentLang } from '../services/i18n'

const LEVELS = [
  { id: 'A1', label: 'Beginner', th: 'เพิ่งเริ่มต้น', en: 'Just getting started' },
  { id: 'A2', label: 'Elementary', th: 'พอรู้พื้นฐาน แต่งประโยคง่าย ๆ ได้', en: 'I know the basics and can make simple sentences' },
  { id: 'B1', label: 'Intermediate', th: 'สื่อสารเรื่องทั่วไปได้', en: 'I can talk about everyday topics' },
  { id: 'B2', label: 'Upper-Intermediate', th: 'คุยได้ลื่น อยากเก่งขึ้นอีก', en: 'I speak fluently and want to improve' },
]

const RATES: { id: VoiceRate; label: string; th: string; en: string; sample: string }[] = [
  { id: 'words', label: 'Single words 🐢', th: 'ช้า เน้นทีละคำ', en: 'Slow, one word at a time', sample: 'Do you want to meet up?' },
  { id: 'calm', label: 'Calm 😌', th: 'ช้ากว่าปกติเล็กน้อย ฟังชัด', en: 'A little slower than normal, easy to follow', sample: 'Do you want to meet up?' },
  { id: 'natural', label: 'Natural 💬', th: 'ความเร็วธรรมชาติแบบเจ้าของภาษา', en: 'Natural native-speaker speed', sample: 'Do you want to meet up?' },
]

export default function Onboarding() {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [level, setLevel] = useState('A2')
  const [tutorId, setTutorId] = useState('mia')
  const [rate, setRate] = useState<VoiceRate>('natural')
  // เปลี่ยนภาษาแล้วต้อง render ใหม่ — tx() อ่านจาก settings เอง state นี้มีไว้กระตุ้นเท่านั้น
  const [lang, setLang] = useState(getSettings().uiLang)
  const pickLang = (l: 'th' | 'en') => {
    saveSettings({ uiLang: l })
    applyDocumentLang()
    setLang(l)
  }

  const finish = () => {
    saveSettings({ name: name.trim() || 'Learner', level, tutorId, voiceRate: rate, onboarded: true })
    setSpeaker(null) // จากนี้ผู้พูดตาม tutorId ที่เพิ่งบันทึก
    nav('/', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-[calc(env(safe-area-inset-top)+24px)] pb-8">
      {/* progress dots */}
      <div className="mb-8 flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-bee-400' : 'bg-bee-100'}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="-mt-4 mb-2 flex justify-end">
          <div className="flex rounded-full bg-bee-100 p-0.5 text-xs font-bold">
            {(['th', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => pickLang(l)}
                className={`rounded-full px-3 py-1 ${lang === l ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-400'}`}
              >
                {l === 'th' ? 'TH' : 'EN'}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 0 && (
        <StepWrap title={tx('🐝 ยินดีต้อนรับ!', '🐝 Welcome!')} sub={tx('ให้เราเรียกคุณว่าอะไรดี?', 'What should we call you?')}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tx('พิมพ์ชื่อของคุณ', 'Type your name')}
            className="w-full rounded-2xl border-2 border-bee-200 bg-white px-4 py-3.5 text-lg outline-none focus:border-bee-400"
          />
        </StepWrap>
      )}

      {step === 1 && (
        <StepWrap title={tx('ระดับภาษาอังกฤษของคุณ?', 'Your English level?')} sub={tx('เลือกที่ใกล้เคียงที่สุด', 'Pick the closest one')}>
          <div className="space-y-2.5">
            {LEVELS.map((l) => (
              <ChoiceCard key={l.id} active={level === l.id} onClick={() => setLevel(l.id)}>
                <span className="mr-2 rounded-lg bg-bee-100 px-2 py-0.5 font-en text-sm font-bold text-bee-600">{l.id}</span>
                <span className="font-bold text-navy-900">{l.label}</span>
                <div className="mt-0.5 text-sm text-gray-500">{tx(l.th, l.en)}</div>
              </ChoiceCard>
            ))}
          </div>
        </StepWrap>
      )}

      {step === 2 && (
        <StepWrap title={tx('เลือก tutor ของคุณ', 'Choose your tutor')} sub={tx('tutor จะพาเรียนและคุยกับคุณทุกบทเรียน', 'Your tutor will guide and talk with you in every lesson')}>
          <div className="grid grid-cols-3 gap-2.5">
            {tutors.map((t) => (
              <ChoiceCard key={t.id} active={tutorId === t.id} onClick={() => {
                setTutorId(t.id)
                // ยังไม่ได้บันทึก settings → ตั้งผู้พูดตรง ๆ ให้ได้ยินเสียงของตัวที่แตะ
                setSpeaker(t.id)
                speak(`Hi! I'm ${t.name.replace(/^Grand(ma|pa) /, '')}. Nice to meet you!`, { rate: 'natural' })
              }}>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <TutorAvatar tutorId={t.id} size={60} />
                  <div className="font-en w-full truncate text-sm font-bold text-navy-900">{t.name.replace(/^Grand(ma|pa) /, '')}</div>
                </div>
              </ChoiceCard>
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-navy-400">
            {(() => {
              const t = tutors.find((t) => t.id === tutorId)
              return t ? tx(t.desc, t.descEn) : ''
            })()}
          </p>
        </StepWrap>
      )}

      {step === 3 && (
        <StepWrap title={tx('เลือกความเร็วเสียงพูด', 'Choose speaking speed')} sub={tx('แตะการ์ดเพื่อฟังตัวอย่างเสียง', 'Tap a card to hear a sample')}>
          <div className="space-y-2.5">
            {RATES.map((r) => (
              <ChoiceCard
                key={r.id}
                active={rate === r.id}
                onClick={() => {
                  setRate(r.id)
                  speak(r.sample, { rate: r.id })
                }}
              >
                <span className="font-bold text-navy-900">{r.label}</span>
                <div className="mt-0.5 text-sm text-gray-500">{tx(r.th, r.en)}</div>
              </ChoiceCard>
            ))}
          </div>
        </StepWrap>
      )}

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={() => (step < 3 ? setStep(step + 1) : finish())}
          disabled={step === 0 && !name.trim()}
          className="w-full rounded-2xl bg-bee-400 py-4 text-lg font-bold text-navy-900 shadow-md transition active:scale-[0.98] disabled:opacity-40"
        >
          {step < 3 ? tx('ถัดไป', 'Next') : tx('เริ่มเรียนเลย! 🎉', "Let's start! 🎉")}
        </button>
      </div>
    </div>
  )
}

function StepWrap({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="pop-in">
      <h1 className="text-2xl font-extrabold text-navy-900">{title}</h1>
      <p className="mt-1 mb-6 text-gray-500">{sub}</p>
      {children}
    </div>
  )
}

function ChoiceCard({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border-2 bg-white px-4 py-3 text-left transition active:scale-[0.98] ${
        active ? 'border-bee-400 shadow-md' : 'border-transparent shadow-sm'
      }`}
    >
      {children}
    </button>
  )
}
