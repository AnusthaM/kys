"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Eraser,
  Square,
  Circle,
  Egg,
  Triangle,
  Star,
  ArrowRight,
  Minus,
  PaintBucket,
  Trash2,
  Download,
  Undo,
  Redo,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DrawingPoint {
  x: number;
  y: number;
}

type ShapeType = "circle" | "ellipse" | "square" | "triangle" | "line" | "arrow" | "star";

/** A freehand pen or eraser stroke. */
interface PathStroke {
  kind: "path";
  tool: "pen" | "eraser";
  points: DrawingPoint[];
  color: string;
  brushSize: number;
}

/** A shape (circle, square, arrow, etc.) drawn between two corner points. */
interface ShapeStroke {
  kind: "shape";
  shape: ShapeType;
  start: DrawingPoint;
  end: DrawingPoint;
  color: string;
  brushSize: number;
  filled: boolean;
}

/** A paint-bucket fill applied at a single point. */
interface FillStroke {
  kind: "fill";
  point: DrawingPoint;
  color: string;
}

type DrawingStroke = PathStroke | ShapeStroke | FillStroke;

type ToolType = "pen" | "eraser" | "shape" | "fill";

const SHAPES: { type: ShapeType; icon: typeof Circle; label: string }[] = [
  { type: "circle", icon: Circle, label: "Circle" },
  { type: "ellipse", icon: Egg, label: "Ellipse" },
  { type: "square", icon: Square, label: "Square" },
  { type: "triangle", icon: Triangle, label: "Triangle" },
  { type: "star", icon: Star, label: "Star" },
  { type: "line", icon: Minus, label: "Line" },
  { type: "arrow", icon: ArrowRight, label: "Arrow" },
];

const COLOR_PRESETS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
];

// ---------------------------------------------------------------------------
// Pure drawing helpers (no React, easy to reason about / test)
// ---------------------------------------------------------------------------

/** Traces the path for a shape between two corner points onto a 2D context. */
function traceShapePath(ctx: CanvasRenderingContext2D, shape: ShapeType, start: DrawingPoint, end: DrawingPoint) {
  const width = end.x - start.x;
  const height = end.y - start.y;
  const cx = (start.x + end.x) / 2;
  const cy = (start.y + end.y) / 2;

  ctx.beginPath();

  switch (shape) {
    case "circle": {
      const radius = Math.hypot(width, height) / 2;
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      break;
    }
    case "ellipse": {
      ctx.ellipse(cx, cy, Math.abs(width) / 2, Math.abs(height) / 2, 0, 0, Math.PI * 2);
      break;
    }
    case "square": {
      ctx.rect(start.x, start.y, width, height);
      break;
    }
    case "triangle": {
      ctx.moveTo(start.x + width / 2, start.y);
      ctx.lineTo(start.x, end.y);
      ctx.lineTo(end.x, end.y);
      ctx.closePath();
      break;
    }
    case "line": {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      break;
    }
    case "arrow": {
      const angle = Math.atan2(height, width);
      const headLen = Math.max(12, Math.hypot(width, height) * 0.2);
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.lineTo(
        end.x - headLen * Math.cos(angle - Math.PI / 6),
        end.y - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - headLen * Math.cos(angle + Math.PI / 6),
        end.y - headLen * Math.sin(angle + Math.PI / 6)
      );
      break;
    }
    case "star": {
      const outerR = Math.hypot(width, height) / 2;
      const innerR = outerR * 0.4;
      const spikes = 5;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;
      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
        rot += step;
      }
      ctx.closePath();
      break;
    }
  }
}

function hexToRgba(hex: string): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, 255];
}

/**
 * Classic scanline flood fill. Operates directly on the canvas's raw pixel
 * buffer (physical pixels), so callers must convert logical/CSS coordinates
 * to physical pixels (multiply by devicePixelRatio) before calling this.
 */
function floodFill(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  startX: number,
  startY: number,
  fillColor: [number, number, number, number],
  tolerance = 32
) {
  const x0 = Math.floor(startX);
  const y0 = Math.floor(startY);
  if (x0 < 0 || y0 < 0 || x0 >= width || y0 >= height) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const startIdx = (y0 * width + x0) * 4;
  const target: [number, number, number, number] = [
    data[startIdx],
    data[startIdx + 1],
    data[startIdx + 2],
    data[startIdx + 3],
  ];

  // Already the target color: nothing to do.
  if (
    Math.abs(target[0] - fillColor[0]) < 2 &&
    Math.abs(target[1] - fillColor[1]) < 2 &&
    Math.abs(target[2] - fillColor[2]) < 2 &&
    Math.abs(target[3] - fillColor[3]) < 2
  ) {
    return;
  }

  const tol2 = tolerance * tolerance;
  const matches = (idx: number) => {
    const dr = data[idx] - target[0];
    const dg = data[idx + 1] - target[1];
    const db = data[idx + 2] - target[2];
    const da = data[idx + 3] - target[3];
    return dr * dr + dg * dg + db * db + da * da <= tol2;
  };

  const stack: [number, number][] = [[x0, y0]];

  while (stack.length) {
    const [x, y] = stack.pop()!;

    let left = x;
    while (left >= 0 && matches((y * width + left) * 4)) left--;
    left++;

    let right = x;
    while (right < width && matches((y * width + right) * 4)) right++;
    right--;

    let spanAbove = false;
    let spanBelow = false;

    for (let i = left; i <= right; i++) {
      const idx = (y * width + i) * 4;
      data[idx] = fillColor[0];
      data[idx + 1] = fillColor[1];
      data[idx + 2] = fillColor[2];
      data[idx + 3] = fillColor[3];

      if (y > 0) {
        const aboveMatch = matches(((y - 1) * width + i) * 4);
        if (!spanAbove && aboveMatch) {
          stack.push([i, y - 1]);
          spanAbove = true;
        } else if (spanAbove && !aboveMatch) {
          spanAbove = false;
        }
      }
      if (y < height - 1) {
        const belowMatch = matches(((y + 1) * width + i) * 4);
        if (!spanBelow && belowMatch) {
          stack.push([i, y + 1]);
          spanBelow = true;
        } else if (spanBelow && !belowMatch) {
          spanBelow = false;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Live-drawing refs (avoid re-rendering on every mouse move).
  const isDrawingPathRef = useRef(false);
  const currentPathRef = useRef<DrawingPoint[]>([]);
  const shapeStartRef = useRef<DrawingPoint | null>(null);
  const isDrawingShapeRef = useRef(false);
  const hasMovedRef = useRef(false);

  // History is the single source of truth: `strokes` is always derived from
  // it, so there's no risk of the two getting out of sync.
  const [history, setHistory] = useState<DrawingStroke[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const strokes = history[historyIndex];

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<ToolType>("pen");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(8);
  const [shape, setShape] = useState<ShapeType>("circle");
  const [shapeFilled, setShapeFilled] = useState(false);

  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 650 });

  const getCanvasDimensions = useCallback(() => {
    if (typeof window === "undefined") return { width: 1000, height: 650 };
    const maxWidth = Math.min(window.innerWidth - 32, 1400);
    const maxHeight = Math.min(window.innerHeight - 280, 800);
    return { width: maxWidth, height: maxHeight };
  }, []);

  // --- Draw one stroke onto the context -----------------------------------
  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, stroke: DrawingStroke) => {
    if (stroke.kind === "path") {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;
      ctx.lineWidth = stroke.brushSize;
      ctx.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
      return;
    }

    if (stroke.kind === "shape") {
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = stroke.brushSize;
      traceShapePath(ctx, stroke.shape, stroke.start, stroke.end);
      if (stroke.filled && stroke.shape !== "line" && stroke.shape !== "arrow") {
        ctx.fill();
      } else {
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (stroke.kind === "fill") {
      const dpr = window.devicePixelRatio || 1;
      floodFill(ctx, canvas.width, canvas.height, stroke.point.x * dpr, stroke.point.y * dpr, hexToRgba(stroke.color));
    }
  }, []);

  // --- Replay every stroke from scratch -----------------------------------
  const redrawCanvas = useCallback(
    (strokeList?: DrawingStroke[]) => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      for (const stroke of strokeList ?? strokes) {
        drawStroke(ctx, canvas, stroke);
      }
    },
    [strokes, drawStroke]
  );

  // --- Initialize + handle resize -----------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setup = (dimensions: { width: number; height: number }) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = dimensions.width * dpr;
      canvas.height = dimensions.height * dpr;
      canvas.style.width = `${dimensions.width}px`;
      canvas.style.height = `${dimensions.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctxRef.current = ctx;
      }
    };

    const dimensions = getCanvasDimensions();
    setCanvasSize(dimensions);
    setup(dimensions);

    const handleResize = () => {
      const newDimensions = getCanvasDimensions();
      setCanvasSize(newDimensions);
      setup(newDimensions);
      requestAnimationFrame(() => redrawCanvas());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCanvasDimensions]);

  // --- Redraw whenever the committed strokes change -----------------------
  useEffect(() => {
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  // --- History management ---------------------------------------------------
  const pushHistory = useCallback(
    (newStrokes: DrawingStroke[]) => {
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), newStrokes]);
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    setHistoryIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setHistoryIndex((prev) => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const clearCanvas = useCallback(() => {
    if (strokes.length === 0) return;
    pushHistory([]);
  }, [strokes, pushHistory]);

  // Keyboard shortcuts for undo/redo.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // --- Coordinates ----------------------------------------------------------
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): DrawingPoint | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ("touches" in e) {
        if (e.touches.length === 0) return null;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
        e.preventDefault();
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const dpr = window.devicePixelRatio || 1;
      const scaleX = canvas.width / dpr / rect.width;
      const scaleY = canvas.height / dpr / rect.height;

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    []
  );

  // --- Shape preview while dragging -----------------------------------------
  const previewShape = useCallback(
    (start: DrawingPoint, end: DrawingPoint) => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;

      redrawCanvas();
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = brushSize;
      traceShapePath(ctx, shape, start, end);
      if (shapeFilled && shape !== "line" && shape !== "arrow") {
        ctx.fill();
      } else {
        ctx.stroke();
      }
      ctx.restore();
    },
    [redrawCanvas, color, brushSize, shape, shapeFilled]
  );

  // --- Pointer handlers -------------------------------------------------------
  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const coords = getCanvasCoords(e);
      if (!coords || !ctxRef.current) return;

      if (tool === "fill") {
        pushHistory([...strokes, { kind: "fill", point: coords, color }]);
        return;
      }

      if (tool === "shape") {
        shapeStartRef.current = coords;
        isDrawingShapeRef.current = true;
        hasMovedRef.current = false;
        return;
      }

      isDrawingPathRef.current = true;
      setIsDrawing(true);
      currentPathRef.current = [coords];
      hasMovedRef.current = false;
    },
    [getCanvasCoords, tool, strokes, color, pushHistory]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const coords = getCanvasCoords(e);
      if (!coords || !ctxRef.current) return;

      if (tool === "shape" && isDrawingShapeRef.current && shapeStartRef.current) {
        hasMovedRef.current = true;
        previewShape(shapeStartRef.current, coords);
        return;
      }

      if (!isDrawingPathRef.current) return;

      const ctx = ctxRef.current;
      const points = [...currentPathRef.current, coords];
      currentPathRef.current = points;
      hasMovedRef.current = true;

      redrawCanvas();

      if (points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
        ctx.lineWidth = brushSize;
        ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      }
    },
    [getCanvasCoords, tool, redrawCanvas, previewShape, color, brushSize]
  );

  const finishDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (tool === "shape" && isDrawingShapeRef.current && shapeStartRef.current) {
        const coords = getCanvasCoords(e) ?? shapeStartRef.current;
        if (hasMovedRef.current) {
          const newStroke: ShapeStroke = {
            kind: "shape",
            shape,
            start: shapeStartRef.current,
            end: coords,
            color,
            brushSize,
            filled: shapeFilled,
          };
          pushHistory([...strokes, newStroke]);
        } else {
          redrawCanvas();
        }
        isDrawingShapeRef.current = false;
        shapeStartRef.current = null;
        hasMovedRef.current = false;
        return;
      }

      if (!isDrawingPathRef.current) return;

      isDrawingPathRef.current = false;
      setIsDrawing(false);

      if (currentPathRef.current.length < 2 || !hasMovedRef.current) {
        currentPathRef.current = [];
        hasMovedRef.current = false;
        return;
      }

      const newStroke: PathStroke = {
        kind: "path",
        tool: tool === "eraser" ? "eraser" : "pen",
        points: [...currentPathRef.current],
        color,
        brushSize,
      };
      pushHistory([...strokes, newStroke]);

      currentPathRef.current = [];
      hasMovedRef.current = false;
    },
    [tool, color, brushSize, shape, shapeFilled, getCanvasCoords, strokes, pushHistory, redrawCanvas]
  );

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setBrushSize((prev) => Math.max(2, Math.min(100, e.deltaY > 0 ? prev - 2 : prev + 2)));
  }, []);

  const exportImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  const cursorClass = tool === "fill" ? "cursor-copy" : "cursor-crosshair";

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-[1600px] mx-auto min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Drawing Canvas</h1>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg shadow-md border border-gray-200 w-full">
        {/* Color picker + presets */}
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-gray-300"
            disabled={tool === "eraser"}
            aria-label="Color"
          />
          <div className="flex items-center gap-0.5 ml-1">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setColor(preset)}
                className="w-4 h-4 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: preset }}
                aria-label={`Use color ${preset}`}
              />
            ))}
          </div>
        </div>

        {/* Brush size */}
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium text-gray-700">Size</label>
          <input
            type="range"
            min={2}
            max={100}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-gray-500 w-8">{brushSize}px</span>
        </div>

        <div className="w-px h-8 bg-gray-300" />

        {/* Tools */}
        <Button variant={tool === "pen" ? "default" : "outline"} size="sm" onClick={() => setTool("pen")} className="flex items-center gap-1">
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Pen</span>
        </Button>

        <Button variant={tool === "eraser" ? "default" : "outline"} size="sm" onClick={() => setTool("eraser")} className="flex items-center gap-1">
          <Eraser className="h-4 w-4" />
          <span className="hidden sm:inline">Eraser</span>
        </Button>

        <Button variant={tool === "shape" ? "default" : "outline"} size="sm" onClick={() => setTool("shape")} className="flex items-center gap-1">
          <Square className="h-4 w-4" />
          <span className="hidden sm:inline">Shape</span>
        </Button>

        <Button variant={tool === "fill" ? "default" : "outline"} size="sm" onClick={() => setTool("fill")} className="flex items-center gap-1">
          <PaintBucket className="h-4 w-4" />
          <span className="hidden sm:inline">Fill</span>
        </Button>

        {tool === "shape" && (
          <>
            <div className="w-px h-8 bg-gray-300" />
            {SHAPES.map(({ type, icon: Icon, label }) => (
              <Button
                key={type}
                variant={shape === type ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShape(type)}
                className="flex items-center gap-1"
                aria-label={label}
                title={label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
            <Button
              variant={shapeFilled ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShapeFilled((v) => !v)}
              disabled={shape === "line" || shape === "arrow"}
              className="text-xs"
            >
              {shapeFilled ? "Filled" : "Outline"}
            </Button>
          </>
        )}

        <div className="w-px h-8 bg-gray-300" />

        {/* Actions */}
        <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0} className="flex items-center gap-1">
          <Undo className="h-4 w-4" />
          <span className="hidden sm:inline">Undo</span>
        </Button>

        <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1} className="flex items-center gap-1">
          <Redo className="h-4 w-4" />
          <span className="hidden sm:inline">Redo</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          disabled={strokes.length === 0}
          className="flex items-center gap-1 text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Clear</span>
        </Button>

        <Button variant="outline" size="sm" onClick={exportImage} disabled={strokes.length === 0} className="flex items-center gap-1">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      {/* Canvas - now responsive, fills available width */}
      <div className="relative w-full max-w-[1600px] bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className={`touch-none w-full h-auto max-h-[calc(100vh-280px)] ${cursorClass}`}
          style={{
            width: "100%",
            height: "auto",
            maxHeight: "calc(100vh - 280px)",
            objectFit: "contain",
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={finishDrawing}
          onMouseLeave={finishDrawing}
          onWheel={handleWheel}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={finishDrawing}
        />

        <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none bg-white/70 px-2 py-1 rounded">
          {tool === "shape" && "Click and drag to draw shape"}
          {tool === "fill" && "Click an area to fill it"}
          {(tool === "pen" || tool === "eraser") && "Click and drag to draw | Scroll to change brush size"}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex flex-wrap justify-between items-center w-full text-xs text-gray-500 px-2">
        <span>
          Tool: {tool.charAt(0).toUpperCase() + tool.slice(1)}
          {tool === "shape" && ` (${shape}${shapeFilled ? ", filled" : ""})`}
        </span>
        <span>
          Strokes: {strokes.length} | History: {historyIndex + 1}/{history.length}
        </span>
        <span className="hidden sm:block">
          {isDrawing ? "Drawing..." : "Ready"} | Brush: {brushSize}px
        </span>
      </div>
    </div>
  );
}