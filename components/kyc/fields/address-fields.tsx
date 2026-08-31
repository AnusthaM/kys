"use client";

import { useEffect, useState } from "react";
import { Control, UseFormSetValue, useWatch } from "react-hook-form";
import { FieldSet, FieldLegend, Field, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "./text-field";
import { SelectField } from "./select-field";
import { ADDRESS_FIELDS, MUNICIPALITY_OPTIONS, KycFormValues } from "@/lib/kyc-schema";

interface AddressFieldsProps {
  control: Control<KycFormValues>;
  setValue: UseFormSetValue<KycFormValues>;
}

export function AddressFields({ control, setValue }: AddressFieldsProps) {
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const permanent = useWatch({ control, name: "permanentAddress" });

  useEffect(() => {
    if (!sameAsPermanent || !permanent) return;
    (Object.keys(permanent) as (keyof typeof permanent)[]).forEach((key) => {
      setValue(`temporaryAddress.${key}`, permanent[key] ?? "");
    });
  }, [sameAsPermanent, permanent, setValue]);

  return (
    <>
      <FieldSet className="gap-3">
        <FieldLegend variant="label">Permanent Address</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-2">
          {ADDRESS_FIELDS.map((f) => (
            <TextField key={f.name} control={control} name={`permanentAddress.${f.name}`} label={f.label} />
          ))}
          <SelectField control={control} name="permanentAddress.municipality" label="Municipality Type" options={MUNICIPALITY_OPTIONS} />
        </div>
      </FieldSet>

      <FieldSet className="gap-3">
        <div className="flex items-center justify-between">
          <FieldLegend variant="label">Temporary Address</FieldLegend>
          <Field orientation="horizontal">
            <Checkbox
              id="sameAsPermanent"
              checked={sameAsPermanent}
              onCheckedChange={(checked) => setSameAsPermanent(checked === true)}
            />
            <FieldLabel htmlFor="sameAsPermanent" className="font-normal">Same as permanent</FieldLabel>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {ADDRESS_FIELDS.map((f) => (
            <TextField key={f.name} control={control} name={`temporaryAddress.${f.name}`} label={f.label} disabled={sameAsPermanent} />
          ))}
          <SelectField control={control} name="temporaryAddress.municipality" label="Municipality Type" options={MUNICIPALITY_OPTIONS} disabled={sameAsPermanent} />
        </div>
      </FieldSet>
    </>
  );
}