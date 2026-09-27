import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', icon: '🏠', label: 'หน้าหลัก' },
  { to: '/progress', icon: '📊', label: 'สถิติ' },
  { to: '/settings', icon: '⚙️', label: 'ตั้งค่า' },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-bee-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                isActive ? 'text-bee-600' : 'text-gray-400'
              }`
            }
          >
            <span className="text-xl leading-none">{it.icon}</span>
            {it.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
