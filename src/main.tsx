import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Global styles first so page stylesheets (imported by App) can override them.
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
