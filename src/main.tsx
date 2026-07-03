import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initPwaIsolation } from "./lib/pwa";
import "./index.css";

initPwaIsolation();

createRoot(document.getElementById("root")!).render(<App />);
