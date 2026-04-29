import os

app_dir = r"c:\Users\HP\Desktop\petstack\proximart\frontend-admin"

app_tsx = """import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import { AdminLayout } from './components/AdminLayout'
import PendingApprovals from './pages/PendingApprovals'
import Users from './pages/Users'
import Analytics from './pages/Analytics'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Navigate to="/analytics" replace />} />
            <Route path="/pending" element={<PendingApprovals />} />
            <Route path="/users" element={<Users />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
"""

admin_layout_tsx = """import { Link, Outlet, useLocation } from 'react-router-dom'
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
"""

analytics_tsx = """import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Store, Clock } from 'lucide-react'
import api from '@/lib/axios'

export default function Analytics() {
  const [stats, setStats] = useState<any>(null)
  
  useEffect(() => {
    api.get('/admin/analytics/overview').then(res => setStats(res.data)).catch(console.error)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome back to the admin portal.</p>
      </div>

      {stats ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_vendors}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_approvals}</div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div>Loading stats...</div>
      )}
    </div>
  )
}
"""

pending_tsx = """import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import api from '@/lib/axios'

export default function PendingApprovals() {
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [rejectReason, setRejectReason] = useState('')
  const [rejectId, setRejectId] = useState<string | null>(null)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/pending?role=vendor')
      setPending(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this vendor?')) return
    try {
      await api.post(`/admin/approve/${id}`)
      fetchPending()
    } catch (err) {
      console.error(err)
      alert('Failed to approve')
    }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectId || !rejectReason) return
    try {
      await api.post(`/admin/reject/${rejectId}`, { reason: rejectReason })
      setRejectId(null)
      setRejectReason('')
      fetchPending()
    } catch (err) {
      console.error(err)
      alert('Failed to reject')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Pending Approvals</h2>
        <p className="text-muted-foreground">Review vendor applications and documents.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
             <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : pending.length === 0 ? (
             <div className="p-8 text-center text-muted-foreground">No pending approvals found.</div>
          ) : (
            <div className="divide-y">
              {pending.map((item: any) => (
                <div key={item.user.id} className="p-6 flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{item.profile.store_name}</h4>
                    <p className="text-sm text-muted-foreground">Owner: {item.user.name} ({item.user.email})</p>
                    <p className="text-sm text-muted-foreground">Phone: {item.user.phone} | City: {item.profile.city}</p>
                    <p className="text-sm font-mono mt-2 bg-muted inline-block px-2 py-1 rounded">GST: {item.profile.gst_number}</p>
                    <div className="mt-4">
                      <Button variant="outline" size="sm" onClick={() => setSelectedDocs(item.profile.doc_urls || [])}>
                        View Documents ({item.profile.doc_urls?.length || 0})
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleApprove(item.user.id)} className="bg-green-600 hover:bg-green-700">Approve</Button>
                    <Button variant="destructive" onClick={() => setRejectId(item.user.id)}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject Application</CardTitle>
            </CardHeader>
            <form onSubmit={handleReject}>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason for rejection</label>
                  <Input required value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="E.g., Invalid GST number" />
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setRejectId(null); setRejectReason('') }}>Cancel</Button>
                <Button type="submit" variant="destructive">Submit Rejection</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Docs Modal */}
      {selectedDocs.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-8">
          <div className="w-full max-w-4xl bg-background rounded-lg flex flex-col max-h-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Documents</h3>
              <Button variant="ghost" onClick={() => setSelectedDocs([])}>Close</Button>
            </div>
            <div className="p-4 overflow-auto flex-1 space-y-4">
              {selectedDocs.map((url, i) => (
                <div key={i} className="border p-2 rounded">
                  <a href={url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline mb-2 block">Open original file</a>
                  <img src={url} alt="Document" className="max-w-full h-auto" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
"""

users_tsx = """import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/lib/axios'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await api.put(`/admin/users/${id}/status`, { status: newStatus })
      fetchUsers()
    } catch (err) {
      alert('Failed to update status')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      fetchUsers()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">Manage all platform users and vendors.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium">{u.name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4 capitalize">{u.role}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        u.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {u.status === 'active' ? (
                        <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(u.id, 'inactive')}>Deactivate</Button>
                      ) : u.status === 'inactive' ? (
                        <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(u.id, 'active')}>Reactivate</Button>
                      ) : null}
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(u.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
"""

with open(os.path.join(app_dir, "src", "App.tsx"), "w") as f: f.write(app_tsx)
with open(os.path.join(app_dir, "src", "components", "AdminLayout.tsx"), "w") as f: f.write(admin_layout_tsx)
with open(os.path.join(app_dir, "src", "pages", "Analytics.tsx"), "w") as f: f.write(analytics_tsx)
with open(os.path.join(app_dir, "src", "pages", "PendingApprovals.tsx"), "w") as f: f.write(pending_tsx)
with open(os.path.join(app_dir, "src", "pages", "Users.tsx"), "w") as f: f.write(users_tsx)

print("Admin UI files created.")
