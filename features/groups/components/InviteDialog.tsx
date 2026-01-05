"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlusIcon } from "@/components/icons";
import { QRCodeSVG } from "qrcode.react";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteCode: string;
  locale: string;
  copied: boolean;
  onCopyCode: () => void;
  onCopyLink: () => void;
}

export function InviteDialog({
  open,
  onOpenChange,
  inviteCode,
  locale,
  copied,
  onCopyCode,
  onCopyLink,
}: InviteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center hover:bg-gray-700 transition-colors">
          <UserPlusIcon className="w-5 h-5 text-gray-300" />
        </button>
      </DialogTrigger>
      <DialogContent className="dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Invite Members</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          {/* Invite Code */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Invite Code
            </label>
            <div className="flex gap-2 mt-2">
              <Input
                value={inviteCode}
                readOnly
                className="text-center text-2xl tracking-widest font-mono dark:bg-gray-700 dark:text-white"
              />
              <Button onClick={onCopyCode} variant="outline">
                {copied ? "✓" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Invite Link */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Invite Link
            </label>
            <Button
              onClick={onCopyLink}
              className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600"
            >
              {copied ? "Link Copied!" : "Copy Invite Link"}
            </Button>
          </div>

          {/* QR Code */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              QR Code
            </label>
            <div className="mt-2 p-4 bg-white rounded-lg flex items-center justify-center">
              <QRCodeSVG
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/groups/join?code=${inviteCode}`}
                size={160}
                level="M"
                includeMargin={true}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
