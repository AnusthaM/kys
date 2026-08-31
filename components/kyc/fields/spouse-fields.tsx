"use client";

import { Fragment } from "react";
import { Controller, type Control, useWatch } from "react-hook-form";
import { KycFormValues } from "@/lib/kyc-schema";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface SpouseFieldsProps {
  control: Control<KycFormValues>;
}

export function SpouseFields({ control }: SpouseFieldsProps) {
  const maritalStatus = useWatch({ control, name: "martial_status" });
  if (maritalStatus !== "married") return null;

  return (
    <Fragment>
      <Controller
        name="spouseFirstName"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Spouse First Name</FieldLabel>
            <Input {...field} value={field.value ?? ""} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="spouseMiddleName"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Spouse Middle Name</FieldLabel>
            <Input {...field} value={field.value ?? ""} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="spouseLastName"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Spouse Last Name</FieldLabel>
            <Input {...field} value={field.value ?? ""} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="spouseAge"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Spouse Age</FieldLabel>
            <Input {...field} value={field.value ?? ""} type="number" min="18" />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </Fragment>
  );
}