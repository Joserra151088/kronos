const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { verificarToken } = require("../middleware/auth");
const { requireRoles, ROLES, ROLES_GESTION } = require("../middleware/roles");

router.use(verificarToken);

/** GET /api/horarios — Lista horarios activos */
router.get("/", requireRoles(...ROLES_GESTION), (req, res) => {
  return res.json(store.getHorarios());
});

/** POST /api/horarios — Crear horario (super_admin, agente_soporte_ti) */
router.post("/", requireRoles(ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI, ROLES.NOMINAS), (req, res) => {
  const { nombre, horaEntrada, horaSalida, horaSalidaAlimentos, horaRegresoAlimentos, diasLaborales, toleranciaMinutos } = req.body;
  if (!nombre || !horaEntrada || !horaSalida || !diasLaborales) {
    return res.status(400).json({ error: "nombre, horaEntrada, horaSalida y diasLaborales son obligatorios" });
  }
  const nuevo = store.createHorario({
    nombre,
    horaEntrada,
    horaSalida,
    horaSalidaAlimentos: horaSalidaAlimentos || null,
    horaRegresoAlimentos: horaRegresoAlimentos || null,
    diasLaborales: Array.isArray(diasLaborales) ? diasLaborales : [diasLaborales],
    toleranciaMinutos: parseInt(toleranciaMinutos || 0, 10),
  });
  return res.status(201).json(nuevo);
});

/** PUT /api/horarios/:id — Actualizar horario (super_admin, agente_soporte_ti) */
router.put("/:id", requireRoles(ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI, ROLES.NOMINAS), (req, res) => {
  const { nombre, horaEntrada, horaSalida, horaSalidaAlimentos, horaRegresoAlimentos, diasLaborales, toleranciaMinutos, activo } = req.body;
  const actualizado = store.updateHorario(req.params.id, {
    ...(nombre !== undefined && { nombre }),
    ...(horaEntrada !== undefined && { horaEntrada }),
    ...(horaSalida !== undefined && { horaSalida }),
    ...(horaSalidaAlimentos !== undefined && { horaSalidaAlimentos }),
    ...(horaRegresoAlimentos !== undefined && { horaRegresoAlimentos }),
    ...(diasLaborales !== undefined && { diasLaborales }),
    ...(toleranciaMinutos !== undefined && { toleranciaMinutos: parseInt(toleranciaMinutos, 10) }),
    ...(activo !== undefined && { activo }),
  });
  if (!actualizado) return res.status(404).json({ error: "Horario no encontrado" });
  return res.json(actualizado);
});

/** DELETE /api/horarios/:id — Desactivar horario (super_admin, agente_soporte_ti) */
router.delete("/:id", requireRoles(ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI, ROLES.NOMINAS), (req, res) => {
  // Validar que no haya usuarios con este horario asignado
  const usuariosConHorario = store.getUsuarios({ horarioId: req.params.id, activo: true });
  if (usuariosConHorario.length > 0) {
    return res.status(409).json({
      error: `No se puede eliminar: ${usuariosConHorario.length} empleado(s) tienen este horario asignado.`,
    });
  }
  // Validar que no haya puestos con este horario asignado
  const puestosConHorario = store.getPuestos().filter((p) => p.horarioId === req.params.id);
  if (puestosConHorario.length > 0) {
    return res.status(409).json({
      error: `No se puede eliminar: ${puestosConHorario.length} puesto(s) tienen este horario asignado.`,
    });
  }
  const ok = store.deleteHorario(req.params.id);
  if (!ok) return res.status(404).json({ error: "Horario no encontrado" });
  return res.json({ mensaje: "Horario desactivado" });
});

/** PUT /api/horarios/asignar/:usuarioId — Asignar horario a usuario */
router.put("/asignar/:usuarioId", requireRoles(ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI, ROLES.NOMINAS), (req, res) => {
  const { horarioId } = req.body;
  const usuario = store.getUsuarioById(req.params.usuarioId);
  if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
  if (horarioId && !store.getHorarioById(horarioId)) {
    return res.status(400).json({ error: "Horario no encontrado" });
  }
  const actualizado = store.updateUsuario(req.params.usuarioId, { horarioId: horarioId || null });
  return res.json(actualizado);
});

module.exports = router;
