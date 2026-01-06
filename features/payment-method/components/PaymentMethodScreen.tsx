"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftIcon } from "@/components/icons";
import { usePaymentMethod } from "./usePaymentMethod";

// Thai banks list with PromptPay first
const THAI_BANKS = [
  { value: "promptpay", label: "PromptPay" },
  { value: "kbank", label: "กสิกรไทย (KBank)" },
  { value: "scb", label: "ไทยพาณิชย์ (SCB)" },
  { value: "bbl", label: "กรุงเทพ (BBL)" },
  { value: "ktb", label: "กรุงไทย (KTB)" },
  { value: "bay", label: "กรุงศรี (BAY)" },
  { value: "tmb", label: "ทหารไทยธนชาต (TTB)" },
  { value: "gsb", label: "ออมสิน (GSB)" },
  { value: "ghb", label: "อาคารสงเคราะห์ (GHB)" },
  { value: "cimb", label: "ซีไอเอ็มบี (CIMB)" },
  { value: "uob", label: "ยูโอบี (UOB)" },
  { value: "lhbank", label: "แลนด์ แอนด์ เฮ้าส์ (LH Bank)" },
  { value: "tisco", label: "ทิสโก้ (TISCO)" },
  { value: "kkp", label: "เกียรตินาคินภัทร (KKP)" },
  { value: "icbc", label: "ไอซีบีซี (ICBC)" },
];

export function PaymentMethodScreen() {
  const {
    t,
    router,
    fileInputRef,
    loading,
    saving,
    uploading,
    bankName,
    setBankName,
    bankAccount,
    setBankAccount,
    qrPreview,
    handleFileChange,
    handleRemoveQr,
    handleSave,
  } = usePaymentMethod();

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
            <Select value={bankName} onValueChange={setBankName}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full">
                <SelectValue placeholder={t("bankNamePlaceholder")} />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                {THAI_BANKS.map((bank) => (
                  <SelectItem
                    key={bank.value}
                    value={bank.value}
                    className="dark:text-white dark:focus:bg-gray-700"
                  >
                    {bank.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
