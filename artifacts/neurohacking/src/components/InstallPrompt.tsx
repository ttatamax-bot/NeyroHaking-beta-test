import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, PlusSquare } from "lucide-react";

const STORAGE_KEY = 'neyro_install_prompt_dismissed';

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isSafari() {
  return /Safari/i.test(navigator.userAgent) && !/CriOS|Chrome|FxiOS|EdgiOS/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return ('standalone' in window.navigator && (window.navigator as any).standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches;
}

function isAndroidChrome() {
  return /Android/.test(navigator.userAgent) && /Chrome/.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [type, setType] = useState<'ios' | 'android' | null>(null);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    if (isIOS() && isSafari()) {
      // Показать iOS-подсказку через 3 секунды
      const t = setTimeout(() => {
        setType('ios');
        setVisible(true);
      }, 3000);
      return () => clearTimeout(t);
    }

    if (isAndroidChrome()) {
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setType('android');
        setVisible(true);
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }
    return;
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, '1');
  };

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="fixed bottom-[80px] left-0 right-0 z-[200] px-4"
        >
          <div
            className="rounded-[20px] p-5 relative overflow-hidden"
            style={{
              background: 'rgba(8, 18, 40, 0.97)',
              border: '1.5px solid rgba(245,158,11,0.4)',
              boxShadow: '0 0 40px rgba(245,158,11,0.15), 0 16px 48px rgba(0,0,0,0.7)',
            }}
          >
            {/* gold glow top */}
            <div style={{
              position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
              width: '120%', height: 100,
              background: 'radial-gradient(ellipse, rgba(245,158,11,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <button
              onClick={dismiss}
              className="absolute top-3 right-3 p-1 text-tertiary active:opacity-60"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[12px] shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)' }}>
                <span style={{ fontSize: 20 }}>⚡</span>
              </div>
              <div className="flex-1 pr-4">
                <p className="title-s text-primary mb-1">Добавить на рабочий стол</p>
                <p className="body-s text-secondary mb-4 leading-relaxed">
                  Установи НейроХакинг как приложение — работает без браузера, быстрее загружается.
                </p>

                {type === 'ios' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px]"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Share size={14} color="#60A5FA" className="shrink-0" />
                      <span className="caption text-secondary">Нажми <span className="text-primary">«Поделиться»</span> в браузере</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px]"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <PlusSquare size={14} color="#60A5FA" className="shrink-0" />
                      <span className="caption text-secondary">Выбери <span className="text-primary">«На экран «Домой»»</span></span>
                    </div>
                    <button
                      onClick={dismiss}
                      className="w-full h-[38px] rounded-[10px] caption text-tertiary active:opacity-60"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      Понятно, позже
                    </button>
                  </div>
                )}

                {type === 'android' && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleInstallAndroid}
                      className="flex-1 h-[40px] rounded-[10px] btn-grad btn-shimmer title-s"
                      style={{ fontSize: 13 }}
                    >
                      Установить
                    </button>
                    <button
                      onClick={dismiss}
                      className="h-[40px] px-4 rounded-[10px] caption text-tertiary active:opacity-60"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      Позже
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
