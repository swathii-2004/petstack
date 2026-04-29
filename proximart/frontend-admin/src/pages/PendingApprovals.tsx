import { useEffect, useState } from 'react'
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
