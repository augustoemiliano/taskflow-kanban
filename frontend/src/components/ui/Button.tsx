import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export const Button = ({ variant = "primary", className, ...props }: ButtonProps) => (
  <button
    className={clsx(
      "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
      {
        "bg-slate-900 text-white hover:bg-slate-700": variant === "primary",
        "bg-slate-100 text-slate-700 hover:bg-slate-200": variant === "secondary",
        "bg-rose-600 text-white hover:bg-rose-500": variant === "danger"
      },
      className
    )}
    {...props}
  />
);
