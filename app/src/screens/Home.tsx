import { course, findScene } from '../content/course'
import { getProgress, getSettings, todayISO } from '../services/store'
import { getLevel, getDailyGoal, getStudyDayCount } from '../services/gamify'
import TutorAvatar from '../components/TutorAvatar'
import BottomNav from '../components/BottomNav'
import WeekStrip from '../components/WeekStrip'
import { Badge, ButtonLink, Card, Chip, ProgressBar, Ring, SectionHeader, StatRow } from '../components/ui'
import { Link } from 'react-router-dom'
import { tx, uiLang } from '../services/i18n'

// สีประจำ module — การ์ดบทเรียนเป็นพื้นพาสเทลตามสีนี้ (แบบการ์ดแพ็กเกจใน ref)
const TONES = ['aqua', 'grape', 'tang', 'leaf'] as const
type Tone = (typeof TONES)[number]
const TINT: Record<Tone, { card: string; accent: string; ring: string }> = {
  aqua: { card: 'bg-aqua-50 ring-aqua-100', accent: 'text-aqua-600', ring: 'ring-aqua-300' },
  grape: { card: 'bg-grape-50 ring-grape-100', accent: 'text-grape-600', ring: 'ring-grape-300' },
  tang: { card: 'bg-tang-50 ring-tang-100', accent: 'text-tang-600', ring: 'ring-tang-300' },
  leaf: { card: 'bg-leaf-50 ring-leaf-100', accent: 'text-leaf-600', ring: 'ring-leaf-300' },
}

export default function Home() {
  const settings = getSettings()
  const progress = getProgress()
  const lvl = getLevel(progress)
  const daily = getDailyGoal(progress, todayISO())

  // บทเรียนถัดไปที่ยังไม่จบ — การกระทำที่สำคัญที่สุดของหน้านี้
  const next = course.modules
    .flatMap((m) => m.lessons.map((l) => ({ lesson: l, module: m })))
    .find((x) => !progress.completedLessons.includes(x.lesson.id))

  const totalLessons = course.modules.reduce((n, m) => n + m.lessons.length, 0)
  const doneLessons = progress.completedLessons.length

  return (
    <div className="mx-auto max-w-md pb-32">
      <header className="sticky top-0 z-10 bg-canvas/90 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Ring tone="bee" size={44}>
            <TutorAvatar tutorId={settings.tutorId} size={44} />
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] text-navy-400">{tx('สวัสดี', 'Hi')} {settings.name} 👋</div>
            <div className="font-en truncate text-[22px] font-extrabold leading-tight text-navy-900">
              Level <span className="text-tang-500">{lvl.level}</span>
              <span className="ml-1.5 text-base font-bold text-navy-300">· {settings.level}</span>
            </div>
          </div>
          <Badge tone={progress.streak > 0 ? 'tang' : 'muted'} className="shrink-0 px-3 py-1.5 text-sm">
            🔥 {progress.streak}
          </Badge>
        </div>
      </header>

      <main className="space-y-6 px-5 pt-2">
        {/* ---- สัปดาห์นี้ + สถิติ ---- */}
        <Card delay={0} className="space-y-4 p-5">
          <WeekStrip progress={progress} />
          <div className="text-center text-[13px] text-navy-400">
            {daily.done ? tx('🎉 วันนี้เรียนแล้ว เก่งมาก!', '🎉 Done for today. Great job!') : tx('วันนี้ยังไม่ได้เรียนเลยนะ', "You haven't studied today yet")}
          </div>
          <div>
            <div className="mb-2 text-sm font-extrabold text-navy-900">{tx('ภาพรวมสะสม', 'All-time stats')}</div>
            <StatRow
              tone="aqua"
              className="shadow-pop"
              items={[
                { icon: '⚡', value: lvl.xp, label: tx('XP รวม', 'Total XP') },
                { icon: '🗣️', value: progress.wordsLearned, label: tx('คำที่ฝึกพูด', 'Words spoken') },
                { icon: '📅', value: getStudyDayCount(progress), label: tx('วันที่เรียน', 'Study days') },
              ]}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
              <span className="font-bold text-navy-700">
                {tx('อีก', '')} <span className="text-tang-500">{lvl.xpPerLevel - lvl.xpInLevel} XP</span> {tx('ขึ้น', 'to')} Level {lvl.level + 1}
              </span>
              <span className="font-en font-extrabold">
                <span className="text-tang-500">{lvl.xpInLevel}</span>
                <span className="text-navy-300"> / {lvl.xpPerLevel}</span>
              </span>
            </div>
            <ProgressBar ratio={lvl.ratio} tone="tang" />
          </div>
        </Card>

        {/* ---- เรียนต่อ: กล่องเหลืองหุ้มการ์ดขาว มาสคอตลอยทับขอบ (แบบแผง "course complete" ใน ref) ---- */}
        {next ? (
          <section className="rise-in relative rounded-card bg-bee-400 px-3 pb-3 pt-12" style={{ animationDelay: '0.06s' }}>
            <div className="pointer-events-none absolute right-5 top-4 text-xl opacity-60">✦</div>
            <div className="pointer-events-none absolute left-6 top-7 text-sm opacity-50">✦</div>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3">
              <Ring tone="bee" size={76}>
                <TutorAvatar tutorId={next.module.tutorId} size={76} />
              </Ring>
            </div>
            <div className="rounded-tile bg-surface px-5 pb-5 pt-9 text-center shadow-card">
              <div className="text-xs font-bold text-navy-300">
                {tx('เรียนต่อ · บทที่', 'Continue · Lesson')} <span className="text-tang-500">{doneLessons + 1}</span>/{totalLessons}
              </div>
              <div className="font-en mt-1 text-2xl font-extrabold text-navy-900">{next.lesson.title}</div>
              {uiLang() === 'th' && <p className="mt-1 text-sm leading-relaxed text-navy-400">{next.lesson.titleTh}</p>}
              <div className="mt-3 flex justify-center gap-1.5">
                <Chip tone="aqua">{next.module.title}</Chip>
                <Chip tone="leaf">+10 XP</Chip>
              </div>
              <ButtonLink to={`/lesson/${next.lesson.id}`} variant="warm" size="lg" full className="mt-4 rounded-full">
                ▶ {tx('เริ่มเรียน', 'Start')}
              </ButtonLink>
            </div>
          </section>
        ) : (
          <Card tone="leaf" delay={0.06} className="py-6 text-center">
            <div className="trophy-pop text-5xl">🏆</div>
            <div className="mt-2 text-lg font-extrabold">{tx('เรียนจบทุกบทแล้ว!', 'All lessons complete!')}</div>
            <div className="mt-0.5 text-sm opacity-90">{tx('ลองฝึกบทสนทนาเพิ่มด้านล่างได้เลย', 'Keep practicing with the conversations below')}</div>
          </Card>
        )}

        {/* ---- ฝึกเพิ่ม: ปุ่มใหญ่คู่ มีไอคอนในวงกลม (แบบปุ่ม Reading / Practice ใน ref) ---- */}
        <section className="grid grid-cols-2 gap-3">
          <PracticeButton to="/scene/job-interview" tone="aqua" icon="💼" title={tx('สัมภาษณ์งาน', 'Job interview')} />
          <PracticeButton to="/freetalk" tone="tang" icon="💬" title="Free talk" />
        </section>

        {/* ---- เส้นทางคอร์ส ---- */}
        {course.modules.map((m, mi) => {
          const scene = m.sceneId ? findScene(m.sceneId) : null
          const tone = TONES[mi % TONES.length]
          const t = TINT[tone]
          const doneInModule = m.lessons.filter((l) => progress.completedLessons.includes(l.id)).length
          const allDone = doneInModule === m.lessons.length

          return (
            <section key={m.id}>
              <SectionHeader
                title={
                  <span className="flex items-center gap-2">
                    <span className="font-en">{m.title}</span>
                  </span>
                }
                action={
                  <Badge tone={allDone ? 'leaf' : 'muted'}>
                    {allDone ? '✓ ' : ''}
                    {doneInModule}/{m.lessons.length}
                  </Badge>
                }
                className="mb-1"
              />
              {uiLang() === 'th' && <div className="mb-3 text-xs text-navy-400">{m.titleTh}</div>}

              <div className="space-y-2.5">
                {m.lessons.map((l, li) => {
                  const done = progress.completedLessons.includes(l.id)
                  return (
                    <Link
                      key={l.id}
                      to={`/lesson/${l.id}`}
                      className={`rise-in flex items-center gap-3.5 rounded-card p-3.5 ring-1 transition active:scale-[0.985] ${t.card}`}
                      style={{ animationDelay: `${0.03 * li}s` }}
                    >
                      <Ring tone={tone} size={52}>
                        <TutorAvatar tutorId={m.tutorId} size={52} />
                      </Ring>
                      <div className="min-w-0 flex-1">
                        <div className="font-en truncate text-[15px] font-extrabold text-navy-900">{l.title}</div>
                        {uiLang() === 'th' && <div className="truncate text-xs text-navy-400">{l.titleTh}</div>}
                        <div className={`font-en mt-1 text-sm font-extrabold ${done ? 'text-leaf-600' : 'text-tang-500'}`}>
                          {done ? tx('✓ เรียนแล้ว', '✓ Done') : '+10 XP'}
                        </div>
                      </div>
                      <Radio done={done} />
                    </Link>
                  )
                })}

                {scene && (
                  <Link
                    to={`/scene/${scene.id}`}
                    className="rise-in flex items-center gap-3.5 rounded-card bg-surface p-3.5 shadow-card transition active:scale-[0.985]"
                  >
                    <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-grape-100 text-2xl">
                      {scene.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-en truncate text-[15px] font-extrabold text-navy-900">{scene.title}</div>
                      {uiLang() === 'th' && <div className="truncate text-xs text-navy-400">{scene.titleTh}</div>}
                      <div className="mt-1">
                        <Chip tone="grape">💬 {tx('บทสนทนาจริง', 'Real conversation')} · +25 XP</Chip>
                      </div>
                    </div>
                    <Radio done={progress.completedScenes.includes(scene.id)} />
                  </Link>
                )}
              </div>
            </section>
          )
        })}
      </main>

      <BottomNav />
    </div>
  )
}

/** วงกลมเลือกแบบ radio ขวามือการ์ด (ใน ref ใช้บอกสถานะ) — ทึบเขียวเมื่อจบแล้ว */
function Radio({ done }: { done: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        done ? 'bg-leaf-500 text-white' : 'bg-surface ring-2 ring-navy-200/60'
      }`}
    >
      {done ? '✓' : ''}
    </span>
  )
}

function PracticeButton({ to, tone, icon, title }: { to: string; tone: 'aqua' | 'tang'; icon: string; title: string }) {
  const skin =
    tone === 'aqua'
      ? 'bg-aqua-500 shadow-[0_4px_0_0_var(--color-aqua-700)]'
      : 'bg-tang-500 shadow-[0_4px_0_0_var(--color-tang-700)]'
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 rounded-full py-2 pl-2 pr-4 text-white transition active:translate-y-[3px] active:shadow-none ${skin}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/25 text-lg">{icon}</span>
      <span className="truncate text-[15px] font-extrabold">{title}</span>
    </Link>
  )
}
