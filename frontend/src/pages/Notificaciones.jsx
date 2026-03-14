import { useNotificaciones } from "../context/NotificacionesContext";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { getUsuarios, enviarNotificacion } from "../utils/api";

const ROLES_PUEDEN_ENVIAR = ["super_admin", "agente_soporte_ti", "supervisor_sucursales", "agente_control_asistencia"];

const TIPO_CONFIG = {
  info:               { icon: "🔔", label: "Info",    color: "#3b82f6" },
  alerta:             { icon: "⚠️",  label: "Alerta",  color: "#f97316" },
  success:            { icon: "✅", label: "Éxito",   color: "#22c55e" },
  error:              { icon: "❌", label: "Error",   color: "#ef4444" },
  incidencia_nueva:   { icon: "📋", label: "Incidencia", color: "#f97316" },
  incidencia_resuelta:{ icon: "✅", label: "Resuelta",   color: "#22c55e" },
  asistencia_manual:  { icon: "🖊️", label: "Asistencia", color: "#3b82f6" },
  asistencia_aprobada:{ icon: "✔️",  label: "Aprobada",  color: "#22c55e" },
  asistencia_rechazada:{ icon: "❌", label: "Rechazada", color: "#ef4444" },
  mensaje_general:    { icon: "💬", label: "Mensaje",  color: "#3b82f6" },
};

const TIPOS_FILTRO = [
  { value: "todos", label: "Todos los tipos" },
  { value: "info",    label: "🔔 Info" },
  { value: "alerta",  label: "⚠️ Alerta" },
  { value: "success", label: "✅ Éxito" },
  { value: "error",   label: "❌ Error" },
];

const formatFecha = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
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

const Notificaciones = () => {
  const { usuario } = useAuth();
  const { notificaciones, noLeidas, marcarLeida, marcarTodas } = useNotificaciones();
  const puedeEnviar = ROLES_PUEDEN_ENVIAR.includes(usuario?.rol);

  const [tabActiva, setTabActiva] = useState("todas"); // "todas" | "no_leidas" | "leidas"
  const [tipoFiltro, setTipoFiltro] = useState("todos");

  const [usuarios, setUsuarios] = useState([]);
  const [modalEnviar, setModalEnviar] = useState(false);
  const [form, setForm] = useState({ paraUsuarioIds: [], titulo: "", mensaje: "" });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (puedeEnviar) getUsuarios().then(setUsuarios).catch(() => {});
  }, [puedeEnviar]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (form.paraUsuarioIds.length === 0) { alert("Selecciona al menos un destinatario"); return; }
    try {
      setEnviando(true);
      await enviarNotificacion({ ...form, tipo: "mensaje_general" });
      setEnviado(true);
      setModalEnviar(false);
      setForm({ paraUsuarioIds: [], titulo: "", mensaje: "" });
      setTimeout(() => setEnviado(false), 3000);
    } catch (e) {
      alert(e.message);
    } finally {
      setEnviando(false);
    }
  };

  // Filtrar notificaciones
  const notifFiltradas = notificaciones.filter((n) => {
    if (tabActiva === "no_leidas" && n.leida) return false;
    if (tabActiva === "leidas" && !n.leida) return false;
    if (tipoFiltro !== "todos") {
      // Agrupar tipos relacionados al filtro seleccionado
      const grupoTipo = {
        info: ["info", "asistencia_manual", "mensaje_general"],
        alerta: ["alerta", "incidencia_nueva"],
        success: ["success", "incidencia_resuelta", "asistencia_aprobada"],
        error: ["error", "asistencia_rechazada"],
      };
      const grupo = grupoTipo[tipoFiltro] || [tipoFiltro];
      if (!grupo.includes(n.tipo)) return false;
    }
    return true;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notificaciones</h1>
          <p className="page-subtitle">
            {noLeidas > 0
              ? <span style={{ color: "var(--danger)", fontWeight: 600 }}>{noLeidas} sin leer</span>
              : "Todas leídas"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {noLeidas > 0 && (
            <button className="btn btn-secondary" onClick={marcarTodas}>
              ✅ Marcar todas como leídas
            </button>
          )}
          {puedeEnviar && (
            <button className="btn btn-primary" onClick={() => setModalEnviar(true)}>
              + Enviar notificación
            </button>
          )}
        </div>
      </div>

      {enviado && <div className="alert alert-success">Notificación enviada correctamente</div>}

      {/* Tabs de filtro */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <div className="tabs" style={{ marginBottom: 0, flex: 1 }}>
          {[
            { key: "todas",     label: `Todas (${notificaciones.length})` },
            { key: "no_leidas", label: `No leídas (${noLeidas})` },
            { key: "leidas",    label: `Leídas (${notificaciones.length - noLeidas})` },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`tab-btn${tabActiva === tab.key ? " tab-btn-active" : ""}`}
              onClick={() => setTabActiva(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          className="form-control"
          style={{ width: "auto", minWidth: 160 }}
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
        >
          {TIPOS_FILTRO.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {notifFiltradas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔕</div>
          <p>
            {tabActiva === "no_leidas"
              ? "No tienes notificaciones sin leer"
              : tabActiva === "leidas"
              ? "No tienes notificaciones leídas"
              : "No hay notificaciones"}
          </p>
        </div>
      ) : (
        <div className="notif-page-list">
          {notifFiltradas.map((n) => {
            const config = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.info;
            return (
              <div
                key={n.id}
                className={`notif-item-card ${!n.leida ? "notif-item-card-unread" : ""}`}
                style={{ borderLeft: `4px solid ${config.color}` }}
                onClick={() => !n.leida && marcarLeida(n.id)}
              >
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flex: 1 }}>
                  <span className={`notif-type-${n.tipo in TIPO_CONFIG ? n.tipo : "info"}`} style={{ fontSize: "1.5rem", flexShrink: 0, lineHeight: 1 }}>
                    {config.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{n.titulo}</div>
                    <div style={{ color: "var(--text2)", fontSize: "0.875rem", marginBottom: 6 }}>{n.mensaje}</div>
                    <div style={{ display: "flex", gap: 12, fontSize: "0.78rem", color: "var(--text2)" }}>
                      <span title={formatFecha(n.creadoEn)}>{tiempoRelativo(n.creadoEn)}</span>
                      <span>·</span>
                      <span>{formatFecha(n.creadoEn)}</span>
                      <span style={{ background: config.color + "22", color: config.color, borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                </div>
                {!n.leida && (
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: "0.78rem", padding: "4px 10px", flexShrink: 0, alignSelf: "center" }}
                    onClick={(e) => { e.stopPropagation(); marcarLeida(n.id); }}
                  >
                    Marcar como leída
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalEnviar && (
        <div className="modal-overlay" onClick={() => setModalEnviar(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enviar Notificación</h2>
              <button className="modal-close" onClick={() => setModalEnviar(false)}>✕</button>
            </div>
            <form onSubmit={handleEnviar} className="modal-body">
              <div className="form-group">
                <label>Destinatarios *</label>
                <select
                  multiple
                  className="form-control"
                  style={{ minHeight: 120 }}
                  value={form.paraUsuarioIds}
                  onChange={(e) => setForm({ ...form, paraUsuarioIds: Array.from(e.target.selectedOptions, o => o.value) })}
                >
                  {usuarios.filter(u => u.activo).map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre} {u.apellido} ({u.rol.replace(/_/g, " ")})</option>
                  ))}
                </select>
                <small style={{ color: "var(--text-muted)" }}>Mantén Ctrl/Cmd para seleccionar varios</small>
              </div>
              <div className="form-group">
                <label>Título *</label>
                <input className="form-control" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Mensaje *</label>
                <textarea className="form-control" rows={3} value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} required />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalEnviar(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? "Enviando..." : "Enviar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
