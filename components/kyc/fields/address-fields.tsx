"use client";

import { useEffect, useState } from "react";
import { Control, UseFormSetValue, useWatch } from "react-hook-form";
import { FieldSet, FieldLegend } from "@/components/ui/field";
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
    <div className="space-y-5">
      <FieldSet className="gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
        <FieldLegend variant="label">Permanent Address</FieldLegend>
        <div className="grid gap-4 sm:grid-cols-2">
          {ADDRESS_FIELDS.map((f) => (
            <TextField key={f.name} control={control} name={`permanentAddress.${f.name}`} label={f.label} />
          ))}
          <SelectField control={control} name="permanentAddress.municipality" label="Municipality Type" options={MUNICIPALITY_OPTIONS} />
        </div>
      </FieldSet>

      <FieldSet className="gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
        <div className="flex items-center justify-between">
          <FieldLegend variant="label">Temporary Address</FieldLegend>
          <label
            htmlFor="sameAsPermanent"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs transition-colors hover:border-primary/40"
          >
            <Checkbox
              id="sameAsPermanent"
              checked={sameAsPermanent}
              onCheckedChange={(checked) => setSameAsPermanent(checked === true)}
            />
            <span className="font-normal text-muted-foreground">Same as permanent</span>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {ADDRESS_FIELDS.map((f) => (
            <TextField key={f.name} control={control} name={`temporaryAddress.${f.name}`} label={f.label} disabled={sameAsPermanent} />
          ))}
          <SelectField control={control} name="temporaryAddress.municipality" label="Municipality Type" options={MUNICIPALITY_OPTIONS} disabled={sameAsPermanent} />
        </div>
      </FieldSet>
    </div>
  );
}