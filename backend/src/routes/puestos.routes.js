const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { verificarToken } = require("../middleware/auth");
const { requireRoles, ROLES } = require("../middleware/roles");

router.use(verificarToken);

/** GET /api/puestos — Todos los puestos activos */
router.get("/", (req, res) => {
  return res.json(store.getPuestos());
});

const ROLES_ADMIN = [ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI, ROLES.ADMINISTRADOR_GENERAL];

/** POST /api/puestos — Crear puesto */
router.post("/", requireRoles(...ROLES_ADMIN), (req, res) => {
  const { nombre, descripcion, horarioId, areaId } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });
  if (horarioId && !store.getHorarioById(horarioId))
    return res.status(400).json({ error: "El horario especificado no existe" });
  if (areaId && !store.getAreaById(areaId))
    return res.status(400).json({ error: "El área especificada no existe" });
  const nuevo = store.createPuesto({
    nombre,
    descripcion: descripcion || "",
    horarioId: horarioId || null,
    areaId: areaId || null,
  });
  return res.status(201).json(nuevo);
});

/** PUT /api/puestos/:id — Actualizar puesto */
router.put("/:id", requireRoles(...ROLES_ADMIN), (req, res) => {
  const { nombre, descripcion, horarioId, areaId, activo } = req.body;
  if (horarioId && !store.getHorarioById(horarioId))
    return res.status(400).json({ error: "El horario especificado no existe" });
  if (areaId && !store.getAreaById(areaId))
    return res.status(400).json({ error: "El área especificada no existe" });
  const actualizado = store.updatePuesto(req.params.id, {
    ...(nombre !== undefined && { nombre }),
    ...(descripcion !== undefined && { descripcion }),
    ...(horarioId !== undefined && { horarioId: horarioId || null }),
    ...(areaId !== undefined && { areaId: areaId || null }),
    ...(activo !== undefined && { activo }),
  });
  if (!actualizado) return res.status(404).json({ error: "Puesto no encontrado" });
  return res.json(actualizado);
});

/** DELETE /api/puestos/:id — Eliminar puesto (solo si no tiene empleados activos) */
router.delete("/:id", requireRoles(...ROLES_ADMIN), (req, res) => {
  const puesto = store.getPuestoById(req.params.id);
  if (!puesto) return res.status(404).json({ error: "Puesto no encontrado" });

  // Verificar si hay empleados activos con este puesto
  const empleados = store.getUsuarios({ activo: true }).filter((u) => u.puestoId === req.params.id);
  if (empleados.length > 0) {
    return res.status(409).json({
      error: `No se puede eliminar: ${empleados.length} empleado(s) tienen este puesto asignado`,
      empleadosCount: empleados.length,
    });
  }

  const ok = store.deletePuesto(req.params.id);
  if (!ok) return res.status(404).json({ error: "Puesto no encontrado" });
  return res.json({ ok: true, mensaje: "Puesto eliminado" });
});

/**
 * PUT /api/puestos/:id/campos
 * Reemplaza la lista de campos personalizados del puesto.
 * Cada campo tiene: { id, nombre, tipo: 'text'|'number'|'fecha'|'select', opciones: [], obligatorio: bool }
 */
router.put("/:id/campos", requireRoles(ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI), (req, res) => {
  const { campos } = req.body;
  if (!Array.isArray(campos)) return res.status(400).json({ error: "campos debe ser un array" });

  // Validate each field
  for (const c of campos) {
    if (!c.nombre || !c.tipo) return res.status(400).json({ error: "Cada campo requiere nombre y tipo" });
    if (!["text","number","fecha","select"].includes(c.tipo))
      return res.status(400).json({ error: `Tipo inválido: ${c.tipo}` });
    if (c.tipo === "select" && (!Array.isArray(c.opciones) || c.opciones.length === 0))
      return res.status(400).json({ error: `El campo '${c.nombre}' de tipo select requiere opciones` });
  }

  // Assign IDs to new fields (those without id)
  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
  const camposConId = campos.map(c => ({ ...c, id: c.id || genId() }));

  const actualizado = store.updatePuesto(req.params.id, { camposExtra: camposConId });
  if (!actualizado) return res.status(404).json({ error: "Puesto no encontrado" });
  return res.json(actualizado);
});

module.exports = router;
