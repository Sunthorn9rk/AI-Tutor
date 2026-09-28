import { useEffect, useState } from 'react'
import { getSettings, saveSettings, resetProgress, type VoiceRate } from '../services/store'
import { tutors } from '../content/course'
import { speak, listEnglishVoices, resetVoiceCache } from '../services/tts'
import { GEMINI_VOICES } from '../services/gemini-tts'
import { LOCAL_VOICES, ensureLocalTTS, getLocalTTSStatus, onLocalTTSStatus } from '../services/local-tts'
import { clearTTSCache } from '../services/tts-cache'
import { listOllamaModels } from '../services/ollama'
import { isSTTSupported } from '../services/stt'
import { tx, applyDocumentLang } from '../services/i18n'
import TutorAvatar from '../components/TutorAvatar'
import BottomNav from '../components/BottomNav'

const VOICE_SAMPLE = 'Hello! Nice to meet you. Do you want to meet up tomorrow?'

export default function Settings() {
  const [s, setS] = useState(getSettings())
  const [saved, setSaved] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [localTTS, setLocalTTS] = useState(getLocalTTSStatus())
  const [ollamaModels, setOllamaModels] = useState<string[] | null>(null)
  const [ollamaError, setOllamaError] = useState('')
  const loadOllamaModels = async (url: string) => {
    setOllamaError('')
    try {
      const models = await listOllamaModels(url)
      setOllamaModels(models)
      // ยังไม่เคยเลือกโมเดล → เลือกตัวแรกให้เลย
      if (models.length && !getSettings().ollamaModel) {
        setS(saveSettings({ ollamaModel: models[0] }))
      }
    } catch {
      setOllamaModels(null)
      setOllamaError(tx('ต่อ Ollama ไม่ได้ — เช็คว่าแอป Ollama เปิดอยู่ (หรือรัน `ollama serve`)', "Can't reach Ollama — make sure the Ollama app is running (or run `ollama serve`)"))
    }
  }

  useEffect(() => {
    const load = () => setVoices(listEnglishVoices())
    load()
    window.speechSynthesis?.addEventListener('voiceschanged', load)
    const unsub = onLocalTTSStatus(setLocalTTS)
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', load)
      unsub()
    }
  }, [])

  const update = (patch: Parameters<typeof saveSettings>[0]) => {
    setS(saveSettings(patch))
    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
  }

  return (
    <div className="mx-auto max-w-md px-5 pb-24 pt-[calc(env(safe-area-inset-top)+20px)]">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-navy-900">{tx('ตั้งค่า', 'Settings')} ⚙️</h1>
        {saved && <span className="text-sm font-bold text-leaf-600">{tx('บันทึกแล้ว', 'Saved')} ✓</span>}
      </div>

      <Section title={tx('ภาษาแอป', 'App language')}>
        <div className="flex gap-2">
          {(
            [
              ['th', 'ไทย'],
              ['en', 'English'],
            ] as ['th' | 'en', string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                update({ uiLang: id })
                applyDocumentLang()
              }}
              className={`flex-1 rounded-xl border-2 bg-white px-2 py-2.5 text-sm font-semibold ${
                s.uiLang === id ? 'border-bee-400 text-navy-900' : 'border-transparent text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title={tx('ชื่อของคุณ', 'Your name')}>
        <input
          value={s.name}
          onChange={(e) => update({ name: e.target.value })}
          className="w-full rounded-xl border-2 border-bee-200 bg-white px-3 py-2.5 outline-none focus:border-bee-400"
        />
      </Section>

      <Section title="Tutor">
        {/* 14 ตัว → ตาราง 4 คอลัมน์ ห้ามเป็น flex แถวเดียว (จะล้นจอแนวนอน) */}
        <div className="grid grid-cols-4 gap-2">
          {tutors.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                update({ tutorId: t.id })
                // ให้ได้ยินเสียงของตัวที่เลือกทันที (อ่านจาก settings ที่เพิ่งบันทึก)
                speak(`Hi! I'm ${t.name.replace(/^Grand(ma|pa) /, '')}. Nice to meet you!`, { rate: 'natural' })
              }}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-tile bg-surface p-2 transition active:scale-95 ${
                s.tutorId === t.id ? 'ring-2 ring-tang-400' : 'ring-1 ring-navy-200/30'
              }`}
            >
              <TutorAvatar tutorId={t.id} size={52} />
              <span className="w-full truncate text-center text-[11px] font-bold text-navy-900">{t.name.replace(/^Grand(ma|pa) /, '')}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-navy-400">
          <b className="text-navy-700">{tutors.find((t) => t.id === s.tutorId)?.name}</b> ·{' '}
          {(() => {
            const t = tutors.find((t) => t.id === s.tutorId)
            return t ? tx(t.desc, t.descEn) : ''
          })()}
        </p>
      </Section>

      <Section title={tx('ความเร็วเสียงพูด (แตะเพื่อฟังตัวอย่าง)', 'Speaking speed (tap to preview)')}>
        <div className="flex gap-2">
          {(
            [
              ['words', tx('🐢 ทีละคำ', '🐢 Word by word')],
              ['calm', tx('😌 ใจเย็น', '😌 Calm')],
              ['natural', tx('💬 ธรรมชาติ', '💬 Natural')],
            ] as [VoiceRate, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                update({ voiceRate: id })
                speak('Do you want to meet up?', { rate: id })
              }}
              className={`flex-1 rounded-xl border-2 bg-white px-2 py-2.5 text-sm font-semibold ${
                s.voiceRate === id ? 'border-bee-400 text-navy-900' : 'border-transparent text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title={tx('เสียงของ AI Tutor', 'AI Tutor voice')}>
        <div className="mb-3">
          <ToggleRow
            on={s.voicePerCharacter}
            onToggle={() => {
              update({ voicePerCharacter: !s.voicePerCharacter })
              resetVoiceCache()
            }}
            icon="🎭"
            title={tx('เสียงตามตัวละคร', 'Voice per character')}
            desc={
              s.voicePerCharacter
                ? tx('แต่ละตัวพูดด้วยเสียงของตัวเอง (ชาย/หญิง/วัย)', 'Each character speaks in their own voice (gender/age)')
                : tx('ใช้เสียงที่เลือกเองด้านล่างกับทุกตัว', 'Use the voice you pick below for everyone')
            }
          />
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => update({ ttsEngine: 'device' })}
            className={`rounded-xl border-2 bg-white px-1.5 py-2.5 text-[13px] font-semibold ${
              s.ttsEngine === 'device' ? 'border-bee-400 text-navy-900' : 'border-transparent text-gray-500'
            }`}
          >
            📱 {tx('เสียงระบบ', 'System voice')}
            <span className="block text-[10px] font-normal text-gray-400">{tx('ฟรี ออฟไลน์', 'Free, offline')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              update({ ttsEngine: 'local' })
              void ensureLocalTTS()
            }}
            className={`rounded-xl border-2 bg-white px-1.5 py-2.5 text-[13px] font-semibold ${
              s.ttsEngine === 'local' ? 'border-bee-400 text-navy-900' : 'border-transparent text-gray-500'
            }`}
          >
            🧠 {tx('AI ในเครื่อง', 'On-device AI')}
            <span className="block text-[10px] font-normal text-gray-400">{tx('ไม่จำกัด โหลดครั้งเดียว', 'Unlimited, one-time download')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              update({ ttsEngine: 'gemini' })
              speak(VOICE_SAMPLE, { rate: 'natural' })
            }}
            className={`rounded-xl border-2 bg-white px-1.5 py-2.5 text-[13px] font-semibold ${
              s.ttsEngine === 'gemini' ? 'border-bee-400 text-navy-900' : 'border-transparent text-gray-500'
            }`}
          >
            ✨ AI cloud
            <span className="block text-[10px] font-normal text-gray-400">{tx('Gemini โควตาจำกัด', 'Gemini, limited quota')}</span>
          </button>
        </div>

        {s.ttsEngine === 'local' && (
          <>
            {localTTS.status !== 'ready' && (
              <button
                type="button"
                onClick={() => void ensureLocalTTS()}
                disabled={localTTS.status === 'downloading'}
                className="mb-2 w-full rounded-xl border-2 border-bee-300 bg-bee-100 px-3 py-2.5 text-sm font-bold text-navy-900 disabled:opacity-70"
              >
                {localTTS.status === 'downloading'
                  ? `${tx('กำลังดาวน์โหลดโมเดลเสียง…', 'Downloading voice model…')} ${localTTS.progress}%`
                  : localTTS.status === 'error'
                    ? tx('โหลดไม่สำเร็จ — แตะเพื่อลองใหม่', 'Download failed — tap to retry')
                    : tx('⬇️ ดาวน์โหลดโมเดลเสียง (~90MB ครั้งเดียว)', '⬇️ Download voice model (~90MB, one time)')}
              </button>
            )}
            {localTTS.status === 'downloading' && (
              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-bee-100">
                <div className="h-full bg-bee-400 transition-all" style={{ width: `${localTTS.progress}%` }} />
              </div>
            )}
            {localTTS.status === 'ready' && (
              <p className="mb-2 text-xs font-bold text-leaf-600">✓ {tx('โมเดลพร้อมใช้งาน — ไม่จำกัด ใช้ออฟไลน์ได้', 'Model ready — unlimited, works offline')}</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {LOCAL_VOICES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    update({ localVoice: v.id })
                    speak(VOICE_SAMPLE, { rate: 'natural' })
                  }}
                  className={`rounded-xl border-2 bg-white px-3 py-2 text-left text-xs ${
                    s.localVoice === v.id ? 'border-bee-400' : 'border-transparent'
                  }`}
                >
                  <span className="font-en text-sm font-bold text-navy-900">{tx(v.label, v.labelEn).split(' — ')[0]}</span>
                  <span className="block text-gray-500">{tx(v.label, v.labelEn).split(' — ')[1]}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              {tx('เสียง AI ที่รันในเครื่องคุณเอง (Kokoro) — ', 'An AI voice running on your own device (Kokoro) — ')}
              <b>{tx('ไม่มีโควตา ไม่ต้องใช้ key', 'no quota, no key needed')}</b>{' '}
              {tx(
                'ประโยคใหม่ใช้เวลา generate ~1-5 วิ (แอปเตรียมล่วงหน้าให้ระหว่างเรียน) ประโยคที่เคยพูดแล้วดังทันที ระหว่างเสียงยังไม่พร้อมจะใช้เสียงระบบไปก่อน',
                'New sentences take ~1-5 s to generate (the app prepares them ahead during lessons); sentences spoken before play instantly. Until the voice is ready, the system voice is used.',
              )}
            </p>
          </>
        )}

        {s.ttsEngine === 'device' && (
          <>
            <select
              value={s.deviceVoice}
              onChange={(e) => {
                update({ deviceVoice: e.target.value })
                resetVoiceCache()
                speak(VOICE_SAMPLE, { rate: 'natural' })
              }}
              className="w-full rounded-xl border-2 border-bee-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-bee-400"
            >
              <option value="">{tx('อัตโนมัติ (แอปเลือกเสียงที่ดีที่สุดให้)', 'Automatic (the app picks the best voice)')}</option>
              {voices.map((v) => (
                <option key={`${v.name}|${v.lang}`} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              💡 <b>{tx('เคล็ดลับ iPhone/Mac:', 'iPhone/Mac tip:')}</b>{' '}
              {tx(
                'ดาวน์โหลดเสียงคุณภาพสูงได้ฟรีที่ ตั้งค่า → การช่วยการเข้าถึง → เนื้อหาที่พูด → เสียง → English แล้วเลือกเสียงที่มีคำว่า',
                'download high-quality voices for free in Settings → Accessibility → Spoken Content → Voices → English, then pick a voice marked',
              )}{' '}
              <b>(Enhanced)</b> {tx('หรือ', 'or')} <b>(Premium)</b>{' '}
              {tx(
                'จากรายการด้านบน — เสียงจะธรรมชาติขึ้นมาก (เลือกแล้วจะมีเสียงตัวอย่างให้ฟัง)',
                'from the list above — it sounds much more natural (you’ll hear a sample when you pick one)',
              )}
            </p>
          </>
        )}

        {s.ttsEngine === 'gemini' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {GEMINI_VOICES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    update({ geminiVoice: v.id })
                    speak(VOICE_SAMPLE, { rate: 'natural' })
                  }}
                  className={`rounded-xl border-2 bg-white px-3 py-2 text-left text-xs ${
                    s.geminiVoice === v.id ? 'border-bee-400' : 'border-transparent'
                  }`}
                >
                  <span className="font-en text-sm font-bold text-navy-900">{v.id}</span>
                  <span className="block text-gray-500">{tx(v.label, v.labelEn).split('— ')[1]}</span>
                </button>
              ))}
            </div>
            {!s.geminiKey && (
              <p className="mt-2 text-xs text-orange-600">⚠️ {tx('ต้องใส่ Gemini API key (ด้านล่าง) ก่อนถึงจะมีเสียง', 'Add a Gemini API key (below) to enable this voice')}</p>
            )}
            <p className="mt-2 text-xs leading-5 text-gray-500">
              {tx(
                'โควตาฟรีของเสียง AI จำกัด (~3 ประโยคใหม่/นาที, ~15 ประโยคใหม่/วัน) แอปจึง',
                'The free AI voice quota is limited (~3 new sentences/min, ~15 new sentences/day), so the app',
              )}{' '}
              <b>{tx('เก็บเสียงที่โหลดแล้วไว้ในเครื่อง', 'keeps downloaded audio on your device')}</b>{' '}
              {tx(
                '— ประโยคเดิมเล่นทันทีไม่กินโควตา และทยอยโหลดเสียงบทเรียนล่วงหน้าให้เอง ประโยคไหนยังโหลดไม่ทันจะใช้เสียงในเครื่องไปก่อน (เรียนซ้ำบทเดิมวันถัดไปเสียงจะเป็น AI ครบทั้งบท)',
                '— repeated sentences play instantly without using quota, and lesson audio is fetched ahead of time. Sentences not ready yet use the device voice (replay the lesson the next day for full AI voice).',
              )}
            </p>
          </>
        )}
      </Section>

      <Section title={tx('ตัวช่วยตอนฝึกพูด', 'Speaking helpers')}>
        <ToggleRow
          on={s.autoMic}
          onToggle={() => update({ autoMic: !s.autoMic })}
          icon="🎤"
          title={tx('เปิดไมค์ให้เองหลัง AI พูดจบ', 'Auto-open mic after the AI speaks')}
          desc={tx('ไม่ต้องกดปุ่มไมค์ พูดตอบได้ทันที', 'No need to tap the mic — just answer')}
        />
        <div className="mt-2">
          <ToggleRow
            on={s.pronTips}
            onToggle={() => update({ pronTips: !s.pronTips })}
            icon="💡"
            title={tx('เคล็ดลับการออกเสียงตอนพูดไม่ตรง', 'Pronunciation tips when you miss')}
            desc={tx('โชว์คำอ่านภาษาไทย + วิธีวางลิ้น/ริมฝีปากของคำที่พลาด', 'Show Thai phonetic reading + tongue/lip position for missed words')}
          />
        </div>
      </Section>

      <Section title={tx('สมองของ AI (Scene role-play / Free talk)', 'AI brain (Scene role-play / Free talk)')}>
        <div className="mb-2 flex gap-2">
          <button
            type="button"
            onClick={() => update({ llmEngine: 'gemini' })}
            className={`flex-1 rounded-xl border-2 bg-white px-2 py-2.5 text-sm font-semibold ${
              s.llmEngine === 'gemini' ? 'border-bee-400 text-navy-900' : 'border-transparent text-gray-500'
            }`}
          >
            ☁️ Gemini cloud
            <span className="block text-[11px] font-normal text-gray-400">{tx('ฉลาดสุด ต้องมีเน็ต+key', 'Smartest, needs internet + key')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              update({ llmEngine: 'ollama' })
              void loadOllamaModels(s.ollamaUrl)
            }}
            className={`flex-1 rounded-xl border-2 bg-white px-2 py-2.5 text-sm font-semibold ${
              s.llmEngine === 'ollama' ? 'border-bee-400 text-navy-900' : 'border-transparent text-gray-500'
            }`}
          >
            💻 Ollama (local)
            <span className="block text-[11px] font-normal text-gray-400">{tx('เร็ว ฟรีไม่จำกัด บนเครื่องนี้', 'Fast, free, unlimited on this device')}</span>
          </button>
        </div>

        {s.llmEngine === 'ollama' && (
          <>
            {ollamaModels === null && !ollamaError && (
              <button
                type="button"
                onClick={() => void loadOllamaModels(s.ollamaUrl)}
                className="w-full rounded-xl border-2 border-bee-300 bg-bee-100 px-3 py-2.5 text-sm font-bold text-navy-900"
              >
                🔌 {tx('เชื่อมต่อ Ollama', 'Connect Ollama')}
              </button>
            )}
            {ollamaError && (
              <div className="rounded-xl bg-orange-50 px-3 py-2.5 text-xs leading-5 text-orange-700">
                ⚠️ {ollamaError}
                <button type="button" onClick={() => void loadOllamaModels(s.ollamaUrl)} className="ml-2 font-bold underline">
                  {tx('ลองใหม่', 'Retry')}
                </button>
              </div>
            )}
            {ollamaModels && (
              <>
                <p className="mb-1 text-xs font-bold text-leaf-600">✓ {tx('เชื่อมต่อ Ollama สำเร็จ', 'Connected to Ollama')}</p>
                <select
                  value={s.ollamaModel}
                  onChange={(e) => update({ ollamaModel: e.target.value })}
                  className="w-full rounded-xl border-2 border-bee-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-bee-400"
                >
                  {ollamaModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </>
            )}
            <p className="mt-2 text-xs leading-5 text-gray-500">
              {tx('ใช้โมเดล AI ที่รันบนเครื่องนี้ผ่าน Ollama — ', 'Uses an AI model running on this machine via Ollama — ')}
              <b>{tx('ตอบไว (~1-2 วิ) ฟรี ไม่จำกัด ออฟไลน์ได้', 'fast replies (~1-2 s), free, unlimited, works offline')}</b>{' '}
              {tx(
                'เหมาะกับตอนใช้บน Mac (บนมือถือให้ใช้ Gemini) — โมเดลไทย-อังกฤษที่แนะนำ:',
                'Best on a Mac (use Gemini on mobile) — recommended Thai-English model:',
              )}{' '}
              <code className="rounded bg-gray-100 px-1">scb10x/typhoon2.5-qwen3-4b</code>
            </p>
          </>
        )}
      </Section>

      <Section title={tx('Gemini API key (สำหรับ Scene role-play / Free talk)', 'Gemini API key (for Scene role-play / Free talk)')}>
        <input
          value={s.geminiKey}
          onChange={(e) => update({ geminiKey: e.target.value.trim() })}
          placeholder={tx('วาง API key ที่นี่', 'Paste your API key here')}
          type="password"
          autoComplete="off"
          className="w-full rounded-xl border-2 border-bee-200 bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-bee-400"
        />
        <p className="mt-2 text-xs leading-5 text-gray-500">
          {tx('สมัครฟรีที่', 'Get one free at')}{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="font-bold text-blue-600 underline">
            aistudio.google.com/apikey
          </a>{' '}
          {tx('(กด "Create API key") — โหมดบทเรียน Drill ใช้ได้โดยไม่ต้องมี key', '(tap "Create API key") — Drill lessons work without a key')}
        </p>
      </Section>

      <Section title={tx('ระบบ', 'System')}>
        <div className="rounded-xl bg-white p-3 text-sm text-gray-600">
          <div>
            🎤 {tx('รู้จำเสียงพูด (STT)', 'Speech recognition (STT)')}:{' '}
            {isSTTSupported() ? (
              <b className="text-leaf-600">{tx('ใช้ได้', 'Available')}</b>
            ) : (
              <b className="text-red-500">{tx('browser นี้ไม่รองรับ — แนะนำ Chrome/Safari', 'Not supported in this browser — use Chrome/Safari')}</b>
            )}
          </div>
          <div className="mt-1">
            🔊 {tx('เสียงพูด (TTS)', 'Text-to-speech (TTS)')}:{' '}
            {'speechSynthesis' in window ? (
              <b className="text-leaf-600">{tx('ใช้ได้', 'Available')}</b>
            ) : (
              <b className="text-red-500">{tx('ไม่รองรับ', 'Not supported')}</b>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await clearTTSCache()
            alert(tx('ล้าง cache เสียงแล้ว', 'Voice cache cleared'))
          }}
          className="mt-3 w-full rounded-xl border-2 border-bee-200 bg-white py-2.5 text-sm font-bold text-navy-800"
        >
          {tx('ล้าง cache เสียง AI', 'Clear AI voice cache')}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(tx('ล้างสถิติการเรียนทั้งหมด? (การตั้งค่าจะยังอยู่)', 'Reset all learning stats? (Your settings will be kept)'))) {
              resetProgress()
              location.reload()
            }
          }}
          className="mt-3 w-full rounded-xl border-2 border-red-200 bg-white py-2.5 text-sm font-bold text-red-500"
        >
          {tx('ล้างสถิติการเรียน', 'Reset learning stats')}
        </button>
      </Section>

      <BottomNav />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 text-sm font-bold text-navy-800">{title}</h2>
      {children}
    </section>
  )
}

function ToggleRow({
  on,
  onToggle,
  icon,
  title,
  desc,
}: {
  on: boolean
  onToggle: () => void
  icon: string
  title: string
  desc: string
}) {
  return (
    <button type="button" onClick={onToggle} className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3">
      <span className="text-left text-sm text-navy-800">
        {icon} {title}
        <span className="block text-xs text-gray-400">{desc}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-leaf-500' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}
