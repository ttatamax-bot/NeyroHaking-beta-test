import { motion } from "framer-motion";

let _slideDir = 0;

export function setSlideDir(dir: number) {
  _slideDir = dir;
}

export function ScreenTransition({
  children,
  className = "",
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "reveal";
}) {
  const dir = _slideDir;
  _slideDir = 0;
  const isReveal = variant === "reveal";

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: dir !== 0 ? dir * 20 : 0,
        y: isReveal ? 26 : 0,
        scale: isReveal ? 0.965 : 1,
        filter: isReveal ? "blur(12px)" : "blur(0px)",
      }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: isReveal ? 0.58 : 0.12, ease: isReveal ? [0.16, 1, 0.3, 1] : "easeOut" }}
      className={`w-full min-h-[100dvh] ${className}`}
    >
      {children}
    </motion.div>
  );
}
