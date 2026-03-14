const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { verificarToken } = require("../middleware/auth");
const { requireRoles, ROLES_NOTIFICACIONES } = require("../middleware/roles");
const notifService = require("../services/notificaciones.service");

router.use(verificarToken);

/** GET /api/notificaciones — Mis notificaciones */
router.get("/", (req, res) => {
  const notifs = store.getNotificaciones({ paraUsuarioId: req.user.id });
  const noLeidas = notifs.filter((n) => !n.leida).length;
  return res.json({ notificaciones: notifs, noLeidas });
});

/** PUT /api/notificaciones/:id/leer — Marcar una como leída */
router.put("/:id/leer", (req, res) => {
  const notif = store.getNotificacionById(req.params.id);
  if (!notif) return res.status(404).json({ error: "Notificación no encontrada" });
  if (notif.paraUsuarioId !== req.user.id) return res.status(403).json({ error: "Sin permiso" });
  const actualizada = store.updateNotificacion(req.params.id, { leida: true });
  return res.json(actualizada);
});

/** PUT /api/notificaciones/leer-todas — Marcar todas como leídas */
router.put("/leer-todas", (req, res) => {
  store.marcarTodasLeidas(req.user.id);
  return res.json({ mensaje: "Todas las notificaciones marcadas como leídas" });
});

/** POST /api/notificaciones/enviar — Enviar notificación a usuario(s) */
router.post("/enviar", requireRoles(...ROLES_NOTIFICACIONES), (req, res) => {
  const { paraUsuarioIds, titulo, mensaje, tipo } = req.body;

  if (!paraUsuarioIds || !Array.isArray(paraUsuarioIds) || paraUsuarioIds.length === 0) {
    return res.status(400).json({ error: "paraUsuarioIds debe ser un arreglo con al menos un ID" });
  }
  if (!titulo || !mensaje) {
    return res.status(400).json({ error: "titulo y mensaje son obligatorios" });
  }

  const enviadas = paraUsuarioIds.map((uid) => {
    const usuario = store.getUsuarioById(uid);
    if (!usuario || !usuario.activo) return null;
    return notifService.crearNotificacion({
      paraUsuarioId: uid,
      deUsuarioId: req.user.id,
      tipo: tipo || "mensaje_general",
      titulo,
      mensaje,
    });
  }).filter(Boolean);

  return res.status(201).json({ enviadas: enviadas.length, notificaciones: enviadas });
});

module.exports = router;
