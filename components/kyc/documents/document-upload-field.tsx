"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, X, FileText } from "lucide-react";
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
  // --- Derived state: Generate preview URL for image files ---
  const previewUrl = value && value.type.startsWith("image/") ? URL.createObjectURL(value) : null;

  return (
    <div className="space-y-2">
      <Card className="flex flex-col items-center justify-center gap-3 border-dashed p-4">
        {value ? (
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              {previewUrl ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                  <Image src={previewUrl} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate text-sm">{value.name}</span>
            </div>
            <Button type="button" size="icon" variant="ghost" onClick={() => onChange(undefined)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
            {allowCamera && (
              <Button type="button" variant="outline" onClick={() => setCameraOpen(true)}>
                <Camera className="mr-2 h-4 w-4" /> Camera
              </Button>
            )}
          </div>
        )}
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => onChange(e.target.files?.[0])} />
      </Card>

      {allowCamera && (
        <CameraCaptureDialog open={cameraOpen} onOpenChange={setCameraOpen} onCapture={(file) => onChange(file)} fileName="capture.jpg" />
      )}
    </div>
  );
}