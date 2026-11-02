import { useId, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className, id, ...props }: InputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex w-full flex-col gap-2 text-sm text-slate-700">
      {label ? (
        <label htmlFor={inputId} className="font-medium">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={clsx(
          "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200",
          error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : null,
          className
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error ? (
        <span id={errorId} className="text-xs text-rose-600">
          {error}
        </span>
      ) : null}
    </div>
  );
};
