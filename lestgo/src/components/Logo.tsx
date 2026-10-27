import { Heart } from "lucide-react";

/** App logo: burgundy gradient container with a pure white heart. */
export default function Logo({ size = 64 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center bg-gradient-to-br from-[#590016] via-[#800020] to-[#A7002A] shadow-lg shadow-wine-900/30"
      style={{ width: size, height: size, borderRadius: size * 0.3 }}
    >
      <Heart style={{ width: size * 0.5, height: size * 0.5 }} className="fill-white text-white" />
    </div>
  );
}
