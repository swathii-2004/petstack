import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Users, FileCheck, BarChart3, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/axios'

export function AdminLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.error(err)
    } finally {
      logout()
    }
  }

  const navItems = [
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Pending Approvals', href: '/pending', icon: FileCheck },
    { name: 'User Management', href: '/users', icon: Users },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-muted/40">
      <aside className="w-64 bg-background border-r flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold tracking-tight">ProxiMart Admin</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
