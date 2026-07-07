import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-texture">
      <Loader2 className="animate-spin text-taupe/20" size={42} />
    </div>
  );
}
