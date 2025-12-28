import { InputHTMLAttributes } from "react";

interface ValidatedNumberInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange" | "value"
  > {
  value: number | null;
  onChange: (value: number | null) => void;
  numberMode?: "int" | "float";
  positiveOnly?: boolean;
  min?: number;
  max?: number;
}

export function ValidatedNumberInput({
  value,
  onChange,
  numberMode = "float",
  positiveOnly = false,
  min,
  max,
  className = "",
  ...props
}: ValidatedNumberInputProps) {
  const handleChange = (rawValue: string) => {
    if (rawValue === "" || rawValue === null) {
      onChange(null);
      return;
    }

    const num =
      numberMode === "int" ? parseInt(rawValue, 10) : parseFloat(rawValue);

    onChange(isNaN(num) ? null : num);
  };

  return (
    <input
      type="number"
      className={`w-24 rounded border border-gray-300 px-2 py-1 ${className}`}
      value={value ?? ""}
      min={min}
      max={max}
      onKeyDown={(e) => {
        const allowedKeys = [
          "Backspace",
          "Delete",
          "ArrowLeft",
          "ArrowRight",
          "Tab",
        ];

        if (numberMode === "float") {
          allowedKeys.push(".");
        }

        if (!positiveOnly) {
          allowedKeys.push("-");
        }

        const isNumber = /^\d$/.test(e.key);
        const isAllowedKey = allowedKeys.includes(e.key);

        const currentValue = e.currentTarget.value;

        if (e.key === "." && currentValue.includes(".")) {
          e.preventDefault();
          return;
        }

        if (
          !positiveOnly &&
          e.key === "-" &&
          (currentValue.includes("-") || currentValue.length > 0)
        ) {
          e.preventDefault();
          return;
        }

        if (!isNumber && !isAllowedKey) {
          e.preventDefault();
        }
      }}
      onInput={(e) => {
        const input = e.currentTarget;
        let value = input.value;

        if (/^0\d/.test(value)) {
          value = value.replace(/^0+/, "");
          input.value = value;
        }
      }}
      onChange={(event) => handleChange(event.target.value)}
      {...props}
    />
  );
}
