# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

AI Tutor — PWA ฝึกพูดภาษาอังกฤษส่วนตัว (แรงบันดาลใจจาก BeeSpeaker) ใช้คนเดียว ไม่มี backend ทุกอย่างฟรี
ภาพรวมฟีเจอร์ + วิธีตั้ง Gemini key + วิธี deploy อยู่ใน `app/README.md` แล้ว — ที่นี่เก็บเฉพาะสิ่งที่โค้ดไม่ได้บอกตรง ๆ

## คำสั่ง — ต้องรันใน `app/` เท่านั้น

root ของ repo มีแค่ไฟล์สื่อที่ใช้อ้างอิง (`IMG_1018.MOV` วิดีโอต้นแบบ, `.glb`) โค้ดทั้งหมดอยู่ `app/`

```bash
cd app
npm run dev      # Vite dev server → http://localhost:5173 (default)
npm run build    # tsc -b && vite build
npm run lint     # oxlint (ไม่ใช่ eslint — ไม่มี .eslintrc)
```

- `npm run dev` ไม่ได้ตั้ง port ไว้ใน `vite.config.ts` → ได้ 5173 · ที่ `README.md` กับ permission เก่าอ้าง **5199** เพราะเคยรันด้วย `--port 5199` ถ้าอยากได้ port เดิมต้องใส่เอง
- **ไม่มี test framework** — ยืนยันงานด้วยการเปิด dev server แล้วกดใช้จริง ไม่ใช่รันเทส
- เป็น git repo แล้ว (branch `main`) — ไฟล์ที่ track อยู่ย้อนได้ แต่ไฟล์ untracked ยังหายถาวรถ้าลบ
- ต้องเปิดด้วย **Chrome หรือ Safari** (Web Speech API) · ไมค์บนมือถือต้อง HTTPS, localhost ใช้ได้เฉพาะเครื่องนี้

## ข้อตกลงที่ห้ามพัง

- **ไม่ใส่ `StrictMode`** ใน `main.tsx` — จงใจเอาออก เพราะ double-effect ใน dev ทำให้ TTS/STT ใน `LessonPlayer` ยิงซ้ำ
- **แหล่งเสียงพูดทุกตัวต้องต่อเข้า `getSpeechOutput()`** ของ `services/audio-bus.ts` ไม่ใช่ `ctx.destination` ตรง ๆ — ตัวละคร tutor (`FlatTutor.tsx`) อ่านระดับเสียงจาก AnalyserNode ตัวนั้นไปเลือกรูปปาก ถ้าต่อข้าม ปากจะนิ่งทั้งที่เสียงดัง
- **`pron-rules.ts` เป็น rule-based โดยตั้งใจ** — ไม่ให้ LLM แต่งเคล็ดลับการออกเสียงเอง เพราะโมเดลเล็กมั่ว
- **`matcher.ts` ตรวจคำตอบ drill ในเครื่อง ไม่เรียก LLM** — โหมดบทเรียนต้องใช้ได้โดยไม่มี key
- **throttle ของ `gemini-tts.ts` (เว้น 21 วิ/req, พัก 10 นาทีเมื่อโดน 429) ห้ามถอด** — free tier ~3 req/นาที, ~15 ประโยคใหม่/วัน
- comment ในโค้ดเขียนภาษาไทย — เขียนเพิ่มให้เข้าชุดกัน
- **หน้าแอปมี 2 ภาษา (ไทย/อังกฤษ, setting `uiLang`)** — ข้อความที่ผู้ใช้เห็นทุกตัวต้องเขียนเป็น `tx('ไทย', 'English')` จาก `services/i18n.ts` (คู่ข้อความอยู่ตรงจุดใช้ ไม่มีไฟล์ dictionary) · ที่ตั้งใจไม่แปล: เนื้อหาคอร์ส (`briefTh`, ภารกิจ, บทพูด tutor), เคล็ดลับใน `pron-rules.ts`, prompt ของ AI

## สถาปัตยกรรมที่ต้องรู้ก่อนแก้

**Engine เสียง/สมอง สลับได้จากหน้า Settings — เพิ่มตัวใหม่ต้องแตะหลายที่**

`services/tts.ts` เป็น router ที่ fallback ลงเสียงระบบอย่างเงียบ ๆ เสมอเมื่อ engine ที่เลือกพัง (โควตาหมด/โมเดลยังโหลดไม่เสร็จ) — เพิ่ม TTS engine ใหม่ต้องแก้ครบ: type ใน `store.ts` → สาขาใน `speak()` → `prefetchTTS()` → `stopSpeaking()` → UI ใน `Settings.tsx`
- `device` = speechSynthesis · `local` = Kokoro-82M ONNX ใน Web Worker (โมเดล ~90MB) · `gemini` = cloud
- ฝั่งสมองบทสนทนาแยกกัน: `llmEngine` = `gemini` (`gemini.ts`) หรือ `ollama` (`ollama.ts`, `http://localhost:11434`)

**Gemini model เป็น fallback chain ไม่ใช่ค่าเดียว** — `MODEL_CANDIDATES` ใน `gemini.ts` ไล่ลองจาก `gemini-flash-lite-latest` ลงไป แล้ว cache ตัวที่ใช้ได้ไว้ใน localStorage · **404 เป็นเรื่องปกติไม่ใช่บั๊ก** (key บัญชีใหม่ใช้โมเดลรุ่นเก่าไม่ได้) อย่าแก้เป็น hardcode โมเดลเดียว และให้เก็บ `*-latest` ไว้เพราะทนการปลดระวางที่สุด

**เนื้อหาคอร์สเป็น static JSON** — เพิ่ม/แก้บทเรียนที่ `src/content/course-a2.json` ตาม type ใน `content/schema.ts` (Course → Module → Lesson → Step) ไม่ต้องแตะโค้ด

**state ทั้งหมดอยู่ฝั่ง client ไม่มี server**
- localStorage: `ai-tutor:settings`, `ai-tutor:progress`, `ai-tutor:gemini-model-v2`
- IndexedDB: `ai-tutor-tts` (cache เสียงที่ generate แล้ว key = `<engine>|<voice>|<text>`)
- เพิ่ม field ใน `Settings`/`Progress` ต้องเติมค่าใน `defaultSettings`/`defaultProgress` ด้วยเสมอ — `load()` merge `{...fallback, ...JSON.parse(raw)}` คือ fallback เป็นตัวจ่าย default ให้ข้อมูลเก่า ถ้าไม่เติม field นั้นจะเป็น `undefined` ของผู้ใช้เดิม

**PWA ไม่ precache ไฟล์ใหญ่** — `vite.config.ts` ตั้ง `globIgnores` ไว้สำหรับ `.wasm` (21MB ของ Kokoro) พร้อม limit 4MB ถ้าเอาออกจะ build ไม่ผ่าน/ติดตั้ง PWA ช้ามาก

## ตัวละคร tutor

ตัวเดียวคือ `components/FlatTutor.tsx` (SVG แบน ขยับปาก/หัว/ตา ไม่ใช้ WebGL) — โหมด 3D (VRM/GLB + three.js) **ถอดออกแล้วโดยตั้งใจ** เพราะเบราว์เซอร์ทำคนเหมือนจริงไม่ได้ดี ไฟล์โมเดลเก่าเก็บที่ `design/archive-3d-avatars/` (gitignore) อย่าเอา three.js กลับมาโดยไม่ถาม
- ในรายการ/หัวข้อใช้หน้าการ์ตูนเล็กใน `TutorAvatar.tsx` แทน เพราะหน้าเดียวมีหลายตัว ถ้าใช้ตัวเต็มจะรัน rAF พร้อมกันหลายลูป
- กับดักลำดับการวาด (คิ้ว/เปลือกตา, คอ/เสื้อ) อยู่ในคอมเมนต์หัวไฟล์ `FlatTutor.tsx` และ `design/README.md`
- ตัวละครทั้งหมด (14 ตัว, Mia = ค่าเริ่มต้น) เป็นข้อมูลใน `content/cast.ts` · ตัววาดประกอบชิ้นส่วนอยู่ `components/character.ts`
- **เสียงตามตัวละคร**: แต่ละตัวมี `voice` (Kokoro / Gemini / pitch+rate ของเสียงระบบ) · "ใครพูดอยู่" เป็น state กลางใน `services/speaker.ts` (บทเรียนตั้งเป็น `module.tutorId` ไม่งั้นใช้ tutor ที่เลือก) แทนการส่ง option ผ่าน `speak()` ~15 จุด
  - คิว prefetch ของ local/gemini เก็บ voice ไว้ตอน**เข้าคิว** ไม่ใช่ตอน generate — ถ้าเปลี่ยนเป็นอ่านตอน generate เสียงจะผิดตัวเมื่อออกจากบทเรียนก่อนคิวหมด
  - ค่า `voicePerCharacter` (default true) ทับตัวเลือกเสียงที่ตั้งเองในหน้า Settings · Gemini แยก cache ตามเสียง → ตัวละครหลายตัวกินโควตาฟรีเร็วขึ้น

## หมายเหตุ

TTS ของ browser มีบั๊กที่จัดการไว้แล้วใน `tts.ts` (warm-up ด้วย utterance เงียบ, รอ `voiceschanged`, หน่วง 60ms หลัง `cancel()`, timeout กัน `onend` ไม่ยิงบน iOS) — โค้ดที่ดูเกินจำเป็นตรงนั้นมีเหตุผล อย่าเพิ่ง simplify
