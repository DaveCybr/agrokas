import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121 0 2.032-.696 2.032-1.571l1.219-8.032A1.5 1.5 0 0 0 20.43 4.5H6.25L5.856 2.773A1.5 1.5 0 0 0 4.385 1.5H2.25" />
      <circle cx="9" cy="20.25" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20.25" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m-3-3h6M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function ChartBarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}

function CogIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
    </svg>
  )
}

function LeafLogo() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
      <path d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 0-8.862 12.872M12.75 3.031a9 9 0 0 1 6.69 14.036l-.776-.518a1.875 1.875 0 0 0-1.664-.199L14.125 17.6a2.25 2.25 0 0 0-1.197 1.194l-.415.831a1.125 1.125 0 0 1-1.013.628h-.416" />
    </svg>
  )
}

const nav = [
  { to: '/kasir',      Icon: CartIcon,     label: 'Kasir' },
  { to: '/produk',     Icon: BoxIcon,      label: 'Produk' },
  { to: '/pelanggan',  Icon: UsersIcon,    label: 'Pelanggan' },
  { to: '/supplier',   Icon: TruckIcon,    label: 'Supplier' },
  { to: '/transaksi',  Icon: ReceiptIcon,  label: 'Transaksi' },
  { to: '/laporan',    Icon: ChartBarIcon, label: 'Laporan' },
  { to: '/pengaturan', Icon: CogIcon,      label: 'Pengaturan' },
]

export function Sidebar() {
  const { user, signOut } = useAuthStore()
  const initials = user?.email?.[0]?.toUpperCase() ?? 'K'

  return (
    <aside
      className="w-52 h-screen bg-white flex flex-col fixed left-0 top-0 z-30"
      style={{ borderRight: '1px solid #E8E6E0' }}
    >
      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#3B6D11' }}
          >
            <LeafLogo />
          </div>
          <div>
            <span className="font-bold text-sm leading-none block" style={{ color: '#1A1A18' }}>
              AgroKas
            </span>
            <span className="text-[10px] leading-none mt-0.5 block" style={{ color: '#9B9890' }}>
              v1.0
            </span>
          </div>
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: '#E8E6E0' }} />

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-2.5 py-2 pr-3 pl-[10px] rounded-lg text-sm font-semibold border-l-2 transition-all duration-150'
                : 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-gray-50'
            }
            style={({ isActive }) =>
              isActive
                ? { backgroundColor: '#EAF3DE', color: '#3B6D11', borderLeftColor: '#3B6D11' }
                : { color: '#6B6963' }
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ height: '1px', backgroundColor: '#E8E6E0' }} />

      {/* User */}
      <div className="p-3">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg" style={{ backgroundColor: '#F8F8F6' }}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{ backgroundColor: '#EAF3DE', color: '#3B6D11' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: '#1A1A18' }}>
              {user?.email ?? 'Kasir'}
            </p>
          </div>
          <button
            onClick={signOut}
            className="p-1 rounded-md transition-colors hover:bg-red-50"
            style={{ color: '#9B9890' }}
            title="Keluar"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </aside>
  )
}
