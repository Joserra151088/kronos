/**
 * Logs.jsx
 * Salud de la plataforma en tiempo real.
 * – Gráfico de dona SVG (distribución de eventos por nivel)
 * – Tarjetas de métricas clave
 * – Tabla de logs con detalle de error y stack trace
 * Solo visible para super_admin y agente_soporte_ti.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { getLogsHealth, getLogsErrores } from "../utils/api";

const ROWS_PER_PAGE = 50;
const REFRESH_MS    = 30_000; // auto-refresh cada 30 s

// ─── Configuración por nivel ──────────────────────────────────────────────────
const LEVEL_CFG = {
  error: { label: "Errores",       color: "#d32f2f", bg: "#ffebee", icon: "🔴" },
  warn:  { label: "Advertencias",  color: "#f57c00", bg: "#fff3e0", icon: "🟡" },
  info:  { label: "Info",          color: "#1565c0", bg: "#e3f2fd", icon: "🔵" },
};

const STATUS_CFG = {
  healthy:  { label: "Operativo",  color: "#2e7d32", bg: "#e8f5e9", dot: "#43a047", icon: "✅" },
  degraded: { label: "Degradado",  color: "#e65100", bg: "#fff3e0", dot: "#fb8c00", icon: "⚠️" },
  critical: { label: "Crítico",    color: "#b71c1c", bg: "#ffebee", dot: "#e53935", icon: "🔴" },
};

// ─── SVG Donut Chart ─────────────────────────────────────────────────────────
function buildArc(cx, cy, r, startAngle, endAngle) {
  const toRad = (d) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle - 90));
  const y1 = cy + r * Math.sin(toRad(startAngle - 90));
  const x2 = cx + r * Math.cos(toRad(endAngle - 90));
  const y2 = cy + r * Math.sin(toRad(endAngle - 90));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function DonutChart({ slices, size = 180, thickness = 38 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r  = (size - thickness) / 2;
  const total = slices.reduce((s, sl) => s + sl.value, 0);

  const [hovered, setHovered] = useState(null);

  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e0e0e0" strokeWidth={thickness} />
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#9e9e9e" fontSize={12}>Sin datos</text>
      </svg>
    );
  }

  let current = 0;
  const arcs = slices.map((sl) => {
    const sweep = (sl.value / total) * 360;
    const start = current;
    current += sweep;
    return { ...sl, start, end: current, sweep };
  });

  const hoveredSlice = hovered !== null ? arcs[hovered] : null;

  return (
    <svg width={size} height={size} style={{ overflow: "visible", display: "block" }}>
      {arcs.map((arc, i) => {
        if (arc.sweep < 0.5) return null;
        const isHov = hovered === i;
        const path  = buildArc(cx, cy, r, arc.start, arc.end);
        return (
          <path
            key={i}
            d={path}
            fill="none"
            stroke={arc.color}
            strokeWidth={isHov ? thickness + 6 : thickness}
            strokeLinecap="round"
            style={{ cursor: "pointer", transition: "stroke-width 0.15s ease" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        );
      })}
      {/* Centro: número total o dato del slice hovered */}
      {hoveredSlice ? (
        <>
          <text x={cx} y={cy - 9} textAnchor="middle" fill={hoveredSlice.color}
            fontSize={20} fontWeight="700">{hoveredSlice.value}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="#666" fontSize={10}>
            {hoveredSlice.label}
          </text>
          <text x={cx} y={cy + 24} textAnchor="middle" fill="#999" fontSize={10}>
            {Math.round((hoveredSlice.value / total) * 100)}%
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text1, #1a2a3a)"
            fontSize={24} fontWeight="700">{total}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text2, #666)" fontSize={11}>
            eventos
          </text>
        </>
      )}
    </svg>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────
function StatusPulse({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.healthy;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: cfg.bg, color: cfg.color,
      padding: "6px 16px", borderRadius: 24, fontWeight: 700, fontSize: 15,
    }}>
      <span style={{
        width: 10, height: 10, borderRadius: "50%", background: cfg.dot,
        boxShadow: status !== "healthy" ? `0 0 0 3px ${cfg.dot}44` : "none",
        animation: status !== "healthy" ? "pulse-dot 1.4s infinite" : "none",
        display: "inline-block",
      }} />
      {cfg.icon} {cfg.label}
    </span>
  );
}

function MetricCard({ icon, label, value, sub, color = "#e3f2fd" }) {
  return (
    <div className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "0.72rem", color: "var(--text2)", marginBottom: 1, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text1)", lineHeight: 1.2 }}>{value}</div>
        {sub && <div style={{ fontSize: "0.68rem", color: "var(--text3, var(--text2))", marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
const Logs = () => {
  const [health,        setHealth]        = useState(null);
  const [errores,       setErrores]       = useState([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [level,         setLevel]         = useState("");
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingLogs,   setLoadingLogs]   = useState(true);
  const [errorMsg,      setErrorMsg]      = useState("");
  const [selected,      setSelected]      = useState(null);
  const [countdown,     setCountdown]     = useState(REFRESH_MS / 1000);
  const timerRef = useRef(null);

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const cargarHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const data = await getLogsHealth();
      setHealth(data);
      setErrorMsg("");
    } catch (e) {
      setErrorMsg(e.message || "No se pudo cargar la información de salud de la plataforma.");
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  const cargarLogs = useCallback(async (pg = 1) => {
    setLoadingLogs(true);
    try {
      const data = await getLogsErrores({ page: pg, limit: ROWS_PER_PAGE, level: level || undefined });
      setErrores(data.items || []);
      setTotal(data.total || 0);
      setPage(pg);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  }, [level]);

  const refrescarTodo = useCallback(() => {
    cargarHealth();
    cargarLogs(1);
    setCountdown(REFRESH_MS / 1000);
  }, [cargarHealth, cargarLogs]);

  useEffect(() => { cargarHealth(); }, [cargarHealth]);
  useEffect(() => { cargarLogs(1); }, [cargarLogs]);

  // Auto-refresco + countdown
  useEffect(() => {
    setCountdown(REFRESH_MS / 1000);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          refrescarTodo();
          return REFRESH_MS / 1000;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [refrescarTodo]);

  // ── Datos para gráfica ──────────────────────────────────────────────────────
  const countByLevel = errores.reduce(
    (acc, e) => { acc[e.level] = (acc[e.level] || 0) + 1; return acc; },
    { error: 0, warn: 0, info: 0 }
  );

  // Totales globales del buffer (del health)
  const erroresUltimaHora = health?.errorsLastHour ?? 0;
  const totalErrores      = health?.errorsTotal     ?? 0;

  // Slices para la dona: basados en el buffer cargado
  const donutSlices = [
    { label: "Errores",      value: countByLevel.error, color: LEVEL_CFG.error.color },
    { label: "Advertencias", value: countByLevel.warn,  color: LEVEL_CFG.warn.color  },
    { label: "Info",         value: countByLevel.info,  color: LEVEL_CFG.info.color  },
  ].filter((s) => s.value > 0);

  const totalPaginas = Math.ceil(total / ROWS_PER_PAGE);

  return (
    <div className="page">

      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🖥️ Salud de la plataforma</h1>
          <p className="page-subtitle">
            Monitoreo en tiempo real
            {health
              ? ` · Actualizado ${new Date(health.timestamp).toLocaleTimeString("es-MX")}`
              : " · Cargando…"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text2)" }}>
            Próxima actualización: <strong>{countdown}s</strong>
          </span>
          <button
            className="btn btn-secondary"
            onClick={refrescarTodo}
            disabled={loadingHealth}
          >
            {loadingHealth ? "⟳ Actualizando…" : "⟳ Actualizar ahora"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* ── Fila principal: Estado + Dona + Métricas ─────────────────────── */}
      {health && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 20,
          marginBottom: 24,
          alignItems: "start",
        }}>

          {/* ── Panel izquierdo: dona + estado ──────────────────────────── */}
          <div className="card" style={{ padding: "24px 28px", textAlign: "center", minWidth: 240 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Estado del sistema
              </div>
              <StatusPulse status={health.status} />
            </div>

            <div style={{ margin: "20px auto 6px", display: "flex", justifyContent: "center" }}>
              <DonutChart
                slices={donutSlices.length > 0 ? donutSlices : [{ label: "Sin errores", value: 1, color: "#43a047" }]}
                size={180}
                thickness={36}
              />
            </div>

            {/* Leyenda */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
              {donutSlices.length > 0
                ? donutSlices.map((s) => (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: "inline-block" }} />
                        <span style={{ fontSize: 12, color: "var(--text2)" }}>{s.label}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
                    </div>
                  ))
                : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#43a047", display: "inline-block" }} />
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>Sin errores</span>
                  </div>
                )
              }
            </div>

            {/* Info de inicio */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.68rem", color: "var(--text3, var(--text2))" }}>
                Iniciado el {new Date(health.startedAt).toLocaleString("es-MX", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                })}
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text3, var(--text2))", marginTop: 2 }}>
                {health.nodeVersion}
              </div>
            </div>
          </div>

          {/* ── Panel derecho: métricas ──────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 14 }}>
            <MetricCard
              icon="⏱️"
              label="Tiempo activo"
              value={health.uptimeFormatted}
              sub="desde el último reinicio"
              color="#e8f5e9"
            />
            <MetricCard
              icon="📡"
              label="Peticiones HTTP"
              value={health.requestsTotal.toLocaleString("es-MX")}
              sub="desde el inicio del servidor"
              color="#e3f2fd"
            />
            <MetricCard
              icon="🔴"
              label="Errores (última hora)"
              value={erroresUltimaHora}
              sub={`${totalErrores} errores en total`}
              color={erroresUltimaHora > 5 ? "#ffebee" : "#e8f5e9"}
            />
            <MetricCard
              icon="🧠"
              label="Memoria (heap)"
              value={`${health.memoryMB} MB`}
              sub={`RSS total: ${health.totalMemoryMB} MB`}
              color="#f3e5f5"
            />
            <MetricCard
              icon={health.database.connected ? "🟢" : "🔴"}
              label="Base de datos"
              value={health.database.connected ? "Conectada" : (health.database.enabled ? "Desconectada" : "No configurada")}
              sub={health.database.database || "—"}
              color={health.database.connected ? "#e8f5e9" : "#ffebee"}
            />

            {/* Barra de resumen de niveles */}
            <div className="card" style={{ padding: "16px 18px", gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
                Distribución de eventos en el buffer
              </div>
              {total > 0 ? (
                <>
                  <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", marginBottom: 10 }}>
                    {[
                      { key: "error", value: countByLevel.error },
                      { key: "warn",  value: countByLevel.warn  },
                      { key: "info",  value: countByLevel.info  },
                    ].filter(s => s.value > 0).map((s) => (
                      <div
                        key={s.key}
                        title={`${LEVEL_CFG[s.key].label}: ${s.value}`}
                        style={{
                          flex: s.value,
                          background: LEVEL_CFG[s.key].color,
                          transition: "flex 0.4s ease",
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {Object.entries(LEVEL_CFG).map(([key, cfg]) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                        <span style={{ fontSize: 12, color: "var(--text2)" }}>{cfg.label}:</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>
                          {countByLevel[key] || 0}
                        </span>
                      </div>
                    ))}
                    <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text2)" }}>
                      Mostrando {total} de max. 200
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: "var(--text2)", textAlign: "center", padding: "8px 0" }}>
                  ✅ No hay eventos registrados en el buffer
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loadingHealth && !health && (
        <div className="loading" style={{ marginBottom: 24 }}>Cargando métricas de salud…</div>
      )}

      {/* ── Tabla de logs ──────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>
            📋 Registro de eventos de la plataforma
          </h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 12, color: "var(--text2)" }}>Nivel:</label>
            <select
              className="form-control filter-select"
              style={{ minWidth: 140 }}
              value={level}
              onChange={(e) => { setLevel(e.target.value); setPage(1); }}
            >
              <option value="">Todos los niveles</option>
              <option value="error">🔴 Solo errores</option>
              <option value="warn">🟡 Solo advertencias</option>
              <option value="info">🔵 Solo info</option>
            </select>
            <span style={{ fontSize: "0.8rem", color: "var(--text2)" }}>
              {total} evento{total !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {loadingLogs ? (
        <div className="loading">Cargando registros…</div>
      ) : errores.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <p>{level ? "No hay eventos para el nivel seleccionado." : "El buffer de eventos está vacío."}</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 158 }}>Fecha / Hora</th>
                <th style={{ width: 110 }}>Nivel</th>
                <th>Mensaje del error</th>
                <th style={{ width: 200 }}>Origen / Ubicación</th>
                <th style={{ width: 70, textAlign: "center" }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {errores.map((entry) => {
                const cfg     = LEVEL_CFG[entry.level] || LEVEL_CFG.info;
                const isOpen  = selected?.id === entry.id;
                return (
                  <>
                    <tr
                      key={entry.id}
                      style={{
                        background: isOpen ? cfg.bg : undefined,
                        borderLeft: isOpen ? `3px solid ${cfg.color}` : undefined,
                      }}
                    >
                      <td style={{ fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>
                        {new Date(entry.timestamp).toLocaleString("es-MX")}
                      </td>
                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          background: cfg.bg, color: cfg.color,
                          padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                          border: `1px solid ${cfg.color}40`,
                        }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        <span style={{ wordBreak: "break-word" }}>{entry.message}</span>
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text2)", fontFamily: "monospace", wordBreak: "break-all" }}>
                        {entry.location || <span style={{ color: "var(--text3, #bbb)" }}>—</span>}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {entry.stack ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: 11, padding: "2px 10px" }}
                            onClick={() => setSelected(isOpen ? null : entry)}
                          >
                            {isOpen ? "▲ Ocultar" : "▼ Ver stack"}
                          </button>
                        ) : (
                          <span style={{ color: "var(--text3, #ccc)", fontSize: 11 }}>—</span>
                        )}
                      </td>
                    </tr>

                    {/* Stack trace expandido inline */}
                    {isOpen && (
                      <tr key={`${entry.id}-stack`} style={{ background: cfg.bg }}>
                        <td colSpan={5} style={{ padding: "0 12px 12px" }}>
                          <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", marginBottom: 6, paddingTop: 8,
                          }}>
                            <strong style={{ fontSize: 12, color: cfg.color }}>
                              Stack trace completo
                            </strong>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 10 }}
                              onClick={() => setSelected(null)}
                            >✕ Cerrar</button>
                          </div>
                          <pre style={{
                            background: "var(--bg1, #fff)",
                            border: `1px solid ${cfg.color}60`,
                            borderRadius: 6, padding: "12px 16px",
                            fontSize: 11, fontFamily: "monospace",
                            whiteSpace: "pre-wrap", wordBreak: "break-all",
                            color: "var(--text1)", maxHeight: 300,
                            overflow: "auto", margin: 0, lineHeight: 1.6,
                          }}>
                            {entry.stack}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, alignItems: "center" }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => cargarLogs(page - 1)}>
            ← Anterior
          </button>
          <span style={{ fontSize: "0.85rem", color: "var(--text2)" }}>
            Página {page} de {totalPaginas}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={page === totalPaginas} onClick={() => cargarLogs(page + 1)}>
            Siguiente →
          </button>
        </div>
      )}

      {/* Animación CSS para el pulso del estado degradado/crítico */}
      <style>{`
        @keyframes pulse-dot {
          0%   { box-shadow: 0 0 0 0 rgba(251,140,0,.5); }
          70%  { box-shadow: 0 0 0 8px rgba(251,140,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(251,140,0,0); }
        }
      `}</style>
    </div>
  );
};

export default Logs;
