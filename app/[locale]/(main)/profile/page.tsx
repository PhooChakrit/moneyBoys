"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useUserStore } from "@/lib/stores/user-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AvatarDisplay } from "@/components/ui/avatar-display";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tAuth = useTranslations("auth");
  const { user, refreshUser } = useAuth();
  const { isOAuthUser, checkIsOAuthUser } = useUserStore();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarKey, setAvatarKey] = useState<string | null>(
    user?.avatar || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is OAuth (Google) user - uses cached value if available
  useEffect(() => {
    if (isOAuthUser === null) {
      checkIsOAuthUser();
    }
  }, [isOAuthUser, checkIsOAuthUser]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      // Get presigned URL for upload
      const urlRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: "avatars",
        }),
      });

      if (!urlRes.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, key } = await urlRes.json();

      // Upload to R2
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      // Update profile with new avatar key
      const profileRes = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: key }),
      });

      if (!profileRes.ok) {
        throw new Error("Failed to update profile");
      }

      // Update local avatar key and clear base64 cache to trigger re-fetch
      setAvatarKey(key);
      useUserStore.getState().setUserAvatarBase64(null); // Clear cache
      await refreshUser(); // This will trigger fetchUserAvatarBase64
      setSuccess(t("updateSuccess"));
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const updateData: { name?: string; email?: string; password?: string } =
        {};

      if (name !== user?.name) {
        updateData.name = name;
      }
      if (email !== user?.email) {
        updateData.email = email;
      }
      if (newPassword) {
        if (newPassword.length < 6) {
          setError(tAuth("passwordTooShort"));
          setLoading(false);
          return;
        }
        updateData.password = newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update profile");
        return;
      }

      await refreshUser();
      setNewPassword("");
      setSuccess(t("updateSuccess"));
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
          <CardHeader className="text-center pb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("title")}
            </h1>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <AvatarDisplay
                  avatarKey={avatarKey}
                  name={user.name}
                  size="xl"
                  className="border-4 border-emerald-100 dark:border-emerald-900 shadow-lg"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : t("changeAvatar")}
                </Button>
              </div>

              {/* Messages */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm">
                  {success}
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tAuth("name")}
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tAuth("email")}
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isOAuthUser ?? false}
                    className={`h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 ${isOAuthUser ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                  {isOAuthUser && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("oauthEmailDisabled") ||
                        "Email cannot be changed for Google login accounts"}
                    </p>
                  )}
                </div>

                {!isOAuthUser && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("newPassword")}
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg"
              >
                {loading ? t("saving") : t("saveChanges")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
