/**
 * Auditoria.jsx
 * Solo super_admin / administrador_general. Registro de todas las acciones del sistema.
 * Muestra: quién hizo qué y a quién (actor → acción → objetivo).
 */
import { useState, useEffect, useCallback } from "react";
import { getAuditoria, getUsuarios } from "../utils/api";

const HOY = new Date().toISOString().split("T")[0];
const HACE_7 = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

const ROWS_PER_PAGE = 50;

const ROL_LABEL = {
  administrador_general:     "Admin General",
  super_admin:               "Super Admin",
  agente_soporte_ti:         "Soporte TI",
  supervisor_sucursales:     "Supervisor",
  agente_control_asistencia: "Control Asist.",
  visor_reportes:            "Visor Reportes",
  medico_titular:            "Médico Titular",
  medico_de_guardia:         "Médico Guardia",
  nominas:                   "Nóminas",
};

/** Colores de badge según resultado de la acción */
const badgeExito = (exito) => ({
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 10,
  fontSize: 11,
  fontWeight: 600,
  background: exito ? "var(--success-bg, #dcfce7)" : "var(--danger-bg, #fee2e2)",
  color:      exito ? "var(--success, #16a34a)"    : "var(--danger, #dc2626)",
});

const TIPO_ICON = {
  usuario:    "👤",
  sucursal:   "🏢",
  grupo:      "🔗",
  horario:    "⏰",
  incidencia: "📋",
  registro:   "📡",
};

const Auditoria = () => {
  const [entradas,  setEntradas]  = useState([]);
  const [usuarios,  setUsuarios]  = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [cargando,  setCargando]  = useState(false);
  const [filtros,   setFiltros]   = useState({
    usuarioId: "", accion: "", desde: HACE_7, hasta: HOY,
  });
  const [expandido, setExpandido] = useState(null); // id de la entrada con detalles expandidos

  const buscar = useCallback(async (pg = 1) => {
    setCargando(true);
    try {
      const params = { ...filtros, page: pg, limit: ROWS_PER_PAGE };
      const res = await getAuditoria(params);
      setEntradas(res.items || []);
      setTotal(res.total || 0);
      setPage(pg);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }, [filtros]);

  useEffect(() => {
    getUsuarios().then(setUsuarios).catch(() => {});
    buscar(1);
  }, []);

  const totalPaginas = Math.ceil(total / ROWS_PER_PAGE);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔍 Auditoría del sistema</h1>
          <p className="page-subtitle">
            Registro de acciones — {total} evento{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => buscar(1)} disabled={cargando}>
          {cargando ? "⟳ Cargando…" : "⟳ Actualizar"}
        </button>
      </div>

      {/* Filtros */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 12 }}>Actor (quien actuó)</label>
            <select className="form-control filter-select" value={filtros.usuarioId}
              onChange={e => setFiltros({...filtros, usuarioId: e.target.value})}>
              <option value="">Todos</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 12 }}>Acción (texto)</label>
            <input className="form-control" placeholder="Buscar acción..." value={filtros.accion}
              onChange={e => setFiltros({...filtros, accion: e.target.value})} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 12 }}>Desde</label>
            <input type="date" className="form-control" value={filtros.desde}
              onChange={e => setFiltros({...filtros, desde: e.target.value})} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 12 }}>Hasta</label>
            <input type="date" className="form-control" value={filtros.hasta}
              onChange={e => setFiltros({...filtros, hasta: e.target.value})} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => buscar(1)} disabled={cargando}>
              🔍 Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="loading">Cargando registros…</div>
      ) : entradas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>No hay registros para los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 150 }}>Fecha / Hora</th>
                <th>Actor</th>
                <th style={{ width: 110 }}>Rol</th>
                <th>Acción</th>
                <th>Objetivo</th>
                <th style={{ width: 70 }}>Estado</th>
                <th style={{ width: 110 }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {entradas.map((e) => (
                <>
                  <tr
                    key={e.id}
                    style={{ cursor: e.detalles ? "pointer" : "default", opacity: e.exito === false ? 0.7 : 1 }}
                    onClick={() => e.detalles && setExpandido(expandido === e.id ? null : e.id)}
                  >
                    <td style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, whiteSpace: "nowrap" }}>
                      {new Date(e.timestamp).toLocaleString("es-MX")}
                    </td>
                    <td style={{ fontWeight: 500 }}>{e.usuarioNombre || "—"}</td>
                    <td style={{ fontSize: 11, color: "var(--text2)" }}>
                      {ROL_LABEL[e.usuarioRol] || e.usuarioRol || "—"}
                    </td>
                    <td>
                      <span style={{ fontSize: 13 }}>{e.accion || "—"}</span>
                      {e.detalles && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: "var(--text3)", cursor: "pointer" }}>
                          {expandido === e.id ? "▲" : "▼"}
                        </span>
                      )}
                    </td>
                    <td>
                      {e.objetivoNombre ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span>{TIPO_ICON[e.objetivoTipo] || "📌"}</span>
                          <span style={{ fontSize: 13 }}>{e.objetivoNombre}</span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--text3)", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td>
                      <span style={badgeExito(e.exito !== false)}>
                        {e.exito !== false ? "✓ OK" : "✗ Error"}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: "var(--text2)", fontFamily: "monospace" }}>{e.ip || "—"}</td>
                  </tr>
                  {expandido === e.id && e.detalles && (
                    <tr key={`${e.id}-det`} style={{ background: "var(--bg2)" }}>
                      <td colSpan={7} style={{ padding: "8px 16px" }}>
                        <pre style={{
                          margin: 0, fontSize: 11, fontFamily: "monospace",
                          whiteSpace: "pre-wrap", wordBreak: "break-all",
                          color: "var(--text2)", maxHeight: 200, overflowY: "auto",
                        }}>
                          {JSON.stringify(e.detalles, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, alignItems: "center" }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => buscar(page - 1)}>← Anterior</button>
          <span style={{ fontSize: "0.85rem", color: "var(--text2)" }}>Página {page} de {totalPaginas}</span>
          <button className="btn btn-secondary btn-sm" disabled={page === totalPaginas} onClick={() => buscar(page + 1)}>Siguiente →</button>
        </div>
      )}
    </div>
  );
};

export default Auditoria;
