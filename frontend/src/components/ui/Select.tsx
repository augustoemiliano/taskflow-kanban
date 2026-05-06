import type { SelectHTMLAttributes } from "react";
import clsx from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = ({ label, className, children, ...props }: SelectProps) => (
  <label className="flex w-full flex-col gap-2 text-sm text-slate-700">
    {label ? <span className="font-medium">{label}</span> : null}
    <select
      className={clsx(
        "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200",
        className
      )}
      {...props}
    >
      {children}
    </select>
  </label>
);
