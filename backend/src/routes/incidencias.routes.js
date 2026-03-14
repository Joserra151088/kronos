const express = require("express");
const router = express.Router();
const multer = require("multer");
const store = require("../data/store");
const { verificarToken } = require("../middleware/auth");
const { requireRoles, ROLES, TODOS_LOS_ROLES } = require("../middleware/roles");
const { saveFile } = require("../services/storage.service");
const notifService = require("../services/notificaciones.service");
const { getAllowedSucursalIds, canAccessSucursal } = require("../utils/access-scope");

// Multer en memoria (listo para S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const permitidos = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (permitidos.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imágenes (JPG, PNG, WebP) y PDF"));
  },
});

router.use(verificarToken);

const puedeGestionarIncidencia = (user, incidencia) => {
  if (!incidencia) return false;
  if ([ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI].includes(user.rol)) return true;
  if (incidencia.usuarioId === user.id) return true;
  return !!incidencia.sucursalId && canAccessSucursal(user, incidencia.sucursalId, store);
};

// ─── Tipos de Incidencia ──────────────────────────────────────────────────────

/** GET /api/incidencias/tipos — Todos los tipos activos */
router.get("/tipos", (req, res) => {
  return res.json(store.getTiposIncidencia());
});

/** POST /api/incidencias/tipos — Crear tipo (super_admin) */
router.post("/tipos", requireRoles(ROLES.SUPER_ADMIN), (req, res) => {
  const { nombre, descripcion, requiereArchivo } = req.body;
  if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });
  const nuevo = store.createTipoIncidencia({
    nombre,
    descripcion: descripcion || "",
    requiereArchivo: !!requiereArchivo,
  });
  return res.status(201).json(nuevo);
});

/** PUT /api/incidencias/tipos/:id — Actualizar tipo */
router.put("/tipos/:id", requireRoles(ROLES.SUPER_ADMIN), (req, res) => {
  const { nombre, descripcion, requiereArchivo, activo } = req.body;
  const actualizado = store.updateTipoIncidencia(req.params.id, {
    ...(nombre !== undefined && { nombre }),
    ...(descripcion !== undefined && { descripcion }),
    ...(requiereArchivo !== undefined && { requiereArchivo: !!requiereArchivo }),
    ...(activo !== undefined && { activo }),
  });
  if (!actualizado) return res.status(404).json({ error: "Tipo no encontrado" });
  return res.json(actualizado);
});

/** DELETE /api/incidencias/tipos/:id — Desactivar tipo */
router.delete("/tipos/:id", requireRoles(ROLES.SUPER_ADMIN), (req, res) => {
  const ok = store.deleteTipoIncidencia(req.params.id);
  if (!ok) return res.status(404).json({ error: "Tipo no encontrado" });
  return res.json({ mensaje: "Tipo desactivado" });
});

// ─── Incidencias ──────────────────────────────────────────────────────────────

/** GET /api/incidencias — Lista todas (admin/supervisor) o las propias */
router.get("/", (req, res) => {
  const rolesGestion = [ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI, ROLES.SUPERVISOR_SUCURSALES, ROLES.AGENTE_CONTROL_ASISTENCIA];
  const filtros = {};
  const allowedSucursalIds = getAllowedSucursalIds(req.user, store);

  if (!rolesGestion.includes(req.user.rol)) {
    filtros.usuarioId = req.user.id;
  } else {
    if (req.query.usuarioId) filtros.usuarioId = req.query.usuarioId;
    if (req.query.sucursalId) {
      if (allowedSucursalIds !== null && !allowedSucursalIds.includes(req.query.sucursalId)) {
        return res.status(403).json({ error: "No tienes acceso a la sucursal solicitada" });
      }
      filtros.sucursalId = req.query.sucursalId;
    }
    if (req.query.estado) filtros.estado = req.query.estado;
    if (req.query.tipoIncidenciaId) filtros.tipoIncidenciaId = req.query.tipoIncidenciaId;
    // Supervisor: ve incidencias de TODAS las sucursales en sus grupos
    if (req.user.rol === ROLES.SUPERVISOR_SUCURSALES) {
      filtros.sucursalIds = allowedSucursalIds?.length ? allowedSucursalIds : ["__ninguna__"];
    }
  }

  const lista = store.getIncidencias(filtros).map((inc) => {
    const usuario = store.getUsuarioById(inc.usuarioId);
    const tipo = store.getTipoIncidenciaById(inc.tipoIncidenciaId);
    const supervisor = inc.supervisorId ? store.getUsuarioById(inc.supervisorId) : null;
    return {
      ...inc,
      usuarioNombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : "N/A",
      tipoNombre: tipo ? tipo.nombre : "N/A",
      supervisorNombre: supervisor ? `${supervisor.nombre} ${supervisor.apellido}` : null,
    };
  });

  return res.json(lista);
});

/** GET /api/incidencias/:id — Detalle de una incidencia */
router.get("/:id", (req, res) => {
  const inc = store.getIncidenciaById(req.params.id);
  if (!inc) return res.status(404).json({ error: "Incidencia no encontrada" });

  if (!puedeGestionarIncidencia(req.user, inc)) {
    return res.status(403).json({ error: "Sin permiso" });
  }

  const tipo = store.getTipoIncidenciaById(inc.tipoIncidenciaId);
  return res.json({ ...inc, tipoNombre: tipo ? tipo.nombre : "N/A" });
});

/**
 * POST /api/incidencias — Crear incidencia (todos los usuarios autenticados)
 * Acepta multipart/form-data con campo "archivo" opcional.
 * Las incidencias NO validan geocerca.
 */
router.post("/", upload.single("archivo"), async (req, res) => {
  try {
    const { tipoIncidenciaId, descripcion } = req.body;
    if (!tipoIncidenciaId) return res.status(400).json({ error: "tipoIncidenciaId es obligatorio" });

    const tipo = store.getTipoIncidenciaById(tipoIncidenciaId);
    if (!tipo) return res.status(400).json({ error: "Tipo de incidencia no encontrado" });

    if (tipo.requiereArchivo && !req.file) {
      return res.status(400).json({ error: "Este tipo de incidencia requiere adjuntar un archivo" });
    }

    let archivoUrl = null, archivoNombre = null, archivoMime = null;
    if (req.file) {
      const guardado = await saveFile(req.file);
      archivoUrl = guardado.url;
      archivoNombre = guardado.nombre;
      archivoMime = guardado.mime;
    }

    // Usar sucursalId del token (cubre medico_de_guardia con sucursal de sesión)
    const sucursalId = req.user.sucursalId;

    const nueva = store.createIncidencia({
      usuarioId: req.user.id,
      sucursalId,
      tipoIncidenciaId,
      descripcion: descripcion || "",
      archivoUrl,
      archivoNombre,
      archivoMime,
    });

    // Notificar a supervisores de la sucursal
    if (sucursalId) {
      const usuario = store.getUsuarioById(req.user.id);
      const nombreUsuario = usuario ? `${usuario.nombre} ${usuario.apellido}` : "Un empleado";
      notifService.notificarSupervisoresDeSucursal(sucursalId, req.user.id, {
        tipo: "incidencia_nueva",
        titulo: "Nueva incidencia por aprobar",
        mensaje: `${nombreUsuario} ha registrado una incidencia: ${tipo.nombre}`,
        referenciaId: nueva.id,
      });
    }

    return res.status(201).json(nueva);
  } catch (err) {
    console.error("Error al crear incidencia:", err);
    return res.status(500).json({ error: err.message || "Error al crear la incidencia" });
  }
});

/** PUT /api/incidencias/:id/aprobar — Aprobar incidencia (supervisor_sucursales) */
router.put("/:id/aprobar", requireRoles(ROLES.SUPERVISOR_SUCURSALES, ROLES.SUPER_ADMIN), (req, res) => {
  const inc = store.getIncidenciaById(req.params.id);
  if (!inc) return res.status(404).json({ error: "Incidencia no encontrada" });
  if (!puedeGestionarIncidencia(req.user, inc)) {
    return res.status(403).json({ error: "No tienes acceso a esta incidencia" });
  }
  if (inc.estado !== "pendiente") return res.status(400).json({ error: "Solo se pueden aprobar incidencias pendientes" });

  const actualizada = store.updateIncidencia(req.params.id, {
    estado: "aprobada",
    supervisorId: req.user.id,
    comentarioSupervisor: req.body.comentario || null,
    revisadoEn: new Date().toISOString(),
  });

  // Notificar al empleado
  notifService.notificarUsuario(inc.usuarioId, req.user.id, {
    tipo: "incidencia_resuelta",
    titulo: "Incidencia aprobada",
    mensaje: `Tu incidencia ha sido aprobada.${req.body.comentario ? " Comentario: " + req.body.comentario : ""}`,
    referenciaId: inc.id,
  });

  return res.json(actualizada);
});

/** PUT /api/incidencias/:id/rechazar — Rechazar incidencia (supervisor_sucursales) */
router.put("/:id/rechazar", requireRoles(ROLES.SUPERVISOR_SUCURSALES, ROLES.SUPER_ADMIN), (req, res) => {
  const inc = store.getIncidenciaById(req.params.id);
  if (!inc) return res.status(404).json({ error: "Incidencia no encontrada" });
  if (!puedeGestionarIncidencia(req.user, inc)) {
    return res.status(403).json({ error: "No tienes acceso a esta incidencia" });
  }
  if (inc.estado !== "pendiente") return res.status(400).json({ error: "Solo se pueden rechazar incidencias pendientes" });

  const actualizada = store.updateIncidencia(req.params.id, {
    estado: "rechazada",
    supervisorId: req.user.id,
    comentarioSupervisor: req.body.comentario || null,
    revisadoEn: new Date().toISOString(),
  });

  notifService.notificarUsuario(inc.usuarioId, req.user.id, {
    tipo: "incidencia_resuelta",
    titulo: "Incidencia rechazada",
    mensaje: `Tu incidencia ha sido rechazada.${req.body.comentario ? " Motivo: " + req.body.comentario : ""}`,
    referenciaId: inc.id,
  });

  return res.json(actualizada);
});

module.exports = router;
