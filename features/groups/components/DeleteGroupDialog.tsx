"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleting: boolean;
  onDelete: () => void;
  t: (key: string) => string;
}

export function DeleteGroupDialog({
  open,
  onOpenChange,
  deleting,
  onDelete,
  t,
}: DeleteGroupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            {t("deleteGroup") || "Delete Group"}
          </DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t("deleteGroupConfirm") ||
              "Are you sure you want to delete this group? This action cannot be undone. All expenses and data will be permanently deleted."}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={deleting}
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button
              onClick={onDelete}
              disabled={deleting}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting
                ? t("deleting") || "Deleting..."
                : t("deleteGroup") || "Delete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
