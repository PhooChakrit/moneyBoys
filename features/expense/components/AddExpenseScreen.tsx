"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon } from "@/components/icons";

export function AddExpenseScreen() {
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">เพิ่มรายจ่าย</h1>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            รายละเอียด
          </label>
          <Input
            placeholder="เช่น ค่าอาหารเย็น"
            className="h-12 rounded-xl bg-gray-50 border-0"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            จำนวนเงิน
          </label>
          <div className="relative">
            <Input
              placeholder="0"
              className="h-14 rounded-xl bg-gray-50 border-0 text-2xl font-bold pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
              ฿
            </span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            ใครจ่าย?
          </label>
          <div className="flex gap-3">
            {["P", "B", "N", "S"].map((a, i) => (
              <button
                key={i}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  i === 0
                    ? "bg-emerald-500 text-white ring-2 ring-emerald-500 ring-offset-2"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            หารกัน
          </label>
          <div className="flex gap-2 mb-3">
            <Button
              variant="default"
              className="rounded-full bg-emerald-500 hover:bg-emerald-600"
            >
              หารเท่าๆ กัน
            </Button>
            <Button variant="outline" className="rounded-full">
              กำหนดเอง
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Pim", "Bank", "Nook", "Som"].map((name, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 cursor-pointer hover:bg-emerald-100 hover:text-emerald-700"
              >
                {name} ✓
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            ใบเสร็จ (ไม่บังคับ)
          </label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
            <span className="text-3xl">📷</span>
            <p className="text-gray-500 text-sm mt-2">แตะเพื่อถ่ายรูป</p>
          </div>
        </div>

        <Button className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-semibold mt-4">
          เพิ่มรายจ่าย
        </Button>
      </div>
    </div>
  );
}
