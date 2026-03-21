import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

const nav = [
  { to: '/kasir',     icon: '🛒', label: 'Kasir' },
  { to: '/produk',    icon: '📦', label: 'Produk' },
  { to: '/pelanggan', icon: '👥', label: 'Pelanggan' },
  { to: '/laporan',   icon: '📊', label: 'Laporan' },
  { to: '/pengaturan',icon: '⚙️',  label: 'Pengaturan' },
]

export function Sidebar() {
  const { user, signOut } = useAuthStore()

  return (
    <aside className="w-56 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary-400" />
          </div>
          <span className="font-semibold text-gray-900 tracking-tight">AgroKas</span>
        </div>
        <p className="text-xs text-gray-400 mt-1 ml-9">POS Toko Pertanian</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-primary-50 text-primary-800 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-800">
            {user?.email?.[0]?.toUpperCase() ?? 'K'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">
              {user?.email ?? 'Kasir'}
            </p>
          </div>
          <button
            onClick={signOut}
            className="text-gray-400 hover:text-red-500 transition-colors text-xs"
            title="Keluar"
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  )
}
