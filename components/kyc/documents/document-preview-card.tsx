"use client";

import { useEffect, useState } from "react";
import { useWatch, type Control } from "react-hook-form";
import { KycFormValues, DOCUMENT_TYPES } from "@/lib/kyc-schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, FileText, ExternalLink } from "lucide-react";
import { ZoomableImage } from "../common/zoomable-image";

interface DocumentPreviewCardProps {
  control: Control<KycFormValues>;
  index: number;
}

function useObjectUrl(file: File | undefined | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local preview state to a browser File
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

export function DocumentPreviewCard({
  control,
  index,
}: DocumentPreviewCardProps) {
  const doc = useWatch({ control, name: `documents.${index}` });
  const config = DOCUMENT_TYPES.find((d) => d.value === doc?.type);

  const isImage = doc?.format === "image";
  const frontUrl = useObjectUrl(isImage ? doc?.front : null);
  const backUrl = useObjectUrl(isImage ? doc?.back : null);
  const pdfUrl = useObjectUrl(!isImage ? doc?.file : null);

  if (!doc) return null;

  const showBack = !!config?.requiresBack;

  return (
    <Card className="space-y-3 border-border/60 bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {config?.label ?? doc.type}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Lock className="h-3 w-3" /> From scan
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {doc.format === "pdf" ? "PDF" : "JPEG / PNG"}
        </span>
      </div>

      {doc.format === "pdf" ? (
        <div className="flex items-center gap-3">
          <div className="flex h-24 w-32 items-center justify-center gap-2 rounded-lg border bg-background p-2 text-xs text-muted-foreground">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">
              {doc.file?.name ?? "document.pdf"}
            </span>
          </div>
          {pdfUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(pdfUrl, "_blank")}
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View PDF
            </Button>
          )}
        </div>
      ) : (
        <div className="flex gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Front</p>
            {frontUrl ? (
              <ZoomableImage
                src={frontUrl}
                alt="Document front"
                className="h-24 w-32 rounded-lg border"
              />
            ) : (
              <div className="flex h-24 w-32 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                Not provided
              </div>
            )}
          </div>
          {showBack && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Back</p>
              {backUrl ? (
                <ZoomableImage
                  src={backUrl}
                  alt="Document back"
                  className="h-24 w-32 rounded-lg border"
                />
              ) : (
                <div className="flex h-24 w-32 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                  Not provided
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {doc.idNumber && (
        <p className="text-xs text-muted-foreground">
          ID Number: <span className="font-medium text-foreground">{doc.idNumber}</span>
        </p>
      )}
    </Card>
  );
}