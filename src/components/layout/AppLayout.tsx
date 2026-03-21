import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '@/components/ui/Toast'

export function AppLayout() {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F8F8F6' }}>
      <Sidebar />
      <main className="flex-1 ml-52 min-h-screen">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  )
}
