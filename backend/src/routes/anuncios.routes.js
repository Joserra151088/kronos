/**
 * anuncios.routes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CRUD de anuncios con soporte para imagen, color, categoría y CTA.
 * Super_admin y administrador_general pueden crear/editar/eliminar anuncios.
 * Todos los usuarios autenticados pueden leerlos.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const store   = require("../data/store");
const { verificarToken }      = require("../middleware/auth");
const { requireRoles, ROLES } = require("../middleware/roles");
const { saveFile, deleteFile } = require("../services/storage.service");

router.use(verificarToken);

const ROLES_GESTORES = [ROLES.ADMINISTRADOR_GENERAL, ROLES.SUPER_ADMIN];

// ── Multer: imagen de portada del anuncio ─────────────────────────────────────
const uploadImagen = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const permitidos = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (permitidos.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imágenes JPG, PNG, WebP o GIF"));
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const enrichAnuncio = (a) => {
  const creador = a.creadoPor ? store.getUsuarioById(a.creadoPor) : null;
  return { ...a, creadoPorNombre: creador ? `${creador.nombre} ${creador.apellido}` : null };
};

function parsearDestinatarios(destinatarios) {
  if (!destinatarios) return null;
  let dest = destinatarios;
  if (typeof dest === "string") {
    try { dest = JSON.parse(dest); } catch { return null; }
  }
  if (dest.todos === true) return { todos: true };
  const grupos   = Array.isArray(dest.grupos)   ? dest.grupos   : [];
  const usuarios = Array.isArray(dest.usuarios) ? dest.usuarios : [];
  const areas    = Array.isArray(dest.areas)    ? dest.areas    : [];
  // Si no hay destinatarios específicos, tratar como "todos"
  if (grupos.length === 0 && usuarios.length === 0 && areas.length === 0) return { todos: true };
  return { grupos, usuarios, areas };
}

function calcularExpiracion(fechaExpiracion, diasDuracion) {
  if (fechaExpiracion) return fechaExpiracion;
  if (diasDuracion && !isNaN(parseInt(diasDuracion))) {
    const dias = Math.max(1, Math.min(365, parseInt(diasDuracion)));
    return new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  }
  return null;
}

// ── GET /api/anuncios ─────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  const esGestor = ROLES_GESTORES.includes(req.user?.rol);
  const verTodos = req.query.all === "true" && esGestor;
  const opts = { all: verTodos };
  // Pasar contexto del usuario para filtrado por destinatarios
  if (!verTodos && req.user) {
    opts.usuarioId = req.user.id;
    opts.grupoId   = req.user.grupoId   || null;
    opts.userArea  = req.user.area      || null;
  }
  return res.json(store.getAnuncios(opts).map(enrichAnuncio));
});

// ── GET /api/anuncios/:id ─────────────────────────────────────────────────────
router.get("/:id", (req, res) => {
  const anuncio = store.getAnuncioById(req.params.id);
  if (!anuncio) return res.status(404).json({ error: "Anuncio no encontrado" });
  return res.json(enrichAnuncio(anuncio));
});

// ── POST /api/anuncios — crear con imagen opcional ────────────────────────────
router.post("/", requireRoles(...ROLES_GESTORES), uploadImagen.single("imagen"), async (req, res) => {
  const { titulo, texto, fechaExpiracion, diasDuracion, fechaInicio, destinatarios, color, categoria, ctaLabel, ctaUrl } = req.body;
  if (!titulo || !texto) {
    return res.status(400).json({ error: "titulo y texto son obligatorios" });
  }

  let imageUrl = null;
  if (req.file) {
    try {
      const saved = await saveFile(req.file);
      imageUrl = saved.url;
    } catch (e) {
      return res.status(500).json({ error: "Error al guardar la imagen: " + e.message });
    }
  }

  const nuevo = store.createAnuncio({
    titulo: titulo.trim(),
    texto:  texto.trim(),
    creadoPor: req.user.id,
    ...(imageUrl          ? { imageUrl }                              : {}),
    ...(color             ? { color }                                 : {}),
    ...(categoria         ? { categoria }                             : {}),
    ...(ctaLabel          ? { ctaLabel }                              : {}),
    ...(ctaUrl            ? { ctaUrl }                                : {}),
    ...(fechaInicio       ? { fechaInicio }                           : {}),
    ...(calcularExpiracion(fechaExpiracion, diasDuracion)
          ? { fechaExpiracion: calcularExpiracion(fechaExpiracion, diasDuracion) } : {}),
    ...(parsearDestinatarios(destinatarios)
          ? { destinatarios: parsearDestinatarios(destinatarios) }    : {}),
  });

  return res.status(201).json(enrichAnuncio(nuevo));
});

// ── PUT /api/anuncios/:id — actualizar ────────────────────────────────────────
router.put("/:id", requireRoles(...ROLES_GESTORES), uploadImagen.single("imagen"), async (req, res) => {
  const anuncio = store.getAnuncioById(req.params.id);
  if (!anuncio) return res.status(404).json({ error: "Anuncio no encontrado" });

  const { titulo, texto, fechaExpiracion, diasDuracion, fechaInicio, destinatarios, color, categoria, ctaLabel, ctaUrl, quitarImagen } = req.body;
  const cambios = {};

  if (titulo       !== undefined) cambios.titulo       = titulo.trim();
  if (texto        !== undefined) cambios.texto        = texto.trim();
  if (color        !== undefined) cambios.color        = color || null;
  if (categoria    !== undefined) cambios.categoria    = categoria || null;
  if (ctaLabel     !== undefined) cambios.ctaLabel     = ctaLabel || null;
  if (ctaUrl       !== undefined) cambios.ctaUrl       = ctaUrl || null;
  if (fechaInicio  !== undefined) cambios.fechaInicio  = fechaInicio || null;

  const exp = calcularExpiracion(fechaExpiracion, diasDuracion);
  if (exp) cambios.fechaExpiracion = exp;

  const dest = parsearDestinatarios(destinatarios);
  if (dest) cambios.destinatarios = dest;

  // Nueva imagen
  if (req.file) {
    if (anuncio.imageUrl) {
      try { await deleteFile(anuncio.imageUrl); } catch (_) { /* ignorar */ }
    }
    try {
      const saved = await saveFile(req.file);
      cambios.imageUrl = saved.url;
    } catch (e) {
      return res.status(500).json({ error: "Error al guardar la imagen: " + e.message });
    }
  } else if (quitarImagen === "true" && anuncio.imageUrl) {
    try { await deleteFile(anuncio.imageUrl); } catch (_) { /* ignorar */ }
    cambios.imageUrl = null;
  }

  const actualizado = store.updateAnuncio(req.params.id, cambios);
  return res.json(enrichAnuncio(actualizado));
});

// ── DELETE /api/anuncios/:id — soft-delete ────────────────────────────────────
router.delete("/:id", requireRoles(...ROLES_GESTORES), (req, res) => {
  const ok = store.deleteAnuncio(req.params.id);
  if (!ok) return res.status(404).json({ error: "Anuncio no encontrado" });
  return res.json({ mensaje: "Anuncio eliminado correctamente" });
});

module.exports = router;
