/**
 * ThemeToggle.jsx – Selector de tema visual
 */
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

const THEMES = [
  { key: "dark",   label: "🌙 Oscuro" },
  { key: "light",  label: "☀️ Claro" },
  { key: "system", label: "💻 Sistema" },
  { key: "custom", label: "🖼️ Personalizado" },
];

const ThemeToggle = () => {
  const { theme, setTheme, wallpaper, setWallpaper } = useTheme();
  const [open, setOpen] = useState(false);
  const [wpInput, setWpInput] = useState(wallpaper || "");

  return (
    <div style={{ position: "relative" }}>
      <button
        className="btn btn-sm btn-secondary"
        onClick={() => setOpen((p) => !p)}
        title="Cambiar tema"
        style={{ fontSize: "1rem", padding: "4px 8px" }}
      >
        {theme === "dark" ? "🌙" : theme === "light" ? "☀️" : theme === "system" ? "💻" : "🖼️"}
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "110%", right: 0, zIndex: 1000,
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 8, padding: 12, minWidth: 220, boxShadow: "var(--shadow)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8, fontWeight: 600 }}>TEMA</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {THEMES.map((t) => (
              <button
                key={t.key}
                className={`btn btn-sm ${theme === t.key ? "btn-primary" : "btn-secondary"}`}
                onClick={() => { setTheme(t.key); if (t.key !== "custom") setOpen(false); }}
                style={{ justifyContent: "flex-start" }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {theme === "custom" && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>URL del fondo:</p>
              <input
                className="form-control"
                placeholder="https://..."
                value={wpInput}
                onChange={(e) => setWpInput(e.target.value)}
                style={{ fontSize: 12 }}
              />
              <button
                className="btn btn-sm btn-primary"
                style={{ marginTop: 6, width: "100%" }}
                onClick={() => { setWallpaper(wpInput); setOpen(false); }}
              >
                Aplicar fondo
              </button>
            </div>
          )}

          <button
            className="btn btn-sm btn-secondary"
            style={{ marginTop: 10, width: "100%", fontSize: 11 }}
            onClick={() => setOpen(false)}
          >✕ Cerrar</button>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
