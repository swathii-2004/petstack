import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { adminApi } from "../../api/admin";
import { User } from "../../types";
import { Input } from "../../components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";

type StatusColor = { bg: string; text: string; border: string };
const statusStyles: Record<string, StatusColor> = {
  active:      { bg: "bg-ad-success/10", text: "text-ad-success", border: "border-ad-success/20" },
  pending:     { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
  rejected:    { bg: "bg-ad-danger/10", text: "text-ad-danger", border: "border-ad-danger/20" },
  deactivated: { bg: "bg-white/5", text: "text-ad-text-dim", border: "border-white/10" },
};

function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] ?? statusStyles.deactivated;
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border ${s.bg} ${s.text} ${s.border}`}>
      {status}
    </span>
  );
}

type ConfirmAction = { userId: string; userName: string; action: "deactivate" | "reactivate" } | null;

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["users", debouncedSearch, role, page],
    queryFn: () => adminApi.getUsers({
      search: debouncedSearch || undefined,
      role: role !== "all" ? role : undefined,
      page,
    }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => adminApi.deactivateUser(id),
    onSuccess: () => { toast.success("User deactivated."); qc.invalidateQueries({ queryKey: ["users"] }); setConfirm(null); },
    onError: () => toast.error("Failed to deactivate user."),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => adminApi.reactivateUser(id),
    onSuccess: () => { toast.success("User reactivated."); qc.invalidateQueries({ queryKey: ["users"] }); setConfirm(null); },
    onError: () => toast.error("Failed to reactivate user."),
  });

  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.action === "deactivate") deactivateMutation.mutate(confirm.userId);
    else reactivateMutation.mutate(confirm.userId);
  };

  const isPending = deactivateMutation.isPending || reactivateMutation.isPending;
  const totalPages = data?.pages ?? 1;

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Identity Registry</h2>
        <p className="text-ad-text-dim text-sm mt-1 font-mono tracking-wider uppercase">
          &gt; Global user database access and management.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 bg-ad-card border border-ad-border p-4 rounded-xl shadow-lg">
        <input
          type="text"
          placeholder="SEARCH IDENTITY (NAME / EMAIL)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[250px] bg-[#000000] border border-ad-border rounded-lg px-4 py-2 text-[13px] font-mono text-white placeholder:text-ad-text-dim/50 focus:outline-none focus:border-ad-accent focus:ring-1 focus:ring-ad-accent transition-all"
        />
        <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
          <SelectTrigger className="w-[200px] bg-[#000000] border-ad-border text-white font-mono text-[13px]">
            <SelectValue placeholder="ALL CLEARANCES" />
          </SelectTrigger>
          <SelectContent className="bg-[#09090B] border-ad-border text-white font-mono">
            <SelectItem value="all">ALL CLEARANCES</SelectItem>
            <SelectItem value="user">USER (BASIC)</SelectItem>
            <SelectItem value="vet">VETERINARIAN</SelectItem>
            <SelectItem value="seller">SELLER (MERCHANT)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-ad-border overflow-hidden bg-ad-card shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="bg-[#09090B] border-b border-ad-border text-ad-text-dim font-mono tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase">Subject ID & Name</th>
                <th className="px-6 py-4 font-semibold uppercase">Email (Comm Link)</th>
                <th className="px-6 py-4 font-semibold uppercase">Role</th>
                <th className="px-6 py-4 font-semibold uppercase">Status</th>
                <th className="px-6 py-4 font-semibold uppercase">Date Acquired</th>
                <th className="px-6 py-4 font-semibold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ad-border">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[1,2,3,4,5,6].map((j) => (
                        <td key={j} className="px-6 py-5"><div className="h-4 bg-white/5 rounded-md w-full" /></td>
                      ))}
                    </tr>
                  ))
                : data?.items.map((user: User) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white tracking-wide">{user.name}</div>
                        <div className="text-[10px] font-mono text-ad-text-dim mt-0.5">ID: {user.id.slice(0,10)}</div>
                      </td>
                      <td className="px-6 py-4 text-ad-text-dim font-mono">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-mono uppercase tracking-widest ${user.role === 'admin' ? 'text-ad-neon font-bold' : 'text-ad-text-dim'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                      <td className="px-6 py-4 text-ad-text-dim font-mono text-[12px]">
                        {(user as any).created_at ? format(parseISO((user as any).created_at), "yyyy-MM-dd") : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.status === "active" || user.status === "pending" ? (
                          <button
                            onClick={() => setConfirm({ userId: user.id, userName: user.name, action: "deactivate" })}
                            className="px-3 py-1.5 border border-ad-danger/50 text-ad-danger rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-ad-danger hover:text-white transition-all shadow-[0_0_10px_rgba(225,29,72,0.1)] hover:shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                          >
                            REVOKE
                          </button>
                        ) : user.status === "deactivated" ? (
                          <button
                            onClick={() => setConfirm({ userId: user.id, userName: user.name, action: "reactivate" })}
                            className="px-3 py-1.5 border border-ad-success/50 text-ad-success rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-ad-success hover:text-black transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          >
                            RESTORE
                          </button>
                        ) : (
                          <span className="text-ad-text-dim/30 font-mono text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button 
            disabled={page === 1} 
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border border-ad-border rounded-lg text-ad-text-dim hover:text-white hover:border-white disabled:opacity-30 text-xs font-mono font-bold"
          >
            &lt; PREV
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-mono font-bold transition-all ${
                p === page ? "bg-ad-accent text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]" : "border border-ad-border text-ad-text-dim hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border border-ad-border rounded-lg text-ad-text-dim hover:text-white hover:border-white disabled:opacity-30 text-xs font-mono font-bold"
          >
            NEXT &gt;
          </button>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={!!confirm} onOpenChange={() => setConfirm(null)}>
        <DialogContent className="bg-ad-card border border-ad-border max-w-sm p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white uppercase tracking-wider mb-2">
              Confirm {confirm?.action}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-ad-text-dim mb-6 font-mono">
            &gt; You are about to <span className={confirm?.action === "deactivate" ? "text-ad-danger" : "text-ad-success"}>{confirm?.action}</span> user identity 
            <br/><br/>
            [<span className="text-white font-bold">{confirm?.userName}</span>]
            <br/><br/>
            &gt; Proceed?
          </p>
          <DialogFooter className="gap-3">
            <button 
              onClick={() => setConfirm(null)}
              className="px-4 py-2 bg-transparent text-white border border-ad-border hover:bg-white/5 rounded-xl text-sm font-bold transition-all uppercase"
            >
              Cancel
            </button>
            <button
              disabled={isPending}
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all uppercase shadow-lg disabled:opacity-50 ${
                confirm?.action === "deactivate" 
                  ? "bg-ad-danger text-white border border-ad-danger hover:bg-ad-danger/90 shadow-[0_0_15px_rgba(225,29,72,0.4)]" 
                  : "bg-ad-success text-black border border-ad-success hover:bg-ad-success/90 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              }`}
            >
              {isPending ? "Executing..." : `Confirm ${confirm?.action}`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
