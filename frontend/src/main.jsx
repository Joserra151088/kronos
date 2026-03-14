/**
 * main.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Punto de entrada de React.
 * Monta el componente App en el elemento #root del HTML.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { EmpresaProvider } from "./context/EmpresaContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <EmpresaProvider>
        <App />
      </EmpresaProvider>
    </ThemeProvider>
  </StrictMode>
);
