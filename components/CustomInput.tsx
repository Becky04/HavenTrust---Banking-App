import React from "react";
import { Controller, FieldPath } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Control } from "react-hook-form";
import z from "zod";
import { FormSchema } from "@/lib/utils";

const authFormSchema = FormSchema("sign-up");

interface CustomInput {
  control: Control<z.infer<typeof authFormSchema>>;
  name: FieldPath<z.infer<typeof authFormSchema>>;
  label: string;
  placeholder: string;
}

const CustomInput = ({ control, name, label, placeholder }: CustomInput) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <div className="form-item">
            <FieldLabel htmlFor="form-rhf-demo-title" className="form-label">
              {label}
            </FieldLabel>
            <div className="flex w-full flex-col">
              <Input
                {...field}
                id="form-rhf-demo-title"
                aria-invalid={fieldState.invalid}
                placeholder={placeholder}
                autoComplete="off"
                className="input-class"
                type={name === "password" ? "password" : "text"}
              />
              {fieldState.invalid && (
                <FieldError
                  errors={[fieldState.error]}
                  className="form-message mt-2 "
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
