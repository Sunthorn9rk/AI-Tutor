# AI Tutor 🐝 — แอปฝึกพูดภาษาอังกฤษส่วนตัว

แอปฝึกพูดภาษาอังกฤษกับ AI tutor (แรงบันดาลใจจาก BeeSpeaker) — เป็น PWA ใช้บนมือถือได้ ทุกอย่างฟรี

## ฟีเจอร์

| โหมด | รายละเอียด | ต้องใช้เน็ต/key? |
|---|---|---|
| 📖 **Lesson Drill** | Speak now / Repeat by ear / Translate now + ตรวจการออกเสียง + feedback | ❌ ไม่ต้องมี key (ฟังเสียงในเครื่อง) |
| 🎬 **Scene Role-play** | แชทพูดตามสถานการณ์ (นัดเพื่อน, ดูหนัง, สัมภาษณ์งาน) + ภารกิจ 0/4 | ✅ Gemini API key (ฟรี) |
| 🗣️ **Free talk** | คุยเปิดกับ tutor + แก้ประโยคผิดให้ | ✅ Gemini API key (ฟรี) |
| ⚡ **Streak + สถิติ** | streak รายวัน, ปฏิทิน, คำที่ฝึกพูด | ❌ |

## วิธีรัน (dev)

```bash
cd app
npm install
npm run dev
```

เปิด http://localhost:5199 (หรือ port ที่ Vite แจ้ง) — **ต้องใช้ Chrome หรือ Safari** (ใช้ Web Speech API)

## ตั้งค่า Gemini API key (ฟรี — ใช้กับโหมดแชทเท่านั้น)

1. ไปที่ https://aistudio.google.com/apikey แล้วกด **Create API key**
2. ในแอป → หน้า **ตั้งค่า** → วาง key ในช่อง Gemini API key
3. key เก็บใน localStorage ของเครื่องตัวเองเท่านั้น

## Deploy ขึ้นมือถือ (จำเป็นสำหรับใช้ไมค์บน iPhone)

ไมโครโฟน/รู้จำเสียงต้องรันผ่าน **HTTPS** — deploy ฟรีได้เช่น:

```bash
npm run build        # ได้โฟลเดอร์ dist/
npx vercel deploy    # หรือลาก dist/ ขึ้น Netlify Drop / GitHub Pages
```

จากนั้นเปิด URL บน iPhone Safari → Share → **Add to Home Screen** จะได้ไอคอนแอปเหมือนแอปจริง (PWA)

## โครงสร้างโค้ด

```
src/
├── screens/        # Onboarding, Home, LessonPlayer, ScenePlayer, FreeTalk, Progress, Settings
├── components/     # TutorAvatar (SVG ปากขยับ), ExerciseCard, ChatBubble, MicButton ฯลฯ
├── services/
│   ├── stt.ts      # รู้จำเสียง (Web Speech API — ฟรี)
│   ├── tts.ts      # เสียง tutor (speechSynthesis — ฟรี) + 3 ระดับความเร็ว
│   ├── matcher.ts  # ตรวจคำตอบ drill ในเครื่อง (fuzzy match ไม่ใช้ LLM)
│   ├── gemini.ts   # Scene/Free talk/แปล ผ่าน Gemini free tier
│   └── store.ts    # settings + progress + streak ใน localStorage
└── content/
    └── course-a2.json  # คอร์ส A2: 3 modules × 3 lessons + 4 scenes (แก้/เพิ่มเองได้เลย)
```

## เพิ่มบทเรียนเอง

แก้ `src/content/course-a2.json` — step มี 4 แบบ:

- `tutor_say` — tutor พูด + ซับไทย (ไปต่ออัตโนมัติ)
- `speak` — โชว์ EN+TH ให้พูดตาม
- `repeat_by_ear` — ฟังแล้วพูดซ้ำ (โชว์แค่ช่องว่าง)
- `translate` — โชว์ไทย ให้พูดเป็นอังกฤษ

Scene เพิ่มใน `scenes` (กำหนด `persona`, `opening`, `tasks` ได้อิสระ) แล้วผูกกับ module ผ่าน `sceneId` หรือเข้าตรงผ่าน URL `#/scene/<id>`
