import { useId, type TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = ({ label, error, hint, className, ...props }: TextareaProps) => {
  const messageId = useId();

  return (
    <label className="flex w-full flex-col gap-2 text-sm text-slate-700">
      {label ? <span className="font-medium">{label}</span> : null}
      <textarea
        className={clsx(
          "min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200",
          error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : null,
          className
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? messageId : undefined}
        {...props}
      />
      <span className="flex justify-between gap-2 text-xs">
        {error ? (
          <span id={messageId} className="text-rose-600">
            {error}
          </span>
        ) : (
          <span />
        )}
        {hint ? <span className="text-slate-400">{hint}</span> : null}
      </span>
    </label>
  );
};
