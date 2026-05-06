import clsx from "clsx";

interface BadgeProps {
  label: string;
  className?: string;
}

export const Badge = ({ label, className }: BadgeProps) => (
  <span className={clsx("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", className)}>{label}</span>
);
