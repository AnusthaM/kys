"use client";

import { Control } from "react-hook-form";
import { FieldSet, FieldLegend } from "@/components/ui/field";
import { TextField } from "./text-field";
import { KycFormValues } from "@/lib/kyc-schema";

interface PersonNameFieldsProps {
  control: Control<KycFormValues>;
  prefix: "father" | "mother" | "grandFather" | "grandMother";
  label: string;
  optional?: boolean;
}

export function PersonNameFields({ control, prefix, label, optional }: PersonNameFieldsProps) {
  return (
    <FieldSet className="gap-3">
      <FieldLegend variant="label">{label}{optional ? " (optional)" : ""}</FieldLegend>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField control={control} name={`${prefix}.firstName`} label="First Name" />
        <TextField control={control} name={`${prefix}.middleName`} label="Middle Name" />
        <TextField control={control} name={`${prefix}.lastName`} label="Last Name" />
      </div>
    </FieldSet>
  );
}