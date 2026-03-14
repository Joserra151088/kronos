/**
 * logs.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Servicio de registros de plataforma.
 * Mantiene un buffer circular de errores y métricas de salud en memoria.
 * Visible solo para super_admin y agente_soporte_ti.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MAX_ERRORS = 200;
const startTime  = Date.now();

/** @type {Array<{id,timestamp,level,message,location,stack}>} */
const errorBuffer = [];
let requestCount  = 0;
let errorCount    = 0;

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Registra un error en el buffer circular.
 * @param {string}      message   - Descripción del error
 * @param {string|null} location  - Módulo / ruta / función donde ocurrió
 * @param {string|null} stack     - Stack trace opcional
 * @param {"error"|"warn"|"info"} level
 */
const logError = (message, location = null, stack = null, level = "error") => {
  errorCount++;
  const entry = {
    id:        `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    level,
    message:   String(message),
    location:  location || null,
    stack:     stack    || null,
  };
  errorBuffer.unshift(entry);          // más reciente primero
  if (errorBuffer.length > MAX_ERRORS) errorBuffer.pop();
  return entry;
};

/** Incrementa el contador de peticiones HTTP */
const incrementRequests = () => { requestCount++; };

/**
 * Devuelve el objeto de salud de la plataforma.
 * @param {object} databaseStatus - Resultado de store.getDatabaseStatus()
 */
const getHealth = (databaseStatus) => {
  const uptimeMs      = Date.now() - startTime;
  const since1h       = Date.now() - 3_600_000;
  const recentErrors  = errorBuffer.filter(
    (e) => e.level === "error" && new Date(e.timestamp).getTime() > since1h
  );

  let status = "healthy";
  if (recentErrors.length > 5)  status = "degraded";
  if (recentErrors.length > 20) status = "critical";
  if (databaseStatus.enabled && !databaseStatus.connected) status = "degraded";

  return {
    status,
    uptime:          uptimeMs,
    uptimeFormatted: formatUptime(uptimeMs),
    startedAt:       new Date(startTime).toISOString(),
    requestsTotal:   requestCount,
    errorsTotal:     errorCount,
    errorsLastHour:  recentErrors.length,
    database:        databaseStatus,
    nodeVersion:     process.version,
    memoryMB:        Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    totalMemoryMB:   Math.round(process.memoryUsage().rss / 1024 / 1024),
    timestamp:       new Date().toISOString(),
  };
};

/**
 * Devuelve la lista paginada de entradas del buffer.
 * @param {number}             page
 * @param {number}             limit
 * @param {"error"|"warn"|"info"|null} level - Filtro opcional
 */
const getErrors = (page = 1, limit = 50, level = null) => {
  const items  = level ? errorBuffer.filter((e) => e.level === level) : [...errorBuffer];
  const total  = items.length;
  const offset = (page - 1) * limit;
  return { items: items.slice(offset, offset + limit), total, page, limit };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

module.exports = { logError, incrementRequests, getHealth, getErrors };
