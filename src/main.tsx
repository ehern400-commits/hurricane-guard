import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { seedOnce } from "./db/seed";
import { registerServiceWorker } from "./offline/registerSW";
import "./index.css";

void seedOnce();
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
