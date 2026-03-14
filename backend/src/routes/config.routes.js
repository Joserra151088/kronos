/**
 * config.routes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Configuración dinámica del sistema: módulos accesibles por rol.
 * Solo el super_admin puede leer y modificar.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const express = require("express");
const router  = express.Router();
const store   = require("../data/store");
const { verificarToken }       = require("../middleware/auth");
const { requireRoles, ROLES }  = require("../middleware/roles");

router.use(verificarToken);

/**
 * GET /api/config/roles
 * Devuelve la lista de módulos del sistema y la configuración actual
 * (qué módulos puede ver cada rol).
 */
router.get("/roles", requireRoles(ROLES.SUPER_ADMIN), (req, res) => {
  return res.json({
    modulos: store.MODULOS_SISTEMA,
    config:  store.getConfiguracionRoles(),
  });
});

/**
 * GET /api/config/modulos
 * Devuelve los módulos permitidos para el usuario autenticado.
 */
router.get("/modulos", (req, res) => {
  return res.json({
    rol: req.user.rol,
    modulos: store.getModulosDeRol(req.user.rol),
  });
});

/**
 * PUT /api/config/roles/:rol
 * Reemplaza la lista de módulos accesibles para el rol indicado.
 * Body: { modulos: string[] }
 */
router.put("/roles/:rol", requireRoles(ROLES.SUPER_ADMIN), (req, res) => {
  const { modulos } = req.body;
  if (!Array.isArray(modulos))
    return res.status(400).json({ error: "modulos debe ser un array de strings" });

  const ok = store.updateModulosDeRol(req.params.rol, modulos);
  if (!ok)
    return res.status(404).json({ error: `Rol '${req.params.rol}' no reconocido` });

  return res.json({ mensaje: "Configuración actualizada", rol: req.params.rol, modulos });
});

const multer  = require("multer");
const { saveFile } = require("../services/storage.service");
const uploadLogo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (["image/jpeg","image/png","image/webp","image/svg+xml"].includes(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imágenes para el logo"));
  },
});

/**
 * GET /api/config/empresa
 * Cualquier usuario autenticado puede leer los datos de la empresa (para login y nav).
 */
router.get("/empresa", (req, res) => {
  return res.json(store.getEmpresaConfig());
});

/**
 * PUT /api/config/empresa
 * Solo super_admin puede actualizar los datos de la empresa.
 */
router.put("/empresa", requireRoles(ROLES.SUPER_ADMIN), (req, res) => {
  const { nombre, razonSocial, rfc, domicilio, telefono, email } = req.body;
  const actualizado = store.updateEmpresaConfig({
    ...(nombre      !== undefined && { nombre }),
    ...(razonSocial !== undefined && { razonSocial }),
    ...(rfc         !== undefined && { rfc }),
    ...(domicilio   !== undefined && { domicilio }),
    ...(telefono    !== undefined && { telefono }),
    ...(email       !== undefined && { email }),
  });
  return res.json(actualizado);
});

/**
 * PUT /api/config/empresa/logo
 * Sube el logo de la empresa (solo super_admin).
 */
router.put("/empresa/logo", requireRoles(ROLES.SUPER_ADMIN), uploadLogo.single("logo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibió ninguna imagen" });
    const guardado = await saveFile(req.file);
    const actualizado = store.updateEmpresaConfig({ logoUrl: guardado.url });
    return res.json({ logoUrl: guardado.url, empresa: actualizado });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
