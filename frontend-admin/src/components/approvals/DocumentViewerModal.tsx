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
import { Button } from "../ui/button";

interface Props {
  user: PendingUser | null;
  onClose: () => void;
}

const CHECKLIST = [
  "Document is clearly visible",
  "Name matches registration details",
  "Document appears valid and unexpired",
  "No signs of tampering",
];

export default function DocumentViewerModal({ user, onClose }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (item: string) =>
    setChecked((prev) => ({ ...prev, [item]: !prev[item] }));

  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Documents — {user.name}{" "}
            <span className="ml-2 text-sm font-normal text-gray-500 capitalize">
              ({user.role})
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Documents */}
        <div className="space-y-4 mt-2">
          {user.doc_urls && user.doc_urls.length > 0 ? (
            user.doc_urls.map((url, i) => {
              const isPdf = url.toLowerCase().includes(".pdf");
              const isImage = /\.(jpg|jpeg|png)(\?|$)/i.test(url);
              return (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-500 border-b">
                    Document {i + 1}
                  </div>
                  {isPdf ? (
                    <iframe
                      src={url}
                      width="100%"
                      height="500px"
                      title={`Document ${i + 1}`}
                      className="block"
                    />
                  ) : isImage ? (
                    <img
                      src={url}
                      alt={`Document ${i + 1}`}
                      className="w-full object-contain max-h-[500px]"
                    />
                  ) : (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block p-4 text-sm text-indigo-600 underline"
                    >
                      Open document
                    </a>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-500 italic">No documents uploaded.</p>
          )}
        </div>

        {/* Checklist */}
        <div className="mt-6 border rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Verification Checklist
          </p>
          {CHECKLIST.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <Checkbox
                id={item}
                checked={!!checked[item]}
                onCheckedChange={() => toggle(item)}
              />
              <Label htmlFor={item} className="text-sm cursor-pointer">
                {item}
              </Label>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
