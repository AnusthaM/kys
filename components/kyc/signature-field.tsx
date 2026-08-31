"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Undo, Trash2, Check, PenLine, X } from "lucide-react";
import Image from "next/image";
import jsPDF from "jspdf";

interface Point {
  x: number;
  y: number;
}

interface SignatureFieldProps {
  value?: File;
  onChange: (file?: File) => void;
}

const CANVAS_W = 500;
const CANVAS_H = 180;

function fillWhite(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

export function SignatureField({ value, onChange }: SignatureFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const strokesRef = useRef<Point[][]>([]);
  const drawingRef = useRef(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [hasInk, setHasInk] = useState(false);
  const [format, setFormat] = useState<"image" | "pdf">("image");
  const previewUrl =
    value && value.type.startsWith("image/")
      ? URL.createObjectURL(value)
      : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || value) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.5;
    fillWhite(ctx);
    ctxRef.current = ctx;
  }, [value]);

  const redraw = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    fillWhite(ctx);
    strokesRef.current.forEach((stroke) => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
    setHasInk(strokesRef.current.length > 0);
  }, []);

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    strokesRef.current.push([getPoint(e)]);
    setStrokeCount(strokesRef.current.length);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const stroke = strokesRef.current[strokesRef.current.length - 1];
    const point = getPoint(e);
    const prev = stroke[stroke.length - 1];
    stroke.push(point);
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    setHasInk(true);
  }

  function handlePointerUp() {
    drawingRef.current = false;
  }

  function undo() {
    strokesRef.current.pop();
    setStrokeCount(strokesRef.current.length);
    redraw();
  }

  function clear() {
    strokesRef.current = [];
    setStrokeCount(0);
    redraw();
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (format === "pdf") {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [CANVAS_W, CANVAS_H],
      });
      pdf.addImage(imgData, "PNG", 0, 0, CANVAS_W, CANVAS_H);
      const blob = pdf.output("blob");
      onChange(new File([blob], "signature.pdf", { type: "application/pdf" }));
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (blob)
          onChange(new File([blob], "signature.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }

  if (value) {
    return (
      <Card className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          {previewUrl ? (
            <div className="relative h-16 w-40 overflow-hidden rounded border bg-white">
              <Image
                src={previewUrl}
                alt="Signature"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-16 w-40 items-center justify-center rounded border bg-muted text-xs text-muted-foreground">
              signature.pdf
            </div>
          )}
          <span className="text-sm text-muted-foreground">{value.name}</span>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => onChange(undefined)}
        >
          <X className="h-4 w-4" />
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-3 p-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full touch-none rounded border bg-white"
        style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={strokeCount === 0}
          >
            <Undo className="mr-1.5 h-3.5 w-3.5" /> Undo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clear}
            disabled={!hasInk}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFormat("image")}
              className={`rounded px-2 py-1 ${format === "image" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              JPEG
            </button>
            <button
              type="button"
              onClick={() => setFormat("pdf")}
              className={`rounded px-2 py-1 ${format === "pdf" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              PDF
            </button>
          </div>
          <Button type="button" size="sm" onClick={save} disabled={!hasInk}>
            <Check className="mr-1.5 h-3.5 w-3.5" /> Use signature
          </Button>
        </div>
      </div>

      {!hasInk && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <PenLine className="h-3.5 w-3.5" /> Draw your signature above
        </p>
      )}
    </Card>
  );
}
