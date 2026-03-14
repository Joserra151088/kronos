const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { verificarToken } = require("../middleware/auth");
const { requireRoles, ROLES_REPORTES } = require("../middleware/roles");
const { calcularMinutosTrabajados } = require("../utils/minutos");
const { getAllowedSucursalIds, canAccessUsuario } = require("../utils/access-scope");

router.use(verificarToken);
router.use(requireRoles(...ROLES_REPORTES));

const filtrarPorAlcanceSucursal = (items, getSucursalId, allowedSucursalIds) => {
  if (allowedSucursalIds === null) return items;
  const permitidas = new Set(allowedSucursalIds);
  return items.filter((item) => permitidas.has(getSucursalId(item)));
};

/**
 * GET /api/reportes/asistencia
 * Reporte completo de asistencia con todos los filtros disponibles.
 * Query: usuarioId, sucursalId, fechaInicio, fechaFin, rol, grupoId, puestoId, tipo
 */
router.get("/asistencia", (req, res) => {
  const { usuarioId, sucursalId, fechaInicio, fechaFin, rol, grupoId, puestoId, tipo } = req.query;

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ error: "fechaInicio y fechaFin son obligatorios" });
  }

  const filtrosReg = { fechaInicio, fechaFin };
  const allowedSucursalIds = getAllowedSucursalIds(req.user, store);

  if (allowedSucursalIds !== null && sucursalId && !allowedSucursalIds.includes(sucursalId)) {
    return res.status(403).json({ error: "No tienes acceso a la sucursal solicitada" });
  }

  if (allowedSucursalIds !== null && usuarioId) {
    const usuario = store.getUsuarioById(usuarioId);
    if (!canAccessUsuario(req.user, usuario, store)) {
      return res.status(403).json({ error: "No tienes acceso al usuario solicitado" });
    }
  }

  if (usuarioId) filtrosReg.usuarioId = usuarioId;
  if (sucursalId) filtrosReg.sucursalId = sucursalId;
  if (tipo) filtrosReg.tipo = tipo;

  let registros = store.getRegistros(filtrosReg);
  registros = filtrarPorAlcanceSucursal(registros, (registro) => registro.sucursalId, allowedSucursalIds);

  // Filtrar por atributos del usuario si aplica
  if (rol || grupoId || puestoId) {
    const usuariosFiltrados = store.getUsuarios({ ...(rol && { rol }), ...(grupoId && { grupoId }) });
    const idsPermitidos = new Set(
      usuariosFiltrados
        .filter((u) => !puestoId || u.puestoId === puestoId)
        .map((u) => u.id)
    );
    registros = registros.filter((r) => idsPermitidos.has(r.usuarioId));
  }

  // Enriquecer registros
  const enriquecidos = registros.map((r) => {
    const usuario = store.getUsuarioById(r.usuarioId);
    const sucursal = store.getSucursalById(r.sucursalId);
    const puesto = usuario?.puestoId ? store.getPuestoById(usuario.puestoId) : null;
    return {
      ...r,
      usuarioNombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : "N/A",
      usuarioRol: usuario?.rol || "N/A",
      puestoNombre: puesto?.nombre || usuario?.puesto || "N/A",
      sucursalNombre: sucursal?.nombre || "N/A",
    };
  });

  return res.json({ total: enriquecidos.length, registros: enriquecidos });
});

/**
 * GET /api/reportes/minutos
 * Minutos trabajados por usuario en un rango de fechas.
 * Query: usuarioId (requerido), fechaInicio, fechaFin
 */
router.get("/minutos", (req, res) => {
  const { usuarioId, fechaInicio, fechaFin } = req.query;
  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ error: "fechaInicio y fechaFin son obligatorios" });
  }

  const uid = usuarioId || req.user.id;
  const usuarioObjetivo = store.getUsuarioById(uid);
  if (!canAccessUsuario(req.user, usuarioObjetivo, store)) {
    return res.status(403).json({ error: "No tienes acceso al usuario solicitado" });
  }
  const registros = store.getRegistrosByDateRange(uid, fechaInicio, fechaFin);

  // Agrupar por fecha
  const porFecha = {};
  registros.forEach((r) => {
    if (!porFecha[r.fecha]) porFecha[r.fecha] = [];
    porFecha[r.fecha].push(r);
  });

  const resumen = Object.entries(porFecha).map(([fecha, regs]) => ({
    fecha,
    minutos: calcularMinutosTrabajados(regs),
    registros: regs.length,
  }));

  const totalMinutos = resumen.reduce((acc, d) => acc + (d.minutos || 0), 0);

  return res.json({ usuarioId: uid, fechaInicio, fechaFin, totalMinutos, dias: resumen });
});

/**
 * GET /api/reportes/incidencias
 * Reporte de incidencias con filtros.
 * Query: usuarioId, sucursalId, estado, tipoIncidenciaId, fechaInicio, fechaFin
 */
router.get("/incidencias", (req, res) => {
  const { usuarioId, sucursalId, estado, tipoIncidenciaId } = req.query;
  const { fechaInicio, fechaFin } = req.query;
  const allowedSucursalIds = getAllowedSucursalIds(req.user, store);

  if (allowedSucursalIds !== null && sucursalId && !allowedSucursalIds.includes(sucursalId)) {
    return res.status(403).json({ error: "No tienes acceso a la sucursal solicitada" });
  }

  if (allowedSucursalIds !== null && usuarioId) {
    const usuario = store.getUsuarioById(usuarioId);
    if (!canAccessUsuario(req.user, usuario, store)) {
      return res.status(403).json({ error: "No tienes acceso al usuario solicitado" });
    }
  }

  const filtros = {};
  if (usuarioId) filtros.usuarioId = usuarioId;
  if (sucursalId) filtros.sucursalId = sucursalId;
  if (estado) filtros.estado = estado;
  if (tipoIncidenciaId) filtros.tipoIncidenciaId = tipoIncidenciaId;

  let lista = store.getIncidencias(filtros);
  lista = filtrarPorAlcanceSucursal(lista, (incidencia) => incidencia.sucursalId, allowedSucursalIds);

  if (fechaInicio) lista = lista.filter((i) => i.creadoEn.slice(0, 10) >= fechaInicio);
  if (fechaFin) lista = lista.filter((i) => i.creadoEn.slice(0, 10) <= fechaFin);

  const enriquecidas = lista.map((inc) => {
    const usuario = store.getUsuarioById(inc.usuarioId);
    const tipo = store.getTipoIncidenciaById(inc.tipoIncidenciaId);
    const supervisor = inc.supervisorId ? store.getUsuarioById(inc.supervisorId) : null;
    const sucursal = store.getSucursalById(inc.sucursalId);
    return {
      ...inc,
      usuarioNombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : "N/A",
      tipoNombre: tipo?.nombre || "N/A",
      supervisorNombre: supervisor ? `${supervisor.nombre} ${supervisor.apellido}` : null,
      sucursalNombre: sucursal?.nombre || "N/A",
    };
  });

  return res.json({ total: enriquecidas.length, incidencias: enriquecidas });
});

module.exports = router;
