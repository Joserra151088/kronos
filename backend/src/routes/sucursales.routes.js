const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { verificarToken } = require("../middleware/auth");
const { requireRoles, ROLES } = require("../middleware/roles");

router.use(verificarToken);

router.get("/", (req, res) => res.json(store.getSucursales()));

router.get("/:id", (req, res) => {
  const s = store.getSucursalById(req.params.id);
  if (!s) return res.status(404).json({ error: "Sucursal no encontrada" });
  return res.json(s);
});

router.post("/", requireRoles(ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI), (req, res) => {
  const { nombre, direccion, ciudad, estado, geocerca } = req.body;
  if (!nombre || !geocerca?.latitud || !geocerca?.longitud || !geocerca?.radio)
    return res.status(400).json({ error: "Nombre y geocerca (latitud, longitud, radio) son obligatorios" });
  const nueva = store.createSucursal({
    nombre, direccion: direccion || "", ciudad: ciudad || "", estado: estado || "", activa: true,
    geocerca: { latitud: parseFloat(geocerca.latitud), longitud: parseFloat(geocerca.longitud), radio: parseInt(geocerca.radio, 10) },
  });
  return res.status(201).json(nueva);
});

router.put("/:id", requireRoles(ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI), (req, res) => {
  const { nombre, direccion, ciudad, estado, activa, geocerca } = req.body;
  const actualizada = store.updateSucursal(req.params.id, {
    ...(nombre !== undefined && { nombre }), ...(direccion !== undefined && { direccion }),
    ...(ciudad !== undefined && { ciudad }), ...(estado !== undefined && { estado }),
    ...(activa !== undefined && { activa }),
    ...(geocerca && { geocerca: { latitud: parseFloat(geocerca.latitud), longitud: parseFloat(geocerca.longitud), radio: parseInt(geocerca.radio, 10) } }),
  });
  if (!actualizada) return res.status(404).json({ error: "Sucursal no encontrada" });
  return res.json(actualizada);
});

router.delete("/:id", requireRoles(ROLES.SUPER_ADMIN), (req, res) => {
  const ok = store.deleteSucursal(req.params.id);
  if (!ok) return res.status(404).json({ error: "Sucursal no encontrada" });
  return res.json({ mensaje: "Sucursal desactivada correctamente" });
});

module.exports = router;
