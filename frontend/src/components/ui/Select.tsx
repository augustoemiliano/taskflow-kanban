import { useId, type SelectHTMLAttributes } from "react";
import clsx from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = ({ label, className, children, id, ...props }: SelectProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex w-full flex-col gap-2 text-sm text-slate-700">
      {label ? (
        <label htmlFor={selectId} className="font-medium">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={clsx(
          "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};
