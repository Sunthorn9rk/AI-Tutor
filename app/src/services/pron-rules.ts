// เคล็ดลับการออกเสียงแบบ rule-based — เขียนตายตัวในโค้ด แม่นเสมอ เข้าใจง่าย
// (ไม่ให้ LLM แต่งเอง เพราะโมเดลเล็กชอบมั่ว) — เน้นจุดที่คนไทยพลาดบ่อยจริง ๆ

const clean = (w: string) => w.toLowerCase().replace(/[^a-z']/g, '')

interface Rule {
  when: (w: string) => boolean
  tip: (w: string) => string
}

// เรียงตามความสำคัญ: เสียงเฉพาะ (th/v/sh/ch) → เสียงท้ายคำ (จุดพลาดอันดับ 1 ของคนไทย) → r
const RULES: Rule[] = [
  {
    when: (w) => w.includes('th'),
    tip: (w) => `"${w}" มีเสียง th — แลบปลายลิ้นแตะฟันบนเบา ๆ แล้วเป่าลมออก (ไม่ใช่ "ต" หรือ "ด")`,
  },
  {
    when: (w) => w.includes('v'),
    tip: (w) => `"${w}" มีเสียง v — ฟันบนแตะริมฝีปากล่างแล้วสั่นเสียง (ไม่ใช่ "ว")`,
  },
  {
    when: (w) => w.includes('sh'),
    tip: (w) => `"${w}" มีเสียง sh — ทำปากจู๋ เสียง "ช" ลากยาวนุ่ม ๆ`,
  },
  {
    when: (w) => w.includes('ch'),
    tip: (w) => `"${w}" มีเสียง ch — เสียง "ช" สั้น ๆ พ่นลมแรง`,
  },
  {
    when: (w) => /(s|x|z|'s)$/.test(w),
    tip: (w) => `"${w}" ลงท้ายเสียง "ส" — คนไทยลืมบ่อยสุด พูดให้ได้ยิน "ส" ชัด ๆ ท้ายคำ`,
  },
  {
    when: (w) => /[pb]$/.test(w),
    tip: (w) => `"${w}" ลงท้ายเสียง "${w.endsWith('p') ? 'พ' : 'บ'}" — ปิดริมฝีปากตอนจบคำให้สนิท อย่าตัดทิ้ง`,
  },
  {
    when: (w) => /[td]$/.test(w),
    tip: (w) => `"${w}" มีเสียงท้าย "ท/ด" แผ่ว ๆ — แตะลิ้นที่เพดานตอนจบคำ พูดให้สุดคำ`,
  },
  {
    when: (w) => /[kg]$/.test(w),
    tip: (w) => `"${w}" เก็บเสียงท้าย "ค/ก" ด้วย — พูดให้จบคำ อย่าปล่อยหาย`,
  },
  {
    when: (w) => /l$/.test(w),
    tip: (w) => `"${w}" ลงท้ายเสียง l — ยกปลายลิ้นแตะเพดานหลังฟันบนตอนจบคำ`,
  },
  {
    when: (w) => w.includes('r'),
    tip: (w) => `"${w}" มีเสียง r — ห่อปลายลิ้นขึ้นโดยไม่แตะเพดาน (ระวังอย่าให้เป็น "ล")`,
  },
]

/** เคล็ดลับสำหรับคำที่พลาด (คำละ 1 ข้อ รวมไม่เกิน 3 ข้อ ให้อ่านไหว) */
export function pronTricks(missedWords: string[]): string[] {
  const tips: string[] = []
  const seen = new Set<string>()
  for (const raw of missedWords) {
    const w = clean(raw)
    if (!w || seen.has(w)) continue
    seen.add(w)
    const rule = RULES.find((r) => r.when(w))
    tips.push(rule ? rule.tip(w) : `"${w}" — กด 🐢 ฟังช้า ๆ แล้วพูดตามทีละพยางค์`)
    if (tips.length >= 3) break
  }
  return tips
}
