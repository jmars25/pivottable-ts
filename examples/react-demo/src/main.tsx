import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@jmars25/pivottable-ts/dist/pivot.css";
import "./index.css";
import App from "./App";

// Register all locales (side-effectful import)
import "@jmars25/pivottable-ts/locales";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
