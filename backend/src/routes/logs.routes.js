/**
 * logs.routes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Rutas de salud y logs de plataforma.
 * Acceso restringido a super_admin y agente_soporte_ti.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express     = require("express");
const router      = express.Router();
const { verificarToken } = require("../middleware/auth");
const { requireRoles, ROLES } = require("../middleware/roles");
const logsService = require("../services/logs.service");
const store       = require("../data/store");

const soloAdmin = [
  verificarToken,
  requireRoles(ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI),
];

/**
 * GET /api/logs/salud
 * Devuelve el estado de salud general de la plataforma.
 */
router.get("/salud", ...soloAdmin, (req, res) => {
  const dbStatus = store.getDatabaseStatus();
  const health   = logsService.getHealth(dbStatus);
  res.json(health);
});

/**
 * GET /api/logs/errores
 * Lista paginada del buffer de errores/advertencias.
 * Query: ?page=1&limit=50&level=error|warn|info
 */
router.get("/errores", ...soloAdmin, (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 50);
  const level = req.query.level || null;
  const result = logsService.getErrors(page, limit, level);
  res.json(result);
});

module.exports = router;
