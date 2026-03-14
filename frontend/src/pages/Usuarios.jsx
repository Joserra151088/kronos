/**
 * Usuarios.jsx – Gestión de empleados (CRUD)
 * Soporta tabs: Todos / Corporativo / Sucursales
 * Soporta campos extra por puesto y campo `tipo` de empleado.
 */

import { useState, useEffect, useRef } from "react";
import {
  getUsuarios, getPuestos, getSucursales,
  crearUsuario, actualizarUsuario, eliminarUsuario,
  subirFotoEmpleado,
} from "../utils/api";
import { getGrupos } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const BASE = "http://localhost:4000";

const ROLES_DISPONIBLES = [
  { value: "medico_titular",            label: "Médico Titular" },
  { value: "medico_de_guardia",         label: "Médico de Guardia" },
  { value: "supervisor_sucursales",     label: "Supervisor de Sucursales" },
  { value: "agente_control_asistencia", label: "Agente Control Asistencia" },
  { value: "agente_soporte_ti",         label: "Agente Soporte TI" },
  { value: "visor_reportes",            label: "Visor de Reportes" },
  { value: "super_admin",               label: "Super Administrador" },
];

const FORM_VACIO = {
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  sexo: "masculino",
  edad: "",
  puestoId: "",
  sucursalId: "",
  rol: "medico_titular",
  tipo: "sucursal",
  departamento: "",
  datosExtra: {},
};

const SEXO_ICON = { masculino: "👨", femenino: "👩", otro: "🧑" };

const ROL_LABEL = {
  super_admin: "Super Admin",
  agente_soporte_ti: "Soporte TI",
  supervisor_sucursales: "Supervisor",
  agente_control_asistencia: "Control Asist.",
  visor_reportes: "Visor",
  medico_titular: "Médico Titular",
  medico_de_guardia: "Médico Guardia",
};

// Roles que pueden ver todos los tabs
const ROLES_VER_TODOS = ["super_admin", "agente_soporte_ti"];
// Roles que pueden ver el tab corporativo
const ROLES_VER_CORPORATIVO = ["super_admin", "agente_soporte_ti"];
// Roles que pueden gestionar (crear/editar/eliminar)
const ROLES_GESTIONAR = ["super_admin", "agente_soporte_ti"];

const Usuarios = () => {
  const { usuario: usuarioActual } = useAuth();

  const [usuarios, setUsuarios]     = useState([]);
  const [puestos, setPuestos]       = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [grupos, setGrupos]         = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [modal, setModal]           = useState(false);
  const [editando, setEditando]     = useState(null);
  const [form, setForm]             = useState(FORM_VACIO);
  const [error, setError]           = useState("");
  const [guardando, setGuardando]   = useState(false);
  const [busqueda, setBusqueda]     = useState("");
  const [filtroSucursal, setFiltroSucursal] = useState("");
  const [filtroGrupo, setFiltroGrupo]       = useState("");
  const [tabActivo, setTabActivo]           = useState("todos");

  // Foto
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile]       = useState(null);
  const fotoInputRef = useRef(null);

  const rolActual = usuarioActual?.rol || "";
  const puedeVerTodos      = ROLES_VER_TODOS.includes(rolActual);
  const puedeVerCorporativo = ROLES_VER_CORPORATIVO.includes(rolActual);
  const puedeGestionar     = ROLES_GESTIONAR.includes(rolActual);

  // El tab inicial depende del rol
  const tabInicial = puedeVerTodos ? "todos" : "sucursales";

  useEffect(() => {
    setTabActivo(tabInicial);
  }, [rolActual]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarDatos = async () => {
    try {
      const [u, p, s, g] = await Promise.all([
        getUsuarios(),
        getPuestos(),
        getSucursales(),
        getGrupos(),
      ]);
      setUsuarios(Array.isArray(u) ? u : []);
      setPuestos(Array.isArray(p) ? p : []);
      setSucursales(Array.isArray(s) ? s : []);
      setGrupos(Array.isArray(g) ? g : []);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const nombreSucursal = (id) => sucursales.find((s) => s.id === id)?.nombre || "—";
  const nombrePuesto   = (id) => puestos.find((p) => p.id === id)?.nombre   || "—";
  const nombreGrupo    = (id) => grupos.find((g) => g.id === id)?.nombre    || "—";

  const puestoSeleccionado = puestos.find((p) => p.id === form.puestoId) || null;
  const camposExtra = puestoSeleccionado?.camposExtra || [];

  // ─── Filtrado por tab ──────────────────────────────────────────────────────
  const usuariosPorTab = (tab) => {
    let lista = [...usuarios];

    if (tab === "corporativo") {
      lista = lista.filter((u) => u.tipo === "corporativo");
    } else if (tab === "sucursales") {
      lista = lista.filter((u) => u.tipo === "sucursal" || !u.tipo);
      // Para roles sin acceso global: filtrar por su sucursal
      if (!puedeVerTodos && usuarioActual?.sucursalId) {
        lista = lista.filter((u) => u.sucursalId === usuarioActual.sucursalId);
      }
    }

    // Filtros adicionales en tab sucursales
    if (filtroSucursal && tab === "sucursales") {
      lista = lista.filter((u) => u.sucursalId === filtroSucursal);
    }
    if (filtroGrupo && tab === "sucursales") {
      lista = lista.filter((u) => u.grupoId === filtroGrupo);
    }

    // Búsqueda de texto
    if (busqueda) {
      const txt = busqueda.toLowerCase();
      lista = lista.filter((u) =>
        `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(txt)
      );
    }

    return lista;
  };

  const listaCorporativo = usuarios.filter((u) => u.tipo === "corporativo");
  const listaSucursales  = usuarios.filter((u) => u.tipo === "sucursal" || !u.tipo);

  const usuariosFiltrados = usuariosPorTab(tabActivo);

  // ─── Modal ─────────────────────────────────────────────────────────────────
  const abrirCrear = () => {
    setEditando(null);
    setForm({
      ...FORM_VACIO,
      tipo: tabActivo === "corporativo" ? "corporativo" : "sucursal",
    });
    setFotoPreview(null);
    setFotoFile(null);
    setError("");
    setModal(true);
  };

  const abrirEditar = (u) => {
    setEditando(u.id);
    setForm({
      nombre:      u.nombre,
      apellido:    u.apellido ?? "",
      email:       u.email,
      password:    "",
      sexo:        u.sexo,
      edad:        u.edad,
      puestoId:    u.puestoId ?? "",
      sucursalId:  u.sucursalId ?? "",
      rol:         u.rol,
      tipo:        u.tipo || "sucursal",
      departamento: u.departamento ?? "",
      datosExtra:  u.datosExtra || {},
    });
    setFotoPreview(u.fotoUrl ? `${BASE}${u.fotoUrl}` : null);
    setFotoFile(null);
    setError("");
    setModal(true);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Al cambiar tipo, limpiar campos que no aplican
      if (name === "tipo") {
        if (value === "corporativo") {
          next.sucursalId = "";
        } else {
          next.departamento = "";
        }
      }
      // Al cambiar puesto, resetear datosExtra
      if (name === "puestoId") {
        next.datosExtra = {};
      }
      return next;
    });
  };

  const handleDatoExtra = (campoId, valor) => {
    setForm((prev) => ({
      ...prev,
      datosExtra: { ...prev.datosExtra, [campoId]: valor },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const datos = { ...form };
      if (!datos.password) delete datos.password;
      if (datos.tipo === "corporativo") {
        datos.sucursalId = null;
      }
      if (datos.tipo === "sucursal") {
        delete datos.departamento;
      }
      // Limpiar datosExtra vacíos
      if (datos.datosExtra && Object.keys(datos.datosExtra).length === 0) {
        delete datos.datosExtra;
      }

      let uid = editando;
      if (editando) {
        await actualizarUsuario(editando, datos);
      } else {
        const nuevo = await crearUsuario(datos);
        uid = nuevo.id;
      }
      // Subir foto si se seleccionó una
      if (fotoFile && uid) {
        await subirFotoEmpleado(uid, fotoFile);
      }
      setModal(false);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Desactivar este usuario?")) return;
    try {
      await eliminarUsuario(id);
      await cargarDatos();
    } catch (err) {
      alert(err.message);
    }
  };

  // ─── Render campo extra ────────────────────────────────────────────────────
  const renderCampoExtra = (campo) => {
    const val = form.datosExtra[campo.id] ?? "";
    const base = {
      id:       `extra-${campo.id}`,
      value:    val,
      required: campo.obligatorio,
      onChange: (e) => handleDatoExtra(campo.id, e.target.value),
    };

    if (campo.tipo === "select") {
      return (
        <select {...base}>
          <option value="">Seleccionar…</option>
          {(campo.opciones || []).map((op) => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        {...base}
        type={campo.tipo === "number" ? "number" : campo.tipo === "date" ? "date" : "text"}
      />
    );
  };

  // ─── Render tabla ──────────────────────────────────────────────────────────
  const esCorporativoTab = tabActivo === "corporativo";

  const renderTabla = (lista) => (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Empleado</th>
            <th>Sexo / Edad</th>
            <th>Puesto</th>
            {esCorporativoTab ? <th>Área / Departamento</th> : <th>Sucursal</th>}
            <th>Rol</th>
            <th>Estado</th>
            {puedeGestionar && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {lista.map((u) => (
            <tr key={u.id} className={!u.activo ? "row-inactiva" : ""}>
              <td>
                <div className="user-cell">
                  {u.fotoUrl ? (
                    <img
                      src={`${BASE}${u.fotoUrl}`}
                      alt={u.nombre}
                      className="emp-foto-sm"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="user-avatar"
                    style={{ display: u.fotoUrl ? "none" : "flex" }}
                  >
                    {SEXO_ICON[u.sexo] || "🧑"}
                  </div>
                  <div>
                    <div className="user-name">{u.nombre} {u.apellido}</div>
                    <div className="user-email">{u.email}</div>
                  </div>
                </div>
              </td>
              <td><span className="capitalize">{u.sexo}</span> · {u.edad} años</td>
              <td>{nombrePuesto(u.puestoId)}</td>
              {esCorporativoTab
                ? <td>{u.departamento || "—"}</td>
                : <td>{nombreSucursal(u.sucursalId)}</td>
              }
              <td>
                <span className="badge badge-info">
                  {ROL_LABEL[u.rol] || u.rol}
                </span>
              </td>
              <td>
                <span className={`badge ${u.activo ? "badge-success" : "badge-danger"}`}>
                  {u.activo ? "Activo" : "Inactivo"}
                </span>
              </td>
              {puedeGestionar && (
                <td>
                  <div className="action-btns">
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => abrirEditar(u)}
                      title="Editar"
                    >✏️</button>
                    {u.activo && (
                      <button
                        className="btn btn-danger btn-xs"
                        onClick={() => handleEliminar(u.id)}
                        title="Desactivar"
                      >🗑️</button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {lista.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>No se encontraron empleados.</p>
        </div>
      )}
    </div>
  );

  // ─── Tabs disponibles ──────────────────────────────────────────────────────
  const tabs = [];
  if (puedeVerTodos) {
    tabs.push({ id: "todos", label: `Todos` });
  }
  if (puedeVerCorporativo) {
    tabs.push({ id: "corporativo", label: `🏛️ Corporativo (${listaCorporativo.length})` });
  }
  tabs.push({ id: "sucursales", label: `🏢 Sucursales (${listaSucursales.length})` });

  if (cargando) return <div className="loading">Cargando empleados…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Empleados</h1>
          <p className="page-subtitle">Gestión de personal por tipo y sucursal</p>
        </div>
        {puedeGestionar && (
          <button className="btn btn-primary" onClick={abrirCrear}>
            + Nuevo empleado
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-bar" style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", borderBottom: "2px solid var(--border)", paddingBottom: "0" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTabActivo(t.id)}
            style={{
              padding: "0.5rem 1.25rem",
              border: "none",
              borderBottom: tabActivo === t.id ? "3px solid var(--primary)" : "3px solid transparent",
              background: "none",
              cursor: "pointer",
              fontWeight: tabActivo === t.id ? "700" : "400",
              color: tabActivo === t.id ? "var(--primary)" : "var(--text2)",
              fontSize: "0.9rem",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="filtros-bar">
        <input
          className="search-input"
          type="search"
          placeholder="🔍 Buscar por nombre o correo…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {tabActivo === "sucursales" && puedeVerTodos && (
          <>
            <select
              className="filter-select"
              value={filtroSucursal}
              onChange={(e) => setFiltroSucursal(e.target.value)}
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={filtroGrupo}
              onChange={(e) => setFiltroGrupo(e.target.value)}
            >
              <option value="">Todos los grupos</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Tabla */}
      {renderTabla(usuariosFiltrados)}

      {/* Modal crear / editar */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div
            className="modal modal-large"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <h2>{editando ? "Editar Empleado" : "Nuevo Empleado"}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {error && <div className="alert alert-error">{error}</div>}

              {/* Foto de perfil */}
              <div
                className="foto-upload-area"
                onClick={() => fotoInputRef.current?.click()}
              >
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Vista previa" className="emp-foto-preview" />
                ) : (
                  <div className="foto-upload-placeholder">
                    <span style={{ fontSize: "2rem" }}>📷</span>
                    <span>Clic para subir foto</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text2)" }}>
                      JPG, PNG o WebP · máx 5 MB
                    </span>
                  </div>
                )}
                {fotoPreview && (
                  <div className="foto-overlay">
                    <span>📷 Cambiar foto</span>
                  </div>
                )}
              </div>
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handleFotoChange}
              />

              {/* Tipo de empleado */}
              <div className="form-group">
                <label>Tipo de empleado *</label>
                <select name="tipo" value={form.tipo} onChange={handleChange} required>
                  <option value="sucursal">Sucursal</option>
                  <option value="corporativo">Corporativo</option>
                </select>
              </div>

              <div className="form-row two-cols">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Apellido</label>
                  <input name="apellido" value={form.apellido} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Correo electrónico *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  {editando
                    ? "Nueva contraseña (vacío = sin cambios)"
                    : "Contraseña *"}
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required={!editando}
                />
              </div>

              <div className="form-row two-cols">
                <div className="form-group">
                  <label>Sexo *</label>
                  <select name="sexo" value={form.sexo} onChange={handleChange} required>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Edad *</label>
                  <input
                    name="edad"
                    type="number"
                    min="16"
                    max="80"
                    value={form.edad}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row two-cols">
                <div className="form-group">
                  <label>Puesto *</label>
                  <select name="puestoId" value={form.puestoId} onChange={handleChange} required>
                    <option value="">Seleccionar…</option>
                    {puestos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Rol en el sistema *</label>
                  <select name="rol" value={form.rol} onChange={handleChange} required>
                    {ROLES_DISPONIBLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sucursal: solo requerida cuando tipo = sucursal */}
              <div className="form-group">
                <label>
                  Sucursal asignada{" "}
                  {form.tipo === "sucursal" ? "*" : "(opcional)"}
                </label>
                <select
                  name="sucursalId"
                  value={form.sucursalId}
                  onChange={handleChange}
                  required={form.tipo === "sucursal"}
                >
                  <option value="">Seleccionar sucursal…</option>
                  {sucursales.filter((s) => s.activa).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} – {s.ciudad}
                    </option>
                  ))}
                </select>
              </div>

              {/* Departamento: solo visible cuando tipo = corporativo */}
              {form.tipo === "corporativo" && (
                <div className="form-group">
                  <label>Área / Departamento</label>
                  <input
                    name="departamento"
                    value={form.departamento}
                    onChange={handleChange}
                    placeholder="Ej. Recursos Humanos, Finanzas…"
                  />
                </div>
              )}

              {/* Campos extra del puesto */}
              {camposExtra.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                  <p style={{ fontWeight: "600", marginBottom: "0.75rem", color: "var(--text2)", fontSize: "0.85rem" }}>
                    Campos adicionales del puesto
                  </p>
                  {camposExtra.map((campo) => (
                    <div className="form-group" key={campo.id}>
                      <label>
                        {campo.nombre}
                        {campo.obligatorio ? " *" : ""}
                      </label>
                      {renderCampoExtra(campo)}
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando…"
                    : editando
                    ? "Actualizar"
                    : "Crear empleado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
