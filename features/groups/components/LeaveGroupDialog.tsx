"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LeaveGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  leaving: boolean;
  onLeave: () => void;
  t: (key: string) => string;
}

export function LeaveGroupDialog({
  open,
  onOpenChange,
  groupName,
  leaving,
  onLeave,
  t,
}: LeaveGroupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            {t("leaveGroup")}
          </DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Are you sure you want to leave <strong>{groupName}</strong>? You
            will need to be invited again to rejoin.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={leaving}
            >
              Cancel
            </Button>
            <Button
              onClick={onLeave}
              disabled={leaving}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {leaving ? t("leaving") : t("leaveGroup")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
