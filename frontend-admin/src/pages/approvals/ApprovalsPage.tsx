import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow, parseISO, differenceInHours, format } from "date-fns";
import { adminApi } from "../../api/admin";
import { PendingUser } from "../../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
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
      toast.success("User approved successfully.");
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
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}><CardContent className="p-4 space-y-2">
            <Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-64" /><Skeleton className="h-4 w-32" />
          </CardContent></Card>
        ))}
      </div>
    );

  if (isError)
    return <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">Failed to load pending applications.</div>;

  if (!data || data.length === 0)
    return (
      <div className="mt-8 text-center text-gray-400">
        <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-300" />
        <p className="font-medium">All clear — no pending {role} applications.</p>
      </div>
    );

  return (
    <div className="space-y-3 mt-4">
      {data.map((user) => {
        const hrs = differenceInHours(new Date(), parseISO(user.created_at));
        const border = hrs > 72 ? "border-l-red-500" : hrs > 48 ? "border-l-amber-400" : "border-l-gray-200";
        return (
          <Card key={user.id} className={`border-l-4 ${border}`}>
            <CardContent className="p-4 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{user.full_name || user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                {role === "vet" && <p className="text-xs text-gray-400 mt-1">License: {user.license_number ?? "—"} · {user.specialisation ?? "—"} · {user.clinic_name ?? "—"}</p>}
                {role === "seller" && <p className="text-xs text-gray-400 mt-1">Business: {user.business_name ?? "—"} · GST: {user.gst_number ?? "—"}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  Submitted: {format(parseISO(user.created_at), "MMM d, yyyy")} ·{" "}
                  <span className={hrs > 72 ? "text-red-500 font-medium" : hrs > 48 ? "text-amber-500 font-medium" : ""}>
                    {formatDistanceToNow(parseISO(user.created_at), { addSuffix: true })}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setViewDoc(user)} className="gap-1.5"><FileText className="w-4 h-4" />View Documents</Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5" onClick={() => setApproveTarget(user)}><CheckCircle className="w-4 h-4" />Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => setRejectTarget({ id: user.id, name: user.full_name || user.name || "" })} className="gap-1.5"><XCircle className="w-4 h-4" />Reject</Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <DocumentViewerModal user={viewDoc} onClose={() => setViewDoc(null)} />
      <RejectModal userId={rejectTarget?.id ?? null} userName={rejectTarget?.name ?? ""} onClose={() => setRejectTarget(null)} onSuccess={refresh} />

      <Dialog open={!!approveTarget} onOpenChange={() => setApproveTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Approve Application</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to approve <span className="font-semibold">{approveTarget?.full_name || approveTarget?.name}</span>? They will be able to log in immediately.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setApproveTarget(null)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={approveMutation.isPending} onClick={() => approveTarget && approveMutation.mutate(approveTarget.id)}>
              {approveMutation.isPending ? "Approving..." : "Yes, Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ApprovalsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Pending Approvals</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Review and approve or reject vet and seller applications.</p>
      <Tabs defaultValue="vet">
        <TabsList className="mb-2">
          <TabsTrigger value="vet">Pending Vets</TabsTrigger>
          <TabsTrigger value="seller">Pending Sellers</TabsTrigger>
        </TabsList>
        <TabsContent value="vet"><PendingList role="vet" /></TabsContent>
        <TabsContent value="seller"><PendingList role="seller" /></TabsContent>
      </Tabs>
    </div>
  );
}
