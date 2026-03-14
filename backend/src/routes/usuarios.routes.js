/**
 * usuarios.routes.js - CRUD de usuarios con soporte para 7 roles + foto de perfil.
 */
const express = require("express");
const router = express.Router();
const multer = require("multer");
const store = require("../data/store");
const { verificarToken, hashPassword } = require("../middleware/auth");
const { requireRoles, ROLES } = require("../middleware/roles");
const { saveFile } = require("../services/storage.service");
const { getAllowedSucursalIds, canAccessUsuario } = require("../utils/access-scope");
const notifService = require("../services/notificaciones.service");

// Solo el supervisor y el administrador reciben notificación de cambio de contraseña.
// El empleado realiza el cambio por sí mismo; estas cuentas solo lo visualizan.
const ROLES_RECIBEN_CAMBIO_PASSWORD = [
  "supervisor_sucursales",
  "agente_soporte_ti",
  "super_admin",
];

// Multer en memoria para foto de empleado (máx 5 MB, solo imágenes)
const uploadFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const permitidos = ["image/jpeg", "image/png", "image/webp"];
    if (permitidos.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imágenes JPG, PNG o WebP"));
  },
});

router.use(verificarToken);

/** Roles que pueden VER empleados */
const ROLES_PUEDEN_VER      = [ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI, ROLES.SUPERVISOR_SUCURSALES];
/** Roles que pueden CREAR/EDITAR/ELIMINAR empleados */
const ROLES_PUEDEN_GESTIONAR = [ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI];

router.get("/", requireRoles(...ROLES_PUEDEN_VER), (req, res) => {
  const filtros = {};
  const allowedSucursalIds = getAllowedSucursalIds(req.user, store);
  if (req.query.sucursalId) filtros.sucursalId = req.query.sucursalId;
  if (req.query.rol) filtros.rol = req.query.rol;
  if (req.query.grupoId) filtros.grupoId = req.query.grupoId;
  if (req.query.tipo && ["corporativo", "sucursal"].includes(req.query.tipo)) {
    filtros.tipo = req.query.tipo;
  }
  if (allowedSucursalIds !== null && filtros.sucursalId && !allowedSucursalIds.includes(filtros.sucursalId)) {
    return res.status(403).json({ error: "No tienes acceso a la sucursal solicitada" });
  }

  let lista = store.getUsuarios(filtros);
  if (allowedSucursalIds !== null) {
    const permitidas = new Set(allowedSucursalIds);
    lista = lista.filter((usuario) => usuario.sucursalId && permitidas.has(usuario.sucursalId));
  }

  const enriquecida = lista.map((u) => {
    const puesto = u.puestoId ? store.getPuestoById(u.puestoId) : null;
    const horario = u.horarioId ? store.getHorarioById(u.horarioId) : null;
    return { ...u, puestoNombre: puesto?.nombre || "N/A", horarioNombre: horario?.nombre || "Sin horario" };
  });
  return res.json(enriquecida);
});

router.get("/puestos", (req, res) => res.json(store.getPuestos()));

router.get("/:id", (req, res) => {
  const usuario = store.getUsuarioById(req.params.id);
  if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
  if (!canAccessUsuario(req.user, usuario, store)) {
    return res.status(403).json({ error: "Sin permiso" });
  }
  const { password, ...datos } = usuario;
  const puesto = datos.puestoId ? store.getPuestoById(datos.puestoId) : null;
  return res.json({ ...datos, puestoNombre: puesto?.nombre || "N/A" });
});

router.post("/", requireRoles(ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI), async (req, res) => {
  const { nombre, apellido, email, password, sexo, edad, puestoId, sucursalId, rol, horarioId, grupoId, tipo, departamento, datosExtra } = req.body;
  const tipoEmpleado = tipo || "sucursal";
  const esCorporativo = tipoEmpleado === "corporativo";
  if (!nombre || !email || !password || !sexo || !edad)
    return res.status(400).json({ error: "nombre, email, password, sexo y edad son obligatorios" });
  if (!esCorporativo && !sucursalId)
    return res.status(400).json({ error: "sucursalId es obligatorio para empleados de sucursal" });
  if (req.user.rol === ROLES.AGENTE_SOPORTE_TI && rol && rol !== ROLES.MEDICO_TITULAR)
    return res.status(403).json({ error: "Solo puedes registrar médicos titulares" });
  if (store.getUsuarioByEmail(email)) return res.status(409).json({ error: "El email ya está registrado" });
  if (!esCorporativo && sucursalId && !store.getSucursalById(sucursalId))
    return res.status(400).json({ error: "La sucursal especificada no existe" });
  if (puestoId && !store.getPuestoById(puestoId)) return res.status(400).json({ error: "El puesto no existe" });
  const hashedPassword = await hashPassword(password);
  const nuevo = store.createUsuario({
    nombre, apellido: apellido || "", email, password: hashedPassword, sexo,
    edad: parseInt(edad, 10), puestoId: puestoId || null,
    sucursalId: esCorporativo ? null : (sucursalId || null),
    rol: rol || "medico_titular", horarioId: horarioId || null, grupoId: grupoId || null,
    tipo: tipoEmpleado,
    ...(departamento !== undefined && { departamento }),
    ...(datosExtra !== undefined && { datosExtra }),
  });
  return res.status(201).json(nuevo);
});

router.put("/:id", async (req, res) => {
  const puedeGestionar = ROLES_PUEDEN_GESTIONAR.includes(req.user.rol); // super_admin | agente_soporte_ti
  const esPropioUsuario = req.user.id === req.params.id;
  if (!puedeGestionar && !esPropioUsuario) return res.status(403).json({ error: "Sin permiso" });
  let camposPermitidos = {};
  if (puedeGestionar) {
    const { nombre, apellido, email, sexo, edad, puestoId, sucursalId, rol, horarioId, grupoId, activo, tipo, departamento, datosExtra } = req.body;
    if (email !== undefined) {
      const existing = store.getUsuarioByEmail(email);
      if (existing && existing.id !== req.params.id) {
        return res.status(409).json({ error: "El email ya esta en uso" });
      }
    }
    camposPermitidos = {
      ...(nombre !== undefined && { nombre }), ...(apellido !== undefined && { apellido }),
      ...(email !== undefined && { email }),
      ...(sexo !== undefined && { sexo }), ...(edad !== undefined && { edad: parseInt(edad, 10) }),
      ...(puestoId !== undefined && { puestoId }), ...(sucursalId !== undefined && { sucursalId }),
      ...(horarioId !== undefined && { horarioId }), ...(grupoId !== undefined && { grupoId }),
      ...(activo !== undefined && req.user.rol === ROLES.SUPER_ADMIN && { activo }),
      ...(tipo !== undefined && { tipo }),
      ...(departamento !== undefined && { departamento }),
      ...(datosExtra !== undefined && { datosExtra }),
    };
    if (rol !== undefined && req.user.rol === ROLES.SUPER_ADMIN) camposPermitidos.rol = rol;
  }
  // Permitir al propio usuario actualizar sus datos de perfil
  if (esPropioUsuario && !puedeGestionar) {
    const { nombre, apellido, telefono } = req.body;
    if (nombre     !== undefined) camposPermitidos.nombre     = nombre;
    if (apellido   !== undefined) camposPermitidos.apellido   = apellido;
    if (telefono   !== undefined) camposPermitidos.telefono   = telefono;
    // email update: check uniqueness
    if (req.body.email !== undefined) {
      const existing = store.getUsuarioByEmail(req.body.email);
      if (existing && existing.id !== req.params.id)
        return res.status(409).json({ error: "El email ya está en uso" });
      camposPermitidos.email = req.body.email;
    }
  }
  const cambioPassword = !!req.body.password;
  if (cambioPassword) camposPermitidos.password = await hashPassword(req.body.password);
  if (Object.keys(camposPermitidos).length === 0) return res.status(400).json({ error: "No hay campos para actualizar" });
  const actualizado = store.updateUsuario(req.params.id, camposPermitidos);
  if (!actualizado) return res.status(404).json({ error: "Usuario no encontrado" });

  // Notificar a supervisores/admins cuando cambia la contraseña de un usuario
  if (cambioPassword) {
    const usuarioActualizado = store.getUsuarioById(req.params.id);
    const admins = store.getUsuarios({ activo: true }).filter((u) => ROLES_RECIBEN_CAMBIO_PASSWORD.includes(u.rol));
    admins.forEach((admin) => {
      if (admin.id !== req.params.id) {
        notifService.crearNotificacion({
          paraUsuarioId: admin.id,
          deUsuarioId: req.user.id,
          tipo: "alerta",
          titulo: "Cambio de contraseña",
          mensaje: `El usuario ${usuarioActualizado?.nombre || ""} ${usuarioActualizado?.apellido || ""} (${usuarioActualizado?.email || ""}) cambió su contraseña.`,
          referenciaId: req.params.id,
        });
      }
    });
  }

  return res.json(actualizado);
});

router.delete("/:id", requireRoles(ROLES.SUPER_ADMIN), (req, res) => {
  const ok = store.deleteUsuario(req.params.id);
  if (!ok) return res.status(404).json({ error: "Usuario no encontrado" });
  return res.json({ mensaje: "Usuario desactivado correctamente" });
});

/**
 * PUT /api/usuarios/:id/foto
 * Sube o reemplaza la foto de perfil de un empleado.
 * Solo el propio usuario o un gestor puede cambiarla.
 */
router.put("/:id/foto", uploadFoto.single("foto"), async (req, res) => {
  try {
    const puedeGestionar = ROLES_PUEDEN_VER.includes(req.user.rol);
    const esPropioUsuario = req.user.id === req.params.id;
    if (!puedeGestionar && !esPropioUsuario)
      return res.status(403).json({ error: "Sin permiso" });
    if (!req.file)
      return res.status(400).json({ error: "No se recibió ninguna imagen" });

    const guardado = await saveFile(req.file);
    const actualizado = store.updateUsuario(req.params.id, { fotoUrl: guardado.url });
    if (!actualizado) return res.status(404).json({ error: "Usuario no encontrado" });
    return res.json({ fotoUrl: guardado.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
