"use client";

import { Controller, useWatch, type Control, type FieldArrayWithId, type UseFormSetValue, type UseFormStateReturn } from "react-hook-form";
import { KycFormValues, PERSONAL_FIELDS, FAMILY_GROUPS, SELECT_FIELDS, DOCUMENT_TYPES } from "@/lib/kyc-schema";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { TextField } from "../fields/text-field";
import { SelectField } from "../fields/select-field";
import { PersonNameFields } from "../fields/person-name-fields";
import { AddressFields } from "../fields/address-fields";
import { DocumentUploadField } from "../documents/document-upload-field";
import { SignatureField } from "../fields/signature-field";
import { Plus } from "lucide-react";
import { SpouseFields } from "../fields/spouse-fields";
import { DocumentRow } from "../documents/document-row";
import { KycReviewSummary } from "../kyc-summary/kyc-review-summary";

interface KycStepFieldsProps {
  step: number;
  control: Control<KycFormValues>;
  setValue: UseFormSetValue<KycFormValues>;
  fields: FieldArrayWithId<KycFormValues, "documents", "id">[];
  usedTypes: string[];
  formState: UseFormStateReturn<KycFormValues>;
  onAddDocument: () => void;
  onRemoveDocument: (index: number) => void;
}

export function KycStepFields({
  step, control, setValue, fields, usedTypes, formState, onAddDocument, onRemoveDocument,
}: KycStepFieldsProps) {
  if (step === 0) {
    return (
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        {PERSONAL_FIELDS.map((f) => (
          <TextField key={f.name} control={control} name={f.name} label={f.label} type={f.type} />
        ))}
        {SELECT_FIELDS.map((f) => (
          <SelectField key={f.name} control={control} name={f.name} label={f.label} options={f.options} />
        ))}
        <SpouseFields control={control} />
      </FieldGroup>
    );
  }

  if (step === 1) {
    return (
      <div className="space-y-6">
        {FAMILY_GROUPS.map((g) => (
          <PersonNameFields key={g.key} control={control} prefix={g.key} label={g.label} optional={g.optional} />
        ))}
      </div>
    );
  }

  if (step === 2) {
    return <AddressFields control={control} setValue={setValue} />;
  }

  if (step === 3) {
    return (
      <div className="space-y-6">
        <Controller
          name="photo"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Photo</FieldLabel>
              <DocumentUploadField value={field.value} onChange={field.onChange} allowCamera />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="signature"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Signature</FieldLabel>
              <SignatureField value={field.value} onChange={field.onChange} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
    );
  }

  if (step === 4) {
    return (
      <FieldSet className="gap-3">
        <div className="flex items-center justify-between">
          <FieldLegend variant="label" className="sr-only">Documents</FieldLegend>
          <Button type="button" variant="outline" size="sm" disabled={usedTypes.length >= DOCUMENT_TYPES.length} onClick={onAddDocument}>
            <Plus className="mr-2 h-4 w-4" /> Add document
          </Button>
        </div>

        {fields.length === 0 && (
          <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
            No documents added yet.
          </p>
        )}

        {fields.map((field, index) => (
          <DocumentRow
            key={field.id}
            control={control}
            index={index}
            usedTypes={usedTypes}
            onRemove={() => onRemoveDocument(index)}
          />
        ))}
        {formState.errors.documents?.root && (
          <p className="text-sm text-destructive">{formState.errors.documents.root.message}</p>
        )}
      </FieldSet>
    );
  }

  // step === 5 — Review: read-only snapshot of everything entered so far,
  // built from live form state (not yet submitted).
  return <ReviewStep control={control} />;
}

function ReviewStep({ control }: { control: Control<KycFormValues> }) {
  const watched = useWatch({ control });
  return <KycReviewSummary data={watched} />;
}