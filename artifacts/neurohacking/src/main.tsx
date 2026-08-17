import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// OneSignal инициализируется через скрипт в index.html
// Service Worker управляется OneSignal (через импорт в sw.js)

const rootElement = document.getElementById("root")!;
createRoot(rootElement).render(<App />);

const bootLoader = document.getElementById("app-boot-loader");
const dismissBootLoader = () => {
  if (!bootLoader) return;
  if (!rootElement.firstElementChild) {
    window.requestAnimationFrame(dismissBootLoader);
    return;
  }
  bootLoader.classList.add("is-ready");
  window.setTimeout(() => bootLoader.remove(), 220);
};
window.requestAnimationFrame(dismissBootLoader);
