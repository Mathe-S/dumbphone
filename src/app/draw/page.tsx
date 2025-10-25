import { DrawingCanvas } from "../_components/DrawingCanvas";

export default function DrawPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex-1">
        <DrawingCanvas />
      </div>
    </div>
  );
}
