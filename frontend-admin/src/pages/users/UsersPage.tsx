import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { adminApi } from "../../api/admin";
import { User } from "../../types";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";

type StatusColor = { bg: string; text: string };
const statusStyles: Record<string, StatusColor> = {
  active:      { bg: "bg-green-100 dark:bg-green-900", text: "text-green-700 dark:text-green-300" },
  pending:     { bg: "bg-amber-100 dark:bg-amber-900", text: "text-amber-700 dark:text-amber-300" },
  rejected:    { bg: "bg-red-100 dark:bg-red-900",     text: "text-red-700 dark:text-red-300" },
  deactivated: { bg: "bg-gray-100 dark:bg-gray-800",   text: "text-gray-500 dark:text-gray-400" },
};

function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] ?? statusStyles.deactivated;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${s.bg} ${s.text}`}>
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

  // Debounce search
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
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Users</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage all platform users.</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="vet">Vet</SelectItem>
            <SelectItem value="seller">Seller</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {[1,2,3,4,5,6].map((j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.items.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-gray-500">{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell><StatusBadge status={user.status} /></TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {(user as any).created_at ? format(parseISO((user as any).created_at), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.status === "active" || user.status === "pending" ? (
                        <Button
                          size="sm" variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setConfirm({ userId: user.id, userName: user.name, action: "deactivate" })}
                        >
                          Deactivate
                        </Button>
                      ) : user.status === "deactivated" ? (
                        <Button
                          size="sm" variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => setConfirm({ userId: user.id, userName: user.name, action: "reactivate" })}
                        >
                          Reactivate
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p} size="sm"
              variant={p === page ? "default" : "outline"}
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={!!confirm} onOpenChange={() => setConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="capitalize">{confirm?.action} User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to <strong>{confirm?.action}</strong>{" "}
            <span className="font-semibold">{confirm?.userName}</span>?
          </p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              variant={confirm?.action === "deactivate" ? "destructive" : "default"}
              disabled={isPending}
              onClick={handleConfirm}
            >
              {isPending ? "Processing..." : `Yes, ${confirm?.action}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
