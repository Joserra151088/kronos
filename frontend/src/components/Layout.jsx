import { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEmpresa } from "../context/EmpresaContext";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import useSidebar from "../hooks/useSidebar";
import { getModulesForUser } from "../utils/module-access";
import { getUsuarios } from "../utils/api";

const BASE = "http://localhost:4000";

const NAV_ITEMS = [
  { to: "/dashboard",      label: "Inicio",         icon: "🏠", moduleKey: "dashboard" },
  { to: "/eventos",        label: "Eventos",        icon: "📡", moduleKey: "eventos" },
  { to: "/incidencias",    label: "Incidencias",    icon: "📋", moduleKey: "incidencias" },
  { to: "/reportes",       label: "Reportes",       icon: "📊", moduleKey: "reportes" },
  { to: "/sucursales",     label: "Sucursales",     icon: "🏢", moduleKey: "sucursales" },
  { to: "/empleados",      label: "Empleados",      icon: "👥", moduleKey: "empleados" },
  { to: "/grupos",         label: "Grupos",         icon: "🔗", moduleKey: "grupos" },
  { to: "/mapa",           label: "Mapa",           icon: "🗺️", moduleKey: "mapa" },
  { to: "/admin",          label: "Administración", icon: "⚙️", moduleKey: "administracion" },
  { to: "/auditoria",      label: "Auditoría",      icon: "🔍", moduleKey: "auditoria" },
  { to: "/notificaciones", label: "Notificaciones", icon: "🔔", moduleKey: "notificaciones" },
];

const ROL_LABEL = {
  super_admin: "Super Admin", agente_soporte_ti: "Soporte TI",
  supervisor_sucursales: "Supervisor", agente_control_asistencia: "Control Asist.",
  visor_reportes: "Visor", medico_titular: "Médico Titular", medico_de_guardia: "Médico Guardia",
};

// ─── Links Frecuentes (localStorage) ─────────────────────────────────────────

const LS_KEY = "superadmin_links_frecuentes";

function loadLinks() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLinks(links) {
  localStorage.setItem(LS_KEY, JSON.stringify(links));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esMismoDiaDelAnio(fecha1, fecha2) {
  return fecha1.getMonth() === fecha2.getMonth() && fecha1.getDate() === fecha2.getDate();
}

// ─── Componente Right Sidebar ─────────────────────────────────────────────────

function RightSidebar({ usuarios }) {
  const [abierto, setAbierto] = useState(true);
  const [links, setLinks] = useState(loadLinks);
  const [showFormLink, setShowFormLink] = useState(false);
  const [formLink, setFormLink] = useState({ titulo: "", url: "", imagenBase64: "" });
  const [imgPreview, setImgPreview] = useState("");

  const hoy = new Date();

  // Calcular aniversarios (mismo mes/día que creadoEn)
  const aniversarios = usuarios.filter((u) => {
    if (!u.creadoEn) return false;
    const fechaCreacion = new Date(u.creadoEn);
    return esMismoDiaDelAnio(fechaCreacion, hoy);
  });

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormLink((f) => ({ ...f, imagenBase64: ev.target.result }));
      setImgPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    if (!formLink.titulo || !formLink.url) return;
    const newLink = {
      id: Date.now().toString(),
      titulo: formLink.titulo,
      url: formLink.url.startsWith("http") ? formLink.url : "https://" + formLink.url,
      imagenBase64: formLink.imagenBase64,
      creadoEn: new Date().toISOString(),
    };
    const updated = [...links, newLink];
    setLinks(updated);
    saveLinks(updated);
    setFormLink({ titulo: "", url: "", imagenBase64: "" });
    setImgPreview("");
    setShowFormLink(false);
  };

  const handleDeleteLink = (id) => {
    const updated = links.filter((l) => l.id !== id);
    setLinks(updated);
    saveLinks(updated);
  };

  return (
    <>
      {/* Toggle button - always visible */}
      <button
        className="right-sidebar-toggle"
        onClick={() => setAbierto((a) => !a)}
        title={abierto ? "Ocultar panel" : "Mostrar panel"}
        style={{
          position: "fixed",
          top: "50%",
          right: abierto ? 260 : 0,
          transform: "translateY(-50%)",
          zIndex: 200,
          background: "var(--accent)",
          color: "white",
          border: "none",
          borderRadius: "6px 0 0 6px",
          width: 20,
          height: 60,
          cursor: "pointer",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "right 0.25s ease",
          writingMode: "vertical-rl",
          padding: 0,
        }}
      >
        {abierto ? "›" : "‹"}
      </button>

      {/* Sidebar panel */}
      <aside
        className="right-sidebar"
        style={{
          width: 260,
          minHeight: "100vh",
          background: "var(--bg2)",
          borderLeft: "1px solid var(--border)",
          position: "fixed",
          top: 0,
          right: abierto ? 0 : -260,
          transition: "right 0.25s ease",
          zIndex: 100,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "18px 16px 12px",
          borderBottom: "1px solid var(--border)",
          fontWeight: 700,
          fontSize: "0.85rem",
          color: "var(--text2)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          Panel Super Admin
        </div>

        {/* ── Cumpleaños / Aniversarios ────────────── */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            🎂 Cumpleaños del día
          </div>
          {aniversarios.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "var(--text2)", fontStyle: "italic" }}>
              Sin aniversarios hoy
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {aniversarios.map((u) => {
                const fechaC = new Date(u.creadoEn);
                const anios = hoy.getFullYear() - fechaC.getFullYear();
                return (
                  <div key={u.id} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 10px",
                    background: "rgba(119,179,40,0.1)",
                    borderRadius: 6,
                    border: "1px solid rgba(119,179,40,0.25)",
                  }}>
                    <span style={{ fontSize: "1.3rem" }}>🎉</span>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{u.nombre} {u.apellido}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text2)" }}>
                        {anios === 0 ? "¡Ingresó hoy!" : `${anios} ${anios === 1 ? "año" : "años"} en la empresa`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Links Frecuentes ─────────────────────── */}
        <div style={{ padding: "14px 16px", flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>🔗 Links Frecuentes</span>
            <button
              onClick={() => setShowFormLink((v) => !v)}
              style={{
                background: "var(--accent)", color: "white", border: "none",
                borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: "0.78rem",
              }}
            >
              {showFormLink ? "✕" : "+ Añadir"}
            </button>
          </div>

          {showFormLink && (
            <form onSubmit={handleAddLink} style={{ marginBottom: 14 }}>
              <div style={{ marginBottom: 6 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Título del link"
                  value={formLink.titulo}
                  onChange={(e) => setFormLink((f) => ({ ...f, titulo: e.target.value }))}
                  required
                  style={{ fontSize: "0.8rem", padding: "5px 8px" }}
                />
              </div>
              <div style={{ marginBottom: 6 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="URL (ej: google.com)"
                  value={formLink.url}
                  onChange={(e) => setFormLink((f) => ({ ...f, url: e.target.value }))}
                  required
                  style={{ fontSize: "0.8rem", padding: "5px 8px" }}
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text2)", display: "block", marginBottom: 3 }}>
                  Imagen (opcional)
                </label>
                <input type="file" accept="image/*" onChange={handleImagenChange} style={{ fontSize: "0.75rem" }} />
                {imgPreview && (
                  <img src={imgPreview} alt="preview" style={{ width: "100%", height: 60, objectFit: "cover", borderRadius: 4, marginTop: 5 }} />
                )}
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", fontSize: "0.8rem", padding: "5px" }}>
                Guardar link
              </button>
            </form>
          )}

          {links.length === 0 && !showFormLink ? (
            <div style={{ fontSize: "0.8rem", color: "var(--text2)", fontStyle: "italic" }}>
              No hay links guardados
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {links.map((link) => (
                <div key={link.id} style={{
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  overflow: "hidden",
                  background: "var(--bg3)",
                }}>
                  {link.imagenBase64 && (
                    <img
                      src={link.imagenBase64}
                      alt={link.titulo}
                      style={{ width: "100%", height: 60, objectFit: "cover" }}
                    />
                  )}
                  <div style={{ padding: "7px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent2)", textDecoration: "none", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      🔗 {link.titulo}
                    </a>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      title="Eliminar"
                      style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.85rem", flexShrink: 0 }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// ─── Layout principal ─────────────────────────────────────────────────────────

const Layout = () => {
  const { usuario, logout } = useAuth();
  const { empresa } = useEmpresa();
  const navigate = useNavigate();
  const { collapsed, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const showLabels = !collapsed || mobileOpen;
  const modulosPermitidos = new Set(getModulesForUser(usuario));
  const esSuperAdmin = usuario?.rol === "super_admin";

  const handleLogout = () => { logout(); navigate("/login"); };
  const itemsVisibles = NAV_ITEMS.filter((item) => !item.moduleKey || modulosPermitidos.has(item.moduleKey));

  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Load users for the right sidebar (only for super_admin)
  useEffect(() => {
    if (esSuperAdmin) {
      getUsuarios().then((u) => setTodosUsuarios(Array.isArray(u) ? u : [])).catch(() => {});
    }
  }, [esSuperAdmin]);

  const fotoUrl = usuario?.fotoUrl ? `${BASE}${usuario.fotoUrl}` : null;
  const logoEmpresa = empresa?.logoUrl ? `${BASE}${empresa.logoUrl}` : null;
  const nombreEmpresa = empresa?.nombre || "Control de Acceso";

  return (
    <div
      className={`layout ${collapsed ? "sidebar-is-collapsed" : ""}`}
      style={esSuperAdmin ? { paddingRight: 260 } : {}}
    >
      <header className="mobile-header">
        <button className="hamburger-btn" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? "✕" : "☰"}
        </button>
        <span className="mobile-brand">
          {logoEmpresa ? <img src={logoEmpresa} alt={nombreEmpresa} className="mobile-brand-logo" /> : "🏢"}
          {nombreEmpresa}
        </span>
        <div className="mobile-actions"><NotificationBell /></div>
      </header>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "sidebar-open" : ""}`}>
        {/* Brand / toggle */}
        <div className="sidebar-brand">
          {!collapsed && (
            logoEmpresa
              ? <img src={logoEmpresa} alt={nombreEmpresa} className="brand-logo" />
              : <span className="brand-icon">🏢</span>
          )}
          {showLabels && <span className="brand-text">{nombreEmpresa}</span>}
          <button className="sidebar-toggle-btn" onClick={toggle} title={collapsed ? "Expandir menú" : "Colapsar menú"}>
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        <nav className="sidebar-nav">
          {itemsVisibles.map((item) => (
            <NavLink key={item.to} to={item.to} title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}>
              <span className="nav-icon">{item.icon}</span>
              {showLabels && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión">🚪</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="app-topbar">
          <div className="app-topbar-spacer" />
          <div className="app-topbar-actions">
            <ThemeToggle />
            <NotificationBell />
            <button
              className="profile-chip"
              onClick={() => { navigate("/perfil"); setMobileOpen(false); }}
              title="Editar perfil"
            >
              {fotoUrl
                ? <img src={fotoUrl} alt="avatar" className="profile-chip-avatar" />
                : <div className="profile-chip-fallback">{usuario?.sexo === "femenino" ? "👩" : "👨"}</div>
              }
              <span className="profile-chip-text">
                <strong>{usuario?.nombre} {usuario?.apellido}</strong>
                <small>{usuario?.email || ROL_LABEL[usuario?.rol] || usuario?.rol}</small>
              </span>
            </button>
          </div>
        </div>
        <Outlet />
      </main>

      {/* Right sidebar - solo super_admin */}
      {esSuperAdmin && <RightSidebar usuarios={todosUsuarios} />}
    </div>
  );
};

export default Layout;
