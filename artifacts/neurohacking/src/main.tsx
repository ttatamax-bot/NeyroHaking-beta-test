import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// OneSignal инициализируется через скрипт в index.html
// Service Worker управляется OneSignal (через импорт в sw.js)

createRoot(document.getElementById("root")!).render(<App />);
