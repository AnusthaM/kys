"use client";

import { useEffect, useState } from "react";
import { useWatch, type Control } from "react-hook-form";
import { KycFormValues, DOCUMENT_TYPES } from "@/lib/kyc-schema";
import { Card } from "@/components/ui/card";
import { Lock, FileText } from "lucide-react";
import Image from "next/image";

interface DocumentPreviewCardProps {
  control: Control<KycFormValues>;
  index: number;
}

function useObjectUrl(file: File | undefined | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local preview state to a browser File; url must be created fresh each effect run so Strict Mode's double-invoke doesn't leave a revoked URL in place
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}
export function DocumentPreviewCard({ control, index }: DocumentPreviewCardProps) {
  const doc = useWatch({ control, name: `documents.${index}` });
  const config = DOCUMENT_TYPES.find((d) => d.value === doc?.type);

  const isImage = doc?.format === "image";
  const frontUrl = useObjectUrl(isImage ? doc?.front : null);
  const backUrl = useObjectUrl(isImage ? doc?.back : null);

  if (!doc) return null;

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{config?.label ?? doc.type}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> From scan
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {doc.format === "pdf" ? "PDF" : "JPEG / PNG"}
        </span>
      </div>

      {doc.format === "pdf" ? (
        <div className="flex h-24 w-40 items-center justify-center gap-2 rounded border bg-muted text-xs text-muted-foreground">
          <FileText className="h-4 w-4" /> {doc.file?.name ?? "document.pdf"}
        </div>
      ) : (
        <div className="flex gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Front</p>
            <div className="relative h-24 w-32 overflow-hidden rounded border bg-white">
              {frontUrl ? (
                <Image src={frontUrl} alt="Document front" fill className="object-contain" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Not provided</div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Back</p>
            <div className="relative h-24 w-32 overflow-hidden rounded border bg-white">
              {backUrl ? (
                <Image src={backUrl} alt="Document back" fill className="object-contain" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Not provided</div>
              )}
            </div>
          </div>
        </div>
      )}

      {doc.idNumber && (
        <p className="text-xs text-muted-foreground">
          ID Number: <span className="text-foreground">{doc.idNumber}</span>
        </p>
      )}
    </Card>
  );
}