// ตรวจคำตอบ drill ในเครื่อง (ฟรี ไม่ใช้ LLM): เทียบ transcript กับประโยคเป้าหมาย

const CONTRACTIONS: Record<string, string> = {
  "don't": 'do not',
  "doesn't": 'does not',
  "didn't": 'did not',
  "can't": 'cannot',
  "won't": 'will not',
  "isn't": 'is not',
  "aren't": 'are not',
  "wasn't": 'was not',
  "weren't": 'were not',
  "i'm": 'i am',
  "you're": 'you are',
  "we're": 'we are',
  "they're": 'they are',
  "it's": 'it is',
  "that's": 'that is',
  "there's": 'there is',
  "i'll": 'i will',
  "you'll": 'you will',
  "we'll": 'we will',
  "i've": 'i have',
  "you've": 'you have',
  "we've": 'we have',
  "let's": 'let us',
  "what's": 'what is',
  "how's": 'how is',
  "i'd": 'i would',
  "you'd": 'you would',
  gonna: 'going to',
  wanna: 'want to',
}

export function normalize(text: string): string {
  let t = text.toLowerCase().trim()
  for (const [c, full] of Object.entries(CONTRACTIONS)) {
    t = t.replaceAll(c, full)
  }
  return t
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = cur
  }
  return prev[n]
}

/** ความคล้าย 0..1 จาก edit distance ระดับตัวอักษร */
function charSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (!maxLen) return 1
  return 1 - levenshtein(a, b) / maxLen
}

/** สัดส่วนคำในเป้าหมายที่ผู้พูดพูดถูก (เรียงลำดับแบบหลวม ๆ) */
function tokenRecall(transcript: string, target: string): number {
  const tWords = target.split(' ')
  const sWords = transcript.split(' ')
  if (!tWords.length) return 1
  let hit = 0
  const used = new Set<number>()
  for (const tw of tWords) {
    let best = -1
    let bestScore = 0
    for (let i = 0; i < sWords.length; i++) {
      if (used.has(i)) continue
      const score = charSimilarity(tw, sWords[i])
      if (score > bestScore) {
        bestScore = score
        best = i
      }
    }
    if (best >= 0 && bestScore >= 0.75) {
      hit++
      used.add(best)
    }
  }
  return hit / tWords.length
}

export interface MatchResult {
  pass: boolean
  /** 0..1 */
  score: number
}

/** เทียบสิ่งที่พูดกับประโยคเป้าหมาย ผ่านเมื่อคล้าย ≥ 75% */
export function matchAnswer(transcript: string, target: string): MatchResult {
  const s = normalize(transcript)
  const t = normalize(target)
  if (!s) return { pass: false, score: 0 }
  if (s === t) return { pass: true, score: 1 }

  const score = Math.max(charSimilarity(s, t), tokenRecall(s, t))
  return { pass: score >= 0.75, score }
}

export interface WordDiff {
  /** คำตามที่เขียนในประโยคเป้าหมาย (คงตัวพิมพ์/เครื่องหมายไว้เพื่อแสดงผล) */
  word: string
  /** ผู้เรียนพูดคำนี้ได้ (ตรงหรือใกล้เคียง) */
  hit: boolean
}

/** เทียบรายคำ: คำไหนในประโยคเป้าหมายที่ผู้เรียนพูดได้/พลาด (ไว้ไฮไลต์สี + ส่งให้ AI ช่วยติว) */
export function diffWords(transcript: string, target: string): WordDiff[] {
  const sWords = normalize(transcript).split(' ').filter(Boolean)
  const used = new Set<number>()

  const consume = (normWord: string): boolean => {
    let best = -1
    let bestScore = 0
    for (let i = 0; i < sWords.length; i++) {
      if (used.has(i)) continue
      const score = charSimilarity(normWord, sWords[i])
      if (score > bestScore) {
        bestScore = score
        best = i
      }
    }
    if (best >= 0 && bestScore >= 0.75) {
      used.add(best)
      return true
    }
    return false
  }

  return target
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((display) => {
      // คำเดียวอาจ normalize เป็นหลายคำ (เช่น "I'd" → "i would") ต้องพูดครบทุกส่วนถึงนับว่าได้
      const parts = normalize(display).split(' ').filter(Boolean)
      if (!parts.length) return { word: display, hit: true }
      return { word: display, hit: parts.every(consume) }
    })
}

/** จำนวนคำของประโยค (ไว้โชว์ช่องว่าง __ __ และนับคำที่เรียน) */
export function wordCount(text: string): number {
  return normalize(text).split(' ').filter(Boolean).length
}

/** ทำช่องว่างแบบ "__ ____ __" ตามความยาวคำจริง */
export function blanks(text: string): string {
  return text
    .replace(/[.?!,]/g, '')
    .split(/\s+/)
    .map((w) => '_'.repeat(Math.min(w.length, 6)))
    .join('  ')
}
