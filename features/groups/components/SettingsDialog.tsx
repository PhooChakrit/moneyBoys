"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SettingsIcon, XIcon } from "@/components/icons";
import { MemberData, GroupData } from "./useGroupDetail";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupData;
  members: MemberData[];
  isEditing: boolean;
  editName: string;
  editDescription: string;
  savingGroup: boolean;
  removingMember: string | null;
  onSetIsEditing: (editing: boolean) => void;
  onSetEditName: (name: string) => void;
  onSetEditDescription: (desc: string) => void;
  onStartEditing: () => void;
  onSaveGroupChanges: () => void;
  onRemoveMember: (memberId: string) => void;
  onLeaveGroup: () => void;
  t: (key: string) => string;
}

export function SettingsDialog({
  open,
  onOpenChange,
  group,
  members,
  isEditing,
  editName,
  editDescription,
  savingGroup,
  removingMember,
  onSetIsEditing,
  onSetEditName,
  onSetEditDescription,
  onStartEditing,
  onSaveGroupChanges,
  onRemoveMember,
  onLeaveGroup,
  t,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center hover:bg-gray-700 transition-colors">
          <SettingsIcon className="w-5 h-5 text-gray-300" />
        </button>
      </DialogTrigger>
      <DialogContent className="dark:bg-gray-800 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            {t("groupSettings")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Group Info - Editable for admins */}
          {group.role === "admin" && isEditing ? (
            <>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                  {t("groupName")}
                </label>
                <Input
                  value={editName}
                  onChange={(e) => onSetEditName(e.target.value)}
                  className="dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                  {t("description")}
                </label>
                <Input
                  value={editDescription}
                  onChange={(e) => onSetEditDescription(e.target.value)}
                  placeholder="Optional description"
                  className="dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onSetIsEditing(false)}
                  className="flex-1"
                  disabled={savingGroup}
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={onSaveGroupChanges}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                  disabled={savingGroup || !editName.trim()}
                >
                  {savingGroup ? t("saving") : t("save")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("groupName")}
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {group.name}
                  </p>
                </div>
                {group.role === "admin" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onStartEditing}
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    {t("edit")}
                  </Button>
                )}
              </div>
              {group.description && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("description")}
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {group.description}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Members List (Admin can remove) */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {t("members")} ({members.length})
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-sm">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white text-sm">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {member.role === "admin" ? t("admin") : t("member")}
                      </p>
                    </div>
                  </div>
                  {group.role === "admin" && member.role !== "admin" && (
                    <button
                      onClick={() => onRemoveMember(member.id)}
                      disabled={removingMember === member.id}
                      className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                    >
                      {removingMember === member.id ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <XIcon className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Leave Group */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button
              variant="outline"
              onClick={onLeaveGroup}
              className="w-full text-red-500 border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {t("leaveGroup")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
