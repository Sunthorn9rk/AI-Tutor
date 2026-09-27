import { useEffect, useState } from 'react'
import { getSettings, saveSettings, resetProgress, type VoiceRate } from '../services/store'
import { tutors } from '../content/course'
import { speak, listEnglishVoices, resetVoiceCache } from '../services/tts'
import { GEMINI_VOICES } from '../services/gemini-tts'
import { LOCAL_VOICES, ensureLocalTTS, getLocalTTSStatus, onLocalTTSStatus } from '../services/local-tts'
import { clearTTSCache } from '../services/tts-cache'
import { listOllamaModels } from '../services/ollama'
import { isSTTSupported } from '../services/stt'
import { saveCustomAvatar, clearCustomAvatar, hasCustomAvatar, BUNDLED_AVATARS } from '../services/avatar-file'
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
  const [customAvatar, setCustomAvatar] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState('')

  useEffect(() => {
    void hasCustomAvatar().then(setCustomAvatar)
  }, [])

  const onAvatarFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.vrm')) {
      setAvatarMsg('⚠️ ต้องเป็นไฟล์ .vrm เท่านั้น')
      return
    }
    await saveCustomAvatar(await file.arrayBuffer())
    setCustomAvatar(true)
    update({ avatarFile: 'custom' })
    setAvatarMsg('✓ เปลี่ยนตัวละครแล้ว — มีผลตอนเข้าบทเรียน')
  }

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
      setOllamaError('ต่อ Ollama ไม่ได้ — เช็คว่าแอป Ollama เปิดอยู่ (หรือรัน `ollama serve`)')
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
        <h1 className="text-2xl font-extrabold text-navy-900">ตั้งค่า ⚙️</h1>
        {saved && <span className="text-sm font-bold text-leaf-600">บันทึกแล้ว ✓</span>}
      </div>

      <Section title="ชื่อของคุณ">
        <input
          value={s.name}
          onChange={(e) => update({ name: e.target.value })}
          className="w-full rounded-xl border-2 border-bee-200 bg-white px-3 py-2.5 outline-none focus:border-bee-400"
        />
      </Section>

      <Section title="Tutor">
        <div className="flex gap-3">
          {tutors.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => update({ tutorId: t.id })}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border-2 bg-white p-2.5 ${
                s.tutorId === t.id ? 'border-bee-400' : 'border-transparent'
              }`}
            >
              <TutorAvatar tutorId={t.id} size={52} />
              <span className="text-xs font-bold text-navy-900">{t.name}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="ตัวละคร Tutor ในบทเรียน">
        <div className="mb-2 flex gap-2">
          <button
            type="button"
            onClick={() => update({ avatarStyle: 'vrm' })}
            className={`flex-1 rounded-xl border-2 bg-white px-2 py-2.5 text-sm font-semibold ${
              s.avatarStyle === 'vrm' ? 'border-bee-400 text-navy-900' : 'border-transparent text-gray-500'
            }`}
          >
            🧍‍♀️ ตัวละคร 3D
            <span className="block text-[11px] font-normal text-gray-400">ขยับปากตามเสียงจริง</span>
          </button>
          <button
            type="button"
            onClick={() => update({ avatarStyle: 'cartoon' })}
            className={`flex-1 rounded-xl border-2 bg-white px-2 py-2.5 text-sm font-semibold ${
              s.avatarStyle === 'cartoon' ? 'border-bee-400 text-navy-900' : 'border-transparent text-gray-500'
            }`}
          >
            🐝 การ์ตูน
            <span className="block text-[11px] font-normal text-gray-400">เบา เรียบง่าย</span>
          </button>
        </div>

        {s.avatarStyle === 'vrm' && (
          <>
            <div className="mb-2 grid grid-cols-2 gap-2">
              {BUNDLED_AVATARS.map((a) => (
                <button
                  key={a.file}
                  type="button"
                  onClick={() => {
                    update({ avatarFile: a.file })
                    setAvatarMsg(`✓ ใช้ ${a.name} แล้ว`)
                  }}
                  className={`rounded-xl border-2 bg-white px-3 py-2 text-left text-xs ${
                    s.avatarFile === a.file ? 'border-bee-400' : 'border-transparent'
                  }`}
                >
                  <span className="font-en text-sm font-bold text-navy-900">{a.name}</span>
                  <span className="block text-gray-500">{a.desc}</span>
                </button>
              ))}
              {customAvatar && (
                <button
                  type="button"
                  onClick={() => {
                    update({ avatarFile: 'custom' })
                    setAvatarMsg('✓ ใช้ตัวละครของคุณแล้ว')
                  }}
                  className={`rounded-xl border-2 bg-white px-3 py-2 text-left text-xs ${
                    s.avatarFile === 'custom' ? 'border-bee-400' : 'border-transparent'
                  }`}
                >
                  <span className="font-en text-sm font-bold text-navy-900">My avatar</span>
                  <span className="block text-gray-500">ไฟล์ที่คุณอัปโหลด</span>
                </button>
              )}
            </div>
            <label className="block w-full cursor-pointer rounded-xl border-2 border-dashed border-bee-300 bg-bee-100/60 px-3 py-2.5 text-center text-sm font-bold text-navy-900">
              📂 เพิ่มไฟล์ตัวละคร .vrm ของคุณเอง
              <input
                type="file"
                accept=".vrm"
                className="hidden"
                onChange={(e) => void onAvatarFile(e.target.files?.[0])}
              />
            </label>
            {avatarMsg && <p className="mt-1.5 text-xs font-bold text-leaf-600">{avatarMsg}</p>}
            {customAvatar && s.avatarFile === 'custom' && (
              <button
                type="button"
                onClick={async () => {
                  await clearCustomAvatar()
                  setCustomAvatar(false)
                  update({ avatarFile: BUNDLED_AVATARS[0].file })
                  setAvatarMsg('ลบไฟล์และกลับไปใช้ตัวละครเริ่มต้นแล้ว')
                }}
                className="mt-2 w-full rounded-xl border-2 border-red-200 bg-white py-2 text-xs font-bold text-red-500"
              >
                🗑 ลบไฟล์ตัวละครที่อัปโหลด
              </button>
            )}
            <p className="mt-2 text-xs leading-5 text-gray-500">
              โหลดตัวละครเพิ่มได้ฟรีที่{' '}
              <a
                href="https://hub.vroid.com/en/models?is_downloadable=true"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-blue-600 underline"
              >
                hub.vroid.com
              </a>{' '}
              — <b>เลือกเฉพาะตัวที่มีไอคอนดาวน์โหลด ⬇️</b> (บางตัวผู้สร้างปิดดาวน์โหลด จะใช้ไม่ได้)
              แล้วกดปุ่มเพิ่มไฟล์ด้านบน ไฟล์ถูกเก็บในเครื่อง ใช้ออฟไลน์ได้
            </p>
          </>
        )}
      </Section>

      <Section title="ความเร็วเสียงพูด (แตะเพื่อฟังตัวอย่าง)">
        <div className="flex gap-2">
          {(
            [
              ['words', '🐢 ทีละคำ'],
              ['calm', '😌 ใจเย็น'],
              ['natural', '💬 ธรรมชาติ'],
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

      <Section title="เสียงของ AI Tutor">
        <div className="mb-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => update({ ttsEngine: 'device' })}
            className={`rounded-xl border-2 bg-white px-1.5 py-2.5 text-[13px] font-semibold ${
              s.ttsEngine === 'device' ? 'border-bee-400 text-navy-900' : 'border-transparent text-gray-500'
            }`}
          >
            📱 เสียงระบบ
            <span className="block text-[10px] font-normal text-gray-400">ฟรี ออฟไลน์</span>
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
            🧠 AI ในเครื่อง
            <span className="block text-[10px] font-normal text-gray-400">ไม่จำกัด โหลดครั้งเดียว</span>
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
            <span className="block text-[10px] font-normal text-gray-400">Gemini โควตาจำกัด</span>
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
                  ? `กำลังดาวน์โหลดโมเดลเสียง… ${localTTS.progress}%`
                  : localTTS.status === 'error'
                    ? 'โหลดไม่สำเร็จ — แตะเพื่อลองใหม่'
                    : '⬇️ ดาวน์โหลดโมเดลเสียง (~90MB ครั้งเดียว)'}
              </button>
            )}
            {localTTS.status === 'downloading' && (
              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-bee-100">
                <div className="h-full bg-bee-400 transition-all" style={{ width: `${localTTS.progress}%` }} />
              </div>
            )}
            {localTTS.status === 'ready' && (
              <p className="mb-2 text-xs font-bold text-leaf-600">✓ โมเดลพร้อมใช้งาน — ไม่จำกัด ใช้ออฟไลน์ได้</p>
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
                  <span className="font-en text-sm font-bold text-navy-900">{v.label.split(' — ')[0]}</span>
                  <span className="block text-gray-500">{v.label.split(' — ')[1]}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              เสียง AI ที่รันในเครื่องคุณเอง (Kokoro) — <b>ไม่มีโควตา ไม่ต้องใช้ key</b> ประโยคใหม่ใช้เวลา
              generate ~1-5 วิ (แอปเตรียมล่วงหน้าให้ระหว่างเรียน) ประโยคที่เคยพูดแล้วดังทันที
              ระหว่างเสียงยังไม่พร้อมจะใช้เสียงระบบไปก่อน
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
              <option value="">อัตโนมัติ (แอปเลือกเสียงที่ดีที่สุดให้)</option>
              {voices.map((v) => (
                <option key={`${v.name}|${v.lang}`} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              💡 <b>เคล็ดลับ iPhone/Mac:</b> ดาวน์โหลดเสียงคุณภาพสูงได้ฟรีที่ ตั้งค่า → การช่วยการเข้าถึง →
              เนื้อหาที่พูด → เสียง → English แล้วเลือกเสียงที่มีคำว่า <b>(Enhanced)</b> หรือ <b>(Premium)</b>{' '}
              จากรายการด้านบน — เสียงจะธรรมชาติขึ้นมาก (เลือกแล้วจะมีเสียงตัวอย่างให้ฟัง)
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
                  <span className="block text-gray-500">{v.label.split('— ')[1]}</span>
                </button>
              ))}
            </div>
            {!s.geminiKey && (
              <p className="mt-2 text-xs text-orange-600">⚠️ ต้องใส่ Gemini API key (ด้านล่าง) ก่อนถึงจะมีเสียง</p>
            )}
            <p className="mt-2 text-xs leading-5 text-gray-500">
              โควตาฟรีของเสียง AI จำกัด (~3 ประโยคใหม่/นาที, ~15 ประโยคใหม่/วัน) แอปจึง
              <b>เก็บเสียงที่โหลดแล้วไว้ในเครื่อง</b> — ประโยคเดิมเล่นทันทีไม่กินโควตา
              และทยอยโหลดเสียงบทเรียนล่วงหน้าให้เอง ประโยคไหนยังโหลดไม่ทันจะใช้เสียงในเครื่องไปก่อน
              (เรียนซ้ำบทเดิมวันถัดไปเสียงจะเป็น AI ครบทั้งบท)
            </p>
          </>
        )}
      </Section>

      <Section title="ตัวช่วยตอนฝึกพูด">
        <ToggleRow
          on={s.autoMic}
          onToggle={() => update({ autoMic: !s.autoMic })}
          icon="🎤"
          title="เปิดไมค์ให้เองหลัง AI พูดจบ"
          desc="ไม่ต้องกดปุ่มไมค์ พูดตอบได้ทันที"
        />
        <div className="mt-2">
          <ToggleRow
            on={s.pronTips}
            onToggle={() => update({ pronTips: !s.pronTips })}
            icon="💡"
            title="เคล็ดลับการออกเสียงตอนพูดไม่ตรง"
            desc="โชว์คำอ่านภาษาไทย + วิธีวางลิ้น/ริมฝีปากของคำที่พลาด"
          />
        </div>
      </Section>

      <Section title="สมองของ AI (Scene role-play / Free talk)">
        <div className="mb-2 flex gap-2">
          <button
            type="button"
            onClick={() => update({ llmEngine: 'gemini' })}
            className={`flex-1 rounded-xl border-2 bg-white px-2 py-2.5 text-sm font-semibold ${
              s.llmEngine === 'gemini' ? 'border-bee-400 text-navy-900' : 'border-transparent text-gray-500'
            }`}
          >
            ☁️ Gemini cloud
            <span className="block text-[11px] font-normal text-gray-400">ฉลาดสุด ต้องมีเน็ต+key</span>
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
            <span className="block text-[11px] font-normal text-gray-400">เร็ว ฟรีไม่จำกัด บนเครื่องนี้</span>
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
                🔌 เชื่อมต่อ Ollama
              </button>
            )}
            {ollamaError && (
              <div className="rounded-xl bg-orange-50 px-3 py-2.5 text-xs leading-5 text-orange-700">
                ⚠️ {ollamaError}
                <button type="button" onClick={() => void loadOllamaModels(s.ollamaUrl)} className="ml-2 font-bold underline">
                  ลองใหม่
                </button>
              </div>
            )}
            {ollamaModels && (
              <>
                <p className="mb-1 text-xs font-bold text-leaf-600">✓ เชื่อมต่อ Ollama สำเร็จ</p>
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
              ใช้โมเดล AI ที่รันบนเครื่องนี้ผ่าน Ollama — <b>ตอบไว (~1-2 วิ) ฟรี ไม่จำกัด ออฟไลน์ได้</b>{' '}
              เหมาะกับตอนใช้บน Mac (บนมือถือให้ใช้ Gemini) — โมเดลไทย-อังกฤษที่แนะนำ:{' '}
              <code className="rounded bg-gray-100 px-1">scb10x/typhoon2.5-qwen3-4b</code>
            </p>
          </>
        )}
      </Section>

      <Section title="Gemini API key (สำหรับ Scene role-play / Free talk)">
        <input
          value={s.geminiKey}
          onChange={(e) => update({ geminiKey: e.target.value.trim() })}
          placeholder="วาง API key ที่นี่"
          type="password"
          autoComplete="off"
          className="w-full rounded-xl border-2 border-bee-200 bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-bee-400"
        />
        <p className="mt-2 text-xs leading-5 text-gray-500">
          สมัครฟรีที่{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="font-bold text-blue-600 underline">
            aistudio.google.com/apikey
          </a>{' '}
          (กด "Create API key") — โหมดบทเรียน Drill ใช้ได้โดยไม่ต้องมี key
        </p>
      </Section>

      <Section title="ระบบ">
        <div className="rounded-xl bg-white p-3 text-sm text-gray-600">
          <div>🎤 รู้จำเสียงพูด (STT): {isSTTSupported() ? <b className="text-leaf-600">ใช้ได้</b> : <b className="text-red-500">browser นี้ไม่รองรับ — แนะนำ Chrome/Safari</b>}</div>
          <div className="mt-1">
            🔊 เสียงพูด (TTS): {'speechSynthesis' in window ? <b className="text-leaf-600">ใช้ได้</b> : <b className="text-red-500">ไม่รองรับ</b>}
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await clearTTSCache()
            alert('ล้าง cache เสียงแล้ว')
          }}
          className="mt-3 w-full rounded-xl border-2 border-bee-200 bg-white py-2.5 text-sm font-bold text-navy-800"
        >
          ล้าง cache เสียง AI
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm('ล้างสถิติการเรียนทั้งหมด? (การตั้งค่าจะยังอยู่)')) {
              resetProgress()
              location.reload()
            }
          }}
          className="mt-3 w-full rounded-xl border-2 border-red-200 bg-white py-2.5 text-sm font-bold text-red-500"
        >
          ล้างสถิติการเรียน
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
