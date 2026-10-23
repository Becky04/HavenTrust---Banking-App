"use client";

import React, { useState } from "react";
import { Controller, FieldPath } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Control } from "react-hook-form";
import z from "zod";
import { FormSchema } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

const authFormSchema = FormSchema("sign-up");

interface CustomInput {
  control: Control<z.infer<typeof authFormSchema>>;
  name: FieldPath<z.infer<typeof authFormSchema>>;
  label: string;
  placeholder: string;
}

const CustomInput = ({ control, name, label, placeholder }: CustomInput) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = name === "password";

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <div className="form-item">
            <FieldLabel htmlFor={name} className="form-label">
              {label}
            </FieldLabel>
            <div className="flex w-full flex-col">
              <div className="relative w-full">
                <Input
                  {...field}
                  id={name}
                  aria-invalid={fieldState.invalid}
                  placeholder={placeholder}
                  autoComplete="off"
                  className={`${fieldState.invalid ? "border-red-500" : ""} input-class w-full ${isPasswordField ? "pr-10" : ""}`}
                  type={
                    isPasswordField
                      ? showPassword
                        ? "text"
                        : "password"
                      : "text"
                  }
                />

                {isPasswordField && (
                  <button
                    type="button" // CRUCIAL: type="button" stops the eye from unexpectedly submitting the form
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>

              {fieldState.invalid && (
                <FieldError
                  errors={[fieldState.error]}
                  className="form-message mt-2"
                />
              )}
            </div>
          </div>
        </Field>
      )}
    />
  );
};

export default CustomInput;
