/**
 * Sucursales.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Página de gestión de sucursales (CRUD).
 * Permite crear, editar, configurar la geocerca y desactivar sucursales.
 * Solo accesible para administradores.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from "react";
import { getSucursales, crearSucursal, actualizarSucursal, eliminarSucursal } from "../utils/api";

/** Estado inicial vacío para el formulario de sucursal */
const FORM_VACIO = {
  nombre: "", direccion: "", ciudad: "", estado: "",
  geocerca: { latitud: "", longitud: "", radio: 200 },
};

/**
 * Sucursales
 * Listado y formulario de alta/edición de sucursales con configuración de geocerca.
 */
const Sucursales = () => {
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);          // true = modal abierto
  const [editando, setEditando] = useState(null);     // null = creando, id = editando
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  /** cargarSucursales - Obtiene el listado actualizado del servidor */
  const cargarSucursales = async () => {
    try {
      const data = await getSucursales();
      setSucursales(data);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarSucursales(); }, []);

  /**
   * abrirCrear
   * Abre el modal en modo creación con formulario vacío.
   */
  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setError("");
    setModal(true);
  };

  /**
   * abrirEditar
   * Abre el modal en modo edición con los datos de la sucursal seleccionada.
   * @param {object} s - Sucursal a editar
   */
  const abrirEditar = (s) => {
    setEditando(s.id);
    setForm({
      nombre: s.nombre,
      direccion: s.direccion,
      ciudad: s.ciudad,
      estado: s.estado,
      geocerca: { ...s.geocerca },
    });
    setError("");
    setModal(true);
  };

  /**
   * handleChange
   * Actualiza el estado del formulario de forma genérica.
   * Maneja tanto campos planos como campos anidados en geocerca.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("geo_")) {
      const campo = name.replace("geo_", "");
      setForm((prev) => ({
        ...prev,
        geocerca: { ...prev.geocerca, [campo]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  /**
   * handleSubmit
   * Envía el formulario al servidor para crear o actualizar la sucursal.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      if (editando) {
        await actualizarSucursal(editando, form);
      } else {
        await crearSucursal(form);
      }
      setModal(false);
      await cargarSucursales();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  /**
   * handleEliminar
   * Solicita confirmación y desactiva la sucursal seleccionada.
   * @param {string} id - ID de la sucursal
   */
  const handleEliminar = async (id) => {
    if (!window.confirm("¿Desactivar esta sucursal?")) return;
    try {
      await eliminarSucursal(id);
      await cargarSucursales();
    } catch (err) {
      alert(err.message);
    }
  };

  if (cargando) return <div className="loading">Cargando sucursales…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Sucursales</h1>
          <p className="subtitle">Gestión de ubicaciones y geocercas</p>
        </div>
        <button className="btn btn-primary" onClick={abrirCrear}>
          + Nueva sucursal
        </button>
      </div>

      {/* Grid de tarjetas */}
      <div className="cards-grid">
        {sucursales.map((s) => (
          <div key={s.id} className={`card sucursal-card ${!s.activa ? "inactiva" : ""}`}>
            <div className="sucursal-header">
              <span className="sucursal-icon">🏢</span>
              <div>
                <h3>{s.nombre}</h3>
                <p>{s.ciudad}, {s.estado}</p>
              </div>
              <span className={`badge ${s.activa ? "badge-success" : "badge-danger"}`}>
                {s.activa ? "Activa" : "Inactiva"}
              </span>
            </div>

            <div className="sucursal-info">
              <div className="info-row">
                <span>📍</span>
                <span>{s.direccion || "Sin dirección"}</span>
              </div>
              <div className="info-row geocerca-row">
                <span>🛰️</span>
                <div>
                  <strong>Geocerca:</strong>
                  <br />
                  Lat: {s.geocerca.latitud} · Lon: {s.geocerca.longitud}
                  <br />
                  Radio: <strong>{s.geocerca.radio}m</strong>
                </div>
              </div>
            </div>

            <div className="card-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(s)}>
                ✏️ Editar
              </button>
              {s.activa && (
                <button className="btn btn-danger btn-sm" onClick={() => handleEliminar(s.id)}>
                  🗑️ Desactivar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {sucursales.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <p>No hay sucursales registradas.</p>
          <button className="btn btn-primary" onClick={abrirCrear}>Crear primera sucursal</button>
        </div>
      )}

      {/* Modal de crear/editar */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editando ? "Editar Sucursal" : "Nueva Sucursal"}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label>Nombre de la sucursal *</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Sucursal Centro" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dirección</label>
                  <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Av. Principal 100" />
                </div>
              </div>

              <div className="form-row two-cols">
                <div className="form-group">
                  <label>Ciudad</label>
                  <input name="ciudad" value={form.ciudad} onChange={handleChange} placeholder="Ciudad de México" />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <input name="estado" value={form.estado} onChange={handleChange} placeholder="CDMX" />
                </div>
              </div>

              <div className="form-section-title">🛰️ Configuración de Geocerca</div>

              <div className="form-row two-cols">
                <div className="form-group">
                  <label>Latitud *</label>
                  <input name="geo_latitud" type="number" step="any" value={form.geocerca.latitud} onChange={handleChange} required placeholder="19.4326" />
                </div>
                <div className="form-group">
                  <label>Longitud *</label>
                  <input name="geo_longitud" type="number" step="any" value={form.geocerca.longitud} onChange={handleChange} required placeholder="-99.1332" />
                </div>
              </div>

              <div className="form-group">
                <label>Radio permitido (metros) *</label>
                <input name="geo_radio" type="number" min="10" max="5000" value={form.geocerca.radio} onChange={handleChange} required />
                <p className="form-hint">Los empleados solo podrán registrar dentro de este radio desde el punto central.</p>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  {guardando ? "Guardando…" : editando ? "Actualizar" : "Crear sucursal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sucursales;
