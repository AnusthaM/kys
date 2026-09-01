"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, FileText, CheckCircle2 } from "lucide-react";
import { CameraCaptureDialog } from "./camera-capture-dialog";
import Image from "next/image";

interface DocumentUploadFieldProps {
  value?: File;
  onChange: (file?: File) => void;
  allowCamera?: boolean;
  accept?: string;
}

export function DocumentUploadField({ value, onChange, allowCamera, accept = "image/*,.pdf" }: DocumentUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  // --- Derived state: Generate preview URL for image files ---
  const previewUrl = value && value.type.startsWith("image/") ? URL.createObjectURL(value) : null;

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onChange(file);
  }

  if (value) {
    return (
      <div className="space-y-2">
        <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            {previewUrl ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border">
                <Image src={previewUrl} alt="" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{value.name}</p>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" /> Uploaded
              </div>
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onChange(undefined)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {allowCamera && (
          <CameraCaptureDialog open={cameraOpen} onOpenChange={setCameraOpen} onCapture={(file) => onChange(file)} fileName="capture.jpg" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragOver ? "border-primary bg-primary/5" : "border-border/70 bg-muted/20"
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload className="h-4.5 w-4.5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-primary underline-offset-4 hover:underline"
            >
              Click to upload
            </button>{" "}
            or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            {accept.includes("pdf") ? "Image or PDF" : "PNG or JPG"}
          </p>
        </div>
        {allowCamera && (
          <Button type="button" variant="outline" size="sm" onClick={() => setCameraOpen(true)}>
            <Camera className="mr-2 h-4 w-4" /> Use camera instead
          </Button>
        )}
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => onChange(e.target.files?.[0])} />
      </div>

      {allowCamera && (
        <CameraCaptureDialog open={cameraOpen} onOpenChange={setCameraOpen} onCapture={(file) => onChange(file)} fileName="capture.jpg" />
      )}
    </div>
  );
}