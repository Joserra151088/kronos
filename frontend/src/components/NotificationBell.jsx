import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificaciones } from "../context/NotificacionesContext";

const TIPO_CONFIG = {
  info:               { icon: "🔔", color: "#3b82f6" },
  alerta:             { icon: "⚠️",  color: "#f97316" },
  success:            { icon: "✅", color: "#22c55e" },
  error:              { icon: "❌", color: "#ef4444" },
  incidencia_nueva:   { icon: "📋", color: "#f97316" },
  incidencia_resuelta:{ icon: "✅", color: "#22c55e" },
  asistencia_manual:  { icon: "🖊️", color: "#3b82f6" },
  asistencia_aprobada:{ icon: "✔️",  color: "#22c55e" },
  asistencia_rechazada:{ icon: "❌", color: "#ef4444" },
  mensaje_general:    { icon: "💬", color: "#3b82f6" },
};

const tiempoRelativo = (isoString) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} hora${h !== 1 ? "s" : ""}`;
  const d = Math.floor(h / 24);
  return `hace ${d} día${d !== 1 ? "s" : ""}`;
};

const NotificationBell = () => {
  const { notificaciones, noLeidas, marcarLeida, marcarTodas } = useNotificaciones();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (notif) => {
    if (!notif.leida) marcarLeida(notif.id);
    setAbierto(false);
    navigate("/notificaciones");
  };

  const recientes = notificaciones.slice(0, 5);

  return (
    <div className="notif-bell-wrapper" ref={ref}>
      <button className="notif-bell-btn" onClick={() => setAbierto(!abierto)} title="Notificaciones">
        🔔
        {noLeidas > 0 && (
          <span className="notif-badge">{noLeidas > 99 ? "99+" : noLeidas}</span>
        )}
      </button>

      {abierto && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>Notificaciones {noLeidas > 0 && <span style={{ color: "var(--danger)", fontSize: "0.75rem" }}>({noLeidas} sin leer)</span>}</span>
            {noLeidas > 0 && (
              <button onClick={() => { marcarTodas(); }} title="Marcar todas como leídas">
                Marcar todas como leídas
              </button>
            )}
          </div>

          {recientes.length === 0 ? (
            <div className="notif-empty">
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>🔕</div>
              Sin notificaciones
            </div>
          ) : (
            <div className="notif-list" style={{ maxHeight: 360, overflowY: "auto" }}>
              {recientes.map((n) => {
                const config = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.info;
                return (
                  <button
                    key={n.id}
                    className={`notif-item ${!n.leida ? "notif-item-unread" : ""}`}
                    onClick={() => handleClick(n)}
                    style={{ borderLeft: `3px solid ${config.color}` }}
                  >
                    <span className="notif-item-icon">{config.icon}</span>
                    <div className="notif-item-body">
                      <div className="notif-item-title">{n.titulo}</div>
                      <div className="notif-item-msg">{n.mensaje}</div>
                      <div className="notif-item-time">{tiempoRelativo(n.creadoEn)}</div>
                    </div>
                    {!n.leida && <span className="notif-item-dot" />}
                  </button>
                );
              })}
            </div>
          )}

          <div className="notif-dropdown-footer">
            <button onClick={() => { setAbierto(false); navigate("/notificaciones"); }}>
              Ver todas →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
