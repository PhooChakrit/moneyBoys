"use client";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LoadingSpinner({
  fullScreen = true,
  size = "md",
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`animate-spin rounded-full border-b-2 border-emerald-500 ${sizeClasses[size]}`}
      />
      {text && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
