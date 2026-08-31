"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Pencil, 
  Eraser, 
  Square, 
  Circle, 
  Minus,
  Trash2,
  Download,
  Undo,
  Redo
} from "lucide-react";

interface DrawingPoint {
  x: number;
  y: number;
}

interface DrawingStroke {
  points: DrawingPoint[];
  color: string;
  brushSize: number;
  tool: 'pen' | 'eraser';
  shape?: 'circle' | 'square' | 'line'; // For shape strokes
}

export function DrawingCanvas() {
  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<DrawingPoint[]>([]);
  const isDrawingShapeRef = useRef(false);
  const startPointRef = useRef<DrawingPoint | null>(null);
  const hasDrawnRef = useRef(false);
  const shapeRef = useRef<'circle' | 'square' | 'line'>('circle');
  
  // --- State ---
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [history, setHistory] = useState<DrawingStroke[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const [tool, setTool] = useState<'pen' | 'eraser' | 'shape'>('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(8);
  const [shape, setShape] = useState<'circle' | 'square' | 'line'>('circle');
  
  // --- Canvas dimensions ---
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 650 });

  // --- Get canvas dimensions based on window size ---
  const getCanvasDimensions = useCallback(() => {
    if (typeof window === 'undefined') return { width: 1000, height: 650 };
    const maxWidth = Math.min(window.innerWidth - 32, 1200);
    const maxHeight = Math.min(window.innerHeight - 280, 700);
    return { width: maxWidth, height: maxHeight };
  }, []);

  // --- Redraw all strokes ---
  const redrawCanvas = useCallback((strokeList?: DrawingStroke[]) => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    
    const strokesToDraw = strokeList || strokes;
    
    strokesToDraw.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      // Handle shape strokes
      if (stroke.shape) {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        const width = end.x - start.x;
        const height = end.y - start.y;
        
        ctx.save();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.brushSize;
        ctx.globalCompositeOperation = 'source-over';
        
        switch(stroke.shape) {
          case 'circle':
            ctx.beginPath();
            const radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) / 2;
            const centerX = (start.x + end.x) / 2;
            const centerY = (start.y + end.y) / 2;
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
            break;
          case 'square':
            ctx.strokeRect(start.x, start.y, width, height);
            break;
          case 'line':
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            break;
        }
        ctx.restore();
        return;
      }
      
      // Handle pen/eraser strokes
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
      ctx.lineWidth = stroke.brushSize;
      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.stroke();
    });
    
    ctx.globalCompositeOperation = 'source-over';
  }, [strokes]);

  // --- Initialize canvas ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get dimensions
    const dimensions = getCanvasDimensions();
    setCanvasSize(dimensions);
    
    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctxRef.current = ctx;
    }
    
    // Handle resize
    const handleResize = () => {
      const newDimensions = getCanvasDimensions();
      setCanvasSize(newDimensions);
      
      const dpr = window.devicePixelRatio || 1;
      canvas.width = newDimensions.width * dpr;
      canvas.height = newDimensions.height * dpr;
      canvas.style.width = `${newDimensions.width}px`;
      canvas.style.height = `${newDimensions.height}px`;
      
      if (ctxRef.current) {
        ctxRef.current.scale(dpr, dpr);
        ctxRef.current.lineCap = 'round';
        ctxRef.current.lineJoin = 'round';
        setTimeout(() => redrawCanvas(), 0);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getCanvasDimensions, redrawCanvas]);

  // --- Redraw when strokes change ---
  useEffect(() => {
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  // --- Save current state to history ---
  const saveToHistory = useCallback((newStrokes: DrawingStroke[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push([...newStrokes]);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // --- Get canvas coordinates ---
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Scale coordinates to match canvas size
    const dpr = window.devicePixelRatio || 1;
    const scaleX = (canvas.width / dpr) / rect.width;
    const scaleY = (canvas.height / dpr) / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  // --- Draw shape preview ---
  const drawShapePreview = useCallback((start: DrawingPoint, end: DrawingPoint) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    // Redraw all strokes first
    redrawCanvas();
    
    // Draw shape preview on top
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.globalCompositeOperation = 'source-over';
    
    const width = end.x - start.x;
    const height = end.y - start.y;
    
    switch(shape) {
      case 'circle':
        ctx.beginPath();
        const radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) / 2;
        const centerX = (start.x + end.x) / 2;
        const centerY = (start.y + end.y) / 2;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'square':
        ctx.strokeRect(start.x, start.y, width, height);
        break;
      case 'line':
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
    }
    
    ctx.restore();
  }, [redrawCanvas, color, brushSize, shape]);

  // --- Start drawing ---
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords || !ctxRef.current) return;
    
    if (tool === 'shape') {
      startPointRef.current = coords;
      isDrawingShapeRef.current = true;
      shapeRef.current = shape;
      hasDrawnRef.current = false;
      return;
    }
    
    isDrawingRef.current = true;
    setIsDrawing(true);
    currentStrokeRef.current = [coords];
    hasDrawnRef.current = false;
  }, [getCanvasCoords, tool, shape]);

  // --- Draw ---
  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords || !ctxRef.current) return;
    
    if (tool === 'shape' && isDrawingShapeRef.current && startPointRef.current) {
      hasDrawnRef.current = true;
      drawShapePreview(startPointRef.current, coords);
      return;
    }
    
    if (!isDrawingRef.current) return;
    
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    
    // Add point to current stroke
    const points = [...currentStrokeRef.current, coords];
    currentStrokeRef.current = points;
    hasDrawnRef.current = true;
    
    // Redraw everything
    redrawCanvas();
    
    // Draw current stroke on top
    if (points.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = brushSize;
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [getCanvasCoords, tool, redrawCanvas, drawShapePreview, color, brushSize]);

  // --- Finish drawing ---
  const finishDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Handle shape drawing
    if (tool === 'shape' && isDrawingShapeRef.current && startPointRef.current) {
      const coords = getCanvasCoords(e);
      if (coords && hasDrawnRef.current) {
        // Save the shape as a stroke
        const newStroke: DrawingStroke = {
          points: [startPointRef.current, coords],
          color: color,
          brushSize: brushSize,
          tool: 'pen',
          shape: shapeRef.current
        };
        
        setStrokes(prev => {
          const newStrokes = [...prev, newStroke];
          saveToHistory(newStrokes);
          return newStrokes;
        });
        
        isDrawingShapeRef.current = false;
        startPointRef.current = null;
        hasDrawnRef.current = false;
        
        // Redraw with the shape included
        setTimeout(() => {
          redrawCanvas();
        }, 0);
      } else {
        // Cancel shape drawing
        isDrawingShapeRef.current = false;
        startPointRef.current = null;
        hasDrawnRef.current = false;
        redrawCanvas();
      }
      return;
    }
    
    // Handle pen/eraser drawing
    if (!isDrawingRef.current) {
      return;
    }
    
    if (currentStrokeRef.current.length < 2 || !hasDrawnRef.current) {
      isDrawingRef.current = false;
      setIsDrawing(false);
      currentStrokeRef.current = [];
      hasDrawnRef.current = false;
      return;
    }
    
    const newStroke: DrawingStroke = {
      points: [...currentStrokeRef.current],
      color: tool === 'eraser' ? '#ffffff' : color,
      brushSize: brushSize,
      tool: tool === 'eraser' ? 'eraser' : 'pen'
    };
    
    setStrokes(prev => {
      const newStrokes = [...prev, newStroke];
      saveToHistory(newStrokes);
      return newStrokes;
    });
    
    isDrawingRef.current = false;
    setIsDrawing(false);
    currentStrokeRef.current = [];
    hasDrawnRef.current = false;
  }, [tool, color, brushSize, getCanvasCoords, saveToHistory, redrawCanvas]);

  // --- Handle mouse wheel for brush size ---
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setBrushSize(prev => {
      const newSize = e.deltaY > 0 ? prev - 2 : prev + 2;
      return Math.max(2, Math.min(40, newSize));
    });
  }, []);

  // --- Undo ---
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setStrokes(history[newIndex]);
    setTimeout(() => redrawCanvas(history[newIndex]), 0);
  }, [historyIndex, history, redrawCanvas]);

  // --- Redo ---
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setStrokes(history[newIndex]);
    setTimeout(() => redrawCanvas(history[newIndex]), 0);
  }, [historyIndex, history, redrawCanvas]);

  // --- Clear canvas ---
  const clearCanvas = useCallback(() => {
    if (strokes.length === 0) return;
    setStrokes([]);
    saveToHistory([]);
    setTimeout(() => redrawCanvas([]), 0);
  }, [strokes, saveToHistory, redrawCanvas]);

  // --- Export image ---
  const exportImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-6xl mx-auto">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-800">Drawing Canvas</h1>
      
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg shadow-md border border-gray-200 w-full">
        {/* Color picker */}
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium text-gray-700">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-gray-300"
            disabled={tool === 'eraser'}
          />
        </div>
        
        {/* Brush size */}
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium text-gray-700">Size</label>
          <input
            type="range"
            min={2}
            max={40}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-gray-500 w-8">{brushSize}px</span>
        </div>
        
        <div className="w-px h-8 bg-gray-300" />
        
        {/* Tools */}
        <Button
          variant={tool === 'pen' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTool('pen')}
          className="flex items-center gap-1"
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Pen</span>
        </Button>
        
        <Button
          variant={tool === 'eraser' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTool('eraser')}
          className="flex items-center gap-1"
        >
          <Eraser className="h-4 w-4" />
          <span className="hidden sm:inline">Eraser</span>
        </Button>
        
        <Button
          variant={tool === 'shape' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTool('shape')}
          className="flex items-center gap-1"
        >
          <Square className="h-4 w-4" />
          <span className="hidden sm:inline">Shape</span>
        </Button>
        
        {tool === 'shape' && (
          <>
            <div className="w-px h-8 bg-gray-300" />
            <Button
              variant={shape === 'circle' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShape('circle')}
              className="flex items-center gap-1"
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              variant={shape === 'square' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShape('square')}
              className="flex items-center gap-1"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={shape === 'line' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShape('line')}
              className="flex items-center gap-1"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </>
        )}
        
        <div className="w-px h-8 bg-gray-300" />
        
        {/* Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={historyIndex <= 0}
          className="flex items-center gap-1"
        >
          <Undo className="h-4 w-4" />
          <span className="hidden sm:inline">Undo</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="flex items-center gap-1"
        >
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
        
        <Button
          variant="outline"
          size="sm"
          onClick={exportImage}
          disabled={strokes.length === 0}
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
      
      {/* Canvas */}
      <div className="relative w-full bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="touch-none w-full h-auto cursor-crosshair"
          style={{ 
            width: '100%',
            height: 'auto',
            aspectRatio: `${canvasSize.width}/${canvasSize.height}`
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
        
        {/* Watermark hint */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none">
          {tool === 'shape' ? 'Click and drag to draw shape' : 'Click and drag to draw | Scroll to change brush size'}
        </div>
      </div>
      
      {/* Status bar */}
      <div className="flex flex-wrap justify-between items-center w-full text-xs text-gray-500 px-2">
        <span>
          Tools: {tool.charAt(0).toUpperCase() + tool.slice(1)}
          {tool === 'shape' && ` (${shape})`}
        </span>
        <span>
          Strokes: {strokes.length} | History: {historyIndex + 1}/{history.length}
        </span>
        <span className="hidden sm:block">
          {isDrawing ? 'Drawing...' : 'Ready'} | Brush: {brushSize}px
        </span>
      </div>
    </div>
  );
}