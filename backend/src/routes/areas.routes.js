/**
 * areas.routes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CRUD de áreas organizacionales.
 * Accesible por super_admin, agente_soporte_ti, administrador_general y nominas.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { verificarToken } = require("../middleware/auth");
const { requireRoles, ROLES } = require("../middleware/roles");

router.use(verificarToken);

const ROLES_GESTION = [
  ROLES.SUPER_ADMIN,
  ROLES.AGENTE_SOPORTE_TI,
  ROLES.ADMINISTRADOR_GENERAL,
  ROLES.NOMINAS,
];

/** Cuenta empleados activos en un área (via puestoId o campo area libre) */
function contarEmpleados(areaId, areaNombre) {
  const puestos = store.getPuestos(false);
  const puestosDelArea = new Set(
    puestos.filter((p) => p.areaId === areaId).map((p) => p.id)
  );
  const usuarios = store.getUsuarios({ activo: true });
  return usuarios.filter(
    (u) =>
      (u.puestoId && puestosDelArea.has(u.puestoId)) ||
      (u.area && u.area.toLowerCase() === (areaNombre || "").toLowerCase())
  ).length;
}

// ─── GET /api/areas ───────────────────────────────────────────────────────────
// Todos los usuarios autenticados pueden ver las áreas activas
router.get("/", (req, res) => {
  const areas = store.getAreas(true);
  const resultado = areas.map((a) => ({
    ...a,
    empleadosCount: contarEmpleados(a.id, a.nombre),
  }));
  return res.json(resultado);
});

// ─── GET /api/areas/all ───────────────────────────────────────────────────────
// Admin: devuelve todas las áreas incluyendo inactivas
router.get("/all", requireRoles(...ROLES_GESTION), (req, res) => {
  const areas = store.getAreas(false);
  const resultado = areas.map((a) => ({
    ...a,
    empleadosCount: contarEmpleados(a.id, a.nombre),
  }));
  return res.json(resultado);
});

// ─── POST /api/areas ──────────────────────────────────────────────────────────
router.post("/", requireRoles(...ROLES_GESTION), (req, res) => {
  const { nombre, descripcion } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  // Verificar nombre duplicado
  const existente = store.getAreas(false).find(
    (a) => a.nombre.toLowerCase() === nombre.trim().toLowerCase() && a.activo
  );
  if (existente) {
    return res.status(409).json({ error: "Ya existe un área con ese nombre" });
  }

  const nueva = store.createArea({
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() || "",
  });

  return res.status(201).json(nueva);
});

// ─── PUT /api/areas/:id ───────────────────────────────────────────────────────
router.put("/:id", requireRoles(...ROLES_GESTION), (req, res) => {
  const { id } = req.params;
  const area = store.getAreaById(id);

  if (!area) return res.status(404).json({ error: "Área no encontrada" });

  const { nombre, descripcion, activo } = req.body;

  if (nombre !== undefined && !nombre.trim()) {
    return res.status(400).json({ error: "El nombre no puede estar vacío" });
  }

  // Verificar nombre duplicado (excluyendo el propio)
  if (nombre) {
    const existente = store.getAreas(false).find(
      (a) =>
        a.id !== id &&
        a.nombre.toLowerCase() === nombre.trim().toLowerCase() &&
        a.activo
    );
    if (existente) {
      return res.status(409).json({ error: "Ya existe un área con ese nombre" });
    }
  }

  const cambios = {};
  if (nombre !== undefined) cambios.nombre = nombre.trim();
  if (descripcion !== undefined) cambios.descripcion = descripcion.trim();
  if (activo !== undefined) cambios.activo = Boolean(activo);

  const actualizada = store.updateArea(id, cambios);
  return res.json(actualizada);
});

// ─── DELETE /api/areas/:id ────────────────────────────────────────────────────
router.delete("/:id", requireRoles(...ROLES_GESTION), (req, res) => {
  const { id } = req.params;
  const area = store.getAreaById(id);

  if (!area) return res.status(404).json({ error: "Área no encontrada" });

  // Verificar que no haya empleados activos asignados (via puesto o campo libre)
  const count = contarEmpleados(id, area.nombre);

  if (count > 0) {
    return res.status(409).json({
      error: `No se puede eliminar: ${count} empleado(s) tienen esta área asignada`,
      empleadosCount: count,
    });
  }

  store.deleteArea(id);
  return res.json({ ok: true });
});

module.exports = router;
