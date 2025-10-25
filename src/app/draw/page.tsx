import { DrawingCanvas } from "../_components/DrawingCanvas";

export default function DrawPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b bg-white px-4 py-3">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold tracking-tight">Drawing Canvas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create your artwork and export it as PNG or JPG
          </p>
        </div>
      </div>
      <div className="flex-1">
        <DrawingCanvas />
      </div>
    </div>
  );
}
