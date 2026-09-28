// ประกอบ SVG ตัวละครจาก CharacterSpec — ใช้ร่วมกันทั้ง FlatTutor (ตัวใหญ่ขยับได้) และ TutorAvatar (ไอคอนเล็กนิ่ง)
//
// ส่วนที่ขยับได้มี class ให้ FlatTutor จับ: .neck .body .head .pupils .lids .brows .jaw .mouth
// ⚠️ ลำดับการวาดห้ามสลับ: คอ → เสื้อ → หัว | ในหัว: เปลือกตา → คิ้ว (เปลือกตาสีผิวจะทาทับคิ้วถ้าวาดทีหลัง)

import type { CharacterSpec } from '../content/cast'

export const DARK = '#2B2036'
export const WHITE = '#FFF8EE'
export const TONGUE = '#E86A78'

/** [ผิว, เงา/จมูก/คอ, แก้ม] */
const SKINS = {
  fair: ['#FBDCC4', '#EDB999', '#F4A594'],
  light: ['#F6C9A8', '#E8AC86', '#EFA184'],
  tan: ['#E3AE86', '#CD9068', '#E08A70'],
  brown: ['#C68A5E', '#A96F46', '#C9735A'],
  deep: ['#8C5A3B', '#6F4329', '#A5543F'],
} as const

const FACES = {
  oval: 'M124 202 Q124 88 200 88 Q276 88 276 202 Q276 262 258 286 Q234 312 200 314 Q166 312 142 286 Q124 262 124 202 Z',
  square: 'M122 196 Q122 90 200 90 Q278 90 278 196 L278 256 Q276 298 242 310 Q200 318 158 310 Q124 298 122 256 Z',
  long: 'M130 200 Q130 84 200 84 Q270 84 270 200 Q270 272 252 298 Q230 324 200 326 Q170 324 148 298 Q130 272 130 200 Z',
  round: 'M116 214 Q116 100 200 100 Q284 100 284 214 Q284 272 258 296 Q232 318 200 318 Q168 318 142 296 Q116 272 116 214 Z',
} as const

// {H}=สีผม {A}=สีของตกแต่ง
const HAIR: Record<CharacterSpec['hair'], { back: string; front: string }> = {
  long: {
    back: `<path d="M104 190 Q100 74 200 70 Q300 74 296 190 L300 334 Q250 308 200 310 Q150 308 100 334 Z" fill="{H}"/>`,
    front: `<path d="M112 176 Q108 78 200 74 Q292 78 288 176 Q278 128 228 120 Q156 110 112 176 Z" fill="{H}"/>
      <path d="M112 170 Q100 250 108 322 Q82 310 78 246 Q76 190 112 170 Z" fill="{H}"/>
      <path d="M288 170 Q300 250 292 322 Q318 310 322 246 Q324 190 288 170 Z" fill="{H}"/>`,
  },
  bob: {
    back: `<path d="M106 196 Q102 74 200 70 Q298 74 294 196 Q300 258 288 284 Q248 266 200 268 Q152 266 112 284 Q100 258 106 196 Z" fill="{H}"/>`,
    front: `<path d="M112 182 Q108 76 200 72 Q292 76 288 182 Q280 136 232 126 Q158 116 112 182 Z" fill="{H}"/>
      <path d="M112 176 Q104 228 114 278 Q94 270 88 234 Q84 198 112 176 Z" fill="{H}"/>
      <path d="M288 176 Q296 228 286 278 Q306 270 312 234 Q316 198 288 176 Z" fill="{H}"/>`,
  },
  bangs: {
    back: `<path d="M106 196 Q102 74 200 70 Q298 74 294 196 Q300 258 288 284 Q248 266 200 268 Q152 266 112 284 Q100 258 106 196 Z" fill="{H}"/>`,
    front: `<path d="M114 172 Q110 76 200 72 Q290 76 286 172 Q286 146 200 142 Q114 146 114 172 Z" fill="{H}"/>
      <path d="M112 176 Q104 228 114 278 Q94 270 88 234 Q84 198 112 176 Z" fill="{H}"/>
      <path d="M288 176 Q296 228 286 278 Q306 270 312 234 Q316 198 288 176 Z" fill="{H}"/>`,
  },
  curly: {
    back: `<g fill="{H}"><circle cx="200" cy="120" r="84"/><circle cx="126" cy="170" r="54"/><circle cx="274" cy="170" r="54"/>
      <circle cx="148" cy="100" r="50"/><circle cx="252" cy="100" r="50"/><circle cx="118" cy="232" r="40"/><circle cx="282" cy="232" r="40"/></g>`,
    front: `<g fill="{H}"><circle cx="160" cy="124" r="40"/><circle cx="240" cy="124" r="40"/><circle cx="200" cy="106" r="44"/></g>`,
  },
  afro: {
    back: `<circle cx="200" cy="130" r="112" fill="{H}"/>`,
    front: `<path d="M126 168 Q124 96 200 94 Q276 96 274 168 Q262 132 200 128 Q138 132 126 168 Z" fill="{H}"/>`,
  },
  bun: {
    back: `<circle cx="200" cy="60" r="36" fill="{H}"/>
      <path d="M118 184 Q114 80 200 76 Q286 80 282 184 Q286 214 278 228 Q244 214 200 216 Q156 214 122 228 Q114 214 118 184 Z" fill="{H}"/>`,
    front: `<path d="M120 174 Q116 84 200 80 Q284 84 280 174 Q270 134 226 126 Q162 116 120 174 Z" fill="{H}"/>`,
  },
  ponytail: {
    back: `<path d="M112 186 Q108 78 200 74 Q292 78 288 186 Q292 236 286 260 Q244 244 200 246 Q156 244 114 260 Q108 236 112 186 Z" fill="{H}"/>
      <path d="M284 188 Q332 198 340 252 Q346 306 316 340 Q300 306 296 260 Q292 218 284 188 Z" fill="{H}"/>`,
    front: `<path d="M116 178 Q112 78 200 74 Q288 78 284 178 Q274 132 226 124 Q160 114 116 178 Z" fill="{H}"/>`,
  },
  pigtails: {
    back: `<circle cx="98" cy="196" r="36" fill="{H}"/><circle cx="302" cy="196" r="36" fill="{H}"/>
      <circle cx="126" cy="172" r="9" fill="{A}"/><circle cx="274" cy="172" r="9" fill="{A}"/>
      <path d="M116 190 Q112 92 200 88 Q288 92 284 190 Q286 210 278 222 Q244 210 200 212 Q156 210 122 222 Q114 210 116 190 Z" fill="{H}"/>`,
    front: `<path d="M116 180 Q112 92 200 88 Q288 92 284 180 Q284 154 200 150 Q116 154 116 180 Z" fill="{H}"/>`,
  },
  short: {
    back: `<path d="M118 182 Q114 78 200 74 Q286 78 282 182 Q286 212 278 226 Q244 212 200 214 Q156 212 122 226 Q114 212 118 182 Z" fill="{H}"/>`,
    front: `<path d="M118 176 Q114 80 200 76 Q286 80 282 176 Q272 136 228 128 Q162 118 118 176 Z" fill="{H}"/>`,
  },
  sidepart: {
    back: `<path d="M120 190 Q116 80 200 76 Q284 80 280 190 L276 212 L270 176 L130 176 L124 212 Z" fill="{H}"/>`,
    front: `<path d="M120 176 Q118 82 200 78 Q282 82 280 176 Q270 120 178 118 Q146 122 120 176 Z" fill="{H}"/>`,
  },
  spiky: {
    back: `<path d="M120 190 Q116 90 200 86 Q284 90 280 190 L276 214 L130 214 Z" fill="{H}"/>`,
    front: `<path d="M116 176 Q114 104 142 84 L150 58 L172 78 L190 50 L208 76 L230 52 L240 80 L266 64 Q288 104 284 176 Q272 132 200 126 Q128 132 116 176 Z" fill="{H}"/>`,
  },
  buzz: {
    back: ``,
    front: `<path d="M126 164 Q122 90 200 86 Q278 90 274 164 Q262 118 200 112 Q138 118 126 164 Z" fill="{H}"/>`,
  },
  balding: {
    back: ``,
    front: `<path d="M124 214 Q116 160 136 128 L148 132 Q136 170 140 214 Z" fill="{H}"/>
      <path d="M276 214 Q284 160 264 128 L252 132 Q264 170 260 214 Z" fill="{H}"/>`,
  },
  hijab: {
    back: `<path d="M98 210 Q94 66 200 62 Q306 66 302 210 L316 350 Q200 380 84 350 Z" fill="{A}"/>`,
    front: `<path d="M122 176 Q118 90 200 86 Q282 90 278 176 Q268 120 200 112 Q132 120 122 176 Z" fill="{A}"/>
      <path d="M124 176 Q122 250 150 296 Q128 300 116 270 Q106 220 124 176 Z" fill="{A}"/>
      <path d="M276 176 Q278 250 250 296 Q272 300 284 270 Q294 220 276 176 Z" fill="{A}"/>
      <path d="M146 296 Q200 330 254 296 L262 340 Q200 366 138 340 Z" fill="{A}"/>
      <path d="M146 296 Q200 330 254 296" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="4"/>`,
  },
  cap: {
    back: `<path d="M128 150 L140 150 L138 206 Q130 196 128 150 Z" fill="{H}"/><path d="M272 150 L260 150 L262 206 Q270 196 272 150 Z" fill="{H}"/>`,
    front: `<path d="M116 150 Q116 70 200 68 Q284 70 284 150 Z" fill="{A}"/>
      <path d="M116 150 Q200 136 304 146 Q316 150 312 160 Q200 148 110 162 Q106 154 116 150 Z" fill="{A}"/>
      <path d="M116 150 Q200 136 304 146 Q316 150 312 160 Q200 148 110 162 Q106 154 116 150 Z" fill="#000" opacity=".15"/>
      <circle cx="200" cy="72" r="6" fill="#000" opacity=".2"/>`,
  },
}

// {S}=สีเสื้อ {SK}=สีผิวเงา {A}=สีของตกแต่ง {CLIP}=id ของ clipPath
const SHIRT_PATH = 'M40 490 Q46 358 136 316 L264 316 Q358 358 366 490 Z'
const BASE = `<path d="${SHIRT_PATH}" fill="{S}"/>`
const OUTFIT: Record<CharacterSpec['outfit'], string> = {
  crew: BASE + `<path d="M136 316 Q200 342 264 316 Q200 330 136 316 Z" fill="#000" opacity=".12"/>`,
  collar:
    BASE +
    `<path d="M168 316 L200 358 L170 368 L146 328 Z" fill="#fff" opacity=".9"/><path d="M232 316 L200 358 L230 368 L254 328 Z" fill="#fff" opacity=".9"/>`,
  hoodie:
    BASE +
    `<path d="M134 318 Q200 300 266 318 L266 340 Q200 322 134 340 Z" fill="#000" opacity=".22"/>
    <path d="M184 340 L179 412" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".92"/>
    <path d="M216 340 L221 412" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".92"/>
    <circle cx="179" cy="416" r="6.5" fill="#fff" opacity=".92"/><circle cx="221" cy="416" r="6.5" fill="#fff" opacity=".92"/>`,
  vneck:
    BASE +
    `<path d="M178 316 L200 360 L222 316 Z" fill="{SK}"/><path d="M178 316 L200 360 L222 316" fill="none" stroke="#000" stroke-width="4" opacity=".14"/>`,
  turtle:
    BASE +
    `<path d="M156 300 Q200 286 244 300 L244 348 Q200 366 156 348 Z" fill="{S}"/><path d="M156 300 Q200 286 244 300 L244 348 Q200 366 156 348 Z" fill="#fff" opacity=".14"/>`,
  blazer:
    BASE +
    `<path d="M170 316 L200 410 L230 316 Z" fill="#fff"/>
    <path d="M152 318 L200 410 L170 328 Z" fill="#000" opacity=".22"/><path d="M248 318 L200 410 L230 328 Z" fill="#000" opacity=".22"/>
    <path d="M194 332 L200 352 L206 332 Z" fill="{A}"/><path d="M196 350 L200 400 L204 350 Z" fill="{A}"/>`,
  cardigan:
    BASE +
    `<path d="M178 316 L200 360 L222 316 Z" fill="{A}"/>
    <rect x="196" y="360" width="8" height="140" fill="#000" opacity=".12"/>
    <circle cx="200" cy="384" r="5" fill="#fff" opacity=".8"/><circle cx="200" cy="414" r="5" fill="#fff" opacity=".8"/><circle cx="200" cy="444" r="5" fill="#fff" opacity=".8"/>`,
  stripe:
    BASE +
    `<g clip-path="url(#{CLIP})" fill="#fff" opacity=".4"><rect x="30" y="352" width="340" height="14"/><rect x="30" y="384" width="340" height="14"/><rect x="30" y="416" width="340" height="14"/><rect x="30" y="448" width="340" height="14"/></g>
    <path d="M136 316 Q200 342 264 316 Q200 330 136 316 Z" fill="#000" opacity=".12"/>`,
  doctor:
    BASE +
    `<path d="M168 316 L200 400 L232 316 Z" fill="#8FC3E8"/>
    <path d="M152 318 L200 400 L172 330 Z" fill="#000" opacity=".08"/><path d="M248 318 L200 400 L228 330 Z" fill="#000" opacity=".08"/>
    <path d="M162 322 Q150 380 186 396" fill="none" stroke="#4F5A72" stroke-width="5" stroke-linecap="round"/>
    <circle cx="190" cy="398" r="9" fill="#4F5A72"/><circle cx="190" cy="398" r="4" fill="#AEB6C6"/>
    <rect x="236" y="380" width="30" height="8" rx="3" fill="#35A9E8"/>`,
  apron:
    BASE +
    `<path d="M150 360 Q200 344 250 360 L256 490 L144 490 Z" fill="{A}"/><path d="M160 340 L150 360 M240 340 L250 360" stroke="{A}" stroke-width="6"/>`,
}

/** ขนาดตา/ระดับเปลือกตาตามวัย — FlatTutor ใช้คำนวณการกะพริบ */
export function eyeMetrics(c: CharacterSpec) {
  const r = c.kid ? 25 : c.wrinkles ? 19 : 23
  return {
    r,
    pupil: c.kid ? 14 : c.wrinkles ? 10 : 12,
    /** เปลือกตาพักที่ระดับไหน (0 = ตาเปิดกว้าง, 1 = ปิด) */
    lidBase: c.kid ? 0.08 : c.wrinkles ? 0.4 : 0.32,
    /** ขอบบนของตา */
    top: 188 - r,
    /** ระยะที่เปลือกตาต้องเลื่อนจนปิดสนิท */
    travel: r * 2 + 4,
  }
}

/** ประกอบตัวละครเป็น <svg> · uid ต้องไม่ซ้ำในหน้าเดียวกัน (ใช้กับ clipPath) */
export function buildCharacterSvg(c: CharacterSpec, opts: { uid: string; viewBox?: string; background?: boolean }) {
  const [SKIN, SH, BL] = SKINS[c.skin]
  const h = HAIR[c.hair]
  const clip = `clip-${opts.uid}`
  const sub = (s: string) =>
    s.replaceAll('{H}', c.hairColor).replaceAll('{A}', c.accent ?? '#FFC53D').replaceAll('{S}', c.shirtColor).replaceAll('{SK}', SH).replaceAll('{CLIP}', clip)
  const { r: eyeR, pupil } = eyeMetrics(c)

  const glasses = c.glasses
    ? `<g fill="none" stroke="${c.glasses}" stroke-width="5">
        <circle cx="165" cy="188" r="${eyeR + 8}"/><circle cx="235" cy="188" r="${eyeR + 8}"/>
        <path d="M${165 + eyeR + 8} 186 Q200 176 ${235 - eyeR - 8} 186"/>
        <path d="M${165 - eyeR - 8} 184 L126 176"/><path d="M${235 + eyeR + 8} 184 L274 176"/></g>`
    : ''
  const wrinkles = c.wrinkles
    ? `<g fill="none" stroke="${SH}" stroke-width="3.5" stroke-linecap="round">
        <path d="M170 126 q30 -8 60 0"/><path d="M178 138 q22 -6 44 0"/>
        <path d="M150 244 q-8 16 2 30"/><path d="M250 244 q8 16 -2 30"/>
        <path d="M130 196 l-8 -4"/><path d="M270 196 l8 -4"/></g>`
    : ''
  const freckles = c.freckles
    ? `<g fill="${SH}"><circle cx="140" cy="226" r="3"/><circle cx="152" cy="232" r="3"/><circle cx="146" cy="220" r="2.5"/>
        <circle cx="260" cy="226" r="3"/><circle cx="248" cy="232" r="3"/><circle cx="254" cy="220" r="2.5"/></g>`
    : ''
  const beard = c.beard
    ? `<path d="M130 236 Q134 306 200 322 Q266 306 270 236 Q258 290 200 294 Q142 290 130 236 Z" fill="${c.hairColor}"/>
       <path d="M170 256 Q185 244 200 252 Q215 244 230 256 Q215 262 200 256 Q185 262 170 256 Z" fill="${c.hairColor}"/>`
    : ''
  const stubble = c.stubble
    ? `<path d="M134 250 Q138 304 200 316 Q262 304 266 250 Q250 292 200 296 Q150 292 134 250 Z" fill="${c.hairColor}" opacity=".18"/>`
    : ''
  const mustache = c.mustache
    ? `<path d="M166 252 Q184 238 200 248 Q216 238 234 252 Q216 262 200 254 Q184 262 166 252 Z" fill="${c.mustache}"/>`
    : ''
  const earrings = c.earrings
    ? `<circle cx="124" cy="244" r="7" fill="${c.earrings}"/><circle cx="276" cy="244" r="7" fill="${c.earrings}"/>`
    : ''
  // คิ้ว: ฮิญาบคลุมผม สีผมจึงไม่ได้บอกสีคิ้ว
  const browColor = c.hair === 'hijab' ? '#3B2B2B' : c.hairColor

  return `<svg viewBox="${opts.viewBox ?? '40 60 320 384'}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
  <defs><clipPath id="${clip}"><path d="${SHIRT_PATH}"/></clipPath></defs>
  ${opts.background === false ? '' : `<rect x="0" y="0" width="400" height="480" fill="${c.bg}"/>`}
  <g class="neck"><path d="M176 258 L224 258 L246 382 L154 382 Z" fill="${SH}"/></g>
  <g class="body">${sub(OUTFIT[c.outfit])}</g>
  <g class="head">
    ${sub(h.back)}
    <path d="${FACES[c.face]}" fill="${SKIN}"/>
    <ellipse cx="150" cy="232" rx="19" ry="11" fill="${BL}" opacity=".5"/>
    <ellipse cx="250" cy="232" rx="19" ry="11" fill="${BL}" opacity=".5"/>
    ${freckles}${wrinkles}${stubble}${earrings}
    <circle cx="165" cy="188" r="${eyeR}" fill="${WHITE}"/>
    <circle cx="235" cy="188" r="${eyeR}" fill="${WHITE}"/>
    <g class="pupils"><circle cx="167" cy="195" r="${pupil}" fill="${DARK}"/><circle cx="237" cy="195" r="${pupil}" fill="${DARK}"/>
      ${c.kid ? `<circle cx="172" cy="189" r="4" fill="#fff"/><circle cx="242" cy="189" r="4" fill="#fff"/>` : ''}</g>
    <g class="lids" transform="translate(0 ${188 - eyeR + eyeMetrics(c).lidBase * (eyeR * 2 + 4)})">
      <rect x="136" y="-60" width="58" height="60" fill="${SKIN}"/><rect x="206" y="-60" width="58" height="60" fill="${SKIN}"/></g>
    <g class="brows" fill="none" stroke="${browColor}" stroke-width="7" stroke-linecap="round">
      <path d="M146 156 q20 -11 42 -3"/><path d="M212 153 q20 -9 42 3"/></g>
    ${glasses}
    <path d="M200 214 q9 16 -7 19" fill="none" stroke="${SH}" stroke-width="6" stroke-linecap="round"/>
    ${beard}
    <g class="jaw"><g class="mouth" transform="translate(200 262)"><path d="M-17 -2 Q0 12 17 -2" fill="none" stroke="${DARK}" stroke-width="7" stroke-linecap="round"/></g></g>
    ${mustache}
    ${sub(h.front)}
  </g>
</svg>`
}
