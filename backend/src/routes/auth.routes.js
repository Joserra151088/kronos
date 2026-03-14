/**
 * auth.routes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Rutas de autenticación: login, perfil, recuperación de contraseña.
 * El restablecimiento lo inicia el propio usuario; se le envía un correo
 * con enlace de un solo uso (válido 1 hora).
 * Los supervisores y admin reciben también una notificación interna como testigos.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express   = require("express");
const router    = express.Router();
const { v4: uuidv4 } = require("uuid");
const store     = require("../data/store");
const { generarToken, verificarToken, compararPassword, hashPassword } = require("../middleware/auth");
const { ROLES } = require("../middleware/roles");
const notifService  = require("../services/notificaciones.service");
const emailService  = require("../services/email.service");

// ─── Reset tokens (en memoria, TTL 1 hora) ────────────────────────────────────
// token (UUID) → { userId, expires: Date }
const resetTokens = new Map();

/** Limpia tokens expirados periódicamente (cada 15 min) */
setInterval(() => {
  const ahora = Date.now();
  for (const [token, data] of resetTokens) {
    if (data.expires < ahora) resetTokens.delete(token);
  }
}, 15 * 60 * 1000);

// Roles que reciben notificación interna cuando alguien solicita restablecimiento
const ROLES_RECIBEN_RESET = [
  ROLES.SUPERVISOR_SUCURSALES,
  ROLES.AGENTE_SOPORTE_TI,
  ROLES.SUPER_ADMIN,
];

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Autentica un usuario. Para medico_de_guardia, requiere sucursalIdLogin.
 */
router.post("/login", async (req, res) => {
  const { email, password, sucursalIdLogin } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }

  const usuario = store.getUsuarioByEmail(email);
  if (!usuario) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const passwordValida = await compararPassword(password, usuario.password);
  if (!passwordValida) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  if (!usuario.activo) {
    return res.status(403).json({ error: "Usuario desactivado. Contacta a soporte." });
  }

  // Médico de guardia debe seleccionar sucursal en cada sesión
  if (usuario.rol === ROLES.MEDICO_DE_GUARDIA) {
    if (!sucursalIdLogin) {
      const sucursales = store.getSucursales().filter((s) => s.activa);
      return res.status(200).json({
        requiresBranchSelection: true,
        sucursales,
        mensaje: "Como médico de guardia, debes seleccionar la sucursal en la que te encuentras hoy.",
      });
    }
    const sucursal = store.getSucursalById(sucursalIdLogin);
    if (!sucursal || !sucursal.activa) {
      return res.status(400).json({ error: "Sucursal seleccionada no válida" });
    }
  }

  const token = generarToken(
    usuario,
    usuario.rol === ROLES.MEDICO_DE_GUARDIA ? sucursalIdLogin : null
  );

  const { password: _, ...datosUsuario } = usuario;
  return res.json({ token, usuario: datosUsuario });
});

// ─── Perfil ───────────────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Devuelve el perfil del usuario autenticado.
 */
router.get("/me", verificarToken, (req, res) => {
  const usuario = store.getUsuarioById(req.user.id);
  if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
  const { password: _, ...datosUsuario } = usuario;
  return res.json({ ...datosUsuario, sucursalId: req.user.sucursalId });
});

// ─── Olvidé mi contraseña ─────────────────────────────────────────────────────

/**
 * POST /api/auth/forgot-password
 * Genera un token y envía un correo al usuario con el enlace de restablecimiento.
 * También notifica internamente a supervisores/admins como testigos.
 * No revela si el email existe (seguridad anti-enumeración).
 *
 * Body: { email }
 */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "El email es requerido" });
  }

  const usuario = store.getUsuarioByEmail(email);

  if (usuario && usuario.activo) {
    // Generar token único con TTL de 1 hora
    const token   = uuidv4();
    const expires = Date.now() + 3_600_000; // 1 hora
    resetTokens.set(token, { userId: usuario.id, expires });

    // Enviar correo al usuario
    try {
      await emailService.enviarCorreoReset(
        usuario.email,
        usuario.nombre,
        token
      );
    } catch (err) {
      console.error("[forgot-password] Error al enviar correo:", err.message);
      // No bloqueamos la respuesta; igual notificamos a admins
    }

    // Notificación interna a supervisores/admins como testigos
    const admins = store.getUsuarios({ activo: true })
      .filter((u) => ROLES_RECIBEN_RESET.includes(u.rol));
    admins.forEach((admin) => {
      notifService.crearNotificacion({
        paraUsuarioId: admin.id,
        deUsuarioId:   usuario.id,
        tipo:          "alerta",
        titulo:        "Solicitud de restablecimiento de contraseña",
        mensaje:       `${usuario.nombre} ${usuario.apellido} (${usuario.email}) solicitó restablecer su contraseña. Se envió un enlace a su correo.`,
        referenciaId:  usuario.id,
      });
    });
  }

  // Siempre la misma respuesta independientemente de si el email existe
  return res.json({
    mensaje: "Si el correo está registrado, recibirás un enlace en tu bandeja de entrada.",
  });
});

// ─── Restablecer contraseña ───────────────────────────────────────────────────

/**
 * POST /api/auth/reset-password
 * Valida el token y actualiza la contraseña del usuario.
 *
 * Body: { token, password }
 */
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: "Token y nueva contraseña son requeridos" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  const datos = resetTokens.get(token);

  if (!datos) {
    return res.status(400).json({ error: "El enlace no es válido o ya fue utilizado" });
  }

  if (datos.expires < Date.now()) {
    resetTokens.delete(token);
    return res.status(400).json({ error: "El enlace ha expirado. Solicita uno nuevo." });
  }

  const usuario = store.getUsuarioById(datos.userId);
  if (!usuario || !usuario.activo) {
    resetTokens.delete(token);
    return res.status(400).json({ error: "Usuario no encontrado o inactivo" });
  }

  // Hashear y guardar la nueva contraseña
  const hash = await hashPassword(password);
  store.updateUsuario(usuario.id, { password: hash });

  // Invalidar el token después de un solo uso
  resetTokens.delete(token);

  // Notificar a admins del cambio exitoso
  const admins = store.getUsuarios({ activo: true })
    .filter((u) => ROLES_RECIBEN_RESET.includes(u.rol));
  admins.forEach((admin) => {
    notifService.crearNotificacion({
      paraUsuarioId: admin.id,
      deUsuarioId:   usuario.id,
      tipo:          "info",
      titulo:        "Contraseña restablecida",
      mensaje:       `${usuario.nombre} ${usuario.apellido} restableció su contraseña exitosamente.`,
      referenciaId:  usuario.id,
    });
  });

  return res.json({ mensaje: "Contraseña actualizada correctamente. Ya puedes iniciar sesión." });
});

module.exports = router;
