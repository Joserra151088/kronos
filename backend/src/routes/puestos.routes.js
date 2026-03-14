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

/** POST /api/puestos — Crear puesto (super_admin, agente_soporte_ti) */
router.post("/", requireRoles(ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI), (req, res) => {
  const { nombre, descripcion, horarioId } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });
  if (horarioId && !store.getHorarioById(horarioId))
    return res.status(400).json({ error: "El horario especificado no existe" });
  const nuevo = store.createPuesto({ nombre, descripcion: descripcion || "", horarioId: horarioId || null });
  return res.status(201).json(nuevo);
});

/** PUT /api/puestos/:id — Actualizar puesto (super_admin, agente_soporte_ti) */
router.put("/:id", requireRoles(ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI), (req, res) => {
  const { nombre, descripcion, horarioId, activo } = req.body;
  if (horarioId && !store.getHorarioById(horarioId))
    return res.status(400).json({ error: "El horario especificado no existe" });
  const actualizado = store.updatePuesto(req.params.id, {
    ...(nombre !== undefined && { nombre }),
    ...(descripcion !== undefined && { descripcion }),
    ...(horarioId !== undefined && { horarioId: horarioId || null }),
    ...(activo !== undefined && { activo }),
  });
  if (!actualizado) return res.status(404).json({ error: "Puesto no encontrado" });
  return res.json(actualizado);
});

/** DELETE /api/puestos/:id — Desactivar puesto (super_admin, agente_soporte_ti) */
router.delete("/:id", requireRoles(ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI), (req, res) => {
  const ok = store.deletePuesto(req.params.id);
  if (!ok) return res.status(404).json({ error: "Puesto no encontrado" });
  return res.json({ mensaje: "Puesto desactivado" });
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
