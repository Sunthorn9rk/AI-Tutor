import { NavLink } from 'react-router-dom'
import { tx } from '../services/i18n'

// route เดิมครบทุกตัว — เปลี่ยนแค่หน้าตา
const items = [
  { to: '/', icon: '🏠', th: 'หน้าหลัก', en: 'Home', active: 'bg-aqua-50 text-aqua-600' },
  { to: '/progress', icon: '📊', th: 'สถิติ', en: 'Stats', active: 'bg-tang-50 text-tang-600' },
  { to: '/settings', icon: '⚙️', th: 'ตั้งค่า', en: 'Settings', active: 'bg-grape-50 text-grape-600' },
]

/** แถบล่างลอยมุมโค้ง · เมนูที่เลือกอยู่มีพื้นสีอ่อน + ตัวหนา */
export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)]">
      <div className="mx-auto flex max-w-md gap-1 rounded-card bg-surface p-1.5 shadow-lift">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-tile py-2 text-[11px] font-bold transition active:scale-95 ${
                isActive ? it.active : 'text-navy-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-xl leading-none transition ${isActive ? 'scale-110' : 'opacity-60 grayscale'}`}>
                  {it.icon}
                </span>
                {tx(it.th, it.en)}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
