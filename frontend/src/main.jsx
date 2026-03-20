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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,   // 2 minutos antes de considerar datos obsoletos
      gcTime:    10 * 60 * 1000,  // 10 minutos en caché inactivo
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <EmpresaProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: "10px",
                fontFamily: "inherit",
                fontSize: "14px",
                maxWidth: "420px",
              },
              success: {
                iconTheme: { primary: "#22c55e", secondary: "#fff" },
                style: { background: "#f0fdf4", border: "1px solid #86efac", color: "#166534" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
                style: { background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b" },
                duration: 5000,
              },
            }}
          />
        </EmpresaProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
