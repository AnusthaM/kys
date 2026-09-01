"use client";

import { useWatch, type Control } from "react-hook-form";
import { KycFormValues } from "@/lib/kyc-schema";
import { DocumentEntry } from "./document-entry";
import { DocumentExtraFields } from "../fields/document-extra-fields";
import { DocumentPreviewCard } from "./document-preview-card";

interface DocumentRowProps {
  control: Control<KycFormValues>;
  index: number;
  usedTypes: string[];
  onRemove: () => void;
}

export function DocumentRow({ control, index, usedTypes, onRemove }: DocumentRowProps) {
  const fromScan = useWatch({ control, name: `documents.${index}.fromScan` });

  if (fromScan) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300 ease-out">
        <DocumentPreviewCard control={control} index={index} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in zoom-in-95 space-y-3 rounded-lg border p-4 duration-300 ease-out">
      <DocumentEntry control={control} index={index} usedTypes={usedTypes} onRemove={onRemove} />
      <DocumentExtraFields control={control} index={index} />
    </div>
  );
}