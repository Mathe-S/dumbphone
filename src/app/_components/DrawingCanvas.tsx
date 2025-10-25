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
  QrCode,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "@/trpc/react";
import { QRCodeModal } from "./QRCodeModal";
import { toast } from "sonner";

interface Point {
  x: number;
  y: number;
}

interface DrawingPath {
  points: Point[];
  color: string;
  width: number;
}

interface DrawingCanvasProps {
  pageUserId: string;
  currentUserId: string | null;
  isOwner: boolean;
}

export function DrawingCanvas({
  pageUserId: _pageUserId,
  currentUserId,
  isOwner,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [redoStack, setRedoStack] = useState<DrawingPath[]>([]);
  const [brushColor, setBrushColor] = useState("#0000FF");
  const [brushWidth, setBrushWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [caption, setCaption] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null,
  );
  const [showResults, setShowResults] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQRCodeUrl] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState("");
  const [drawingId] = useState(1); // TODO: Get from database
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(
    new Set(),
  );
  const [imageHistory, setImageHistory] = useState<
    Array<{ url: string; caption: string; isOriginal?: boolean }>
  >([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [chainHistory, setChainHistory] = useState<
    Array<{ iteration: number; caption: string; imageUrl: string }>
  >([]);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [waitingForUser, setWaitingForUser] = useState(false);

  const generateCaption = api.caption.generateFromBase64.useMutation({
    onSuccess: (data) => {
      console.log(`Caption generated for iteration ${currentIteration}:`, data.caption);
      setCaption(data.caption);
      setShowResults(true);
      setWaitingForUser(true);
      toast.success("Caption generated successfully!");
    },
    onError: (error) => {
      console.error("Caption generation failed:", error);
      toast.error("Failed to generate caption. Please try again.");
    },
  });

  const generateImage = api.caption.generateImageFromCaption.useMutation({
    onSuccess: (data) => {
      console.log("Image generated successfully:", data.imageUrl);
      
      // Ensure we have a string URL
      const imageUrl = typeof data.imageUrl === 'string' 
        ? data.imageUrl 
        : String(data.imageUrl);
      
      setGeneratedImageUrl(imageUrl);
      setWaitingForUser(true);
      
      // Add to both histories
      setImageHistory((prev) => [
        ...prev,
        { url: imageUrl, caption: caption ?? "" },
      ]);
      setCurrentHistoryIndex((prev) => prev + 1);
      
      if (caption) {
        setChainHistory((prev) => [
          ...prev,
          {
            iteration: currentIteration,
            caption: caption,
            imageUrl: imageUrl,
          },
        ]);
      }
      
      toast.success("Image generated successfully!");
    },
    onError: (error) => {
      console.error("Image generation failed:", error);
      toast.error("Failed to generate image. Please try again.");
    },
  });

  const createSuggestion = api.suggestion.create.useMutation({
    onSuccess: () => {
      setSuggestion("");
      toast.success("Suggestion sent! The owner will see it.");
    },
    onError: (error) => {
      console.error("Suggestion failed:", error);
      toast.error("Failed to send suggestion. Please try again.");
    },
  });

  const { data: suggestions = [] } = api.suggestion.getByDrawingId.useQuery(
    { drawingId },
    {
      enabled: isOwner && showResults && !!caption,
      refetchInterval: 3000, // Poll every 3 seconds for real-time updates
    },
  );

  const clearSuggestions = api.suggestion.clearByDrawingId.useMutation();

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

  const handleGenerateCaptionFromDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get canvas data as base64
    const dataUrl = canvas.toDataURL("image/png");

    // Add original drawing to history if this is the first generation
    if (imageHistory.length === 0) {
      setImageHistory([{ url: dataUrl, caption: "Original Drawing", isOriginal: true }]);
      setCurrentHistoryIndex(0);
    }
    
    // Show results panel and increment iteration
    if (!showResults) {
      setShowResults(true);
      setCurrentIteration(1);
    }

    // Generate caption
    generateCaption.mutate({ imageBase64: dataUrl });
  };

  const handleGenerateImageFromCaption = () => {
    if (!caption) return;
    setWaitingForUser(false);
    
    // Include only selected suggestions in the prompt
    let enhancedCaption = caption;
    if (selectedSuggestions.size > 0) {
      const selectedTexts = suggestions
        .filter((s) => selectedSuggestions.has(s.id))
        .map((s) => s.suggestion)
        .join(", ");
      enhancedCaption = `${caption}. Incorporate these creative ideas: ${selectedTexts}`;
    }
    
    // Append "make it extremely dumber" to every prompt
    const modifiedCaption = `${enhancedCaption}, make it extremely dumber and blue`;
    
    // Generate image with enhanced caption
    generateImage.mutate({ caption: modifiedCaption });
    
    // Clear suggestions and selections after starting generation
    if (suggestions.length > 0) {
      clearSuggestions.mutate({ drawingId });
      setSelectedSuggestions(new Set());
    }
  };

  const toggleSuggestion = (id: number) => {
    setSelectedSuggestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleGenerateCaptionFromImage = async () => {
    if (!generatedImageUrl) return;

    const imageUrlToFetch = generatedImageUrl;
    
    // Reset caption and increment iteration
    setCaption(null);
    setWaitingForUser(false);
    setCurrentIteration((prev) => prev + 1);

    try {
      // Fetch the generated image and convert to base64
      const response = await fetch(imageUrlToFetch);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64data = reader.result as string;
        console.log(`Generating caption from image for iteration ${currentIteration + 1}`);
        generateCaption.mutate({ imageBase64: base64data });
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to fetch image:", error);
      alert("Failed to fetch image for caption generation");
    }
  };

  const handleContinueChain = async () => {
    if (!generatedImageUrl) return;

    const imageUrlToFetch = generatedImageUrl;
    
    // Reset state for next iteration
    setWaitingForUser(false);
    setCaption(null);
    setGeneratedImageUrl(null);
    setCurrentIteration((prev) => prev + 1);

    try {
      // Fetch the generated image and convert to base64
      const response = await fetch(imageUrlToFetch);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64data = reader.result as string;
        console.log(`Starting iteration ${currentIteration + 1} with generated image`);
        generateCaption.mutate({ imageBase64: base64data });
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to fetch image:", error);
      alert("Failed to fetch image for next iteration");
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setCaption(null);
    setGeneratedImageUrl(null);
    setChainHistory([]);
    setCurrentIteration(0);
    setWaitingForUser(false);
  };

  const handleSubmitSuggestion = () => {
    if (!suggestion.trim()) return;
    createSuggestion.mutate({
      drawingId,
      visitorId: currentUserId ?? undefined,
      suggestion: suggestion.trim(),
    });
  };

  const handleShowQR = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      setQRCodeUrl(url);
      setShowQR(true);
    }
  };

  const navigateHistory = (direction: "prev" | "next") => {
    if (direction === "prev" && currentHistoryIndex > 0) {
      setCurrentHistoryIndex(currentHistoryIndex - 1);
    } else if (direction === "next" && currentHistoryIndex < imageHistory.length - 1) {
      setCurrentHistoryIndex(currentHistoryIndex + 1);
    }
  };

  const handleRegenerateCaption = () => {
    if (!generatedImageUrl) return;
    
    // Clear current caption and generate new one from the image
    setCaption(null);
    generateCaption.mutate({ imageBase64: generatedImageUrl });
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
            <div className="absolute top-full left-0 z-10 mt-1 grid grid-cols-5 gap-2 rounded-lg border bg-white p-3 shadow-lg">
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

        {/* QR Code Button (Owner Only) */}
        {isOwner && (
          <button
            onClick={handleShowQR}
            className="ml-auto flex items-center gap-2 rounded-lg border border-blue-400/50 bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            title="Show QR Code"
          >
            <QrCode className="h-4 w-4" />
            Share
          </button>
        )}

        {/* AI Tools */}
        <div className="flex items-center gap-2">
          {/* Generate Caption */}
          <button
            onClick={handleGenerateCaptionFromDrawing}
            disabled={generateCaption.isPending || paths.length === 0 || !isOwner}
            className="flex items-center gap-2 rounded-lg border border-purple-400/50 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-purple-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-purple-500 disabled:hover:to-pink-500"
            title="Generate Caption from Drawing"
          >
            <Sparkles className="h-4 w-4" />
            {generateCaption.isPending ? "Analyzing..." : "Generate Caption"}
          </button>

          {/* Generate Image */}
          <button
            onClick={handleGenerateImageFromCaption}
            disabled={generateImage.isPending || !caption || !isOwner}
            className="flex items-center gap-2 rounded-lg border border-blue-400/50 bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-blue-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-blue-500 disabled:hover:to-cyan-500"
            title="Generate Image from Caption"
          >
            <ImageIcon className="h-4 w-4" />
            {generateImage.isPending ? "Creating..." : "Generate Image"}
          </button>
        </div>

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

      {/* Visitor Suggestion Input */}
      {!isOwner && (
        <div className="border-b bg-blue-50 px-4 py-3">
          <div className="mx-auto max-w-4xl">
            <label className="mb-2 block text-sm font-medium text-blue-900">
              Suggest an idea for the next image:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitSuggestion()}
                placeholder="Type your creative suggestion here..."
                maxLength={500}
                className="flex-1 rounded-lg border border-blue-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
              <button
                onClick={handleSubmitSuggestion}
                disabled={!suggestion.trim() || createSuggestion.isPending}
                className="flex items-center gap-2 rounded-lg bg-linear-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-blue-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {createSuggestion.isPending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image History Carousel */}
      {imageHistory.length > 0 && (
        <div className="border-b bg-linear-to-r from-blue-50 to-cyan-50 px-4 py-3">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <button
              onClick={() => navigateHistory("prev")}
              disabled={currentHistoryIndex === 0}
              className="rounded-lg bg-white p-2 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              title="Previous"
            >
              <ChevronLeft className="h-5 w-5 text-blue-600" />
            </button>

            <div className="flex flex-1 items-center gap-3 overflow-x-auto">
              {imageHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentHistoryIndex(index)}
                  className={`group relative shrink-0 transition ${
                    index === currentHistoryIndex
                      ? "ring-2 ring-blue-500 ring-offset-2"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  title={item.caption}
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border-2 border-white bg-white shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.caption}
                      className="h-full w-full object-cover"
                    />
                    {item.isOriginal && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-900/20">
                        <span className="text-xs font-bold text-white drop-shadow">
                          ✏️
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white shadow">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => navigateHistory("next")}
              disabled={currentHistoryIndex === imageHistory.length - 1}
              className="rounded-lg bg-white p-2 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
              title="Next"
            >
              <ChevronRight className="h-5 w-5 text-blue-600" />
            </button>

            <div className="text-sm font-medium text-blue-900">
              {currentHistoryIndex + 1} / {imageHistory.length}
            </div>
          </div>
        </div>
      )}

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
          <div className="absolute inset-0 z-10 flex items-center justify-center overflow-auto bg-blue-950/80 p-4 backdrop-blur-sm">
            <div className="relative my-auto w-full max-w-4xl rounded-2xl border border-blue-400/30 bg-linear-to-br from-blue-950 via-blue-900 to-blue-800 p-8 shadow-2xl">
              {/* Close Button */}
              <button
                onClick={handleCloseResults}
                className="absolute top-4 right-4 rounded-lg p-2 text-blue-300 transition hover:bg-blue-800/50 hover:text-white"
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
                        onClick={handleGenerateImageFromCaption}
                        disabled={generateImage.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-500 to-cyan-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:from-blue-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ImageIcon className="h-4 w-4" />
                        {generateImage.isPending
                          ? "Generating Image..."
                          : "Generate Image from Caption"}
                      </button>

                      {/* Visitor Suggestions (Owner Only) - Real-time updates */}
                      {isOwner && suggestions.length > 0 && (
                        <div className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-900/20 p-4">
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-300">
                            <Sparkles className="h-4 w-4" />
                            Visitor Suggestions ({selectedSuggestions.size}/{suggestions.length} selected)
                          </h4>
                          <div className="max-h-32 space-y-2 overflow-y-auto">
                            {suggestions.map((s) => (
                              <label
                                key={s.id}
                                className="flex cursor-pointer items-start gap-2 rounded border border-cyan-400/10 bg-cyan-800/20 p-2 transition hover:bg-cyan-800/30"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedSuggestions.has(s.id)}
                                  onChange={() => toggleSuggestion(s.id)}
                                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-cyan-400/30 bg-cyan-900/50 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0"
                                />
                                <p className="flex-1 text-xs text-cyan-100">{s.suggestion}</p>
                              </label>
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-cyan-400/70">
                            {selectedSuggestions.size > 0
                              ? `Selected suggestions will be included in the next generation`
                              : "Select suggestions to include in the generation"}
                          </p>
                        </div>
                      )}
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
                      {waitingForUser && (
                        <button
                          onClick={handleGenerateCaptionFromImage}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:from-green-600 hover:to-emerald-600"
                        >
                          <Sparkles className="h-4 w-4" />
                          Caption from Image
                        </button>
                      )}
                      <a
                        href={generatedImageUrl}
                        download="ai-generated.png"
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-400/50 bg-blue-800/50 px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-700/50"
                      >
                        <Download className="h-4 w-4" />
                        Download Image
                      </a>
                      <button
                        onClick={handleRegenerateCaption}
                        disabled={generateCaption.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-cyan-600 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Sparkles className="h-4 w-4" />
                        {generateCaption.isPending
                          ? "Analyzing..."
                          : "Continue Telephone Game →"}
                      </button>
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

              {/* Chain History */}
              {chainHistory.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-sm font-semibold text-blue-200">
                    Previous Iterations ({chainHistory.length})
                  </h3>
                  <div className="space-y-3">
                    {chainHistory.map((item) => (
                      <div
                        key={item.iteration}
                        className="rounded-lg border border-blue-400/10 bg-blue-950/30 p-4"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            {item.iteration}
                          </div>
                          <span className="text-sm font-medium text-white">
                            Iteration {item.iteration}
                          </span>
                        </div>
                        <div className="grid gap-3 lg:grid-cols-2">
                          <div>
                            <p className="mb-1 text-xs text-blue-400">Caption:</p>
                            <p className="text-sm text-blue-100">{item.caption}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 overflow-hidden rounded border border-blue-400/20">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.imageUrl}
                                alt={`Iteration ${item.iteration}`}
                                className="h-auto w-full"
                              />
                            </div>
                            <a
                              href={item.imageUrl}
                              download={`iteration-${item.iteration}.png`}
                              className="rounded-lg border border-blue-400/50 bg-blue-800/50 p-2 text-blue-100 transition hover:bg-blue-700/50"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQR && qrCodeUrl && (
          <QRCodeModal url={qrCodeUrl} onClose={() => setShowQR(false)} />
        )}
      </div>
    </div>
  );
}
