import os

app_dir = r"c:\Users\HP\Desktop\petstack\proximart\frontend-vendor"

main_tsx = """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
"""

app_tsx = """import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'

function Dashboard() {
  return <div className="p-8"><h1>Vendor Dashboard</h1></div>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
"""

login_tsx = """import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      login(res.data.user, res.data.access_token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Vendor Login</CardTitle>
          <CardDescription>Enter your email below to login.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="text-sm text-destructive font-medium">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit">Sign in</Button>
            <div className="text-sm text-center text-muted-foreground">
              Want to become a vendor? <Link to="/signup" className="underline">Apply here</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
"""

signup_tsx = """import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import api from '@/lib/axios'

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', store_name: '', gst_number: '', city: '' })
  const [files, setFiles] = useState<FileList | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const data = new FormData()
    data.append('role', 'vendor')
    Object.entries(formData).forEach(([key, value]) => data.append(key, value))
    
    if (files) {
      Array.from(files).forEach(file => data.append('files', file))
    }

    try {
      await api.post('/auth/signup', data, { headers: { 'Content-Type': 'multipart/form-data' }})
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed')
    }
  }

  if (success) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Application Submitted</CardTitle>
            <CardDescription>Your application is awaiting approval. We will contact you soon.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" asChild><Link to="/login">Go to Login</Link></Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Vendor Application</CardTitle>
          <CardDescription>Apply to become a vendor.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="text-sm text-destructive font-medium">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_name">Store Name</Label>
              <Input id="store_name" required value={formData.store_name} onChange={e => setFormData({...formData, store_name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number</Label>
                <Input id="gst_number" required value={formData.gst_number} onChange={e => setFormData({...formData, gst_number: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documents">Business Documents (PDF/Images)</Label>
              <Input id="documents" type="file" multiple required onChange={e => setFiles(e.target.files)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit">Submit Application</Button>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account? <Link to="/login" className="underline">Login</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
"""

with open(os.path.join(app_dir, "src", "main.tsx"), "w") as f: f.write(main_tsx)
with open(os.path.join(app_dir, "src", "App.tsx"), "w") as f: f.write(app_tsx)
with open(os.path.join(app_dir, "src", "pages", "Login.tsx"), "w") as f: f.write(login_tsx)
with open(os.path.join(app_dir, "src", "pages", "Signup.tsx"), "w") as f: f.write(signup_tsx)
