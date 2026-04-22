import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { adminApi } from "../../api/admin";

interface Props {
  userId: string | null;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const schema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});
type FormData = z.infer<typeof schema>;

export default function RejectModal({ userId, userName, onClose, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectUser(id, reason),
    onSuccess: () => {
      toast.success(`${userName} has been rejected.`);
      reset();
      onSuccess();
      onClose();
    },
    onError: () => {
      toast.error("Failed to reject user. Please try again.");
    },
  });

  const onSubmit = (data: FormData) => {
    if (!userId) return;
    mutation.mutate({ id: userId, reason: data.reason });
  };

  return (
    <Dialog open={!!userId} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Application</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="reason" className="mb-1.5 block text-sm">
              Reason for rejection{" "}
              <span className="text-gray-400 font-normal">(min 10 chars)</span>
            </Label>
            <Textarea
              id="reason"
              rows={4}
              placeholder="e.g. License number is invalid or expired..."
              {...register("reason")}
              className={errors.reason ? "border-red-400" : ""}
            />
            {errors.reason && (
              <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
