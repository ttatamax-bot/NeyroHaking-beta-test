import { motion, AnimatePresence } from "framer-motion";

interface Props {
  show: boolean;
  message: string;
  onClose: () => void;
}

export function MaximInfoModal({ show, message, onClose }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-10"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-[340px] rounded-[20px] p-5"
            style={{
              background: 'rgba(10,13,26,0.98)',
              border: '1.5px solid rgba(37,99,235,0.45)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/maxim-avatar.png"
                alt="Максим"
                className="w-[44px] h-[44px] rounded-full object-cover shrink-0"
                style={{ boxShadow: '0 0 0 2px #2563EB' }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.03em' }}>
                Татаринов Максим
              </span>
            </div>
            <p className="body text-primary leading-snug mb-5" style={{ whiteSpace: 'pre-line' }}>
              {message}
            </p>
            <button
              onClick={onClose}
              className="w-full h-[48px] rounded-[14px] btn-grad btn-shimmer text-white title-s"
            >
              Понятно
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
