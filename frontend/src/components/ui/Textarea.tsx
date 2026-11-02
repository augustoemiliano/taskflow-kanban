import { useId, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = ({ label, error, hint, className, id, ...props }: TextareaProps) => {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;

  return (
    <div className="flex w-full flex-col gap-2 text-sm text-slate-700">
      {label ? (
        <label htmlFor={textareaId} className="font-medium">
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        className={clsx(
          "min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200",
          error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : null,
          className
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error || hint ? (
        <div className="flex justify-between gap-2 text-xs">
          <span id={errorId} className="text-rose-600">
            {error}
          </span>
          {hint ? <span className="text-slate-400">{hint}</span> : null}
        </div>
      ) : null}
    </div>
  );
};
