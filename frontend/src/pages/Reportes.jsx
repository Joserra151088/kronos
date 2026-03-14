/**
 * Reportes.jsx - Reportes con filtros avanzados y exportación Excel/CSV/PDF
 */

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getSucursales, getUsuarios, getReporteAsistencia, getReporteIncidencias, getTiposIncidencia, getReporteMinutos, getMinutosEmpleados, getRegistros } from "../utils/api";
import { exportToExcel, exportToCsv, exportToPdf } from "../utils/export";
import { formatearMinutos } from "../utils/minutos";

const HOY = new Date().toISOString().split("T")[0];
const HACE_7 = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

const TABS = [
  { id: "asistencia", label: "Asistencia" },
  { id: "incidencias", label: "Incidencias" },
  { id: "minutos", label: "Tiempo Trabajado" },
  { id: "timeline", label: "📈 Línea de Tiempo" },
];

const COLS_ASISTENCIA = [
  { key: "usuarioNombre", label: "Empleado" },
  { key: "usuarioRol", label: "Rol" },
  { key: "sucursalNombre", label: "Sucursal" },
  { key: "tipo", label: "Tipo" },
  { key: "fecha", label: "Fecha" },
  { key: "hora", label: "Hora" },
  { key: "dentroGeocerca", label: "En Geocerca" },
  { key: "esManual", label: "Manual" },
];

const COLS_INCIDENCIAS = [
  { key: "usuarioNombre", label: "Empleado" },
  { key: "tipoNombre", label: "Tipo" },
  { key: "estado", label: "Estado" },
  { key: "sucursalNombre", label: "Sucursal" },
  { key: "descripcion", label: "Descripción" },
  { key: "supervisorNombre", label: "Supervisor" },
  { key: "creadoEn", label: "Fecha" },
];

const COLS_MINUTOS = [
  { key: "fecha", label: "Fecha" },
  { key: "minutos", label: "Minutos" },
  { key: "horas", label: "Tiempo" },
];

// ─── Timeline helpers ────────────────────────────────────────────────────────

const MINUTOS_JORNADA = 540; // 9 horas = jornada completa
const MINUTOS_UMBRAL_COMPLETA = 480; // 8h = jornada "completa"

function calcularRangoFechas(periodo) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fmt = (d) => d.toISOString().split("T")[0];
  if (periodo === "dia") {
    return { desde: fmt(hoy), hasta: fmt(hoy) };
  } else if (periodo === "semana") {
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    return { desde: fmt(lunes), hasta: fmt(domingo) };
  } else if (periodo === "mes") {
    const ini = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    return { desde: fmt(ini), hasta: fmt(fin) };
  } else if (periodo === "trimestre") {
    const q = Math.floor(hoy.getMonth() / 3);
    const ini = new Date(hoy.getFullYear(), q * 3, 1);
    const fin = new Date(hoy.getFullYear(), q * 3 + 3, 0);
    return { desde: fmt(ini), hasta: fmt(fin) };
  } else {
    // año
    const ini = new Date(hoy.getFullYear(), 0, 1);
    const fin = new Date(hoy.getFullYear(), 11, 31);
    return { desde: fmt(ini), hasta: fmt(fin) };
  }
}

function generarDias(desde, hasta) {
  const dias = [];
  const cur = new Date(desde + "T00:00:00");
  const end = new Date(hasta + "T00:00:00");
  while (cur <= end) {
    dias.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dias;
}

function horaAMinutos(horaStr) {
  if (!horaStr) return null;
  const [h, m] = horaStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

// Agrupa registros por empleado y luego por fecha
function procesarRegistros(registros) {
  const mapa = {}; // { usuarioId: { nombre, dias: { fecha: [registros] } } }
  for (const r of registros) {
    const uid = r.usuarioId || r.usuario_id;
    if (!mapa[uid]) {
      mapa[uid] = {
        usuarioId: uid,
        nombre: r.usuarioNombre || r.usuario_nombre || `Usuario ${uid}`,
        dias: {},
      };
    }
    const fecha = r.fecha ? r.fecha.split("T")[0] : null;
    if (!fecha) continue;
    if (!mapa[uid].dias[fecha]) mapa[uid].dias[fecha] = [];
    mapa[uid].dias[fecha].push(r);
  }
  return Object.values(mapa);
}

// Calcula los segmentos de barra para un día dado
function calcularSegmentos(registrosDia) {
  if (!registrosDia || registrosDia.length === 0) return { segmentos: [], minutosTotales: 0, fueraDeHorario: false };

  // Ordenar por hora
  const ordenados = [...registrosDia].sort((a, b) => {
    const ha = horaAMinutos(a.hora) ?? 0;
    const hb = horaAMinutos(b.hora) ?? 0;
    return ha - hb;
  });

  const segmentos = [];
  let i = 0;
  let minutosTotales = 0;
  let fueraDeHorario = false;

  while (i < ordenados.length) {
    const entrada = ordenados[i];
    if (entrada.tipo !== "entrada") { i++; continue; }
    const horaEntrada = horaAMinutos(entrada.hora);
    if (horaEntrada === null) { i++; continue; }

    // Buscar la siguiente salida
    let salida = null;
    for (let j = i + 1; j < ordenados.length; j++) {
      if (ordenados[j].tipo === "salida") { salida = ordenados[j]; i = j; break; }
    }

    const horaSalida = salida ? horaAMinutos(salida.hora) : null;
    const duracion = horaSalida !== null ? horaSalida - horaEntrada : null;

    segmentos.push({
      inicio: horaEntrada,
      fin: horaSalida,
      duracion,
      fueraDeHorario: entrada.fueraDeHorario || salida?.fueraDeHorario || false,
    });

    if (duracion !== null) minutosTotales += duracion;
    if (entrada.fueraDeHorario || salida?.fueraDeHorario) fueraDeHorario = true;
    i++;
  }

  return { segmentos, minutosTotales, fueraDeHorario };
}

// Light mode colors for bar chart
const CHART_COLORS = {
  bg: "#ffffff",
  text: "#1a1a2e",
  barBg: "#f0f0f0",
  grid: "#e0e0e0",
  green: "#22c55e",
  yellow: "#f59e0b",
  red: "#ef4444",
  border: "#d0d0d0",
  rowAlt: "#f8f9fa",
  headerBg: "#f0f0f0",
  muted: "#6b7280",
};

function colorBarraLight(minutos, fueraDeHorario) {
  if (fueraDeHorario || minutos < 300) return CHART_COLORS.red;
  if (minutos >= MINUTOS_UMBRAL_COMPLETA) return CHART_COLORS.green;
  return CHART_COLORS.yellow;
}

// ─── Tooltip del gráfico de barras ───────────────────────────────────────────

function TooltipBarChart({ empleado, fecha, segmentos, minutosTotales }) {
  const horas = (minutosTotales / 60).toFixed(1);
  return (
    <div style={{
      position: "absolute", zIndex: 1000, bottom: "calc(100% + 8px)", left: "50%",
      transform: "translateX(-50%)",
      background: "#1a1a2e", border: "1px solid #3a3a4a",
      borderRadius: 6, padding: "8px 12px", minWidth: 180, pointerEvents: "none",
      boxShadow: "0 4px 16px rgba(0,0,0,0.5)", fontSize: 12, color: "#e0e0e0",
      whiteSpace: "nowrap",
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: "#fff" }}>{empleado}</div>
      <div style={{ color: "#aaa", marginBottom: 4 }}>{fecha}</div>
      {segmentos.map((s, idx) => (
        <div key={idx} style={{ marginBottom: 2 }}>
          {s.inicio !== null ? `${String(Math.floor(s.inicio / 60)).padStart(2, "0")}:${String(s.inicio % 60).padStart(2, "0")}` : "?"}
          {" → "}
          {s.fin !== null ? `${String(Math.floor(s.fin / 60)).padStart(2, "0")}:${String(s.fin % 60).padStart(2, "0")}` : "sin salida"}
          {s.duracion !== null ? ` (${(s.duracion / 60).toFixed(1)}h)` : ""}
        </div>
      ))}
      <div style={{ marginTop: 4, borderTop: "1px solid #3a3a4a", paddingTop: 4, fontWeight: 600, color: "#22c55e" }}>
        Total: {horas}h ({minutosTotales} min)
      </div>
    </div>
  );
}

// ─── Barra individual del chart ───────────────────────────────────────────────

const BAR_HEIGHT = 100; // px - altura máxima de barra (representa MINUTOS_JORNADA)
const BAR_WIDTH = 28;   // px - ancho de cada barra

function BarDia({ empleado, fecha, registrosDia, esPasado }) {
  const [hover, setHover] = useState(false);
  const { segmentos, minutosTotales, fueraDeHorario } = calcularSegmentos(registrosDia);
  const sinRegistro = segmentos.length === 0;

  const heightPct = Math.min(minutosTotales / MINUTOS_JORNADA, 1);
  const barColor = colorBarraLight(minutosTotales, fueraDeHorario);

  return (
    <div
      style={{
        width: BAR_WIDTH,
        height: BAR_HEIGHT,
        position: "relative",
        display: "flex",
        alignItems: "flex-end",
        flexShrink: 0,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Background track */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, top: 0,
        background: sinRegistro && esPasado ? "rgba(239,68,68,0.08)" : CHART_COLORS.barBg,
        borderRadius: 4,
        border: sinRegistro && esPasado ? "1px solid rgba(239,68,68,0.2)" : "1px solid " + CHART_COLORS.grid,
      }} />

      {/* Bar fill */}
      {!sinRegistro && minutosTotales > 0 && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 2,
          right: 2,
          height: `${heightPct * 100}%`,
          background: barColor,
          borderRadius: "3px 3px 0 0",
          transition: "height 0.3s ease",
          opacity: 0.85,
        }} />
      )}

      {/* In-progress striped bar (entrada sin salida) */}
      {segmentos.length > 0 && segmentos[segmentos.length - 1].fin === null && (
        <div style={{
          position: "absolute",
          bottom: 0, left: 2, right: 2,
          height: `${Math.min((segmentos[segmentos.length - 1].inicio / MINUTOS_JORNADA) * 100 + 15, 100)}%`,
          background: "repeating-linear-gradient(180deg, #f59e0b 0px, #f59e0b 4px, transparent 4px, transparent 8px)",
          borderRadius: "3px 3px 0 0",
          opacity: 0.6,
        }} />
      )}

      {/* Tooltip */}
      {hover && (sinRegistro ? esPasado : true) && (
        <TooltipBarChart
          empleado={empleado}
          fecha={fecha}
          segmentos={sinRegistro ? [] : segmentos}
          minutosTotales={minutosTotales}
        />
      )}
    </div>
  );
}

// ─── Fila de empleado con mini bar chart + trend line ────────────────────────

function FilaEmpleadoChart({ fila, dias, hoy }) {
  // Calcula los minutos para cada día
  const datosDias = dias.map((dia) => {
    const { minutosTotales, fueraDeHorario } = calcularSegmentos(fila.dias[dia]);
    return { dia, minutos: minutosTotales, fueraDeHorario };
  });

  // Puntos para la trend line (solo días pasados con datos)
  const pasadosConDatos = datosDias
    .map((d, i) => ({ ...d, idx: i }))
    .filter((d) => d.dia <= hoy && d.minutos > 0);

  const totalAncho = dias.length * (BAR_WIDTH + 4); // BAR_WIDTH + gap

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, position: "relative", paddingTop: 4 }}>
      {/* Bars */}
      {datosDias.map(({ dia, minutos }) => (
        <BarDia
          key={dia}
          empleado={fila.nombre}
          fecha={dia}
          registrosDia={fila.dias[dia]}
          esPasado={dia <= hoy}
        />
      ))}

      {/* Trend line SVG overlay */}
      {pasadosConDatos.length >= 2 && (
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: totalAncho,
            height: BAR_HEIGHT + 4,
            pointerEvents: "none",
            overflow: "visible",
          }}
          viewBox={`0 0 ${totalAncho} ${BAR_HEIGHT + 4}`}
        >
          <polyline
            points={pasadosConDatos.map((d) => {
              const x = d.idx * (BAR_WIDTH + 4) + BAR_WIDTH / 2;
              const y = BAR_HEIGHT - Math.min(d.minutos / MINUTOS_JORNADA, 1) * BAR_HEIGHT + 4;
              return `${x},${y}`;
            }).join(" ")}
            fill="none"
            stroke="#1a1a2e"
            strokeWidth="1.5"
            strokeDasharray="4,2"
            opacity="0.5"
          />
          {pasadosConDatos.map((d) => {
            const x = d.idx * (BAR_WIDTH + 4) + BAR_WIDTH / 2;
            const y = BAR_HEIGHT - Math.min(d.minutos / MINUTOS_JORNADA, 1) * BAR_HEIGHT + 4;
            return (
              <circle key={d.dia} cx={x} cy={y} r={3} fill="#1a1a2e" opacity="0.5" />
            );
          })}
        </svg>
      )}
    </div>
  );
}

// ─── Componente principal del Timeline ───────────────────────────────────────

const ITEMS_POR_PAGINA = 15;

function TimelineChart({ sucursales, usuarios }) {
  const [nivel, setNivel] = useState("empresa");
  const [entidadId, setEntidadId] = useState("");
  const [periodo, setPeriodo] = useState("semana");
  const [rango, setRango] = useState(() => calcularRangoFechas("semana"));
  const [cargando, setCargando] = useState(false);
  const [filas, setFilas] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [dias, setDias] = useState([]);
  const [hasBuscado, setHasBuscado] = useState(false);

  useEffect(() => {
    setRango(calcularRangoFechas(periodo));
    setPagina(0);
  }, [periodo]);

  const buscar = async () => {
    try {
      setCargando(true);
      const params = { fechaInicio: rango.desde, fechaFin: rango.hasta };
      if (nivel === "empleado" && entidadId) params.usuarioId = entidadId;
      if (nivel === "sucursal" && entidadId) params.sucursalId = entidadId;
      const res = await getRegistros(params);
      const registros = Array.isArray(res) ? res : (res.registros || []);
      const procesados = procesarRegistros(registros);
      setFilas(procesados);
      setDias(generarDias(rango.desde, rango.hasta));
      setPagina(0);
      setHasBuscado(true);
    } catch (e) {
      alert("Error al cargar el timeline: " + e.message);
    } finally {
      setCargando(false);
    }
  };

  // Estadísticas
  const hoy = new Date().toISOString().split("T")[0];
  let jornadasCompletas = 0;
  let totalMinutos = 0;
  let ausencias = 0;
  let totalDiasPosibles = 0;

  for (const fila of filas) {
    for (const dia of dias) {
      if (dia > hoy) continue;
      totalDiasPosibles++;
      const { minutosTotales } = calcularSegmentos(fila.dias[dia]);
      if (minutosTotales === 0) ausencias++;
      else {
        totalMinutos += minutosTotales;
        if (minutosTotales >= MINUTOS_UMBRAL_COMPLETA) jornadasCompletas++;
      }
    }
  }
  const promedioHoras = totalDiasPosibles > ausencias
    ? ((totalMinutos / 60) / (totalDiasPosibles - ausencias)).toFixed(1)
    : "0.0";

  const filasVisible = filas.slice(pagina * ITEMS_POR_PAGINA, (pagina + 1) * ITEMS_POR_PAGINA);
  const totalPaginas = Math.ceil(filas.length / ITEMS_POR_PAGINA);

  // Ancho de celda adaptativo según cantidad de días
  const anchocelda = dias.length <= 7 ? 90 : dias.length <= 31 ? 60 : 40;

  const labelDia = (fecha) => {
    const d = new Date(fecha + "T00:00:00");
    const diaSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d.getDay()];
    const num = d.getDate();
    if (dias.length <= 14) return `${diaSemana} ${num}`;
    if (dias.length <= 31) return `${num}`;
    // trimestre/año: mostrar solo cada 7 días
    const idx = dias.indexOf(fecha);
    return idx % 7 === 0 ? `${num}/${d.getMonth() + 1}` : "";
  };

  return (
    <div>
      {/* Filtros del timeline */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Nivel</label>
              <select className="form-control" value={nivel} onChange={e => { setNivel(e.target.value); setEntidadId(""); }}>
                <option value="empresa">Toda la empresa</option>
                <option value="corporativo">Corporativo</option>
                <option value="sucursal">Sucursal</option>
                <option value="empleado">Empleado individual</option>
              </select>
            </div>
            {nivel === "sucursal" && (
              <div className="form-group">
                <label>Sucursal</label>
                <select className="form-control" value={entidadId} onChange={e => setEntidadId(e.target.value)}>
                  <option value="">Todas</option>
                  {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            )}
            {nivel === "empleado" && (
              <div className="form-group">
                <label>Empleado</label>
                <select className="form-control" value={entidadId} onChange={e => setEntidadId(e.target.value)}>
                  <option value="">Todos</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Período</label>
              <select className="form-control" value={periodo} onChange={e => setPeriodo(e.target.value)}>
                <option value="dia">Día</option>
                <option value="semana">Semana</option>
                <option value="mes">Mes</option>
                <option value="trimestre">Trimestre</option>
                <option value="anio">Año</option>
              </select>
            </div>
            <div className="form-group">
              <label>Desde</label>
              <input type="date" className="form-control" value={rango.desde}
                onChange={e => setRango(r => ({ ...r, desde: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Hasta</label>
              <input type="date" className="form-control" value={rango.hasta}
                onChange={e => setRango(r => ({ ...r, hasta: e.target.value }))} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={buscar} disabled={cargando} style={{ marginTop: 8 }}>
            {cargando ? "Cargando..." : "Generar timeline"}
          </button>
        </div>
      </div>

      {/* Leyenda de colores - light mode */}
      <div style={{ display: "flex", gap: 20, marginBottom: 12, flexWrap: "wrap", fontSize: 13, alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, height: 16, borderRadius: 3, background: CHART_COLORS.green, display: "inline-block" }} />
          Jornada completa (≥8h)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, height: 16, borderRadius: 3, background: CHART_COLORS.yellow, display: "inline-block" }} />
          Parcial (5-8h)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, height: 16, borderRadius: 3, background: CHART_COLORS.red, display: "inline-block" }} />
          Insuficiente o fuera de horario
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, height: 16, borderRadius: 3, background: CHART_COLORS.barBg, border: "1px solid " + CHART_COLORS.grid, display: "inline-block" }} />
          Sin registro
        </span>
      </div>

      {cargando ? (
        <div className="loading">Cargando timeline...</div>
      ) : !hasBuscado ? (
        <div className="empty-state">
          <div className="empty-icon">📈</div>
          <p>Selecciona los filtros y haz clic en "Generar timeline" para visualizar la asistencia</p>
        </div>
      ) : filas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>No se encontraron registros de asistencia para el período y filtros seleccionados.</p>
        </div>
      ) : (
        <>
          {/* Resumen estadístico - light mode */}
          <div style={{
            display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16,
            padding: "12px 16px",
            background: CHART_COLORS.bg,
            borderRadius: 8,
            border: "1px solid " + CHART_COLORS.border,
            fontSize: 13,
            color: CHART_COLORS.text,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}>
            <span>Total empleados: <strong>{filas.length}</strong></span>
            <span style={{ color: CHART_COLORS.muted }}>|</span>
            <span>Jornadas completas: <strong style={{ color: CHART_COLORS.green }}>{jornadasCompletas}</strong></span>
            <span style={{ color: CHART_COLORS.muted }}>|</span>
            <span>Promedio de horas: <strong>{promedioHoras}h</strong></span>
            <span style={{ color: CHART_COLORS.muted }}>|</span>
            <span>Ausencias: <strong style={{ color: CHART_COLORS.red }}>{ausencias}</strong></span>
          </div>

          {/* ── Bar Chart Dashboard (light mode) ── */}
          <div style={{
            background: CHART_COLORS.bg,
            borderRadius: 10,
            border: "1px solid " + CHART_COLORS.border,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}>
            {/* Chart header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              background: CHART_COLORS.headerBg,
              borderBottom: "1px solid " + CHART_COLORS.border,
              gap: 24,
            }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: CHART_COLORS.text }}>
                Asistencia por empleado
              </span>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: CHART_COLORS.muted }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: CHART_COLORS.green, display: "inline-block" }} />
                  Completa (≥8h)
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: CHART_COLORS.yellow, display: "inline-block" }} />
                  Parcial (5-8h)
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: CHART_COLORS.red, display: "inline-block" }} />
                  Insuficiente (&lt;5h)
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#1a1a2e" strokeWidth="1.5" strokeDasharray="4,2" opacity="0.5" /></svg>
                  Tendencia
                </span>
              </div>
            </div>

            {/* Chart rows - scrollable */}
            <div style={{ overflowX: "auto" }}>
              <table style={{
                borderCollapse: "collapse",
                width: "100%",
                fontSize: 12,
                color: CHART_COLORS.text,
              }}>
                <thead>
                  <tr style={{ background: CHART_COLORS.headerBg }}>
                    <th style={{
                      width: 170, minWidth: 150, textAlign: "left",
                      padding: "8px 12px",
                      position: "sticky", left: 0, zIndex: 2,
                      background: CHART_COLORS.headerBg,
                      borderBottom: "1px solid " + CHART_COLORS.border,
                      color: CHART_COLORS.muted, fontWeight: 600,
                    }}>
                      Empleado
                    </th>
                    <th style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderBottom: "1px solid " + CHART_COLORS.border,
                      color: CHART_COLORS.muted, fontWeight: 600,
                    }}>
                      <div style={{ display: "flex", gap: 4, alignItems: "flex-end" }}>
                        {dias.map((dia) => {
                          const label = labelDia(dia);
                          const esFinde = (() => { const d = new Date(dia + "T00:00:00"); return d.getDay() === 0 || d.getDay() === 6; })();
                          return (
                            <div key={dia} style={{
                              width: BAR_WIDTH,
                              textAlign: "center",
                              fontSize: 10,
                              color: esFinde ? CHART_COLORS.red : CHART_COLORS.muted,
                              fontWeight: dia === hoy ? 700 : 400,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              flexShrink: 0,
                            }}>
                              {label || ""}
                            </div>
                          );
                        })}
                      </div>
                    </th>
                    <th style={{
                      width: 90, minWidth: 90, textAlign: "right",
                      padding: "8px 12px",
                      borderBottom: "1px solid " + CHART_COLORS.border,
                      color: CHART_COLORS.muted, fontWeight: 600,
                    }}>
                      Promedio
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filasVisible.map((fila, rowIdx) => {
                    // Calcula promedio para este empleado
                    let sumMin = 0; let cntDias = 0;
                    for (const dia of dias) {
                      if (dia > hoy) continue;
                      const { minutosTotales } = calcularSegmentos(fila.dias[dia]);
                      if (minutosTotales > 0) { sumMin += minutosTotales; cntDias++; }
                    }
                    const promEmp = cntDias > 0 ? (sumMin / 60 / cntDias).toFixed(1) : "—";
                    const promColor = cntDias === 0 ? CHART_COLORS.muted
                      : sumMin / cntDias >= MINUTOS_UMBRAL_COMPLETA ? CHART_COLORS.green
                      : sumMin / cntDias >= 300 ? CHART_COLORS.yellow
                      : CHART_COLORS.red;

                    return (
                      <tr key={fila.usuarioId} style={{
                        background: rowIdx % 2 === 0 ? CHART_COLORS.bg : CHART_COLORS.rowAlt,
                        borderBottom: "1px solid " + CHART_COLORS.grid,
                      }}>
                        <td style={{
                          padding: "12px 12px",
                          position: "sticky", left: 0, zIndex: 1,
                          background: rowIdx % 2 === 0 ? CHART_COLORS.bg : CHART_COLORS.rowAlt,
                          fontWeight: 600, color: CHART_COLORS.text,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 170,
                          verticalAlign: "bottom",
                        }}>
                          {fila.nombre}
                        </td>
                        <td style={{ padding: "8px 12px", verticalAlign: "bottom" }}>
                          <FilaEmpleadoChart fila={fila} dias={dias} hoy={hoy} />
                        </td>
                        <td style={{
                          padding: "12px 12px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: promColor,
                          fontSize: 13,
                          verticalAlign: "bottom",
                        }}>
                          {promEmp !== "—" ? `${promEmp}h` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Y-axis labels hint */}
            <div style={{
              padding: "8px 16px",
              borderTop: "1px solid " + CHART_COLORS.border,
              display: "flex", gap: 16, fontSize: 11, color: CHART_COLORS.muted,
            }}>
              <span>Barra máx. = {MINUTOS_JORNADA} min (9h)</span>
              <span>La línea punteada muestra la tendencia de asistencia por empleado</span>
            </div>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, alignItems: "center" }}>
              <button className="btn btn-secondary" onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0}>
                ← Anterior
              </button>
              <span style={{ fontSize: 13, color: "var(--text-muted, #aaa)" }}>
                Página {pagina + 1} de {totalPaginas} ({filas.length} empleados)
              </span>
              <button className="btn btn-secondary" onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))} disabled={pagina === totalPaginas - 1}>
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Componente principal Reportes ───────────────────────────────────────────

const Reportes = () => {
  const { usuario } = useAuth();
  const [tab, setTab] = useState("asistencia");
  const [sucursales, setSucursales] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [tiposInc, setTiposInc] = useState([]);
  const [datos, setDatos] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [filtros, setFiltros] = useState({ fechaInicio: HACE_7, fechaFin: HOY, sucursalId: "", usuarioId: "", estado: "", tipoIncidenciaId: "" });
  const [expandirFiltros, setExpandirFiltros] = useState(true);
  const [minutosEmpleados, setMinutosEmpleados] = useState([]);

  useEffect(() => {
    Promise.all([getSucursales(), getUsuarios().catch(() => []), getTiposIncidencia()])
      .then(([suc, usr, tipos]) => { setSucursales(suc); setUsuarios(Array.isArray(usr) ? usr : []); setTiposInc(tipos); });
  }, []);

  const buscar = async () => {
    if (!filtros.fechaInicio || !filtros.fechaFin) { alert("Selecciona un rango de fechas"); return; }
    try {
      setCargando(true);
      if (tab === "asistencia") {
        const params = { fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin };
        if (filtros.sucursalId) params.sucursalId = filtros.sucursalId;
        if (filtros.usuarioId) params.usuarioId = filtros.usuarioId;
        const res = await getReporteAsistencia(params);
        setDatos(res.registros || []);
        setTotal(res.total || 0);
      } else if (tab === "incidencias") {
        const params = { fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin };
        if (filtros.sucursalId) params.sucursalId = filtros.sucursalId;
        if (filtros.estado) params.estado = filtros.estado;
        if (filtros.tipoIncidenciaId) params.tipoIncidenciaId = filtros.tipoIncidenciaId;
        const res = await getReporteIncidencias(params);
        setDatos(res.incidencias || []);
        setTotal(res.total || 0);
      } else {
        const uid = filtros.usuarioId || usuario.id;
        const res = await getReporteMinutos({ usuarioId: uid, fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin });
        const rows = (res.dias || []).map(d => ({ ...d, horas: formatearMinutos(d.minutos) }));
        setDatos(rows);
        setTotal(res.totalMinutos || 0);
        // For admins without specific user filter, also fetch per-employee breakdown
        if (!filtros.usuarioId && ['super_admin','agente_soporte_ti','supervisor_sucursales'].includes(usuario.rol)) {
          const params2 = { fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin };
          if (filtros.sucursalId) params2.sucursalId = filtros.sucursalId;
          getMinutosEmpleados(params2).then(r => setMinutosEmpleados(r.empleados || [])).catch(() => {});
        } else {
          setMinutosEmpleados([]);
        }
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setCargando(false);
    }
  };

  const cols = tab === "asistencia" ? COLS_ASISTENCIA : tab === "incidencias" ? COLS_INCIDENCIAS : COLS_MINUTOS;
  const nombreArchivo = `reporte_${tab}_${filtros.fechaInicio}_${filtros.fechaFin}`;

  const handleExport = async (tipo) => {
    if (datos.length === 0) { alert("No hay datos para exportar"); return; }
    if (tipo === "excel") await exportToExcel(cols, datos, nombreArchivo);
    else if (tipo === "csv") exportToCsv(cols, datos, nombreArchivo);
    else await exportToPdf(cols, datos, nombreArchivo, `Reporte de ${tab}`);
  };

  const setFiltro = (key, val) => setFiltros(prev => ({ ...prev, [key]: val }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Consulta y exporta información del sistema</p>
        </div>
        {datos.length > 0 && tab !== "timeline" && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => handleExport("csv")}>CSV</button>
            <button className="btn btn-secondary" onClick={() => handleExport("excel")}>Excel</button>
            <button className="btn btn-primary" onClick={() => handleExport("pdf")}>PDF</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "tab-active" : ""}`}
            onClick={() => { setTab(t.id); setDatos([]); }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Timeline */}
      {tab === "timeline" ? (
        <TimelineChart sucursales={sucursales} usuarios={usuarios} />
      ) : (
        <>
          {/* Filtros */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ cursor: "pointer", display: "flex", justifyContent: "space-between" }}
              onClick={() => setExpandirFiltros(!expandirFiltros)}>
              <span>🔍 Filtros</span>
              <span>{expandirFiltros ? "▲" : "▼"}</span>
            </div>
            {expandirFiltros && (
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Desde</label>
                    <input type="date" className="form-control" value={filtros.fechaInicio} onChange={(e) => setFiltro("fechaInicio", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Hasta</label>
                    <input type="date" className="form-control" value={filtros.fechaFin} onChange={(e) => setFiltro("fechaFin", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Sucursal</label>
                    <select className="form-control" value={filtros.sucursalId} onChange={(e) => setFiltro("sucursalId", e.target.value)}>
                      <option value="">Todas</option>
                      {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  </div>
                  {tab !== "incidencias" && (
                    <div className="form-group">
                      <label>Empleado</label>
                      <select className="form-control" value={filtros.usuarioId} onChange={(e) => setFiltro("usuarioId", e.target.value)}>
                        <option value="">Todos</option>
                        {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
                      </select>
                    </div>
                  )}
                  {tab === "incidencias" && (
                    <>
                      <div className="form-group">
                        <label>Estado</label>
                        <select className="form-control" value={filtros.estado} onChange={(e) => setFiltro("estado", e.target.value)}>
                          <option value="">Todos</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="aprobada">Aprobada</option>
                          <option value="rechazada">Rechazada</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Tipo de incidencia</label>
                        <select className="form-control" value={filtros.tipoIncidenciaId} onChange={(e) => setFiltro("tipoIncidenciaId", e.target.value)}>
                          <option value="">Todos</option>
                          {tiposInc.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                </div>
                <button className="btn btn-primary" onClick={buscar} disabled={cargando}>
                  {cargando ? "Buscando..." : "Buscar"}
                </button>
              </div>
            )}
          </div>

          {/* Resultados */}
          {cargando ? (
            <div className="loading">Cargando datos...</div>
          ) : datos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>Aplica los filtros y haz clic en Buscar para ver los resultados</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12, color: "var(--text-muted)" }}>
                {tab === "minutos" ? (
                  <span>Total: <strong>{formatearMinutos(total)}</strong> trabajados en el período</span>
                ) : (
                  <span><strong>{total}</strong> {tab === "asistencia" ? "registros" : "incidencias"} encontrados</span>
                )}
              </div>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>{cols.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {datos.map((row, i) => (
                      <tr key={i}>
                        {cols.map((c) => (
                          <td key={c.key}>
                            {c.key === "dentroGeocerca" ? (row[c.key] ? "✅" : "❌") :
                             c.key === "esManual" ? (row[c.key] ? "Sí" : "No") :
                             c.key === "creadoEn" ? new Date(row[c.key]).toLocaleDateString("es-MX") :
                             String(row[c.key] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {tab === "minutos" && minutosEmpleados.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ marginBottom: 12, fontSize: "1rem" }}>📊 Detalle por empleado</h3>
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Empleado</th>
                          <th>Puesto</th>
                          <th>Total minutos</th>
                          <th>Tiempo</th>
                          <th>Días trabajados</th>
                        </tr>
                      </thead>
                      <tbody>
                        {minutosEmpleados
                          .sort((a, b) => b.totalMinutos - a.totalMinutos)
                          .map((emp) => (
                            <tr key={emp.usuarioId}>
                              <td>{emp.nombre}</td>
                              <td>{emp.puestoNombre}</td>
                              <td>{emp.totalMinutos}</td>
                              <td>{formatearMinutos(emp.totalMinutos)}</td>
                              <td>{emp.dias.filter(d => d.minutos > 0).length}</td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Reportes;
