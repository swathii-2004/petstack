import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow, parseISO, differenceInHours, format } from "date-fns";
import { adminApi } from "../../api/admin";
import { PendingUser } from "../../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";
import DocumentViewerModal from "../../components/approvals/DocumentViewerModal";
import RejectModal from "../../components/approvals/RejectModal";
import { FileText, CheckCircle, XCircle } from "lucide-react";

function PendingList({ role }: { role: "vet" | "seller" }) {
  const qc = useQueryClient();
  const [viewDoc, setViewDoc] = useState<PendingUser | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [approveTarget, setApproveTarget] = useState<PendingUser | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["pending", role],
    queryFn: () => adminApi.getPendingApplications(role),
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => adminApi.approveUser(userId),
    onSuccess: () => {
      toast.success("Identity verified. Clearance granted.");
      setApproveTarget(null);
      qc.invalidateQueries({ queryKey: ["pending", role] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: () => toast.error("Failed to approve user."),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["pending", role] });
    qc.invalidateQueries({ queryKey: ["analytics"] });
  };

  if (isLoading)
    return (
      <div className="space-y-4 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-ad-card border border-ad-border rounded-xl animate-pulse" />
        ))}
      </div>
    );

  if (isError)
    return <div className="mt-6 rounded-xl border border-ad-danger/50 bg-ad-danger/10 px-4 py-3 text-sm text-ad-danger font-mono">&gt; ERROR: Unable to retrieve pending applications.</div>;

  if (!data || data.length === 0)
    return (
      <div className="mt-12 flex flex-col items-center justify-center p-8 border border-dashed border-ad-border rounded-xl bg-ad-card/50 text-center text-ad-text-dim">
        <CheckCircle className="w-10 h-10 mb-3 text-ad-success" />
        <p className="font-mono text-sm tracking-widest uppercase">&gt; ALL QUEUES CLEAR. NO PENDING APPLICATIONS.</p>
      </div>
    );

  return (
    <div className="space-y-4 mt-6">
      {data.map((user) => {
        const hrs = differenceInHours(new Date(), parseISO(user.created_at));
        const borderClass = hrs > 72 ? "border-l-ad-danger border-ad-danger/30 shadow-[0_0_15px_rgba(225,29,72,0.15)]" : hrs > 48 ? "border-l-amber-500 border-amber-500/30" : "border-l-ad-accent border-ad-border";
        const accentClass = hrs > 72 ? "text-ad-danger" : hrs > 48 ? "text-amber-500" : "text-ad-accent";

        return (
          <div key={user.id} className={`bg-ad-card border rounded-xl overflow-hidden ${borderClass} border-l-[4px]`}>
            <div className="p-5 flex items-start justify-between gap-6 flex-wrap">
              <div className="flex-1 min-w-[300px]">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-[16px] text-white tracking-tight">{user.full_name || user.name}</h3>
                  <span className={`text-[9px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-black border ${hrs > 72 ? 'border-ad-danger/50 text-ad-danger' : 'border-white/10 text-ad-text-dim'}`}>
                    ID: {user.id.slice(0,8)}
                  </span>
                </div>
                
                <p className="text-[13px] text-ad-text-dim font-mono mb-3">{user.email}</p>
                
                <div className="bg-[#09090B] border border-white/5 rounded-lg p-3 inline-block">
                  {role === "vet" && (
                    <div className="flex flex-col gap-1 text-[12px] font-mono text-ad-text-dim">
                      <span className="text-white">License: <span className="text-ad-accent">{user.license_number ?? "—"}</span></span>
                      <span>Specialisation: {user.specialisation ?? "—"}</span>
                      <span>Clinic: {user.clinic_name ?? "—"}</span>
                    </div>
                  )}
                  {role === "seller" && (
                    <div className="flex flex-col gap-1 text-[12px] font-mono text-ad-text-dim">
                      <span className="text-white">Business: <span className="text-ad-accent">{user.business_name ?? "—"}</span></span>
                      <span>GST: {user.gst_number ?? "—"}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-[11px] font-mono text-ad-text-dim/60">
                  <span className="uppercase tracking-widest">Submitted:</span> {format(parseISO(user.created_at), "MMM d, yyyy HH:mm")} ·{" "}
                  <span className={`${accentClass} font-bold`}>
                    {formatDistanceToNow(parseISO(user.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 min-w-[140px]">
                <button 
                  onClick={() => setViewDoc(user)} 
                  className="flex items-center justify-center gap-2 w-full py-2 bg-[#09090B] border border-ad-border rounded-lg text-white hover:border-ad-accent/50 hover:text-ad-accent text-[12px] font-bold tracking-wide transition-all"
                >
                  <FileText className="w-4 h-4" /> VIEW FILES
                </button>
                <button 
                  onClick={() => setApproveTarget(user)}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-ad-success/10 border border-ad-success/30 rounded-lg text-ad-success hover:bg-ad-success hover:text-black text-[12px] font-bold tracking-wide transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                >
                  <CheckCircle className="w-4 h-4" /> APPROVE
                </button>
                <button 
                  onClick={() => setRejectTarget({ id: user.id, name: user.full_name || user.name || "" })}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-ad-danger/10 border border-ad-danger/30 rounded-lg text-ad-danger hover:bg-ad-danger hover:text-white text-[12px] font-bold tracking-wide transition-all"
                >
                  <XCircle className="w-4 h-4" /> REJECT
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <DocumentViewerModal user={viewDoc} onClose={() => setViewDoc(null)} />
      <RejectModal userId={rejectTarget?.id ?? null} userName={rejectTarget?.name ?? ""} onClose={() => setRejectTarget(null)} onSuccess={refresh} />

      <Dialog open={!!approveTarget} onOpenChange={() => setApproveTarget(null)}>
        <DialogContent className="bg-ad-card border border-ad-border max-w-sm p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white mb-2">Confirm Clearance</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-ad-text-dim mb-6">
            Are you sure you want to grant access to <span className="text-white font-bold">{approveTarget?.full_name || approveTarget?.name}</span>? They will be authorized immediately.
          </p>
          <DialogFooter className="gap-3">
            <button 
              onClick={() => setApproveTarget(null)}
              className="px-4 py-2 bg-transparent text-white border border-ad-border hover:bg-white/5 rounded-xl text-sm font-bold transition-all"
            >
              CANCEL
            </button>
            <button 
              disabled={approveMutation.isPending} 
              onClick={() => approveTarget && approveMutation.mutate(approveTarget.id)}
              className="px-4 py-2 bg-ad-success text-black border border-ad-success hover:bg-ad-success/90 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50"
            >
              {approveMutation.isPending ? "PROCESSING..." : "CONFIRM APPROVAL"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ApprovalsPage() {
  return (
    <div className="max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Security Clearances</h2>
        <p className="text-ad-text-dim text-sm mt-1 font-mono tracking-wider uppercase mb-8">
          &gt; Review and authorize pending merchant and practitioner applications.
        </p>
      </div>

      <Tabs defaultValue="vet" className="w-full">
        <TabsList className="bg-[#09090B] border border-ad-border p-1 rounded-xl w-full max-w-md h-12">
          <TabsTrigger 
            value="vet" 
            className="w-full text-sm font-bold data-[state=active]:bg-ad-card data-[state=active]:text-white text-ad-text-dim rounded-lg transition-all"
          >
            Veterinarians
          </TabsTrigger>
          <TabsTrigger 
            value="seller" 
            className="w-full text-sm font-bold data-[state=active]:bg-ad-card data-[state=active]:text-white text-ad-text-dim rounded-lg transition-all"
          >
            Sellers
          </TabsTrigger>
        </TabsList>
        <TabsContent value="vet" className="mt-2"><PendingList role="vet" /></TabsContent>
        <TabsContent value="seller" className="mt-2"><PendingList role="seller" /></TabsContent>
      </Tabs>
    </div>
  );
}
