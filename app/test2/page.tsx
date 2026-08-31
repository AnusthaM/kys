// In your page or component
import { DrawingCanvas } from "@/components/extra/draw2";

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <DrawingCanvas />
    </div>
  );
}