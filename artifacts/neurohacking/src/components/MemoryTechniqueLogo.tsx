import { motion } from "framer-motion";
import { useState } from "react";

const assetBase = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const memoryLogoUrl = `${assetBase}memory-logo.png`;
const loadingLogoUrl = `${assetBase}memory-logo-transparent.png?v=2`;

function MemoryLogoFallback({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 h-full w-full"
      style={{ padding: size * 0.16 }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="memory-logo-fallback-core" cx="50%" cy="45%" r="58%">
          <stop offset="0%" stopColor="#FFE2A1" />
          <stop offset="32%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#7C2D12" stopOpacity=".2" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="28" fill="url(#memory-logo-fallback-core)" />
      <path d="M50 20v60M20 50h60" stroke="#FFD29A" strokeWidth="2" strokeLinecap="round" opacity=".8" />
      <circle cx="50" cy="50" r="22" fill="none" stroke="#FFE7B3" strokeWidth="1.5" opacity=".8" />
      <circle cx="50" cy="50" r="7" fill="#FFF7CC" />
    </svg>
  );
}

interface MemoryTechniqueLogoProps {
  size?: number;
  loading?: boolean;
  className?: string;
}

export function MemoryTechniqueLogo({ size = 76, loading = false, className = "" }: MemoryTechniqueLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <motion.div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      initial={loading ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.72, rotate: -8 }}
      animate={{ opacity: 1, scale: loading ? [0.96, 1.04, 0.96] : [1, 1.035, 1], rotate: loading ? [-2, 2, -2] : [-1, 1, -1] }}
      transition={{
        opacity: { duration: 0.45 },
        scale: { duration: loading ? 2.4 : 3.2, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: loading ? 6 : 8, repeat: Infinity, ease: "easeInOut" },
      }}
      aria-hidden="true"
    >
      <motion.div
        className="absolute -inset-[18%] rounded-full"
        animate={{ opacity: [0.28, 0.72, 0.28], scale: [0.82, 1.14, 0.82] }}
        transition={{ duration: loading ? 2 : 3.4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "radial-gradient(circle, rgba(249,115,22,.56) 0%, rgba(245,158,11,.2) 34%, transparent 72%)",
          filter: "blur(10px)",
        }}
      />

      <motion.div
        className="absolute -inset-[9%] rounded-full border"
        animate={{ rotate: 360 }}
        transition={{ duration: loading ? 8 : 12, repeat: Infinity, ease: "linear" }}
        style={{
          borderColor: "rgba(249,115,22,.18)",
          borderTopColor: "rgba(254,215,170,.82)",
          borderRightColor: "rgba(249,115,22,.55)",
          maskImage: "radial-gradient(circle, transparent 63%, #000 65%, #000 72%, transparent 74%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 63%, #000 65%, #000 72%, transparent 74%)",
        }}
      />

      <motion.div
        className="absolute inset-0 overflow-hidden rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: loading ? 13 : 18, repeat: Infinity, ease: "linear" }}
        style={{
          background: "conic-gradient(from 20deg, transparent 0deg, rgba(255,237,170,.72) 42deg, transparent 78deg, transparent 180deg, rgba(249,115,22,.5) 220deg, transparent 260deg)",
          maskImage: "radial-gradient(circle, transparent 67%, #000 69%, #000 76%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(circle, transparent 67%, #000 69%, #000 76%, transparent 78%)",
        }}
      />

      {imageFailed ? <MemoryLogoFallback size={size} /> : (
        <motion.img
          src={loading ? loadingLogoUrl : memoryLogoUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
          onError={() => setImageFailed(true)}
          animate={{ filter: ["saturate(1.08) brightness(1.05) drop-shadow(0 0 8px rgba(249,115,22,.55))", "saturate(1.28) brightness(1.2) drop-shadow(0 0 18px rgba(255,196,72,.9))", "saturate(1.08) brightness(1.05) drop-shadow(0 0 8px rgba(249,115,22,.55))"] }}
          transition={{ duration: loading ? 2 : 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            mixBlendMode: loading ? "normal" : "screen",
            maskImage: loading ? "none" : "radial-gradient(ellipse at center, #000 30%, rgba(0,0,0,.98) 58%, transparent 78%)",
            WebkitMaskImage: loading ? "none" : "radial-gradient(ellipse at center, #000 30%, rgba(0,0,0,.98) 58%, transparent 78%)",
          }}
        />
      )}

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          maskImage: "radial-gradient(ellipse at center, #000 30%, rgba(0,0,0,.98) 58%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, rgba(0,0,0,.98) 58%, transparent 78%)",
        }}
      >
        <motion.span
          className="absolute inset-y-0"
          animate={{ opacity: [0, 0.9, 0], x: ["-140%", "240%", "240%"] }}
          transition={{ duration: loading ? 2.8 : 4.5, repeat: Infinity, repeatDelay: loading ? 0.4 : 1.4, ease: "easeInOut" }}
          style={{
            width: "42%",
            background: "linear-gradient(105deg, transparent, rgba(255,247,204,.8), transparent)",
            filter: "blur(3px)",
            mixBlendMode: "screen",
          }}
        />
      </div>
    </motion.div>
  );
}