// หมายเหตุ: ไม่ใช้ StrictMode เพราะ double-effect ใน dev ทำให้ TTS/STT ใน LessonPlayer ยิงซ้ำ
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(<App />)
