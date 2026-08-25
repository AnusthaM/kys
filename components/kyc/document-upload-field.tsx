"use client"

import { DocumentUploadFieldProps } from "@/lib/types";
import { useRef, useState } from "react";
import { Card } from "../ui/card";
import { Camera, Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import CameraCaptureDialog from "./camera-capture-dialog";

export function DocumentUploadield({
    label,
    value,
    onChange,
    allowCamera,
    error,
}: DocumentUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [cameraOpen, setCameraOpen] = useState(false);

    const previewUrl = value && value.type.startsWith("image/") ? URL.createObjectURL(value) : null;


  return (
    <div>
        <p className="text-sm">
            {label}
        </p>

        <Card className="flex flex-col items-center justify-center gap-3 border-dashed p-4">
        {value ? (
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              {previewUrl ? (
                <Image
                src={previewUrl}
                alt={label}
                fill
                className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <FileText className="h-8 w-8 text-muted-foreground" />
              )}
              <span className="truncate text-sm">{value.name}</span>
            </div>
            <Button size="icon" variant="ghost" onClick={() => onChange(undefined)}>
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

        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0])}
        />
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {allowCamera && (
        <CameraCaptureDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={(file)=> onChange(file)}
        fileName={`${label.toLowerCase().replace(/\s+/g, "-")}.jpg`}
        />
      )}
    </div>
  )
}
