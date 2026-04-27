import { useState } from "react";
import { PendingUser } from "../../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

interface Props {
  user: PendingUser | null;
  onClose: () => void;
}

const CHECKLIST = [
  "Identity matched and verified",
  "Documentation appears un-tampered",
  "Certification is active and valid",
  "Clearance granted",
];

export default function DocumentViewerModal({ user, onClose }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (item: string) =>
    setChecked((prev) => ({ ...prev, [item]: !prev[item] }));

  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-ad-card border border-ad-border p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <DialogHeader className="p-6 border-b border-ad-border bg-[#09090B]">
          <DialogTitle className="text-xl font-bold text-white tracking-tight flex items-center justify-between">
            <span>
              Subject File: <span className="text-ad-accent">{user.full_name || user.name}</span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-ad-text-dim px-2 py-1 border border-ad-border rounded-md bg-ad-card">
              Role: {user.role}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row h-[70vh]">
          {/* Main Doc Viewer */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#000000] relative">
            {/* Grid overlay */}
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />

            <div className="space-y-6 relative z-10">
              {user.doc_urls && user.doc_urls.length > 0 ? (
                user.doc_urls.map((url, i) => {
                  const isPdf = url.toLowerCase().includes(".pdf");
                  const isImage = /\.(jpg|jpeg|png)(\?|$)/i.test(url);
                  return (
                    <div key={i} className="border border-ad-border rounded-xl overflow-hidden bg-ad-card shadow-lg">
                      <div className="bg-[#09090B] px-4 py-2 border-b border-ad-border flex justify-between items-center">
                        <span className="text-[11px] font-mono text-ad-text-dim uppercase tracking-widest">
                          Attachment_{i + 1}
                        </span>
                        <a href={url} target="_blank" rel="noreferrer" className="text-[10px] text-ad-accent hover:text-white font-mono uppercase tracking-wider">
                          [OPEN EXTERNAL]
                        </a>
                      </div>
                      {isPdf ? (
                        <iframe
                          src={url}
                          width="100%"
                          height="500px"
                          title={`Document ${i + 1}`}
                          className="block bg-white"
                        />
                      ) : isImage ? (
                        <div className="p-4 flex justify-center bg-black/50">
                          <img
                            src={url}
                            alt={`Document ${i + 1}`}
                            className="max-w-full object-contain max-h-[600px] rounded-lg border border-white/10"
                          />
                        </div>
                      ) : (
                        <div className="p-8 text-center text-ad-text-dim font-mono text-sm">
                          > Undefined format. Please download to view.
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full min-h-[300px] border border-dashed border-ad-danger/30 rounded-xl bg-ad-danger/5">
                  <p className="text-sm font-mono text-ad-danger uppercase tracking-widest">
                    > NO_DATA_FOUND
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Verification Sidebar */}
          <div className="w-full md:w-[320px] bg-ad-card border-l border-ad-border p-6 flex flex-col justify-between">
            <div>
              <p className="text-[12px] font-mono font-bold text-white uppercase tracking-widest mb-4">
                Verification Protocol
              </p>
              <div className="space-y-4">
                {CHECKLIST.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Checkbox
                      id={item}
                      checked={!!checked[item]}
                      onCheckedChange={() => toggle(item)}
                      className="mt-0.5 border-ad-border data-[state=checked]:bg-ad-accent data-[state=checked]:border-ad-accent"
                    />
                    <Label htmlFor={item} className="text-[13px] text-ad-text-dim cursor-pointer leading-tight font-medium hover:text-white transition-colors">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-ad-border flex flex-col gap-3">
              <button 
                onClick={onClose}
                className="w-full py-2.5 bg-ad-border hover:bg-ad-border/80 text-white rounded-xl text-[13px] font-bold tracking-wide transition-colors"
              >
                CLOSE FILE
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
