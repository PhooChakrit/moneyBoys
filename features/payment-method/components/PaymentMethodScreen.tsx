"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@/components/icons";

interface PaymentMethod {
  bankName: string | null;
  bankAccount: string | null;
  qrCodeUrl: string | null;
}

export function PaymentMethodScreen() {
  const t = useTranslations("paymentMethod");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethod();
  }, []);

  const fetchPaymentMethod = async () => {
    try {
      const response = await fetch("/api/payment-method");
      if (response.ok) {
        const data = await response.json();
        const pm: PaymentMethod = data.paymentMethod;
        if (pm) {
          setBankName(pm.bankName || "");
          setBankAccount(pm.bankAccount || "");
          setQrCodeUrl(pm.qrCodeUrl);
          setQrPreview(pm.qrCodeUrl);
        }
      }
    } catch (error) {
      console.error("Failed to fetch payment method:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      setQrPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to R2 using presigned URL
    setUploading(true);
    try {
      // Get presigned URL
      const presignResponse = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: "qrcodes",
        }),
      });

      if (!presignResponse.ok) {
        if (presignResponse.status === 401) {
          alert("Please log in to upload images");
          router.push(`/${locale}/login`);
          return;
        }
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, publicUrl } = await presignResponse.json();

      // Upload directly to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      setQrCodeUrl(publicUrl);
    } catch (error) {
      console.error("Upload failed:", error);
      setQrPreview(qrCodeUrl); // Revert preview on error
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveQr = () => {
    setQrCodeUrl(null);
    setQrPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/payment-method", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: bankName || null,
          bankAccount: bankAccount || null,
          qrCodeUrl: qrCodeUrl || null,
        }),
      });

      if (response.ok) {
        router.push(`/${locale}/settings`);
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-5 lg:px-8 pt-8 lg:pt-12 pb-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("title")}
        </h1>
      </div>

      {/* Form */}
      <div className="px-5 lg:px-8 space-y-5">
        {/* Bank Name */}
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-4">
            <Label
              htmlFor="bankName"
              className="text-gray-700 dark:text-gray-300 mb-2 block"
            >
              {t("bankName")}
            </Label>
            <Input
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder={t("bankNamePlaceholder")}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </CardContent>
        </Card>

        {/* Bank Account */}
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-4">
            <Label
              htmlFor="bankAccount"
              className="text-gray-700 dark:text-gray-300 mb-2 block"
            >
              {t("bankAccount")}
            </Label>
            <Input
              id="bankAccount"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder={t("bankAccountPlaceholder")}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </CardContent>
        </Card>

        {/* QR Code Upload */}
        <Card className="border-0 shadow-sm dark:bg-gray-800">
          <CardContent className="p-4">
            <Label className="text-gray-700 dark:text-gray-300 mb-3 block">
              {t("qrCode")}
            </Label>

            {qrPreview ? (
              <div className="space-y-3">
                <div className="relative w-full aspect-square max-w-xs mx-auto bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrPreview}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    {t("changeQr")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveQr}
                    disabled={uploading}
                    className="text-red-500 hover:text-red-600 dark:border-gray-600"
                  >
                    {t("removeQr")}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full aspect-square max-w-xs mx-auto bg-gray-100 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                <div className="text-4xl">📷</div>
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {t("uploadQr")}
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-lg font-medium"
        >
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
