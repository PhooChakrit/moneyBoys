"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import api from "@/lib/api";

interface PaymentMethod {
  bankName: string | null;
  bankAccount: string | null;
  qrCodeUrl: string | null;
}

export function usePaymentMethod() {
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
  const [qrCodeKey, setQrCodeKey] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  // Fetch signed URL for an image key
  const getSignedUrl = useCallback(
    async (key: string): Promise<string | null> => {
      try {
        const { data } = await api.post("/image-url", { key });
        return data.url;
      } catch (error) {
        console.error("Failed to get signed URL:", error);
        return null;
      }
    },
    [],
  );

  // Fetch payment method data
  const fetchPaymentMethod = useCallback(async () => {
    try {
      const { data } = await api.get("/payment-method");
      const pm: PaymentMethod = data.paymentMethod;
      if (pm) {
        setBankName(pm.bankName || "");
        setBankAccount(pm.bankAccount || "");

        if (pm.qrCodeUrl) {
          setQrCodeKey(pm.qrCodeUrl);
          const signedUrl = await getSignedUrl(pm.qrCodeUrl);
          if (signedUrl) {
            setQrPreview(signedUrl);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch payment method:", error);
    } finally {
      setLoading(false);
    }
  }, [getSignedUrl]);

  useEffect(() => {
    fetchPaymentMethod();
  }, [fetchPaymentMethod]);

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      setQrPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to R2 using presigned URL
    setUploading(true);
    try {
      const { data: presignData } = await api.post("/upload/presign", {
        filename: file.name,
        contentType: file.type,
        folder: "qrcodes",
      });

      const { uploadUrl, key } = presignData;

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

      setQrCodeKey(key);

      const signedUrl = await getSignedUrl(key);
      if (signedUrl) {
        setQrPreview(signedUrl);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      if (qrCodeKey) {
        const signedUrl = await getSignedUrl(qrCodeKey);
        setQrPreview(signedUrl);
      } else {
        setQrPreview(null);
      }
    } finally {
      setUploading(false);
    }
  };

  // Remove QR code
  const handleRemoveQr = () => {
    setQrCodeKey(null);
    setQrPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Save payment method
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/payment-method", {
        bankName: bankName || null,
        bankAccount: bankAccount || null,
        qrCodeUrl: qrCodeKey || null,
      });
      router.push(`/${locale}/settings`);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  return {
    // Navigation
    t,
    router,
    locale,
    fileInputRef,

    // State
    loading,
    saving,
    uploading,
    bankName,
    setBankName,
    bankAccount,
    setBankAccount,
    qrPreview,

    // Actions
    handleFileChange,
    handleRemoveQr,
    handleSave,
  };
}
