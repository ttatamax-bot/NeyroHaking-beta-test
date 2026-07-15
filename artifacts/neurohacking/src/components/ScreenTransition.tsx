import { motion } from "framer-motion";

let _slideDir = 0;

export function setSlideDir(dir: number) {
  _slideDir = dir;
}

export function ScreenTransition({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const dir = _slideDir;
  _slideDir = 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: dir !== 0 ? dir * 20 : 0 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className={`w-full min-h-screen ${className}`}
    >
      {children}
    </motion.div>
  );
}
