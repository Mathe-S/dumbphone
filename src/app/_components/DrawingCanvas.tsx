"use client";

import { useRef, useState, useEffect } from "react";
import {
  Download,
  Eraser,
  Pencil,
  Undo,
  Redo,
  Trash2,
  Palette,
  Sparkles,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { api } from "@/trpc/react";

interface Point {
  x: number;
  y: number;
}

interface DrawingPath {
  points: Point[];
  color: string;
  width: number;
}

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [redoStack, setRedoStack] = useState<DrawingPath[]>([]);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushWidth, setBrushWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [caption, setCaption] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null,
  );
  const [showResults, setShowResults] = useState(false);

  const generateCaption = api.caption.generateFromBase64.useMutation({
    onSuccess: (data) => {
      setCaption(data.caption);
      setShowResults(true);
    },
    onError: (error) => {
      console.error("Caption generation failed:", error);
      alert("Failed to generate caption. Please try again.");
    },
  });

  const generateImage = api.caption.generateImageFromCaption.useMutation({
    onSuccess: (data) => {
      console.log("Image generated successfully:", data.imageUrl);
      setGeneratedImageUrl(data.imageUrl);
    },
    onError: (error) => {
      console.error("Image generation failed:", error);
      alert("Failed to generate image. Please try again.");
    },
  });

  const colors = [
    "#000000",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw all paths
    paths.forEach((path) => {
      if (path.points.length < 2) return;

      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(path.points[0]!.x, path.points[0]!.y);

      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i]!.x, path.points[i]!.y);
      }

      ctx.stroke();
    });

    // Draw current path
    if (currentPath.length > 1) {
      ctx.strokeStyle = isEraser ? "#ffffff" : brushColor;
      ctx.lineWidth = isEraser ? brushWidth * 3 : brushWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(currentPath[0]!.x, currentPath[0]!.y);

      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i]!.x, currentPath[i]!.y);
      }

      ctx.stroke();
    }
  }, [paths, currentPath, brushColor, brushWidth, isEraser]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const getTouchCoordinates = (
    e: React.TouchEvent<HTMLCanvasElement>,
  ): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return { x: 0, y: 0 };

    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  const startDrawing = (point: Point) => {
    setIsDrawing(true);
    setCurrentPath([point]);
    setRedoStack([]);
  };

  const draw = (point: Point) => {
    if (!isDrawing) return;
    setCurrentPath((prev) => [...prev, point]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPath.length > 1) {
      setPaths((prev) => [
        ...prev,
        {
          points: currentPath,
          color: isEraser ? "#ffffff" : brushColor,
          width: isEraser ? brushWidth * 3 : brushWidth,
        },
      ]);
    }

    setCurrentPath([]);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    startDrawing(getCoordinates(e));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    draw(getCoordinates(e));
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    startDrawing(getTouchCoordinates(e));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    draw(getTouchCoordinates(e));
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  const undo = () => {
    if (paths.length === 0) return;
    const lastPath = paths[paths.length - 1];
    if (!lastPath) return;

    setRedoStack((prev) => [...prev, lastPath]);
    setPaths((prev) => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const lastRedo = redoStack[redoStack.length - 1];
    if (!lastRedo) return;

    setPaths((prev) => [...prev, lastRedo]);
    setRedoStack((prev) => prev.slice(0, -1));
  };

  const clear = () => {
    setPaths([]);
    setRedoStack([]);
    setCurrentPath([]);
  };

  const exportImage = (format: "png" | "jpg") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `drawing-${Date.now()}.${format}`;
    link.href = canvas.toDataURL(`image/${format === "jpg" ? "jpeg" : "png"}`);
    link.click();
  };

  const handleGenerateCaption = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reset previous results
    setCaption(null);
    setGeneratedImageUrl(null);
    setShowResults(false);

    // Get canvas data as base64
    const dataUrl = canvas.toDataURL("image/png");

    // Generate caption
    generateCaption.mutate({ imageBase64: dataUrl });
  };

  const handleGenerateImage = () => {
    if (!caption) return;
    generateImage.mutate({ caption });
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setCaption(null);
    setGeneratedImageUrl(null);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-white p-3">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1 rounded-lg border bg-gray-50 p-1">
          <button
            onClick={() => setIsEraser(false)}
            className={`rounded p-2 transition ${
              !isEraser
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Pencil"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsEraser(true)}
            className={`rounded p-2 transition ${
              isEraser
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="Eraser"
          >
            <Eraser className="h-4 w-4" />
          </button>
        </div>

        {/* Color Picker */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm transition hover:bg-gray-50"
            title="Color"
          >
            <Palette className="h-4 w-4" />
            <div
              className="h-5 w-5 rounded border"
              style={{ backgroundColor: brushColor }}
            />
          </button>

          {showColorPicker && (
            <div className="absolute left-0 top-full z-10 mt-1 grid grid-cols-5 gap-2 rounded-lg border bg-white p-3 shadow-lg">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setBrushColor(color);
                    setShowColorPicker(false);
                  }}
                  className="h-8 w-8 rounded border-2 transition hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: color === brushColor ? "#000" : "#e5e7eb",
                  }}
                  title={color}
                />
              ))}
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="col-span-5 h-8 w-full cursor-pointer rounded border"
                title="Custom color"
              />
            </div>
          )}
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm">
          <span className="text-sm text-gray-600">Size:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={brushWidth}
            onChange={(e) => setBrushWidth(Number(e.target.value))}
            className="w-20"
          />
          <span className="w-6 text-sm font-medium">{brushWidth}</span>
        </div>

        {/* History Controls */}
        <div className="flex items-center gap-1 rounded-lg border bg-gray-50 p-1">
          <button
            onClick={undo}
            disabled={paths.length === 0}
            className="rounded p-2 text-gray-600 transition hover:bg-white hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="rounded p-2 text-gray-600 transition hover:bg-white hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
          <button
            onClick={clear}
            disabled={paths.length === 0}
            className="rounded p-2 text-red-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            title="Clear"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* AI Generation */}
        <button
          onClick={handleGenerateCaption}
          disabled={generateCaption.isPending || paths.length === 0}
          className="ml-auto flex items-center gap-2 rounded-lg border border-blue-400/50 bg-linear-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-blue-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-blue-500 disabled:hover:to-cyan-500"
          title="Generate Caption & Image with AI"
        >
          <Sparkles className="h-4 w-4" />
          {generateCaption.isPending
            ? "Analyzing..."
            : "Generate with AI"}
        </button>

        {/* Export Controls */}
        <div className="flex items-center gap-1 rounded-lg border bg-gray-50 p-1">
          <button
            onClick={() => exportImage("png")}
            className="flex items-center gap-2 rounded bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50"
            title="Export as PNG"
          >
            <Download className="h-4 w-4" />
            PNG
          </button>
          <button
            onClick={() => exportImage("jpg")}
            className="flex items-center gap-2 rounded bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50"
            title="Export as JPG"
          >
            <Download className="h-4 w-4" />
            JPG
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 overflow-hidden bg-gray-100">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="h-full w-full cursor-crosshair touch-none"
          style={{ width: "100%", height: "100%" }}
        />

        {/* AI Results Panel */}
        {showResults && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-950/80 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl rounded-2xl border border-blue-400/30 bg-linear-to-br from-blue-950 via-blue-900 to-blue-800 p-8 shadow-2xl">
              {/* Close Button */}
              <button
                onClick={handleCloseResults}
                className="absolute right-4 top-4 rounded-lg p-2 text-blue-300 transition hover:bg-blue-800/50 hover:text-white"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="mb-6 text-center">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-200">
                    AI Generated Results
                  </span>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Caption Section */}
                <div className="rounded-xl border border-blue-400/20 bg-blue-900/40 p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Caption
                    </h3>
                  </div>
                  {caption ? (
                    <>
                      <p className="mb-4 text-base text-blue-100">{caption}</p>
                      <button
                        onClick={handleGenerateImage}
                        disabled={generateImage.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-500 to-cyan-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:from-blue-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ImageIcon className="h-4 w-4" />
                        {generateImage.isPending
                          ? "Generating Image..."
                          : "Generate Image from Caption"}
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                    </div>
                  )}
                </div>

                {/* Generated Image Section */}
                <div className="rounded-xl border border-blue-400/20 bg-blue-900/40 p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Generated Image
                    </h3>
                  </div>
                  {generatedImageUrl ? (
                    <div className="space-y-3">
                      <div className="overflow-hidden rounded-lg border border-blue-400/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={generatedImageUrl}
                          alt="AI Generated"
                          className="h-auto w-full"
                        />
                      </div>
                      <a
                        href={generatedImageUrl}
                        download="ai-generated.png"
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-400/50 bg-blue-800/50 px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-700/50"
                      >
                        <Download className="h-4 w-4" />
                        Download Image
                      </a>
                    </div>
                  ) : generateImage.isPending ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-3 border-cyan-400 border-t-transparent" />
                      <p className="text-sm text-blue-300">
                        Creating your image...
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-blue-400/30 py-12">
                      <p className="text-sm text-blue-400">
                        Generate an image from the caption
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
