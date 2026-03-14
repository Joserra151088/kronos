/**
 * auth.routes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Rutas de autenticación: login y perfil del usuario autenticado.
 * Soporta selección de sucursal para medico_de_guardia en el login.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { generarToken, verificarToken, compararPassword } = require("../middleware/auth");
const { ROLES } = require("../middleware/roles");
const notifService = require("../services/notificaciones.service");

const ROLES_RECIBEN_RESET = [
  ROLES.SUPERVISOR_SUCURSALES,
  ROLES.AGENTE_CONTROL_ASISTENCIA,
  ROLES.AGENTE_SOPORTE_TI,
  ROLES.SUPER_ADMIN,
];

/**
 * POST /api/auth/login
 * Autentica un usuario. Para medico_de_guardia, requiere sucursalIdLogin en el body.
 *
 * Body: { email, password, sucursalIdLogin? }
 * Si el usuario es medico_de_guardia y no envía sucursalIdLogin,
 * responde con { requiresBranchSelection: true } para que el frontend muestre el selector.
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

/**
 * POST /api/auth/forgot-password
 * Crea notificaciones para administradores cuando un usuario solicita restablecer contraseña.
 * No revela si el email existe (seguridad).
 *
 * Body: { email }
 */
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "El email es requerido" });
  }

  // Buscar usuario (no revelar si existe o no)
  const usuario = store.getUsuarioByEmail(email);
  if (usuario && usuario.activo) {
    const admins = store.getUsuarios({ activo: true }).filter((u) => ROLES_RECIBEN_RESET.includes(u.rol));
    admins.forEach((admin) => {
      notifService.crearNotificacion({
        paraUsuarioId: admin.id,
        deUsuarioId: usuario.id,
        tipo: "alerta",
        titulo: "Solicitud de restablecimiento de contraseña",
        mensaje: `El usuario ${usuario.nombre} ${usuario.apellido} (${usuario.email}) ha solicitado restablecer su contraseña.`,
        referenciaId: usuario.id,
      });
    });
  }

  // Siempre responder igual independientemente de si el email existe
  return res.json({
    mensaje: "Se ha enviado una notificación a los administradores del sistema.",
  });
});

/**
 * GET /api/auth/me
 * Devuelve el perfil del usuario autenticado.
 */
router.get("/me", verificarToken, (req, res) => {
  const usuario = store.getUsuarioById(req.user.id);
  if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
  const { password: _, ...datosUsuario } = usuario;
  // Incluir sucursalId de sesión (puede diferir del store para medico_de_guardia)
  return res.json({ ...datosUsuario, sucursalId: req.user.sucursalId });
});

module.exports = router;
