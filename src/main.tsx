import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initPwaIsolation } from "./lib/pwa";
import { registerOfflineServiceWorker } from "./lib/offline-shell";
import "./index.css";

initPwaIsolation();
registerOfflineServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
