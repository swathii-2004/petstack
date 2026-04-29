import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
