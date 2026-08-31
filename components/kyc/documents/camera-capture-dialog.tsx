"use client";

import { CameraCaptureDialogProps } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function CameraCaptureDialog({
  open,
  onOpenChange,
  onCapture,
  fileName = "capture.jpg",
}: CameraCaptureDialogProps) {

  //refrence to the video element displaying camera feed
  const videoRef = useRef<HTMLVideoElement>(null);
  // Reference to the camera stream for cleanup
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Reset UI state when `open` changes (render-time, not effect) ---
  //runs durinmg render to reset state immediately when dialog open/closes
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      //when dialog opens, clear any previous photo or error
      setPreview(null);
      setError(null);
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  // --- Sync with the camera (external system) ---
  useEffect(() => {
    if (!open) {
      stopStream();
      return;
    }
    //flag to prevent state updates if component unmounts
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        if (!cancelled) setError("Camera access denied or unavailable.");
      });

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open]);

  async function retake() {
    setPreview(null);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setError("Camera access denied or unavailable.");
    }
  }

  function takePhoto() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setPreview(canvas.toDataURL("image/jpeg", 0.9));
    stopStream();
  }

  function confirmPhoto() {
    if (!preview) return;
    fetch(preview)
      .then((r) => r.blob())
      .then((blob) => {
        onCapture(new File([blob], fileName, { type: "image/jpeg" }));
        onOpenChange(false);
      });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take a photo</DialogTitle>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!preview ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-md bg-black"
          />
        ) : (
          <div className="relative aspect-video w-full">
            <Image
              src={preview}
              alt="Captured"
              className="rounded-md object-cover"
              fill
              unoptimized
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          {!preview ? (
            <Button onClick={takePhoto} disabled={!!error}>
              <Camera className="mr-2 h-4 w-4" /> Capture
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={retake}>
                <RotateCcw className="mr-2 h-4 w-4" /> Retake
              </Button>
              <Button onClick={confirmPhoto}>Use photo</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}