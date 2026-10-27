import { Heart } from "lucide-react";

export default function Logo({ size = 80 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center bg-[#800020] shadow-lg shadow-wine-900/30"
      style={{ width: size, height: size, borderRadius: size * 0.3 }}>
      <Heart className="fill-white text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  );
}
