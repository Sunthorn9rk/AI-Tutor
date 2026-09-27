import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveSettings, type VoiceRate } from '../services/store'
import { tutors } from '../content/course'
import TutorAvatar from '../components/TutorAvatar'
import { speak } from '../services/tts'

const LEVELS = [
  { id: 'A1', label: 'Beginner', th: 'เพิ่งเริ่มต้น' },
  { id: 'A2', label: 'Elementary', th: 'พอรู้พื้นฐาน แต่งประโยคง่าย ๆ ได้' },
  { id: 'B1', label: 'Intermediate', th: 'สื่อสารเรื่องทั่วไปได้' },
  { id: 'B2', label: 'Upper-Intermediate', th: 'คุยได้ลื่น อยากเก่งขึ้นอีก' },
]

const RATES: { id: VoiceRate; label: string; th: string; sample: string }[] = [
  { id: 'words', label: 'Single words 🐢', th: 'ช้า เน้นทีละคำ', sample: 'Do you want to meet up?' },
  { id: 'calm', label: 'Calm 😌', th: 'ช้ากว่าปกติเล็กน้อย ฟังชัด', sample: 'Do you want to meet up?' },
  { id: 'natural', label: 'Natural 💬', th: 'ความเร็วธรรมชาติแบบเจ้าของภาษา', sample: 'Do you want to meet up?' },
]

export default function Onboarding() {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [level, setLevel] = useState('A2')
  const [tutorId, setTutorId] = useState('mia')
  const [rate, setRate] = useState<VoiceRate>('natural')

  const finish = () => {
    saveSettings({ name: name.trim() || 'Learner', level, tutorId, voiceRate: rate, onboarded: true })
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
        <StepWrap title="🐝 ยินดีต้อนรับ!" sub="ให้เราเรียกคุณว่าอะไรดี?">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="พิมพ์ชื่อของคุณ"
            className="w-full rounded-2xl border-2 border-bee-200 bg-white px-4 py-3.5 text-lg outline-none focus:border-bee-400"
          />
        </StepWrap>
      )}

      {step === 1 && (
        <StepWrap title="ระดับภาษาอังกฤษของคุณ?" sub="เลือกที่ใกล้เคียงที่สุด">
          <div className="space-y-2.5">
            {LEVELS.map((l) => (
              <ChoiceCard key={l.id} active={level === l.id} onClick={() => setLevel(l.id)}>
                <span className="mr-2 rounded-lg bg-bee-100 px-2 py-0.5 font-en text-sm font-bold text-bee-600">{l.id}</span>
                <span className="font-bold text-navy-900">{l.label}</span>
                <div className="mt-0.5 text-sm text-gray-500">{l.th}</div>
              </ChoiceCard>
            ))}
          </div>
        </StepWrap>
      )}

      {step === 2 && (
        <StepWrap title="เลือก tutor ของคุณ" sub="tutor จะพาเรียนและคุยกับคุณทุกบทเรียน">
          <div className="space-y-2.5">
            {tutors.map((t) => (
              <ChoiceCard key={t.id} active={tutorId === t.id} onClick={() => setTutorId(t.id)}>
                <div className="flex items-center gap-3">
                  <TutorAvatar tutorId={t.id} size={56} />
                  <div>
                    <div className="font-en font-bold text-navy-900">{t.name}</div>
                    <div className="text-sm text-gray-500">{t.desc}</div>
                  </div>
                </div>
              </ChoiceCard>
            ))}
          </div>
        </StepWrap>
      )}

      {step === 3 && (
        <StepWrap title="เลือกความเร็วเสียงพูด" sub="แตะการ์ดเพื่อฟังตัวอย่างเสียง">
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
                <div className="mt-0.5 text-sm text-gray-500">{r.th}</div>
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
          {step < 3 ? 'ถัดไป' : 'เริ่มเรียนเลย! 🎉'}
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
