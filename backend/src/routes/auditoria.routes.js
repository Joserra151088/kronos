/**
 * auditoria.routes.js
 * GET /api/auditoria — Solo super_admin y administrador_general pueden ver el log.
 */
const express = require("express");
const router  = express.Router();
const store   = require("../data/store");
const { verificarToken }      = require("../middleware/auth");
const { requireRoles, ROLES } = require("../middleware/roles");

router.use(verificarToken);
router.use(requireRoles(ROLES.ADMINISTRADOR_GENERAL, ROLES.SUPER_ADMIN));

/**
 * GET /api/auditoria
 * Query params: usuarioId, accion, desde (YYYY-MM-DD), hasta (YYYY-MM-DD),
 *               metodo, page, limit
 */
router.get("/", (req, res) => {
  const filtros = {};
  if (req.query.usuarioId) filtros.usuarioId = req.query.usuarioId;
  if (req.query.accion)    filtros.accion    = req.query.accion;
  if (req.query.desde)     filtros.desde     = req.query.desde;
  if (req.query.hasta)     filtros.hasta     = req.query.hasta;
  if (req.query.metodo)    filtros.metodo    = req.query.metodo;
  if (req.query.page)      filtros.page      = req.query.page;
  if (req.query.limit)     filtros.limit     = req.query.limit;
  return res.json(store.getAuditLog(filtros));
});

module.exports = router;
