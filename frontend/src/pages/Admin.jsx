/**
 * Admin.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Administración del sistema: Puestos, Horarios, configuración de Roles y Empresa.
 * Acceso: super_admin y agente_soporte_ti (la pestaña Roles/Empresa solo super_admin).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useEmpresa } from "../context/EmpresaContext";
import {
  getPuestosAdmin, crearPuesto, actualizarPuesto, eliminarPuesto,
  getHorarios, crearHorario, actualizarHorario, eliminarHorario,
  getConfigRoles, updateConfigRol,
  getEmpresaConfig, updateEmpresaConfig, uploadLogoEmpresa, actualizarCamposPuesto,
} from "../utils/api";

const DIAS = [
  { val: 1, label: "Lun" }, { val: 2, label: "Mar" }, { val: 3, label: "Mié" },
  { val: 4, label: "Jue" }, { val: 5, label: "Vie" }, { val: 6, label: "Sáb" }, { val: 0, label: "Dom" },
];

const FORM_PUESTO_VACIO = { nombre: "", descripcion: "", horarioId: "" };
const FORM_HORARIO_VACIO = {
  nombre: "", horaEntrada: "08:00", horaSalida: "17:00",
  horaSalidaAlimentos: "", horaRegresoAlimentos: "",
  diasLaborales: [1, 2, 3, 4, 5], toleranciaMinutos: 10,
};

const ROLES_SISTEMA = [
  { key: "super_admin",               label: "Super Administrador" },
  { key: "agente_soporte_ti",         label: "Agente Soporte TI" },
  { key: "supervisor_sucursales",     label: "Supervisor de Sucursales" },
  { key: "agente_control_asistencia", label: "Agente Control Asistencia" },
  { key: "visor_reportes",            label: "Visor de Reportes" },
  { key: "medico_titular",            label: "Médico Titular" },
  { key: "medico_de_guardia",         label: "Médico de Guardia" },
];

// ─── Componente principal ─────────────────────────────────────────────────────
const Admin = () => {
  const { usuario } = useAuth();
  const { setEmpresa: setEmpresaGlobal, refreshEmpresa } = useEmpresa();
  const esSuperAdmin = usuario?.rol === "super_admin";

  const [tab,       setTab]       = useState("puestos");
  const [puestos,   setPuestos]   = useState([]);
  const [horarios,  setHorarios]  = useState([]);
  const [modal,     setModal]     = useState(false);
  const [editando,  setEditando]  = useState(null);
  const [formP,     setFormP]     = useState(FORM_PUESTO_VACIO);
  const [formH,     setFormH]     = useState(FORM_HORARIO_VACIO);
  const [error,     setError]     = useState("");
  const [guardando, setGuardando] = useState(false);

  // Config de roles
  const [modulosSistema, setModulosSistema] = useState([]);
  const [configRoles,    setConfigRoles]    = useState({});
  const [cargandoRoles,  setCargandoRoles]  = useState(false);
  const [guardandoRol,   setGuardandoRol]   = useState(null);

  // Campos adicionales del puesto
  const [camposEditando, setCamposEditando] = useState([]);

  // Empresa
  const [empresa,         setEmpresa]         = useState({ nombre: "", razonSocial: "", rfc: "", domicilio: "", telefono: "", email: "" });
  const [logoUrl,         setLogoUrl]         = useState(null);
  const [guardandoEmpresa, setGuardandoEmpresa] = useState(false);
  const [logoFile,        setLogoFile]        = useState(null);
  const [logoPreview,     setLogoPreview]     = useState(null);
  const logoInputRef = useRef(null);

  // ── Carga ───────────────────────────────────────────────────────────────────
  const cargar = () => {
    getPuestosAdmin().then(setPuestos).catch(() => {});
    getHorarios().then(setHorarios).catch(() => {});
    if (esSuperAdmin) {
      getEmpresaConfig().then(e => {
        setEmpresa({ nombre: e.nombre || "", razonSocial: e.razonSocial || "", rfc: e.rfc || "", domicilio: e.domicilio || "", telefono: e.telefono || "", email: e.email || "" });
        setLogoUrl(e.logoUrl);
      }).catch(() => {});
    }
  };

  const cargarConfigRoles = async () => {
    if (!esSuperAdmin) return;
    setCargandoRoles(true);
    try {
      const data = await getConfigRoles();
      setModulosSistema(data.modulos || []);
      setConfigRoles(data.config   || {});
    } catch { /* silencioso */ } finally { setCargandoRoles(false); }
  };

  useEffect(() => { cargar(); }, []);
  useEffect(() => { if (tab === "roles") cargarConfigRoles(); }, [tab]);

  // ── Modal crear / editar ────────────────────────────────────────────────────
  const abrirModal = (item = null) => {
    setEditando(item);
    setError("");
    if (tab === "puestos") {
      setFormP(item
        ? { nombre: item.nombre, descripcion: item.descripcion || "", horarioId: item.horarioId || "" }
        : FORM_PUESTO_VACIO);
      setCamposEditando(item?.camposExtra || []);
    } else {
      setFormH(item
        ? {
            nombre:               item.nombre,
            horaEntrada:          item.horaEntrada,
            horaSalida:           item.horaSalida,
            horaSalidaAlimentos:  item.horaSalidaAlimentos  || "",
            horaRegresoAlimentos: item.horaRegresoAlimentos || "",
            diasLaborales:        item.diasLaborales,
            toleranciaMinutos:    item.toleranciaMinutos,
          }
        : FORM_HORARIO_VACIO);
    }
    setModal(true);
  };

  const handleSubmitPuesto = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const datos = { ...formP, horarioId: formP.horarioId || null };
      let puestoResult;
      if (editando) {
        puestoResult = await actualizarPuesto(editando.id, datos);
        await actualizarCamposPuesto(editando.id, camposEditando);
      } else {
        puestoResult = await crearPuesto(datos);
        await actualizarCamposPuesto(puestoResult.id, camposEditando);
      }
      setModal(false);
      cargar();
    } catch (err) { setError(err.message); } finally { setGuardando(false); }
  };

  const handleSubmitHorario = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const data = {
        ...formH,
        toleranciaMinutos:    parseInt(formH.toleranciaMinutos, 10),
        horaSalidaAlimentos:  formH.horaSalidaAlimentos  || null,
        horaRegresoAlimentos: formH.horaRegresoAlimentos || null,
      };
      if (editando) await actualizarHorario(editando.id, data);
      else          await crearHorario(data);
      setModal(false);
      cargar();
    } catch (err) { setError(err.message); } finally { setGuardando(false); }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Desactivar este elemento?")) return;
    try {
      if (tab === "puestos") await eliminarPuesto(id);
      else                   await eliminarHorario(id);
      cargar();
    } catch (err) { alert(err.message); }
  };

  const toggleDia = (dia) => {
    setFormH((prev) => ({
      ...prev,
      diasLaborales: prev.diasLaborales.includes(dia)
        ? prev.diasLaborales.filter((d) => d !== dia)
        : [...prev.diasLaborales, dia],
    }));
  };

  // ── Gestión de roles ────────────────────────────────────────────────────────
  const toggleModulo = (rol, moduloKey) => {
    setConfigRoles((prev) => {
      const modulos    = prev[rol] || [];
      const nuevosMod  = modulos.includes(moduloKey)
        ? modulos.filter((m) => m !== moduloKey)
        : [...modulos, moduloKey];
      return { ...prev, [rol]: nuevosMod };
    });
  };

  const guardarRol = async (rolKey) => {
    setGuardandoRol(rolKey);
    try { await updateConfigRol(rolKey, configRoles[rolKey] || []); }
    catch (err) { alert(err.message); }
    finally { setGuardandoRol(null); }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const nombreHorario = (id) => horarios.find((h) => h.id === id)?.nombre || "Sin horario";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Administración</h1>
          <p className="page-subtitle">Puestos, horarios y configuración del sistema</p>
        </div>
        {tab !== "roles" && tab !== "empresa" && (
          <button className="btn btn-primary" onClick={() => abrirModal()}>
            + Nuevo {tab === "puestos" ? "Puesto" : "Horario"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab-btn ${tab === "puestos"  ? "tab-active" : ""}`} onClick={() => setTab("puestos")}>Puestos</button>
        <button className={`tab-btn ${tab === "horarios" ? "tab-active" : ""}`} onClick={() => setTab("horarios")}>Horarios</button>
        {esSuperAdmin && (
          <button className={`tab-btn ${tab === "roles" ? "tab-active" : ""}`} onClick={() => setTab("roles")}>
            🔐 Roles
          </button>
        )}
        {esSuperAdmin && (
          <button className={`tab-btn ${tab === "empresa" ? "tab-active" : ""}`} onClick={() => setTab("empresa")}>
            🏢 Empresa
          </button>
        )}
      </div>

      {/* ── Tab: Puestos ─────────────────────────────────────────────────────── */}
      {tab === "puestos" && (
        <div className="cards-grid">
          {puestos.length === 0 && (
            <div className="empty-state" style={{ gridColumn: "1/-1" }}>
              <div className="empty-icon">💼</div><p>No hay puestos registrados.</p>
            </div>
          )}
          {puestos.map((p) => (
            <div key={p.id} className="card">
              <div className="card-body">
                <h3 style={{ margin: "0 0 6px" }}>{p.nombre}</h3>
                {p.descripcion && (
                  <p style={{ color: "var(--text2)", margin: "0 0 8px", fontSize: 13 }}>{p.descripcion}</p>
                )}
                <p style={{ fontSize: 12, color: "var(--text2)", margin: 0 }}>
                  ⏱ Horario: <strong>{nombreHorario(p.horarioId)}</strong>
                </p>
                {p.camposExtra && p.camposExtra.length > 0 && (
                  <p style={{ fontSize: 12, color: "var(--text2)", margin: "4px 0 0" }}>
                    📋 Campos extra: {p.camposExtra.length}
                  </p>
                )}
              </div>
              <div className="card-footer">
                <button className="btn btn-sm btn-secondary" onClick={() => abrirModal(p)}>✏️ Editar</button>
                <button className="btn btn-sm btn-danger"    onClick={() => handleEliminar(p.id)}>Desactivar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Horarios ────────────────────────────────────────────────────── */}
      {tab === "horarios" && (
        <div className="cards-grid">
          {horarios.length === 0 && (
            <div className="empty-state" style={{ gridColumn: "1/-1" }}>
              <div className="empty-icon">🕐</div><p>No hay horarios registrados.</p>
            </div>
          )}
          {horarios.map((h) => (
            <div key={h.id} className="card">
              <div className="card-body">
                <h3 style={{ margin: "0 0 8px" }}>{h.nombre}</h3>
                <p style={{ margin: "3px 0", fontSize: 13, color: "var(--text2)" }}>
                  🕐 Entrada: <strong>{h.horaEntrada}</strong> · Salida: <strong>{h.horaSalida}</strong>
                </p>
                {(h.horaSalidaAlimentos || h.horaRegresoAlimentos) && (
                  <p style={{ margin: "3px 0", fontSize: 13, color: "var(--text2)" }}>
                    🍽️ Alimentos: <strong>{h.horaSalidaAlimentos || "—"}</strong> → <strong>{h.horaRegresoAlimentos || "—"}</strong>
                  </p>
                )}
                <p style={{ margin: "3px 0", fontSize: 13, color: "var(--text2)" }}>
                  📅 {DIAS.filter((d) => h.diasLaborales.includes(d.val)).map((d) => d.label).join(", ")}
                </p>
                <p style={{ margin: "3px 0", fontSize: 13, color: "var(--text2)" }}>
                  ⏱ Tolerancia: {h.toleranciaMinutos} min
                </p>
              </div>
              <div className="card-footer">
                <button className="btn btn-sm btn-secondary" onClick={() => abrirModal(h)}>✏️ Editar</button>
                <button className="btn btn-sm btn-danger"    onClick={() => handleEliminar(h.id)}>Desactivar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Roles ───────────────────────────────────────────────────────── */}
      {tab === "roles" && esSuperAdmin && (
        cargandoRoles
          ? <div className="loading">Cargando configuración de roles…</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <p style={{ color: "var(--text2)", fontSize: 13, margin: 0 }}>
                Activa o desactiva los módulos que cada rol puede ver en el menú. Guarda los cambios por rol de forma independiente.
              </p>

              {ROLES_SISTEMA.map((rol) => (
                <div key={rol.key} className="card" style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <h3 style={{ margin: 0, fontSize: "0.95rem" }}>👤 {rol.label}</h3>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => guardarRol(rol.key)}
                      disabled={guardandoRol === rol.key}
                    >
                      {guardandoRol === rol.key ? "Guardando…" : "💾 Guardar"}
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {modulosSistema.map((modulo) => {
                      const activo = (configRoles[rol.key] || []).includes(modulo.key);
                      return (
                        <label
                          key={modulo.key}
                          style={{
                            display: "flex", alignItems: "center", gap: 7,
                            cursor: "pointer", userSelect: "none",
                            padding: "5px 12px", borderRadius: 6,
                            border: `1px solid ${activo ? "var(--primary)" : "var(--border)"}`,
                            background: activo
                              ? "color-mix(in srgb, var(--primary) 12%, var(--surface))"
                              : "var(--surface)",
                            fontSize: 13, transition: "all 0.15s",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={activo}
                            onChange={() => toggleModulo(rol.key, modulo.key)}
                            style={{ accentColor: "var(--primary)", width: 14, height: 14 }}
                          />
                          {modulo.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {/* ── Tab: Empresa ─────────────────────────────────────────────────────── */}
      {tab === "empresa" && esSuperAdmin && (
        <div style={{ maxWidth: 640 }}>
          {/* Logo */}
          <div className="card" style={{ padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div
              style={{ width: 100, height: 100, border: "2px dashed var(--border)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0 }}
              onClick={() => logoInputRef.current?.click()}
            >
              {(logoPreview || (logoUrl && `http://localhost:4000${logoUrl}`))
                ? <img src={logoPreview || `http://localhost:4000${logoUrl}`} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                : <span style={{ fontSize: "2rem", color: "var(--text2)" }}>🏢</span>
              }
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }}} />
            <div>
              <p style={{ fontWeight: 600 }}>Logo de la empresa</p>
              <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>Se mostrará en el login y en la plataforma. PNG/JPG/SVG.</p>
              {logoFile && (
                <button className="btn btn-sm btn-primary" onClick={async () => {
                  try {
                    const r = await uploadLogoEmpresa(logoFile);
                    setLogoUrl(r.logoUrl);
                    setEmpresaGlobal((prev) => ({ ...prev, ...r.empresa, logoUrl: r.logoUrl }));
                    await refreshEmpresa();
                    setLogoFile(null);
                  } catch (err) { alert(err.message); }
                }}>💾 Guardar logo</button>
              )}
            </div>
          </div>

          {/* Datos generales */}
          <div className="card" style={{ padding: "20px 24px" }}>
            <h3 style={{ marginBottom: 16, fontSize: "0.95rem" }}>Datos generales</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre de la empresa *</label>
                <input className="form-control" value={empresa.nombre} onChange={e => setEmpresa({...empresa, nombre: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Razón social</label>
                <input className="form-control" value={empresa.razonSocial} onChange={e => setEmpresa({...empresa, razonSocial: e.target.value})} />
              </div>
              <div className="form-group">
                <label>RFC</label>
                <input className="form-control" value={empresa.rfc} onChange={e => setEmpresa({...empresa, rfc: e.target.value})} placeholder="XXXX000000XXX" />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input className="form-control" value={empresa.telefono} onChange={e => setEmpresa({...empresa, telefono: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Domicilio</label>
              <input className="form-control" value={empresa.domicilio} onChange={e => setEmpresa({...empresa, domicilio: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Correo electrónico</label>
              <input type="email" className="form-control" value={empresa.email} onChange={e => setEmpresa({...empresa, email: e.target.value})} />
            </div>
            <button
              className="btn btn-primary"
              disabled={guardandoEmpresa}
              onClick={async () => {
                setGuardandoEmpresa(true);
                try {
                  const actualizada = await updateEmpresaConfig(empresa);
                  setEmpresaGlobal((prev) => ({ ...prev, ...actualizada }));
                  await refreshEmpresa();
                  alert("✅ Empresa actualizada");
                }
                catch (err) { alert(err.message); }
                finally { setGuardandoEmpresa(false); }
              }}
            >
              {guardandoEmpresa ? "Guardando…" : "💾 Guardar datos de empresa"}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal crear / editar ─────────────────────────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editando ? "Editar" : "Nuevo"} {tab === "puestos" ? "Puesto" : "Horario"}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>

            {/* Form Puesto */}
            {tab === "puestos" && (
              <form onSubmit={handleSubmitPuesto} className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="form-group">
                  <label>Nombre *</label>
                  <input className="form-control" value={formP.nombre}
                    onChange={(e) => setFormP({ ...formP, nombre: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea className="form-control" rows={2} value={formP.descripcion}
                    onChange={(e) => setFormP({ ...formP, descripcion: e.target.value })} />
                </div>

                {/* Campos adicionales */}
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label>Campos adicionales</label>
                    <button type="button" className="btn btn-sm btn-secondary"
                      onClick={() => setCamposEditando(prev => [...prev, { nombre: "", tipo: "text", opciones: [], obligatorio: false }])}>
                      + Agregar campo
                    </button>
                  </div>
                  {camposEditando.length === 0 && (
                    <p style={{ fontSize: 12, color: "var(--text2)" }}>Sin campos adicionales. Haz clic en "+ Agregar campo".</p>
                  )}
                  {camposEditando.map((campo, idx) => (
                    <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: 6, padding: 10, marginBottom: 8, background: "var(--bg3)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "end" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: 12 }}>Nombre *</label>
                          <input className="form-control" value={campo.nombre} placeholder="Ej: Número de empleado"
                            onChange={e => { const nc = [...camposEditando]; nc[idx] = {...nc[idx], nombre: e.target.value}; setCamposEditando(nc); }} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: 12 }}>Tipo</label>
                          <select className="form-control" value={campo.tipo}
                            onChange={e => { const nc = [...camposEditando]; nc[idx] = {...nc[idx], tipo: e.target.value, opciones: []}; setCamposEditando(nc); }}>
                            <option value="text">Texto</option>
                            <option value="number">Número</option>
                            <option value="fecha">Fecha</option>
                            <option value="select">Lista de opciones</option>
                          </select>
                        </div>
                        <button type="button" className="btn btn-sm btn-danger"
                          onClick={() => setCamposEditando(prev => prev.filter((_, i) => i !== idx))}>✕</button>
                      </div>
                      {campo.tipo === "select" && (
                        <div style={{ marginTop: 8 }}>
                          <label style={{ fontSize: 12 }}>Opciones (una por línea)</label>
                          <textarea className="form-control" rows={2}
                            value={campo.opciones.join("\n")}
                            placeholder="Opción 1\nOpción 2"
                            onChange={e => { const nc = [...camposEditando]; nc[idx] = {...nc[idx], opciones: e.target.value.split("\n").filter(Boolean)}; setCamposEditando(nc); }} />
                        </div>
                      )}
                      <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, marginTop: 6, cursor: "pointer" }}>
                        <input type="checkbox" checked={campo.obligatorio} onChange={e => { const nc = [...camposEditando]; nc[idx] = {...nc[idx], obligatorio: e.target.checked}; setCamposEditando(nc); }} />
                        Obligatorio
                      </label>
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label>Horario por defecto</label>
                  <select className="form-control" value={formP.horarioId}
                    onChange={(e) => setFormP({ ...formP, horarioId: e.target.value })}>
                    <option value="">Sin horario asignado</option>
                    {horarios.map((h) => (
                      <option key={h.id} value={h.id}>{h.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={guardando}>
                    {guardando ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              </form>
            )}

            {/* Form Horario */}
            {tab === "horarios" && (
              <form onSubmit={handleSubmitHorario} className="modal-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="form-group">
                  <label>Nombre *</label>
                  <input className="form-control" value={formH.nombre}
                    onChange={(e) => setFormH({ ...formH, nombre: e.target.value })} required />
                </div>

                <p style={{ fontWeight: 600, fontSize: 13, margin: "10px 0 4px", color: "var(--text2)" }}>
                  Horario laboral
                </p>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Hora entrada *</label>
                    <input type="time" className="form-control" value={formH.horaEntrada}
                      onChange={(e) => setFormH({ ...formH, horaEntrada: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Hora salida *</label>
                    <input type="time" className="form-control" value={formH.horaSalida}
                      onChange={(e) => setFormH({ ...formH, horaSalida: e.target.value })} required />
                  </div>
                </div>

                <p style={{ fontWeight: 600, fontSize: 13, margin: "10px 0 4px", color: "var(--text2)" }}>
                  🍽️ Horario de alimentos <span style={{ fontWeight: 400 }}>(opcional)</span>
                </p>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Salida a comer</label>
                    <input type="time" className="form-control" value={formH.horaSalidaAlimentos}
                      onChange={(e) => setFormH({ ...formH, horaSalidaAlimentos: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Regreso de comer</label>
                    <input type="time" className="form-control" value={formH.horaRegresoAlimentos}
                      onChange={(e) => setFormH({ ...formH, horaRegresoAlimentos: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Tolerancia (minutos)</label>
                  <input type="number" className="form-control" value={formH.toleranciaMinutos}
                    min={0} max={60}
                    onChange={(e) => setFormH({ ...formH, toleranciaMinutos: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Días laborales *</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {DIAS.map((d) => (
                      <button
                        key={d.val} type="button"
                        className={`btn btn-sm ${formH.diasLaborales.includes(d.val) ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => toggleDia(d.val)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={guardando}>
                    {guardando ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
