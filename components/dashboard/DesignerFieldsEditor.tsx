"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import type { DesignerField } from "@/lib/designer-fields";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface DesignerFieldsEditorProps {
  fields: DesignerField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function DesignerFieldsEditor({
  fields,
  values,
  onChange,
  disabled = false,
  className,
}: DesignerFieldsEditorProps) {
  const textFields = React.useMemo(
    () => fields.filter((f) => f.kind === "text" || f.kind === "textarea"),
    [fields],
  );

  if (textFields.length === 0) {
    return null;
  }

  return (
    <Card className={cn("space-y-4 p-4 sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-sans text-base font-semibold text-fg">
            <FileText className="h-4 w-4 text-accent-text" aria-hidden="true" />
            <span>Nội dung tùy chỉnh theo mẫu thiết kế</span>
          </h3>
          <p className="mt-0.5 text-xs text-fg-muted">
            Mẫu thiệp này có các vị trí chữ cho phép bạn tự soạn nội dung riêng (lời nhắn, trích dẫn, ghi chú...).
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-1">
        {textFields.map((field) => {
          const value = values[field.key] ?? "";
          const isTextarea = field.kind === "textarea";
          const maxLen = field.maxLength;

          return (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor={`designer-field-${field.key}`}
                  className="font-medium text-fg"
                >
                  {field.label}
                </label>
                {maxLen && (
                  <span
                    className={cn(
                      "text-[11px]",
                      value.length > maxLen ? "text-danger-fg" : "text-fg-muted",
                    )}
                  >
                    {value.length}/{maxLen} ký tự
                  </span>
                )}
              </div>

              {isTextarea ? (
                <textarea
                  id={`designer-field-${field.key}`}
                  value={value}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  maxLength={maxLen}
                  disabled={disabled}
                  rows={3}
                  placeholder={`Nhập ${field.label.toLowerCase()}...`}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-fg transition-colors placeholder:text-fg-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              ) : (
                <div className="relative">
                  <input
                    id={`designer-field-${field.key}`}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    maxLength={maxLen}
                    disabled={disabled}
                    placeholder={`Nhập ${field.label.toLowerCase()}...`}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-fg transition-colors placeholder:text-fg-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <FileText className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted/50" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
