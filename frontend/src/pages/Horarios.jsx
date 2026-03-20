/**
 * Horarios.jsx
 * CRUD completo de horarios de trabajo.
 * - Crear, editar, activar/desactivar y eliminar horarios.
 * - Visible para super_admin, agente_soporte_ti, nominas.
 */

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getHorarios, crearHorario, actualizarHorario, eliminarHorario } from "../utils/api";
import { toastError, confirmar } from "../utils/toast";

const DIAS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

const ROLES_GESTIONAR = ["super_admin", "agente_soporte_ti", "nominas"];

const FORM_VACIO = {
  nombre: "",
  horaEntrada: "09:00",
  horaSalida: "18:00",
  toleranciaMinutos: 10,
  diasTrabajo: [1, 2, 3, 4, 5], // Lun–Vie por defecto
  activo: true,
};

const Horarios = () => {
  const { usuario } = useAuth();
  const puedeGestionar = ROLES_GESTIONAR.includes(usuario?.rol);

  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null); // id o null
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    try {
      setCargando(true);
      const lista = await getHorarios();
      setHorarios(Array.isArray(lista) ? lista : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setError("");
    setModal(true);
  };

  const abrirEditar = (h) => {
    setEditando(h.id);
    // Backend devuelve diasLaborales; el form usa diasTrabajo
    const dias = Array.isArray(h.diasLaborales) && h.diasLaborales.length > 0
      ? h.diasLaborales
      : Array.isArray(h.diasTrabajo) ? h.diasTrabajo : [1, 2, 3, 4, 5];
    setForm({
      nombre: h.nombre,
      horaEntrada: h.horaEntrada || "09:00",
      horaSalida: h.horaSalida || "18:00",
      toleranciaMinutos: h.toleranciaMinutos ?? 10,
      diasTrabajo: dias,
      activo: h.activo !== false,
    });
    setError("");
    setModal(true);
  };

  const toggleDia = (dia) => {
    setForm((prev) => {
      const dias = prev.diasTrabajo.includes(dia)
        ? prev.diasTrabajo.filter((d) => d !== dia)
        : [...prev.diasTrabajo, dia];
      return { ...prev, diasTrabajo: dias };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError("El nombre es requerido"); return; }
    if (form.diasTrabajo.length === 0) { setError("Selecciona al menos un día de trabajo"); return; }
    setGuardando(true);
    setError("");
    try {
      // Backend usa diasLaborales; el form local usa diasTrabajo — mapear antes de enviar
      const payload = {
        nombre: form.nombre,
        horaEntrada: form.horaEntrada,
        horaSalida: form.horaSalida,
        toleranciaMinutos: form.toleranciaMinutos,
        diasLaborales: form.diasTrabajo,
        activo: form.activo,
      };
      if (editando) {
        await actualizarHorario(editando, payload);
      } else {
        await crearHorario(payload);
      }
      setModal(false);
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleActivo = async (h) => {
    try {
      await actualizarHorario(h.id, { activo: !h.activo });
      await cargar();
    } catch (err) {
      toastError(err);
    }
  };

  const handleEliminar = async (id) => {
    if (!(await confirmar("¿Eliminar este horario? Solo es posible si no está asignado a empleados o puestos.", "Confirmar", "danger"))) return;
    try {
      await eliminarHorario(id);
      await cargar();
    } catch (err) {
      toastError(err);
    }
  };

  // Acepta diasLaborales (backend) o diasTrabajo (local form)
  const labelDias = (h) => {
    const dias = Array.isArray(h?.diasLaborales) && h.diasLaborales.length > 0
      ? h.diasLaborales
      : Array.isArray(h?.diasTrabajo) ? h.diasTrabajo : Array.isArray(h) ? h : [];
    if (!dias || dias.length === 0) return "—";
    const orden = [1, 2, 3, 4, 5, 6, 0];
    const sorted = [...dias].sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
    return sorted.map((d) => DIAS.find((x) => x.value === d)?.label).filter(Boolean).join(", ");
  };

  if (cargando) return <div className="loading">Cargando horarios…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">⏰ Horarios</h1>
          <p className="page-subtitle">Administración de horarios de trabajo</p>
        </div>
        {puedeGestionar && (
          <button className="btn btn-primary" onClick={abrirCrear}>
            + Nuevo Horario
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {horarios.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⏰</div>
          <p>No hay horarios registrados</p>
          {puedeGestionar && (
            <button className="btn btn-primary" onClick={abrirCrear}>
              Crear primer horario
            </button>
          )}
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Tolerancia</th>
                <th>Días laborales</th>
                <th>Estado</th>
                {puedeGestionar && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {horarios.map((h) => (
                <tr key={h.id} style={{ opacity: h.activo === false ? 0.55 : 1 }}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{h.nombre}</div>
                  </td>
                  <td>{h.horaEntrada || "—"}</td>
                  <td>{h.horaSalida || "—"}</td>
                  <td>{h.toleranciaMinutos ?? 10} min</td>
                  <td style={{ fontSize: 13 }}>{labelDias(h)}</td>
                  <td>
                    <span className={`badge ${h.activo !== false ? "badge-success" : "badge-danger"}`}>
                      {h.activo !== false ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  {puedeGestionar && (
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => abrirEditar(h)}
                          title="Editar"
                        >✏️</button>
                        <button
                          className={`btn btn-xs ${h.activo !== false ? "btn-warning" : "btn-success"}`}
                          onClick={() => handleToggleActivo(h)}
                          title={h.activo !== false ? "Desactivar" : "Activar"}
                        >
                          {h.activo !== false ? "⏸" : "▶"}
                        </button>
                        <button
                          className="btn btn-danger btn-xs"
                          onClick={() => handleEliminar(h.id)}
                          title="Eliminar"
                        >🗑️</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear / editar */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>{editando ? "Editar Horario" : "Nuevo Horario"}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <div className="form-group">
                <label>Nombre del horario *</label>
                <input
                  className="form-control"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Turno Matutino, Turno Nocturno…"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hora de entrada *</label>
                  <input
                    type="time"
                    className="form-control"
                    value={form.horaEntrada}
                    onChange={(e) => setForm({ ...form, horaEntrada: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hora de salida *</label>
                  <input
                    type="time"
                    className="form-control"
                    value={form.horaSalida}
                    onChange={(e) => setForm({ ...form, horaSalida: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tolerancia (minutos)</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="60"
                  value={form.toleranciaMinutos}
                  onChange={(e) => setForm({ ...form, toleranciaMinutos: Number(e.target.value) })}
                />
                <small style={{ color: "var(--text-muted)" }}>
                  Minutos de margen antes de marcar como tardanza
                </small>
              </div>

              <div className="form-group">
                <label>Días laborales *</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  {DIAS.map((d) => (
                    <button
                      type="button"
                      key={d.value}
                      onClick={() => toggleDia(d.value)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid var(--border)",
                        cursor: "pointer",
                        background: form.diasTrabajo.includes(d.value) ? "var(--accent)" : "var(--bg-secondary)",
                        color: form.diasTrabajo.includes(d.value) ? "#fff" : "var(--text)",
                        fontWeight: 600,
                        fontSize: 13,
                        transition: "all 0.15s",
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  />
                  Horario activo
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  {guardando ? "Guardando…" : editando ? "Actualizar" : "Crear Horario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Horarios;
