"use client";

import { Control, Controller, useWatch } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { DOCUMENT_TYPES, DOCUMENT_FORMATS, KycFormValues } from "@/lib/kyc-schema";
import { DocumentUploadField } from "./document-upload-field";

interface DocumentEntryProps {
  control: Control<KycFormValues>;
  index: number;
  usedTypes: string[];
  onRemove: () => void;
}

export function DocumentEntry({ control, index, usedTypes, onRemove }: DocumentEntryProps) {
  const type = useWatch({ control, name: `documents.${index}.type` });
  const format = useWatch({ control, name: `documents.${index}.format` });
  const config = DOCUMENT_TYPES.find((d) => d.value === type);

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start justify-between gap-2">
          <Controller
            name={`documents.${index}.type`}
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="flex-1">
                <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((d) => (
                      <SelectItem key={d.value} value={d.value} disabled={usedTypes.includes(d.value) && d.value !== type}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {type && (
          <>
            <Controller
              name={`documents.${index}.format`}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>File format</FieldLabel>
                  <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_FORMATS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {format === "pdf" && (
              <Controller
                name={`documents.${index}.file`}
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Document (PDF)</FieldLabel>
                    <DocumentUploadField value={field.value} onChange={field.onChange} accept="application/pdf" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}

            {format === "image" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name={`documents.${index}.front`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{config?.requiresBack ? "Front side" : "Document"}</FieldLabel>
                      <DocumentUploadField value={field.value} onChange={field.onChange} allowCamera accept="image/*" />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                {config?.requiresBack && (
                  <Controller
                    name={`documents.${index}.back`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Back side</FieldLabel>
                        <DocumentUploadField value={field.value} onChange={field.onChange} allowCamera accept="image/*" />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}