/**
 * Dashboard.jsx
 * Panel principal del sistema.
 * - Muestra el estado de registros del día del usuario.
 * - Permite realizar el siguiente registro usando GPS.
 * - Sólo permite registros del día de hoy.
 * - Si el registro cae fuera del horario + tolerancia, solicita motivo.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getRegistrosHoy, crearRegistro, getSucursales, getHorarios } from "../utils/api";

const MEDICO_GUARDIA_ROL = "medico_de_guardia";

const BASE = "http://localhost:4000";

const ETIQUETAS = {
  entrada:           { label: "Entrada",         icon: "🟢" },
  salida_alimentos:  { label: "Salida a comer",   icon: "🍽️" },
  regreso_alimentos: { label: "Regreso de comer", icon: "↩️" },
  salida:            { label: "Salida final",     icon: "🔴" },
};

const ORDEN = ["entrada", "salida_alimentos", "regreso_alimentos", "salida"];

const getSaludoPorHora = () => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

/** Convierte "HH:MM" a minutos desde medianoche */
const horaAMin = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Comprueba si horaActual "HH:MM" está fuera del horario esperado para tipoRegistro */
const verificarFueraDeHorario = (horario, tipoRegistro, horaActual) => {
  if (!horario) return false;
  const mapaHoras = {
    entrada:           horario.horaEntrada,
    salida_alimentos:  horario.horaSalidaAlimentos,
    regreso_alimentos: horario.horaRegresoAlimentos,
    salida:            horario.horaSalida,
  };
  const esperada = mapaHoras[tipoRegistro];
  if (!esperada) return false;
  const tolerancia = horario.toleranciaMinutos ?? 10;
  const diffMin = horaAMin(horaActual) - horaAMin(esperada);
  // Fuera si llega tarde más allá de tolerancia, o muy temprano (> 30 min antes)
  return diffMin > tolerancia || diffMin < -30;
};

const Dashboard = () => {
  const { usuario } = useAuth();

  const [registrosHoy, setRegistrosHoy]         = useState([]);
  const [siguienteRegistro, setSiguienteRegistro] = useState(null);
  const [sucursal, setSucursal]                 = useState(null);
  const [todasSucursales, setTodasSucursales]   = useState([]);
  const [horario, setHorario]                   = useState(null);
  const [estado, setEstado]                     = useState("idle");
  const [mensaje, setMensaje]                   = useState("");

  // Médico de guardia: ubicación seleccionada para registrar
  const esMedicoGuardia = usuario?.rol === MEDICO_GUARDIA_ROL;
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState("sesion"); // "sesion" | sucursalId

  // Modal fuera de horario
  const [modalFueraHorario, setModalFueraHorario] = useState(false);
  const [motivoFueraHorario, setMotivoFueraHorario] = useState("");
  const [coordsCache, setCoordsCache]           = useState(null); // guarda lat/lng mientras espera motivo

  // Modal fuera de geocerca
  const [modalFueraGeocerca, setModalFueraGeocerca] = useState(false);
  const [motivoFueraGeocerca, setMotivoFueraGeocerca] = useState("");
  const [infoGeocerca, setInfoGeocerca]           = useState({ distancia: 0, radio: 0 });

  const cargarDatos = useCallback(async () => {
    try {
      const { registros, siguienteRegistro: sig } = await getRegistrosHoy();
      setRegistrosHoy(registros);
      setSiguienteRegistro(sig);
    } catch (err) {
      console.error("Error cargando registros:", err);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    getSucursales().then((lista) => {
      setTodasSucursales(lista.filter((s) => s.activa));
      if (usuario?.sucursalId) {
        setSucursal(lista.find((x) => x.id === usuario.sucursalId) || null);
      }
    });
    // Cargar horario del usuario
    if (usuario?.horarioId) {
      getHorarios().then((lista) => {
        setHorario(lista.find((h) => h.id === usuario.horarioId) || null);
      }).catch(() => {});
    }
  }, [cargarDatos, usuario]);

  /** Ejecuta el registro con las coordenadas ya obtenidas */
  const ejecutarRegistro = async (lat, lng, motivo = null, sucursalIdOverride = null, motivoGeocerca = null) => {
    setEstado("registrando");
    setMensaje("Registrando asistencia…");
    try {
      const result = await crearRegistro(lat, lng, motivo, sucursalIdOverride, motivoGeocerca);
      setMensaje(result.mensaje);
      setEstado("exito");
      await cargarDatos();
      setTimeout(() => setEstado("idle"), 3000);
    } catch (err) {
      // Si el error es por geocerca, mostrar modal para pedir motivo
      if (err.fueraDeGeocerca) {
        setCoordsCache({ lat, lng });
        setInfoGeocerca({ distancia: err.distancia || 0, radio: err.radioPermitido || 0 });
        setMotivoFueraGeocerca("");
        setModalFueraGeocerca(true);
        setEstado("idle");
        setMensaje("");
        return;
      }
      setMensaje(err.message);
      setEstado("error");
      setTimeout(() => setEstado("idle"), 5000);
    }
  };

  /** Devuelve el sucursalId a usar para el registro actual (médico de guardia) */
  const getSucursalIdParaRegistro = () => {
    if (!esMedicoGuardia) return null;
    if (ubicacionSeleccionada === "sesion") return null; // usa la de sesión en el backend
    return ubicacionSeleccionada;
  };

  const handleRegistrar = () => {
    if (!navigator.geolocation) {
      setMensaje("Tu navegador no soporta geolocalización.");
      setEstado("error");
      return;
    }
    setEstado("obteniendo-gps");
    setMensaje("Obteniendo tu ubicación GPS…");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const horaActual = new Date().toTimeString().slice(0, 5);

        // ── Verificar si está fuera de horario ──────────────────────────────
        if (siguienteRegistro && verificarFueraDeHorario(horario, siguienteRegistro, horaActual)) {
          setCoordsCache({ lat: latitude, lng: longitude });
          setMotivoFueraHorario("");
          setModalFueraHorario(true);
          setEstado("idle");
          setMensaje("");
          return;
        }

        await ejecutarRegistro(latitude, longitude, null, getSucursalIdParaRegistro());
      },
      (err) => {
        setMensaje(
          err.code === 1
            ? "Permiso de ubicación denegado. Habilita el GPS en tu navegador."
            : "No se pudo obtener tu ubicación."
        );
        setEstado("error");
        setTimeout(() => setEstado("idle"), 5000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const confirmarConMotivo = async () => {
    if (!motivoFueraHorario.trim()) return;
    setModalFueraHorario(false);
    if (coordsCache) {
      await ejecutarRegistro(coordsCache.lat, coordsCache.lng, motivoFueraHorario.trim(), getSucursalIdParaRegistro());
      setCoordsCache(null);
    }
  };

  const confirmarFueraGeocerca = async () => {
    if (!motivoFueraGeocerca.trim()) return;
    setModalFueraGeocerca(false);
    if (coordsCache) {
      await ejecutarRegistro(coordsCache.lat, coordsCache.lng, null, getSucursalIdParaRegistro(), motivoFueraGeocerca.trim());
      setCoordsCache(null);
    }
  };

  const progreso = registrosHoy.length;
  const fechaHoy = new Date().toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{getSaludoPorHora()}, {usuario?.nombre} 👋</h1>
          <p className="subtitle">
            {usuario?.puestoNombre || usuario?.puesto || "Colaborador"} · {sucursal?.nombre || (esMedicoGuardia ? "Médico de Guardia" : "Cargando sucursal…")}
          </p>
          {/* Mejora 1: aviso "solo hoy" */}
          <p className="fecha-hoy" style={{ marginTop: 4, color: "var(--accent)" }}>
            📅 {fechaHoy}
          </p>
        </div>
      </div>

      {/* Aviso de solo-hoy */}
      <div className="alert alert-info" style={{ marginBottom: 16, fontSize: "0.85rem" }}>
        ℹ️ Los registros de asistencia sólo aplican para el día de <strong>hoy</strong>. No es posible registrar días anteriores o futuros.
      </div>

      {/* Progreso del día */}
      <div className="card">
        <h2 className="card-title">Progreso del día</h2>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${(progreso / 4) * 100}%` }} />
        </div>
        <p className="progress-text">{progreso} / 4 registros completados</p>

        <div className="timeline">
          {ORDEN.map((tipo, i) => {
            const reg = registrosHoy.find((r) => r.tipo === tipo);
            const { label, icon } = ETIQUETAS[tipo];
            return (
              <div key={tipo} className={`timeline-item ${reg ? "done" : i === progreso ? "next" : "pending"}`}>
                <div className="timeline-icon">{reg ? "✅" : icon}</div>
                <div className="timeline-info">
                  <span className="timeline-label">{label}</span>
                  {reg && <span className="timeline-hora">{reg.hora?.slice(0,5)}</span>}
                  {horario && !reg && i === progreso && (
                    <span style={{ fontSize: "0.78rem", color: "var(--text2)" }}>
                      esperado: {[horario.horaEntrada, horario.horaSalidaAlimentos, horario.horaRegresoAlimentos, horario.horaSalida][i] || "—"}
                      {" "}±{horario.toleranciaMinutos ?? 10} min
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botón de registro */}
      {siguienteRegistro && (
        <div className="card card-register">
          <h2 className="card-title">Siguiente registro</h2>
          <div className="next-register">
            <span className="next-icon">{ETIQUETAS[siguienteRegistro]?.icon}</span>
            <span className="next-label">{ETIQUETAS[siguienteRegistro]?.label}</span>
          </div>

          {/* Selector de ubicación para médico de guardia */}
          {esMedicoGuardia && (
            <div className="medico-guardia-location" style={{ margin: "12px 0", padding: "12px 14px", background: "var(--bg3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 600, marginBottom: 8, fontSize: "0.9rem" }}>
                🏥 ¿Dónde te vas a reportar?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 8px", borderRadius: 6, background: ubicacionSeleccionada === "sesion" ? "var(--accent)" + "22" : "transparent", border: ubicacionSeleccionada === "sesion" ? "1px solid var(--accent)" : "1px solid transparent" }}>
                  <input
                    type="radio"
                    name="ubicacion_guardia"
                    value="sesion"
                    checked={ubicacionSeleccionada === "sesion"}
                    onChange={() => setUbicacionSeleccionada("sesion")}
                  />
                  🏛️ Corporativo {sucursal ? `(${sucursal.nombre})` : ""}
                </label>
                {todasSucursales.filter((s) => s.id !== usuario?.sucursalId).map((s) => (
                  <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 8px", borderRadius: 6, background: ubicacionSeleccionada === s.id ? "var(--accent)" + "22" : "transparent", border: ubicacionSeleccionada === s.id ? "1px solid var(--accent)" : "1px solid transparent" }}>
                    <input
                      type="radio"
                      name="ubicacion_guardia"
                      value={s.id}
                      checked={ubicacionSeleccionada === s.id}
                      onChange={() => setUbicacionSeleccionada(s.id)}
                    />
                    🏢 {s.nombre} — {s.ciudad}
                  </label>
                ))}
              </div>
            </div>
          )}

          {mensaje && (
            <div className={`alert ${estado === "exito" ? "alert-success" : estado === "error" ? "alert-error" : "alert-info"}`}>
              {mensaje}
            </div>
          )}

          <button
            className="btn btn-primary btn-xl"
            onClick={handleRegistrar}
            disabled={estado === "obteniendo-gps" || estado === "registrando"}
          >
            {estado === "obteniendo-gps" && "📡 Obteniendo GPS…"}
            {estado === "registrando" && "⏳ Registrando…"}
            {(estado === "idle" || estado === "exito" || estado === "error") &&
              `Registrar ${ETIQUETAS[siguienteRegistro]?.label}`}
          </button>

          {(() => {
            const sucursalActual = esMedicoGuardia && ubicacionSeleccionada !== "sesion"
              ? todasSucursales.find((s) => s.id === ubicacionSeleccionada)
              : sucursal;
            return (
              <p className="geocerca-info">
                📍 Debes estar dentro de <strong>{sucursalActual?.geocerca?.radio || "…"}m</strong> de la sucursal para registrar.
              </p>
            );
          })()}
        </div>
      )}

      {progreso === 4 && (
        <div className="card card-completo">
          <div className="completo-icon">🎉</div>
          <h2>¡Jornada completa!</h2>
          <p>Has completado los 4 registros del día. ¡Hasta mañana!</p>
        </div>
      )}

      {/* ── Modal: fuera de geocerca ───────────────────────────────────────── */}
      {modalFueraGeocerca && (
        <div className="modal-overlay" onClick={() => { setModalFueraGeocerca(false); setCoordsCache(null); }}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📍 Fuera de la geocerca</h2>
              <button className="modal-close" onClick={() => { setModalFueraGeocerca(false); setCoordsCache(null); }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                Tu ubicación está a <strong>{infoGeocerca.distancia}m</strong> del centro de la sucursal
                (radio permitido: <strong>{infoGeocerca.radio}m</strong>).
                Puedes continuar indicando el motivo por el que registras fuera de la geocerca.
              </div>
              <div className="form-group">
                <label>Motivo del registro fuera de geocerca *</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={motivoFueraGeocerca}
                  onChange={(e) => setMotivoFueraGeocerca(e.target.value)}
                  placeholder="Ej: GPS impreciso en interior, trabajando en otra ubicación autorizada, señal débil…"
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => { setModalFueraGeocerca(false); setCoordsCache(null); }}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={confirmarFueraGeocerca}
                  disabled={!motivoFueraGeocerca.trim()}
                >
                  Continuar y registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: fuera de horario ────────────────────────────────────────── */}
      {modalFueraHorario && (
        <div className="modal-overlay" onClick={() => { setModalFueraHorario(false); setCoordsCache(null); }}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Registro fuera de horario</h2>
              <button className="modal-close" onClick={() => { setModalFueraHorario(false); setCoordsCache(null); }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                Este registro se está realizando <strong>fuera del horario establecido</strong>
                {horario && (
                  <span>
                    {" "}(esperado: <strong>
                      {[horario.horaEntrada, horario.horaSalidaAlimentos, horario.horaRegresoAlimentos, horario.horaSalida][
                        ORDEN.indexOf(siguienteRegistro)
                      ] || "—"}
                    </strong> ±{horario.toleranciaMinutos ?? 10} min)
                  </span>
                )}
                . Por favor indica el motivo.
              </div>

              <div className="form-group">
                <label>Motivo del registro fuera de horario *</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={motivoFueraHorario}
                  onChange={(e) => setMotivoFueraHorario(e.target.value)}
                  placeholder="Ej: Tráfico en la ciudad, cita médica previa, autorización del supervisor…"
                  autoFocus
                />
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => { setModalFueraHorario(false); setCoordsCache(null); }}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={confirmarConMotivo}
                  disabled={!motivoFueraHorario.trim()}
                >
                  Continuar y registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
