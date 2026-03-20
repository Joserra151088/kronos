/**
 * calendario.routes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Endpoint que devuelve el estado de cada empleado para una fecha dada:
 * asistió, tiene vacaciones, incapacidad, incidencia activa o está ausente.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { verificarToken } = require("../middleware/auth");
const { requireRoles, ROLES } = require("../middleware/roles");
const { getAllowedSucursalIds } = require("../utils/access-scope");

router.use(verificarToken);

const ROLES_CALENDARIO = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMINISTRADOR_GENERAL,
  ROLES.AGENTE_SOPORTE_TI,
  ROLES.SUPERVISOR_SUCURSALES,
  ROLES.AGENTE_CONTROL_ASISTENCIA,
  ROLES.NOMINAS,
];

/**
 * GET /api/calendario
 * Query params:
 *   fecha       YYYY-MM-DD (requerido si no se usa mesInicio)
 *   sucursalId  UUID (opcional — filtra por sucursal específica)
 *   mesInicio   YYYY-MM-DD (opcional — inicio de rango para vista mensual)
 *   mesFin      YYYY-MM-DD (opcional — fin de rango para vista mensual)
 *   vista       "sucursales" | "corporativo" (default: "sucursales")
 *               Si "corporativo", solo incluye usuarios con tipo=corporativo o sin sucursal
 */
router.get("/", requireRoles(...ROLES_CALENDARIO), (req, res) => {
  const { fecha, sucursalId, mesInicio, mesFin, vista } = req.query;

  if (!fecha && !mesInicio) {
    return res.status(400).json({ error: "Se requiere 'fecha' o 'mesInicio'" });
  }

  const allowedSucursalIds = getAllowedSucursalIds(req.user, store);
  const esCorporativo = vista === "corporativo";

  // Si se pide una sucursal específica, validar acceso (solo aplica en vista sucursales)
  if (sucursalId && !esCorporativo) {
    if (allowedSucursalIds !== null && !allowedSucursalIds.includes(sucursalId)) {
      return res.status(403).json({ error: "No tienes acceso a la sucursal solicitada" });
    }
  }

  // ── Vista de un solo día ──────────────────────────────────────────────────
  if (fecha) {
    const resultado = _buildDayData(fecha, esCorporativo ? null : sucursalId, allowedSucursalIds, esCorporativo);
    return res.json(resultado);
  }

  // ── Vista mensual (rango de fechas) ──────────────────────────────────────
  const inicio = new Date(mesInicio);
  const fin = mesFin ? new Date(mesFin) : new Date(mesInicio.slice(0, 7) + "-31");
  const dias = [];

  for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
    const fechaStr = d.toISOString().split("T")[0];
    dias.push(_buildDayData(fechaStr, esCorporativo ? null : sucursalId, allowedSucursalIds, esCorporativo));
  }

  return res.json({ mesInicio, mesFin: mesFin || null, vista: esCorporativo ? "corporativo" : "sucursales", dias });
});

/**
 * Construye el snapshot de un día para todos los empleados accesibles.
 * @param {string} fecha - YYYY-MM-DD
 * @param {string|null} sucursalId - filtrar por sucursal específica
 * @param {string[]|null} allowedSucursalIds - sucursales accesibles por el usuario (null = todas)
 * @param {boolean} esCorporativo - si true, solo usuarios de tipo corporativo o sin sucursal
 */
function _buildDayData(fecha, sucursalId, allowedSucursalIds, esCorporativo = false) {
  // Obtener todos los usuarios activos en el alcance
  let usuarios = store.getUsuarios({ activo: true });

  if (esCorporativo) {
    // Vista corporativa: empleados sin sucursal asignada o con tipo corporativo
    usuarios = usuarios.filter((u) => !u.sucursalId || u.tipo === "corporativo");
  } else if (sucursalId) {
    usuarios = usuarios.filter((u) => u.sucursalId === sucursalId);
  } else if (allowedSucursalIds !== null) {
    const permitidas = new Set(allowedSucursalIds);
    usuarios = usuarios.filter((u) => u.sucursalId && permitidas.has(u.sucursalId));
  }

  const registrosDelDia = store.getRegistros({ fecha });

  const empleados = usuarios.map((u) => {
    // Registros del día para este usuario
    const regsUsuario = registrosDelDia.filter((r) => r.usuarioId === u.id);
    const tieneRegistroEntrada = regsUsuario.some((r) => r.tipo === "entrada");

    // Incidencias activas que cubren esta fecha
    const incidenciasActivas = store.getIncidenciasActivasParaUsuario(u.id, fecha);
    const puesto = u.puestoId ? store.getPuestoById(u.puestoId) : null;

    let estaVacaciones = false;
    let estaIncapacitado = false;
    let tieneIncidencia = incidenciasActivas.length > 0;
    let estaAusente = false;
    let incidenciaActiva = null;

    if (incidenciasActivas.length > 0) {
      // Tomar la de mayor severidad: vacaciones > incapacidad > falta > cualquier otra
      const prioridad = { vacaciones: 3, incapacidad: 2, falta: 1 };

      const conCategoria = incidenciasActivas
        .map((inc) => {
          const tipo = store.getTipoIncidenciaById(inc.tipoIncidenciaId);
          return { inc, tipo, prio: prioridad[tipo?.categoriaBloqueo] || 0 };
        })
        .sort((a, b) => b.prio - a.prio);

      const principal = conCategoria[0];
      incidenciaActiva = {
        id: principal.inc.id,
        tipo: principal.tipo?.nombre || "Incidencia",
        categoriaBloqueo: principal.tipo?.categoriaBloqueo || null,
        estado: principal.inc.estado,
      };

      const cat = principal.tipo?.categoriaBloqueo;
      estaVacaciones = cat === "vacaciones";
      estaIncapacitado = cat === "incapacidad";
      estaAusente = cat === "falta";
    }

    return {
      usuarioId: u.id,
      nombre: `${u.nombre} ${u.apellido}`,
      fotoUrl: u.fotoUrl || null,
      puestoNombre: puesto?.nombre || null,
      sucursalId: u.sucursalId,
      tieneRegistroEntrada,
      totalRegistros: regsUsuario.length,
      estaVacaciones,
      estaIncapacitado,
      tieneIncidencia,
      estaAusente,
      incidenciaActiva,
    };
  });

  return { fecha, totalEmpleados: empleados.length, empleados };
}

module.exports = router;
