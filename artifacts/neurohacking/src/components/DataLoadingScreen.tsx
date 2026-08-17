import { motion } from "framer-motion";
import { MemoryTechniqueLogo } from "./MemoryTechniqueLogo";

export function DataLoadingScreen({ label = "Загружаем твои данные…" }: { label?: string }) {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-6">
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={{ scale: [0.84, 1.18, 0.84], opacity: [0.12, 0.32, 0.12] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: "radial-gradient(circle, rgba(249,115,22,.44), transparent 67%)", filter: "blur(12px)" }}
      />

      <div className="relative z-10 flex w-full max-w-[320px] flex-col items-center text-center">
        <div className="relative mb-7 flex h-[174px] w-[174px] items-center justify-center">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="absolute rounded-full border"
              style={{
                width: `${116 + index * 27}px`,
                height: `${116 + index * 27}px`,
                borderColor: index === 0 ? "rgba(255,214,126,.34)" : "rgba(249,115,22,.16)",
                borderStyle: index === 2 ? "dashed" : "solid",
              }}
              animate={{ rotate: index % 2 === 0 ? 360 : -360, scale: [0.96, 1.04, 0.96] }}
              transition={{
                rotate: { duration: 8 + index * 4, repeat: Infinity, ease: "linear" },
                scale: { duration: 2.4 + index * 0.5, repeat: Infinity, ease: "easeInOut" },
              }}
            />
          ))}
          <MemoryTechniqueLogo size={132} loading />
          <motion.span
            className="absolute right-2 top-4 h-2 w-2 rounded-full bg-orange-200"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.3, 0.7], x: [0, 8, 0], y: [0, -6, 0] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
            style={{ boxShadow: "0 0 14px rgba(255,214,126,.95)" }}
          />
          <motion.span
            className="absolute bottom-5 left-1 h-1.5 w-1.5 rounded-full bg-orange-400"
            animate={{ opacity: [0.15, 0.9, 0.15], scale: [0.7, 1.4, 0.7], x: [0, -6, 0], y: [0, 5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            style={{ boxShadow: "0 0 12px rgba(249,115,22,.9)" }}
          />
        </div>

        <motion.p
          className="title-s text-primary"
          animate={{ opacity: [0.58, 1, 0.58] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          aria-live="polite"
        >
          {label}
        </motion.p>
        <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="h-1.5 w-1.5 rounded-full bg-orange-300"
              animate={{ y: [0, -5, 0], opacity: [0.28, 1, 0.28] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.16, ease: "easeInOut" }}
            />
          ))}
        </div>
        <div className="mt-5 h-1 w-36 overflow-hidden rounded-full bg-white/[.08]">
          <motion.div
            className="h-full w-1/2 rounded-full"
            animate={{ x: ["-100%", "260%"] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
            style={{ background: "linear-gradient(90deg, transparent, #F97316, #FFE2A1, transparent)" }}
          />
        </div>
      </div>
    </div>
  );
}