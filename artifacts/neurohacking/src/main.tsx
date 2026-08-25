import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// OneSignal инициализируется через скрипт в index.html
// Service Worker управляется OneSignal (через импорт в sw.js)

const rootElement = document.getElementById("root")!;
createRoot(rootElement).render(<App />);

const bootLoader = document.getElementById("app-boot-loader");
let bootLoaderDismissed = false;
const dismissBootLoader = () => {
  if (bootLoaderDismissed) return;
  if (!bootLoader) return;
  bootLoaderDismissed = true;
  bootLoader.classList.add("is-ready");
  window.setTimeout(() => bootLoader.remove(), 220);
};

// Keep the static loader over the app until the account gate has finished.
// This prevents the mobile shell/nav from flashing through during hydration.
window.addEventListener("neuro-app-ready", dismissBootLoader, { once: true });
window.setTimeout(dismissBootLoader, 15_000);
