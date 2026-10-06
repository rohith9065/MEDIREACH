import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../lib/cn";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, className, id, ...props },
  ref,
) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
      <input
        id={inputId}
        ref={ref}
        className={cn(
          "w-full rounded border border-rule-subtle bg-paper-raised px-3 py-2 text-sm text-ink outline-none focus:border-ink",
          error && "border-status-unavailable",
          className,
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-status-unavailable">{error}</span>}
    </label>
  );
});
