import { useEffect, useId, useRef, type PropsWithChildren } from "react";
import clsx from "clsx";

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  /** When true, Escape and backdrop clicks are ignored (e.g. while saving). */
  isDismissDisabled?: boolean;
  className?: string;
}

/**
 * Accessible modal shell: role="dialog", closes on Escape/backdrop click,
 * moves focus into the dialog on open and restores it on close.
 */
export const Modal = ({
  title,
  description,
  onClose,
  isDismissDisabled = false,
  className,
  children
}: PropsWithChildren<ModalProps>) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Read the latest values inside the listener without re-subscribing.
  const onCloseRef = useRef(onClose);
  const isDismissDisabledRef = useRef(isDismissDisabled);
  useEffect(() => {
    onCloseRef.current = onClose;
    isDismissDisabledRef.current = isDismissDisabled;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const firstField = dialogRef.current?.querySelector<HTMLElement>("input, textarea, select, button");
    firstField?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDismissDisabledRef.current) {
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDismissDisabled) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={clsx("w-full rounded-2xl bg-white p-6 shadow-xl", className)}
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="mt-2 text-sm text-slate-600">
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
};
