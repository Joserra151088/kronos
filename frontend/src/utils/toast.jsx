/**
 * toast.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilidades de notificación centralizada (react-hot-toast).
 * Importar siempre desde aquí para mantener consistencia en toda la plataforma.
 *
 * Uso:
 *   import { toastExito, toastError, toastCargando, confirmar } from "../utils/toast";
 *
 *   toastExito("Empleado guardado correctamente");
 *   toastError("No se pudo conectar al servidor");
 *   const id = toastCargando("Guardando...");
 *   toast.dismiss(id);
 *   const ok = await confirmar("¿Eliminar este registro?");
 */

import toast from "react-hot-toast";

/** Notificación de éxito */
export const toastExito = (msg, opts = {}) =>
  toast.success(msg, { duration: 4000, ...opts });

/** Notificación de error (extrae mensaje de Error o string) */
export const toastError = (err, opts = {}) => {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : "Ocurrió un error inesperado";
  return toast.error(msg, { duration: 5000, ...opts });
};

/** Notificación de advertencia */
export const toastAviso = (msg, opts = {}) =>
  toast(msg, {
    icon: "⚠️",
    style: {
      background: "#fffbeb",
      border: "1px solid #fde68a",
      color: "#92400e",
    },
    duration: 5000,
    ...opts,
  });

/** Notificación de información */
export const toastInfo = (msg, opts = {}) =>
  toast(msg, {
    icon: "ℹ️",
    style: {
      background: "#eff6ff",
      border: "1px solid #93c5fd",
      color: "#1e40af",
    },
    duration: 4000,
    ...opts,
  });

/** Toast de carga (devuelve el id para poder cerrarlo con toast.dismiss(id)) */
export const toastCargando = (msg = "Procesando…", opts = {}) =>
  toast.loading(msg, { ...opts });

/**
 * Diálogo de confirmación con toast (reemplaza window.confirm).
 * Muestra un toast con dos botones y devuelve una Promise<boolean>.
 *
 * @param {string} mensaje - Texto de la pregunta
 * @param {string} [labelConfirmar="Confirmar"] - Texto del botón de confirmación
 * @param {string} [tipo="danger"] - "danger" (rojo) | "warning" (naranja) | "info" (azul)
 * @returns {Promise<boolean>}
 */
export const confirmar = (mensaje, labelConfirmar = "Confirmar", tipo = "danger") =>
  new Promise((resolve) => {
    const colors = {
      danger:  { bg: "#fef2f2", border: "#fca5a5", btn: "#ef4444", text: "#991b1b" },
      warning: { bg: "#fffbeb", border: "#fde68a", btn: "#f59e0b", text: "#92400e" },
      info:    { bg: "#eff6ff", border: "#93c5fd", btn: "#3b82f6", text: "#1e40af" },
    };
    const c = colors[tipo] || colors.danger;

    const id = toast(
      (t) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ color: c.text, fontWeight: 500 }}>{mensaje}</span>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => { toast.dismiss(t.id); resolve(false); }}
              style={{
                padding: "5px 14px", borderRadius: 6, border: "1px solid #d1d5db",
                background: "#fff", cursor: "pointer", fontSize: 13,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => { toast.dismiss(t.id); resolve(true); }}
              style={{
                padding: "5px 14px", borderRadius: 6, border: "none",
                background: c.btn, color: "#fff", cursor: "pointer",
                fontWeight: 600, fontSize: 13,
              }}
            >
              {labelConfirmar}
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: { background: c.bg, border: `1px solid ${c.border}`, maxWidth: 380 },
      }
    );

    // Seguridad: si el toast se cierra sin respuesta, resolver como false
    setTimeout(() => resolve(false), 30_000);
  });

export { toast };
export default toast;
