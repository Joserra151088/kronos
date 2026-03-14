const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { verificarToken } = require("../middleware/auth");
const { requireRoles, ROLES } = require("../middleware/roles");
const notifService = require("../services/notificaciones.service");
const { canAccessSucursal } = require("../utils/access-scope");

router.use(verificarToken);

const ROLES_SUPERVISION = [
  ROLES.SUPER_ADMIN,
  ROLES.AGENTE_SOPORTE_TI,
  ROLES.SUPERVISOR_SUCURSALES,
  ROLES.AGENTE_CONTROL_ASISTENCIA,
];

/** GET /api/aclaraciones — Lista aclaraciones (filtrado por rol) */
router.get("/", (req, res) => {
  const filtros = {};

  if (!ROLES_SUPERVISION.includes(req.user.rol)) {
    // Empleados sólo ven las propias
    filtros.usuarioId = req.user.id;
  } else {
    if (req.query.usuarioId) filtros.usuarioId = req.query.usuarioId;
    if (req.query.estado) filtros.estado = req.query.estado;
  }

  const lista = store.getAclaraciones(filtros).map((a) => {
    const usuario = store.getUsuarioById(a.usuarioId);
    const supervisor = a.supervisorId ? store.getUsuarioById(a.supervisorId) : null;
    return {
      ...a,
      usuarioNombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : "N/A",
      supervisorNombre: supervisor ? `${supervisor.nombre} ${supervisor.apellido}` : null,
    };
  });

  return res.json(lista);
});

/** GET /api/aclaraciones/:id — Detalle de una aclaración */
router.get("/:id", (req, res) => {
  const aclaracion = store.getAclaracionById(req.params.id);
  if (!aclaracion) return res.status(404).json({ error: "Aclaración no encontrada" });

  const esPropietario = aclaracion.usuarioId === req.user.id;
  const esSupervisor = ROLES_SUPERVISION.includes(req.user.rol);
  if (!esPropietario && !esSupervisor) {
    return res.status(403).json({ error: "Sin permiso para ver esta aclaración" });
  }

  const usuario = store.getUsuarioById(aclaracion.usuarioId);
  const supervisor = aclaracion.supervisorId ? store.getUsuarioById(aclaracion.supervisorId) : null;
  return res.json({
    ...aclaracion,
    usuarioNombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : "N/A",
    supervisorNombre: supervisor ? `${supervisor.nombre} ${supervisor.apellido}` : null,
  });
});

/** POST /api/aclaraciones — Crear nueva aclaración (cualquier usuario autenticado) */
router.post("/", (req, res) => {
  const { registroId, fechaRegistro, tipoRegistro, motivo } = req.body;

  if (!fechaRegistro) return res.status(400).json({ error: "fechaRegistro es obligatorio" });
  if (!tipoRegistro) return res.status(400).json({ error: "tipoRegistro es obligatorio" });
  if (!motivo) return res.status(400).json({ error: "motivo es obligatorio" });

  const nueva = store.createAclaracion({
    usuarioId: req.user.id,
    registroId: registroId || null,
    fechaRegistro,
    tipoRegistro,
    motivo,
  });

  // Notificar a supervisores de la sucursal del usuario
  const usuario = store.getUsuarioById(req.user.id);
  if (usuario && usuario.sucursalId) {
    const nombreUsuario = `${usuario.nombre} ${usuario.apellido}`;
    notifService.notificarSupervisoresDeSucursal(usuario.sucursalId, req.user.id, {
      tipo: "aclaracion_nueva",
      titulo: "Nueva aclaración de horario",
      mensaje: `${nombreUsuario} ha enviado una aclaración de horario para el ${fechaRegistro}.`,
      referenciaId: nueva.id,
    });
  }

  return res.status(201).json(nueva);
});

/** PUT /api/aclaraciones/:id — Supervisor aprueba o rechaza la aclaración */
router.put(
  "/:id",
  requireRoles(ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI, ROLES.SUPERVISOR_SUCURSALES, ROLES.AGENTE_CONTROL_ASISTENCIA),
  (req, res) => {
    const aclaracion = store.getAclaracionById(req.params.id);
    if (!aclaracion) return res.status(404).json({ error: "Aclaración no encontrada" });

    if (aclaracion.estado !== "pendiente") {
      return res.status(400).json({ error: "Solo se pueden actualizar aclaraciones pendientes" });
    }

    const { estado, comentarioSupervisor } = req.body;
    if (!estado || !["aceptada", "rechazada"].includes(estado)) {
      return res.status(400).json({ error: "estado debe ser 'aceptada' o 'rechazada'" });
    }

    const actualizada = store.updateAclaracion(req.params.id, {
      estado,
      supervisorId: req.user.id,
      comentarioSupervisor: comentarioSupervisor || null,
      revisadoEn: new Date().toISOString(),
    });

    // Notificar al empleado
    const estaAceptada = estado === "aceptada";
    notifService.notificarUsuario(aclaracion.usuarioId, req.user.id, {
      tipo: "aclaracion_resuelta",
      titulo: estaAceptada ? "Aclaración aceptada" : "Aclaración rechazada",
      mensaje: estaAceptada
        ? `Tu aclaración de horario del ${aclaracion.fechaRegistro} ha sido aceptada.${comentarioSupervisor ? " Comentario: " + comentarioSupervisor : ""}`
        : `Tu aclaración de horario del ${aclaracion.fechaRegistro} ha sido rechazada.${comentarioSupervisor ? " Motivo: " + comentarioSupervisor : ""}`,
      referenciaId: aclaracion.id,
    });

    return res.json(actualizada);
  }
);

module.exports = router;
