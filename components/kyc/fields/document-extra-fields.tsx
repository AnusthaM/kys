"use client";

import { Controller, type Control, useWatch } from "react-hook-form";
import { KycFormValues, DOCUMENT_TYPES } from "@/lib/kyc-schema";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface DocumentExtraFieldsProps {
  control: Control<KycFormValues>;
  index: number;
}

export function DocumentExtraFields({ control, index }: DocumentExtraFieldsProps) {
  const type = useWatch({ control, name: `documents.${index}.type` });
  const config = DOCUMENT_TYPES.find((d) => d.value === type);
  if (!config) return null;

  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-3">
      <FieldGroup className="grid grid-cols-2 gap-3">
        <Controller
          name={`documents.${index}.idNumber`}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>{config.label} Number</FieldLabel>
              <Input {...field} value={field.value ?? ""} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {type === "drivers_license" && (
          <>
            <Controller
              name={`documents.${index}.issueDate`}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Issue Date</FieldLabel>
                  <Input {...field} value={field.value ?? ""} type="date" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name={`documents.${index}.expiryDate`}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Expiry Date</FieldLabel>
                  <Input {...field} value={field.value ?? ""} type="date" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </>
        )}

        {type === "birth_certificate" && (
          <>
            <Controller
              name={`documents.${index}.informantFirstName`}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Informant First Name</FieldLabel>
                  <Input {...field} value={field.value ?? ""} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name={`documents.${index}.informantLastName`}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Informant Last Name</FieldLabel>
                  <Input {...field} value={field.value ?? ""} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name={`documents.${index}.informantRelationship`}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Informant Relationship</FieldLabel>
                  <Input {...field} value={field.value ?? ""} placeholder="e.g. Father" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </>
        )}
      </FieldGroup>
    </div>
  );
}