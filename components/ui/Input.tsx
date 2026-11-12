import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-fg"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? "true" : undefined}
          className={cn(
            "flex h-11 w-full rounded-xl border bg-surface px-3.5 py-2 text-sm text-fg transition-colors",
            "placeholder:text-fg-muted/70",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-accent",
            "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-75",
            error ? "border-danger-fg focus-visible:ring-danger-fg" : "border-border",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-danger-fg" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-fg-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-fg"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? "true" : undefined}
          className={cn(
            "flex min-h-[110px] w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-fg transition-colors",
            "placeholder:text-fg-muted/70",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-accent",
            "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-75",
            error ? "border-danger-fg focus-visible:ring-danger-fg" : "border-border",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-danger-fg" role="alert">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-fg-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

