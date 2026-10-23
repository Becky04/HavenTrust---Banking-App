"use client";

import { ChevronDown } from "lucide-react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Field, FieldError, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

export const transferControlClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 text-[15px] text-gray-900 shadow-none transition placeholder:text-gray-400 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-0 aria-invalid:border-red-400 aria-invalid:ring-red-500/10";

export const transferLabelClass = "text-sm font-medium text-gray-800";

type Option = { value: string; label: string };

interface TransferFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  variant?: "input" | "select" | "textarea";
  placeholder?: string;
  description?: string;
  optional?: boolean;
  prefix?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  rows?: number;
  options?: Option[];
  className?: string;
}

const TransferField = <T extends FieldValues>({
  control,
  name,
  label,
  variant = "input",
  placeholder,
  description,
  optional,
  prefix,
  type = "text",
  inputMode,
  maxLength,
  rows = 2,
  options = [],
  className,
}: TransferFieldProps<T>) => {
  const id = `transfer-${name}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor={id} className={transferLabelClass}>
              {label}
              {optional && (
                <span className="ml-1 font-normal text-gray-400">
                  (optional)
                </span>
              )}
            </FieldLabel>

            {variant === "select" && (
              <div className="relative">
                <select
                  {...field}
                  id={id}
                  aria-invalid={fieldState.invalid}
                  className={cn(
                    transferControlClass,
                    "h-11 appearance-none pr-10",
                  )}
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            )}

            {variant === "textarea" && (
              <Textarea
                {...field}
                id={id}
                aria-invalid={fieldState.invalid}
                placeholder={placeholder}
                rows={rows}
                className={cn(transferControlClass, "resize-none py-3")}
              />
            )}

            {variant === "input" && (
              <div className="relative">
                {prefix && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium text-gray-500"
                  >
                    {prefix}
                  </span>
                )}
                <Input
                  {...field}
                  id={id}
                  type={type}
                  inputMode={inputMode}
                  maxLength={maxLength}
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                  placeholder={placeholder}
                  className={cn(
                    transferControlClass,
                    "h-11",
                    prefix && "pl-9 font-medium",
                  )}
                />
              </div>
            )}

            {description && !fieldState.invalid && (
              <p className="text-xs text-gray-500">{description}</p>
            )}

            {fieldState.invalid && (
              <FieldError
                errors={[fieldState.error]}
                className="text-xs text-red-500"
              />
            )}
          </div>
        </Field>
      )}
    />
  );
};

export default TransferField;
