import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEmpresa } from "../context/EmpresaContext";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import { getModulesForUser } from "../utils/module-access";
import { getUsuarios, getAnuncios, crearAnuncio, eliminarAnuncio, getPersonalHoy } from "../utils/api";

const BASE = "http://localhost:4000";

// ─── Estructura de navegación agrupada ────────────────────────────────────────
const NAV_ESTRUCTURA_ADMIN = [
  { to: "/dashboard",   label: "Inicio",      icon: "🏠", moduleKey: "dashboard" },
  {
    label: "Eventos", icon: "📡",
    children: [
      { to: "/eventos",       label: "Asistencia",    icon: "📡", moduleKey: "eventos" },
      { to: "/incidencias",   label: "Incidencias",   icon: "📋", moduleKey: "incidencias" },
      { to: "/vacaciones",    label: "Vacaciones",    icon: "🏖️", moduleKey: "vacaciones" },
      { to: "/incapacidades", label: "Incapacidades", icon: "🩺", moduleKey: "incapacidades" },
    ],
  },
  { to: "/calendario",  label: "Calendario",  icon: "📅", moduleKey: "calendario" },
  { to: "/reportes",    label: "Reportes",    icon: "📊", moduleKey: "reportes" },
  { to: "/grupos",      label: "Grupos",      icon: "🔗", moduleKey: "grupos" },
  { to: "/mapa",        label: "Mapa",        icon: "🗺️", moduleKey: "mapa" },
  {
    label: "Administración", icon: "⚙️",
    children: [
      { to: "/organigrama",    label: "Organigrama", icon: "🌲", moduleKey: "organigrama" },
      { to: "/horarios",       label: "Horarios",    icon: "⏰", moduleKey: "horarios" },
      { to: "/sucursales",     label: "Sucursales",  icon: "🏢", moduleKey: "sucursales" },
      { to: "/empleados",      label: "Empleados",   icon: "👥", moduleKey: "empleados" },
      { to: "/puestos",        label: "Puestos",     icon: "💼", moduleKey: "administracion" },
      { to: "/areas",          label: "Áreas",       icon: "🏗️", moduleKey: "administracion" },
      { to: "/empresa",        label: "Empresa",     icon: "🏛️", moduleKey: "administracion" },
      { to: "/anuncios-admin", label: "Anuncios",    icon: "📢", moduleKey: "administracion" },
    ],
  },
  {
    label: "Des. Org.", icon: "🧠",
    children: [
      { to: "/desarrollo-organizacional", label: "Evaluaciones", icon: "📋", moduleKey: "desarrollo_organizacional" },
      { to: "/nine-box",                  label: "Nine-Box",     icon: "🔲", moduleKey: "desarrollo_organizacional" },
    ],
  },
  {
    label: "Sistema", icon: "🖥️",
    children: [
      { to: "/auditoria",  label: "Auditoría",  icon: "🔍", moduleKey: "auditoria" },
      { to: "/logs",       label: "Logs",       icon: "🖥️", moduleKey: "logs" },
      { to: "/licencias",  label: "Licencias",  icon: "🔑", moduleKey: "licencias" },
    ],
  },
];

const NAV_ITEMS_EMPLEADO = [
  { to: "/dashboard",        label: "Inicio",           icon: "🏠" },
  { to: "/mis-incidencias",  label: "Mis Incidencias",  icon: "📋" },
  { to: "/mis-registros",    label: "Mis Registros",    icon: "🕐" },
  { to: "/perfil",           label: "Mi Perfil",        icon: "👤" },
];

const ROL_LABEL = {
  administrador_general: "Administrador General",
  super_admin: "Super Admin", agente_soporte_ti: "Soporte TI",
  supervisor_sucursales: "Supervisor", agente_control_asistencia: "Control Asist.",
  visor_reportes: "Visor", medico_titular: "Médico Titular", medico_de_guardia: "Médico Guardia",
  nominas: "Nóminas", desarrollo_organizacional: "Desarrollo Org.",
};

// ─── TopNavGroup — grupo con dropdown via portal ──────────────────────────────
function TopNavGroup({ entry, onClose }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const tieneHijoActivo = entry.children.some((c) => location.pathname.startsWith(c.to));

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 6, left: r.left });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!e.target.closest(".tnav-dropdown-portal") && e.target !== btnRef.current && !btnRef.current?.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Cerrar si cambia la ruta
  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <div className="tnav-group">
      <button
        ref={btnRef}
        className={`tnav-item tnav-group-btn${tieneHijoActivo ? " tnav-item-active" : ""}${open ? " tnav-item-open" : ""}`}
        onClick={handleToggle}
      >
        <span className="tnav-label">{entry.label}</span>
        <span className={`tnav-chevron${open ? " open" : ""}`}>▾</span>
      </button>
      {open && createPortal(
        <div
          className="tnav-dropdown tnav-dropdown-portal"
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, zIndex: 9999 }}
        >
          {entry.children.map((c) => (
            <NavLink
              key={c.to}
              to={c.to}
              onClick={() => { setOpen(false); onClose?.(); }}
              className={({ isActive }) => `tnav-dropdown-item${isActive ? " active" : ""}`}
            >
              <span>{c.label}</span>
            </NavLink>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── ProfileDropdown — perfil + cerrar sesión ──────────────────────────────────
function ProfileDropdown({ usuario, fotoUrl, onNavigate, onLogout, onToggleVista, vistaActual }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const location = useLocation();

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!e.target.closest(".profile-dropdown-portal") && e.target !== btnRef.current && !btnRef.current?.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const ROL_LABEL_LOCAL = {
    administrador_general: "Administrador General", super_admin: "Super Admin",
    agente_soporte_ti: "Soporte TI", supervisor_sucursales: "Supervisor",
    agente_control_asistencia: "Control Asist.", visor_reportes: "Visor",
    medico_titular: "Médico Titular", medico_de_guardia: "Médico Guardia",
    nominas: "Nóminas", desarrollo_organizacional: "Desarrollo Org.",
  };

  const puedeToggleVista = ["administrador_general", "super_admin", "agente_soporte_ti"].includes(usuario?.rol);

  return (
    <>
      <button
        ref={btnRef}
        className={`profile-chip${open ? " active" : ""}`}
        onClick={handleToggle}
        title="Mi perfil"
      >
        {fotoUrl
          ? <img src={fotoUrl} alt="avatar" className="profile-chip-avatar" />
          : <div className="profile-chip-fallback">{usuario?.sexo === "femenino" ? "👩" : "👨"}</div>
        }
        <span className="profile-chip-text">
          <strong>{usuario?.nombre} {usuario?.apellido}</strong>
          <small>{ROL_LABEL_LOCAL[usuario?.rol] || usuario?.rol}</small>
        </span>
        <span className={`tnav-chevron${open ? " open" : ""}`} style={{ marginLeft: 2 }}>▾</span>
      </button>

      {open && createPortal(
        <div
          className="tnav-dropdown profile-dropdown-portal"
          style={{ position: "fixed", top: dropPos.top, right: dropPos.right, left: "auto", minWidth: 220, zIndex: 9999 }}
        >
          {/* Cabecera */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{usuario?.nombre} {usuario?.apellido}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{ROL_LABEL_LOCAL[usuario?.rol] || usuario?.rol}</div>
          </div>
          {/* Mi perfil */}
          <button
            onClick={() => { setOpen(false); onNavigate("/perfil"); }}
            className="tnav-dropdown-item"
            style={{ border: "none", background: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
          >
            👤 Mi Perfil
          </button>
          {/* Vista toggle */}
          {puedeToggleVista && (
            <button
              onClick={() => { setOpen(false); onToggleVista(); }}
              className="tnav-dropdown-item"
              style={{ border: "none", background: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
            >
              {vistaActual === "admin" ? "👤 Vista Empleado" : "⚙️ Vista Admin"}
            </button>
          )}
          {/* Separador */}
          <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
          {/* Cerrar sesión */}
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="tnav-dropdown-item"
            style={{ border: "none", background: "none", width: "100%", textAlign: "left", cursor: "pointer", color: "var(--danger)" }}
          >
            🚪 Cerrar sesión
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function esMismoDiaDelAnio(fecha1, fecha2) {
  return fecha1.getMonth() === fecha2.getMonth() && fecha1.getDate() === fecha2.getDate();
}

// ─── SidebarSection (panel derecho) ──────────────────────────────────────────
function SidebarSection({ icon, title, badge, defaultOpen = true, actions, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "10px 16px", display: "flex", alignItems: "center",
          gap: 6, cursor: "pointer", userSelect: "none",
          background: open ? "transparent" : "var(--bg3)",
          transition: "background 0.15s",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "0.88rem", flex: 1, display: "flex", alignItems: "center", gap: 5 }}>
          {icon} {title}
          {badge > 0 && (
            <span style={{
              background: "var(--accent)", color: "#fff", borderRadius: 10,
              fontSize: "0.7rem", padding: "1px 6px", fontWeight: 700,
            }}>{badge}</span>
          )}
        </span>
        {actions && <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 4 }}>{actions}</div>}
        <span style={{
          fontSize: 12, color: "var(--text-muted)",
          transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform 0.2s", display: "inline-block", marginLeft: 2,
        }}>▾</span>
      </div>
      {open && <div style={{ padding: "0 16px 12px" }}>{children}</div>}
    </div>
  );
}

// ─── RightSidebar ─────────────────────────────────────────────────────────────
function RightSidebar({ usuarios, puedeEditar, personal, anuncios, onCrearAnuncio, onEliminarAnuncio, mobilePanelOpen, onMobilePanelClose }) {
  const [abierto, setAbierto] = useState(true);
  const [links, setLinks] = useState(() => {
    try { const r = localStorage.getItem("superadmin_links_frecuentes"); return r ? JSON.parse(r) : []; } catch { return []; }
  });
  const [showFormLink, setShowFormLink] = useState(false);
  const [formLink, setFormLink] = useState({ titulo: "", url: "", imagenBase64: "" });
  const [imgPreview, setImgPreview] = useState("");
  const [showFormAnuncio, setShowFormAnuncio] = useState(false);
  const [formAnuncio, setFormAnuncio] = useState({ titulo: "", texto: "" });

  const hoy = new Date();
  const cumpleaneros = usuarios.filter((u) => {
    if (!u.fechaNacimiento) return false;
    return esMismoDiaDelAnio(new Date(u.fechaNacimiento + "T12:00:00"), hoy);
  });

  const saveLinks = (l) => { localStorage.setItem("superadmin_links_frecuentes", JSON.stringify(l)); };

  const handleImagenChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setFormLink((f) => ({ ...f, imagenBase64: ev.target.result })); setImgPreview(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    if (!formLink.titulo || !formLink.url) return;
    const newLink = { id: Date.now().toString(), titulo: formLink.titulo, url: formLink.url.startsWith("http") ? formLink.url : "https://" + formLink.url, imagenBase64: formLink.imagenBase64, creadoEn: new Date().toISOString() };
    const updated = [...links, newLink]; setLinks(updated); saveLinks(updated);
    setFormLink({ titulo: "", url: "", imagenBase64: "" }); setImgPreview(""); setShowFormLink(false);
  };

  const handleDeleteLink = (id) => { const updated = links.filter((l) => l.id !== id); setLinks(updated); saveLinks(updated); };

  return (
    <>
      {/* Toggle desktop */}
      <button
        className="right-sidebar-toggle"
        onClick={() => setAbierto((a) => !a)}
        title={abierto ? "Ocultar panel" : "Mostrar panel"}
        style={{
          position: "fixed", top: "50%", right: abierto ? 260 : 0,
          transform: "translateY(-50%)", zIndex: 200,
          background: "var(--accent)", color: "white", border: "none",
          borderRadius: "6px 0 0 6px", width: 20, height: 60,
          cursor: "pointer", fontSize: 12, display: "flex",
          alignItems: "center", justifyContent: "center",
          transition: "right 0.25s ease", writingMode: "vertical-rl", padding: 0,
        }}
      >{abierto ? "›" : "‹"}</button>

      {/* Panel */}
      <aside
        className={`right-sidebar${mobilePanelOpen ? " mobile-panel-visible" : ""}`}
        style={{
          width: 260, height: "100vh", background: "var(--bg2)",
          borderLeft: "1px solid var(--border)", position: "fixed",
          top: 0, right: abierto ? 0 : -260,
          transition: "right 0.25s cubic-bezier(0.4,0,0.2,1)",
          zIndex: 100, overflowY: "auto", overflowX: "hidden",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "14px 16px 10px", borderBottom: "1px solid var(--border)",
          fontWeight: 700, fontSize: "0.8rem", color: "var(--text2)",
          textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0,
          position: "sticky", top: 0, background: "var(--bg2)", zIndex: 1,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span>📋 Panel de Empresa</span>
          {mobilePanelOpen && (
            <button onClick={onMobilePanelClose} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "1.1rem", padding: "2px 6px", borderRadius: 6, lineHeight: 1 }}>✕</button>
          )}
        </div>

        {/* Cumpleaños */}
        <SidebarSection icon="🎂" title="Cumpleaños del día" badge={cumpleaneros.length}>
          {cumpleaneros.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "var(--text2)", fontStyle: "italic", paddingTop: 4 }}>Sin cumpleaños hoy</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {cumpleaneros.map((u) => {
                const nac = new Date(u.fechaNacimiento + "T12:00:00");
                const anios = hoy.getFullYear() - nac.getFullYear();
                return (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "rgba(119,179,40,0.1)", borderRadius: 6, border: "1px solid rgba(119,179,40,0.25)" }}>
                    <span style={{ fontSize: "1.2rem" }}>🎉</span>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{u.nombre} {u.apellido}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text2)" }}>{anios === 0 ? "¡Nació hoy!" : `🎂 ${anios} año${anios !== 1 ? "s" : ""}`}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SidebarSection>

        {/* Personal de hoy */}
        <SidebarSection icon="👥" title="Personal de hoy" badge={personal?.length || 0}>
          {!personal || personal.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "var(--text2)", fontStyle: "italic", paddingTop: 4 }}>Sin registros hoy</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {personal.map((p, i) => (
                <div key={p.usuarioId || i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "var(--bg3)", borderRadius: 6, borderLeft: "3px solid var(--primary)" }}>
                  {p.fotoUrl ? <img src={`${BASE}${p.fotoUrl}`} alt={p.nombre} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} /> : <span style={{ fontSize: 20, flexShrink: 0 }}>👤</span>}
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</div>
                    {p.puestoNombre && <div style={{ fontSize: "0.7rem", color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>💼 {p.puestoNombre}</div>}
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>🕐 {p.hora || ""}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SidebarSection>

        {/* Anuncios */}
        <SidebarSection icon="📢" title="Anuncios" badge={anuncios?.length || 0} actions={puedeEditar && (
          <button onClick={() => setShowFormAnuncio((v) => !v)} style={{ background: "var(--accent)", color: "white", border: "none", borderRadius: 4, padding: "2px 7px", cursor: "pointer", fontSize: "0.72rem" }}>
            {showFormAnuncio ? "✕" : "+ Nuevo"}
          </button>
        )}>
          {showFormAnuncio && (
            <form onSubmit={(e) => { e.preventDefault(); if (!formAnuncio.titulo || !formAnuncio.texto) return; onCrearAnuncio?.(formAnuncio); setFormAnuncio({ titulo: "", texto: "" }); setShowFormAnuncio(false); }} style={{ marginBottom: 10 }}>
              <input type="text" className="form-control" placeholder="Título" value={formAnuncio.titulo} onChange={(e) => setFormAnuncio((f) => ({ ...f, titulo: e.target.value }))} required style={{ fontSize: "0.8rem", padding: "5px 8px", marginBottom: 5 }} />
              <textarea className="form-control" placeholder="Texto del anuncio..." value={formAnuncio.texto} onChange={(e) => setFormAnuncio((f) => ({ ...f, texto: e.target.value }))} required rows={3} style={{ fontSize: "0.8rem", padding: "5px 8px", marginBottom: 5 }} />
              <button type="submit" className="btn btn-primary" style={{ width: "100%", fontSize: "0.8rem", padding: "5px" }}>Publicar</button>
            </form>
          )}
          {!anuncios || anuncios.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "var(--text2)", fontStyle: "italic", paddingTop: 4 }}>Sin anuncios</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {anuncios.map((a) => (
                <div key={a.id} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{a.titulo}</div>
                    {puedeEditar && <button onClick={() => onEliminarAnuncio?.(a.id)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.85rem", flexShrink: 0 }}>✕</button>}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text2)", marginTop: 3 }}>{a.texto}</div>
                </div>
              ))}
            </div>
          )}
        </SidebarSection>

        {/* Links frecuentes */}
        <SidebarSection icon="🔗" title="Links Frecuentes" actions={puedeEditar && (
          <button onClick={() => setShowFormLink((v) => !v)} style={{ background: "var(--accent)", color: "white", border: "none", borderRadius: 4, padding: "2px 7px", cursor: "pointer", fontSize: "0.72rem" }}>
            {showFormLink ? "✕" : "+ Añadir"}
          </button>
        )}>
          {showFormLink && (
            <form onSubmit={handleAddLink} style={{ marginBottom: 12 }}>
              <input type="text" className="form-control" placeholder="Título del link" value={formLink.titulo} onChange={(e) => setFormLink((f) => ({ ...f, titulo: e.target.value }))} required style={{ fontSize: "0.8rem", padding: "5px 8px", marginBottom: 5 }} />
              <input type="text" className="form-control" placeholder="URL (ej: google.com)" value={formLink.url} onChange={(e) => setFormLink((f) => ({ ...f, url: e.target.value }))} required style={{ fontSize: "0.8rem", padding: "5px 8px", marginBottom: 5 }} />
              <div style={{ marginBottom: 7 }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text2)", display: "block", marginBottom: 3 }}>Imagen (opcional)</label>
                <input type="file" accept="image/*" onChange={handleImagenChange} style={{ fontSize: "0.75rem" }} />
                {imgPreview && <img src={imgPreview} alt="preview" style={{ width: "100%", height: 56, objectFit: "cover", borderRadius: 4, marginTop: 4 }} />}
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", fontSize: "0.8rem", padding: "5px" }}>Guardar link</button>
            </form>
          )}
          {links.length === 0 && !showFormLink ? (
            <div style={{ fontSize: "0.8rem", color: "var(--text2)", fontStyle: "italic", paddingTop: 4 }}>No hay links guardados</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {links.map((link) => (
                <div key={link.id} style={{ border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", background: "var(--bg3)" }}>
                  {link.imagenBase64 && <img src={link.imagenBase64} alt={link.titulo} style={{ width: "100%", height: 56, objectFit: "cover" }} />}
                  <div style={{ padding: "7px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent2)", textDecoration: "none", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🔗 {link.titulo}</a>
                    {puedeEditar && <button onClick={() => handleDeleteLink(link.id)} title="Eliminar" style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.85rem", flexShrink: 0 }}>✕</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SidebarSection>
        <div style={{ height: 24, flexShrink: 0 }} />
      </aside>
    </>
  );
}

// ─── Layout principal ──────────────────────────────────────────────────────────
const Layout = () => {
  const { usuario, logout, vistaActual, toggleVista } = useAuth();
  const { empresa } = useEmpresa();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [personalHoy, setPersonalHoy] = useState([]);
  const [anuncios, setAnuncios] = useState([]);

  const modulosPermitidos = new Set(getModulesForUser(usuario));
  const esSuperAdmin = ["super_admin", "administrador_general"].includes(usuario?.rol);
  const puedeEditarSidebar = esSuperAdmin || usuario?.rol === "agente_soporte_ti";
  const ROLES_PUEDEN_VER_USUARIOS = ["super_admin", "agente_soporte_ti", "supervisor_sucursales"];
  const ROLES_GESTION = ["administrador_general", "super_admin", "agente_soporte_ti", "supervisor_sucursales", "agente_control_asistencia", "nominas", "desarrollo_organizacional"];

  const handleLogout = () => { logout(); navigate("/login"); };

  // Filtrar estructura de nav según módulos del usuario
  const estructuraFiltrada = NAV_ESTRUCTURA_ADMIN
    .map((entry) => {
      if (entry.children) {
        const hijosVisibles = entry.children.filter((c) => !c.moduleKey || modulosPermitidos.has(c.moduleKey));
        if (hijosVisibles.length === 0) return null;
        return { ...entry, children: hijosVisibles };
      }
      if (entry.moduleKey && !modulosPermitidos.has(entry.moduleKey)) return null;
      return entry;
    })
    .filter(Boolean);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) { setMobileOpen(false); setMobilePanelOpen(false); }
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (usuario && ROLES_PUEDEN_VER_USUARIOS.includes(usuario.rol)) {
      getUsuarios().then((u) => setTodosUsuarios(Array.isArray(u) ? u : [])).catch(() => {});
    }
  }, [usuario?.rol]);

  useEffect(() => {
    if (!usuario) return;
    if (ROLES_GESTION.includes(usuario.rol)) {
      getPersonalHoy().then((r) => setPersonalHoy(Array.isArray(r) ? r : [])).catch(() => {});
    }
    getAnuncios().then((r) => setAnuncios(Array.isArray(r) ? r : [])).catch(() => {});
  }, [usuario?.rol]);

  const handleCrearAnuncio = async (data) => {
    try { const nuevo = await crearAnuncio(data); setAnuncios((prev) => [nuevo, ...prev]); } catch (e) { alert(e.message); }
  };
  const handleEliminarAnuncio = async (id) => {
    if (!window.confirm("¿Eliminar este anuncio?")) return;
    try { await eliminarAnuncio(id); setAnuncios((prev) => prev.filter((a) => a.id !== id)); } catch (e) { alert(e.message); }
  };

  const fotoUrl = usuario?.fotoUrl ? `${BASE}${usuario.fotoUrl}` : null;
  const logoEmpresa = empresa?.logoUrl ? `${BASE}${empresa.logoUrl}` : null;
  const nombreEmpresa = empresa?.nombre || "Control de Acceso";

  const navItems = vistaActual === "empleado" ? NAV_ITEMS_EMPLEADO : estructuraFiltrada;

  return (
    <div className="layout" style={{ paddingRight: 260 }}>

      {/* ── Top Navigation Bar ───────────────────────────────────────────── */}
      <header className="top-nav">
        <div className="tnav-inner">

          {/* Hamburger (mobile) */}
          <button className="tnav-hamburger" onClick={() => setMobileOpen((v) => !v)} aria-label="Menú">
            {mobileOpen ? "✕" : "☰"}
          </button>

          {/* Logo */}
          <div className="tnav-logo" onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>
            {logoEmpresa
              ? <img src={logoEmpresa} alt={nombreEmpresa} className="tnav-logo-img" />
              : <span className="tnav-logo-icon">🏢</span>
            }
            <span className="tnav-brand">{nombreEmpresa}</span>
          </div>

          {/* Desktop nav links */}
          <nav className="tnav-links">
            {navItems.map((entry) =>
              entry.children ? (
                <TopNavGroup key={entry.label} entry={entry} onClose={() => setMobileOpen(false)} />
              ) : (
                <NavLink
                  key={entry.to}
                  to={entry.to}
                  className={({ isActive }) => `tnav-item${isActive ? " tnav-item-active" : ""}`}
                >
                  {entry.label}
                </NavLink>
              )
            )}
          </nav>

          {/* Right actions */}
          <div className="tnav-actions">
            <ThemeToggle />
            <NotificationBell />
            {/* Panel button (móvil) */}
            <button
              className={`mobile-panel-btn${mobilePanelOpen ? " active" : ""}`}
              onClick={() => setMobilePanelOpen((v) => !v)}
              title="Panel de empresa"
            >
              📋
            </button>
            {/* Profile dropdown (incluye logout y cambio de vista) */}
            <ProfileDropdown
              usuario={usuario}
              fotoUrl={fotoUrl}
              onNavigate={navigate}
              onLogout={handleLogout}
              onToggleVista={toggleVista}
              vistaActual={vistaActual}
            />
          </div>

        </div>
      </header>

      {/* ── Mobile overlay + drawer ─────────────────────────────────────── */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} style={{ display: "block" }} />
      )}

      <aside className={`mobile-nav-drawer${mobileOpen ? " mobile-nav-drawer-open" : ""}`}>
        {/* Header del drawer */}
        <div className="mobile-drawer-header">
          {logoEmpresa
            ? <img src={logoEmpresa} alt={nombreEmpresa} style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 6, background: "#fff", padding: 2 }} />
            : <span>🏢</span>
          }
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{nombreEmpresa}</span>
          <button onClick={() => setMobileOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text2)", fontSize: "1.2rem", cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}>✕</button>
        </div>
        {/* Nav items */}
        <nav style={{ padding: "8px 0", flex: 1, overflowY: "auto" }}>
          {navItems.map((entry) =>
            entry.children ? (
              <MobileNavGroup key={entry.label} entry={entry} onClose={() => setMobileOpen(false)} />
            ) : (
              <NavLink
                key={entry.to}
                to={entry.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `mobile-nav-item${isActive ? " mobile-nav-item-active" : ""}`}
              >
                <span>{entry.icon}</span>
                <span>{entry.label}</span>
              </NavLink>
            )
          )}
        </nav>
        {/* Footer logout */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleLogout}
            style={{ width: "100%", padding: "10px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", color: "var(--danger)", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ── Right sidebar ─────────────────────────────────────────────── */}
      {mobilePanelOpen && (
        <div className="mobile-panel-overlay" onClick={() => setMobilePanelOpen(false)} />
      )}
      <RightSidebar
        usuarios={todosUsuarios}
        puedeEditar={puedeEditarSidebar}
        personal={personalHoy}
        anuncios={anuncios}
        onCrearAnuncio={handleCrearAnuncio}
        onEliminarAnuncio={handleEliminarAnuncio}
        mobilePanelOpen={mobilePanelOpen}
        onMobilePanelClose={() => setMobilePanelOpen(false)}
      />
    </div>
  );
};

// ─── MobileNavGroup ────────────────────────────────────────────────────────────
function MobileNavGroup({ entry, onClose }) {
  const location = useLocation();
  const tieneHijoActivo = entry.children.some((c) => location.pathname.startsWith(c.to));
  const [open, setOpen] = useState(tieneHijoActivo);
  return (
    <div>
      <button
        className={`mobile-nav-item mobile-nav-group-btn${tieneHijoActivo ? " mobile-nav-item-active" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{entry.icon}</span>
        <span style={{ flex: 1 }}>{entry.label}</span>
        <span style={{ fontSize: 11, opacity: 0.7, transform: open ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
      </button>
      {open && (
        <div style={{ paddingLeft: 12 }}>
          {entry.children.map((c) => (
            <NavLink
              key={c.to}
              to={c.to}
              onClick={onClose}
              className={({ isActive }) => `mobile-nav-item mobile-nav-child${isActive ? " mobile-nav-item-active" : ""}`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default Layout;
