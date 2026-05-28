"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

type PasswordFieldProps = {
  name?: string;
  label?: string;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
};

export function PasswordField({
  name = "password",
  label = "Contraseña",
  placeholder = "Tu contraseña",
  autoComplete = "current-password",
  disabled,
  required = true,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <label className="block">
      <span className="text-sm font-medium text-[#5f5647]">{label}</span>
      <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-[#ded6c7] bg-[#fbfaf5] px-3 text-[#7b725f]">
        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        <input
          type={visible ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          minLength={8}
          className="h-full w-full border-0 bg-transparent p-0 text-[#14120f] outline-none placeholder:text-[#9b917f]"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#075f53] hover:bg-[#e7fbf7]"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      </span>
    </label>
  );
}
