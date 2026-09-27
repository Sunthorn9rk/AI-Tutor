import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { getSettings } from './services/store'
import { ensureLocalTTS } from './services/local-tts'
import Onboarding from './screens/Onboarding'
import Home from './screens/Home'
import LessonPlayer from './screens/LessonPlayer'
import LessonComplete from './screens/LessonComplete'
import ScenePlayer from './screens/ScenePlayer'
import FreeTalk from './screens/FreeTalk'
import Progress from './screens/Progress'
import Settings from './screens/Settings'

function RequireOnboarded({ children }: { children: React.ReactNode }) {
  if (!getSettings().onboarded) return <Navigate to="/onboarding" replace />
  return children
}

export default function App() {
  // ใช้เสียง AI ในเครื่องอยู่ → โหลดโมเดลตั้งแต่เปิดแอป (มี cache แล้วโหลดเร็ว) จะได้พร้อมก่อนเข้าบทเรียน
  useEffect(() => {
    if (getSettings().ttsEngine === 'local') void ensureLocalTTS()
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route
          path="/"
          element={
            <RequireOnboarded>
              <Home />
            </RequireOnboarded>
          }
        />
        <Route path="/lesson/:lessonId" element={<LessonPlayer />} />
        <Route path="/lesson-complete" element={<LessonComplete />} />
        <Route path="/scene/:sceneId" element={<ScenePlayer />} />
        <Route path="/freetalk" element={<FreeTalk />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
