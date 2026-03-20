/**
 * vacaciones.routes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo de vacaciones: wrapper sobre incidencias filtradas por categoriaBloqueo = 'vacaciones'.
 * Regla de negocio: solo se puede solicitar si el empleado tiene >= 1 año de antigüedad.
 * Notificaciones: al aprobar, se notifica a todos los usuarios con rol 'nominas'.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const express = require("express");
const router = express.Router();
const multer = require("multer");
const store = require("../data/store");
const { verificarToken } = require("../middleware/auth");
const { requireRoles, ROLES } = require("../middleware/roles");
const { saveFile } = require("../services/storage.service");
const notifService = require("../services/notificaciones.service");
const { getAllowedSucursalIds } = require("../utils/access-scope");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const permitidos = ["image/jpeg","image/png","image/webp","application/pdf"];
    if (permitidos.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imágenes (JPG, PNG, WebP) y PDF"));
  },
});

router.use(verificarToken);

const ROLES_GESTION = [
  ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI,
  ROLES.SUPERVISOR_SUCURSALES, ROLES.AGENTE_CONTROL_ASISTENCIA, ROLES.NOMINAS,
];
const ROLES_APROBACION = [
  ROLES.SUPER_ADMIN, ROLES.SUPERVISOR_SUCURSALES, ROLES.NOMINAS,
];

/** Calcula años de diferencia entre dos fechas ISO/Date */
const calcularAnios = (fechaInicio) => {
  if (!fechaInicio) return 0;
  const inicio = new Date(fechaInicio);
  const hoy = new Date();
  let anios = hoy.getFullYear() - inicio.getFullYear();
  const m = hoy.getMonth() - inicio.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < inicio.getDate())) anios--;
  return anios;
};

/** GET /api/vacaciones — Lista solicitudes de vacaciones */
router.get("/", (req, res) => {
  const tiposVac = store.getTiposIncidencia().filter((t) => t.categoriaBloqueo === "vacaciones");
  const idsVac = new Set(tiposVac.map((t) => t.id));
  const allowedSucursalIds = getAllowedSucursalIds(req.user, store);

  let incidencias = store.getIncidencias();
  // Filtrar solo vacaciones
  incidencias = incidencias.filter((i) => idsVac.has(i.tipoIncidenciaId));

  // Filtrar por permisos
  if (!ROLES_GESTION.includes(req.user.rol)) {
    incidencias = incidencias.filter((i) => i.usuarioId === req.user.id);
  } else {
    if (req.query.usuarioId) incidencias = incidencias.filter((i) => i.usuarioId === req.query.usuarioId);
    if (req.query.estado) incidencias = incidencias.filter((i) => i.estado === req.query.estado);
    if (req.user.rol === ROLES.SUPERVISOR_SUCURSALES && allowedSucursalIds !== null) {
      const permitidas = new Set(allowedSucursalIds);
      incidencias = incidencias.filter((i) => i.sucursalId && permitidas.has(i.sucursalId));
    }
  }

  const lista = incidencias.map((inc) => {
    const usuario = store.getUsuarioById(inc.usuarioId);
    const tipo = store.getTipoIncidenciaById(inc.tipoIncidenciaId);
    const jefe = inc.jefeInmediatoId ? store.getUsuarioById(inc.jefeInmediatoId) : null;
    return {
      ...inc,
      usuarioNombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : "N/A",
      tipoNombre: tipo ? tipo.nombre : "Vacaciones",
      categoriaBloqueo: "vacaciones",
      jefeInmediatoNombre: jefe ? `${jefe.nombre} ${jefe.apellido}` : null,
    };
  });

  return res.json(lista);
});

/** GET /api/vacaciones/elegibilidad — Verifica si el usuario actual puede solicitar vacaciones */
router.get("/elegibilidad", (req, res) => {
  const usuarioId = req.query.usuarioId || req.user.id;
  const u = store.getUsuarioById(usuarioId);
  if (!u) return res.status(404).json({ error: "Usuario no encontrado" });

  const anios = calcularAnios(u.fechaInicioActividades);
  const elegible = anios >= 1;

  return res.json({
    elegible,
    aniosAntiguedad: anios,
    fechaInicioActividades: u.fechaInicioActividades || null,
    mensaje: elegible
      ? `Elegible. Tiene ${anios} año(s) de antigüedad.`
      : `No elegible. Se requiere mínimo 1 año de antigüedad. Actualmente: ${anios} año(s).`,
  });
});

/** POST /api/vacaciones — Solicitar período vacacional */
router.post("/", upload.single("archivo"), async (req, res) => {
  try {
    const { tipoIncidenciaId, descripcion, fechaIncidencia, fechaFin } = req.body;
    if (!tipoIncidenciaId || !fechaIncidencia) {
      return res.status(400).json({ error: "tipoIncidenciaId y fechaIncidencia son obligatorios" });
    }

    const tipo = store.getTipoIncidenciaById(tipoIncidenciaId);
    if (!tipo || tipo.categoriaBloqueo !== "vacaciones") {
      return res.status(400).json({ error: "Tipo de incidencia no válido para vacaciones" });
    }

    // Verificar elegibilidad (1 año de antigüedad)
    const usuarioObj = store.getUsuarioById(req.user.id);
    const anios = calcularAnios(usuarioObj?.fechaInicioActividades);
    if (anios < 1) {
      return res.status(403).json({
        error: `Para solicitar vacaciones se requiere al menos 1 año de antigüedad. Actualmente tienes ${anios} año(s).`,
        elegible: false,
        aniosAntiguedad: anios,
      });
    }

    let archivoUrl = null, archivoNombre = null, archivoMime = null;
    if (req.file) {
      const guardado = await saveFile(req.file);
      archivoUrl = guardado.url;
      archivoNombre = guardado.nombre;
      archivoMime = guardado.mime;
    }

    const jefeInmediatoId = usuarioObj?.jefeInmediatoId || null;
    const sucursalId = req.user.sucursalId || usuarioObj?.sucursalId || null;

    const nueva = store.createIncidencia({
      usuarioId: req.user.id,
      sucursalId,
      tipoIncidenciaId,
      descripcion: descripcion || "",
      fechaIncidencia,
      fechaFin: fechaFin || null,
      jefeInmediatoId,
      archivoUrl,
      archivoNombre,
      archivoMime,
    });

    const nombreUsuario = usuarioObj ? `${usuarioObj.nombre} ${usuarioObj.apellido}` : "Un empleado";

    // Notificar al supervisor/jefe inmediato
    if (jefeInmediatoId) {
      notifService.notificarUsuario(jefeInmediatoId, req.user.id, {
        tipo: "vacaciones_nueva",
        titulo: "Nueva solicitud de vacaciones",
        mensaje: `${nombreUsuario} solicita vacaciones del ${fechaIncidencia}${fechaFin ? " al " + fechaFin : ""}. Requiere tu autorización.`,
        referenciaId: nueva.id,
      });
    }

    // Notificar a supervisores de sucursal
    if (sucursalId) {
      notifService.notificarSupervisoresDeSucursal(sucursalId, req.user.id, {
        tipo: "vacaciones_nueva",
        titulo: "Nueva solicitud de vacaciones",
        mensaje: `${nombreUsuario} solicita vacaciones del ${fechaIncidencia}${fechaFin ? " al " + fechaFin : ""}.`,
        referenciaId: nueva.id,
      });
    }

    return res.status(201).json(nueva);
  } catch (err) {
    console.error("Error al solicitar vacaciones:", err);
    return res.status(500).json({ error: err.message || "Error al solicitar vacaciones" });
  }
});

/** PUT /api/vacaciones/:id/pre-aprobar */
router.put("/:id/pre-aprobar", requireRoles(ROLES.SUPER_ADMIN, ROLES.AGENTE_SOPORTE_TI, ROLES.AGENTE_CONTROL_ASISTENCIA), (req, res) => {
  const inc = store.getIncidenciaById(req.params.id);
  if (!inc) return res.status(404).json({ error: "Solicitud no encontrada" });
  if (inc.estado !== "pendiente") return res.status(400).json({ error: "Solo se puede pre-aprobar solicitudes pendientes" });

  const actualizada = store.preAprobarIncidencia(req.params.id, req.user.id, req.body.comentario || "");

  notifService.notificarUsuario(inc.usuarioId, req.user.id, {
    tipo: "vacaciones_pre_aprobada",
    titulo: "Solicitud de vacaciones pre-aprobada",
    mensaje: "Tu solicitud de vacaciones fue pre-aprobada y está en espera de autorización final.",
    referenciaId: inc.id,
  });

  if (inc.jefeInmediatoId) {
    const empleado = store.getUsuarioById(inc.usuarioId);
    notifService.notificarUsuario(inc.jefeInmediatoId, req.user.id, {
      tipo: "vacaciones_por_autorizar",
      titulo: "Vacaciones listas para autorizar",
      mensaje: `Las vacaciones de ${empleado ? empleado.nombre + " " + empleado.apellido : "un empleado"} fueron pre-aprobadas y requieren tu autorización final.`,
      referenciaId: inc.id,
    });
  }

  return res.json(actualizada);
});

/** PUT /api/vacaciones/:id/aprobar */
router.put("/:id/aprobar", (req, res) => {
  const inc = store.getIncidenciaById(req.params.id);
  if (!inc) return res.status(404).json({ error: "Solicitud no encontrada" });

  const puedeAprobar = ROLES_APROBACION.includes(req.user.rol) ||
    (inc.jefeInmediatoId && inc.jefeInmediatoId === req.user.id);
  if (!puedeAprobar) {
    return res.status(403).json({ error: "No tienes permisos para aprobar esta solicitud" });
  }

  if (!["pendiente", "pre_aprobada"].includes(inc.estado)) {
    return res.status(400).json({ error: "Solo se puede aprobar solicitudes pendientes o pre-aprobadas" });
  }

  const aprobador = store.getUsuarioById(req.user.id);
  const aprobadorNombre = aprobador ? `${aprobador.nombre} ${aprobador.apellido}` : "Un supervisor";
  const empleado = store.getUsuarioById(inc.usuarioId);
  const empleadoNombre = empleado ? `${empleado.nombre} ${empleado.apellido}` : "Un empleado";

  const actualizada = store.updateIncidencia(req.params.id, {
    estado: "aprobada",
    supervisorId: req.user.id,
    comentarioSupervisor: req.body.comentario || null,
    revisadoEn: new Date().toISOString(),
  });

  // Notificar al empleado
  notifService.notificarUsuario(inc.usuarioId, req.user.id, {
    tipo: "vacaciones_aprobada",
    titulo: "¡Vacaciones aprobadas! 🏖️",
    mensaje: `Tu solicitud de vacaciones ha sido aprobada por ${aprobadorNombre}.${req.body.comentario ? " Nota: " + req.body.comentario : ""}`,
    referenciaId: inc.id,
  });

  // Notificar a todos los usuarios con rol 'nominas'
  const equipoNominas = store.getSupervisoresPorRoles([ROLES.NOMINAS]);
  equipoNominas.forEach((n) => {
    if (n.id !== req.user.id) {
      notifService.notificarUsuario(n.id, req.user.id, {
        tipo: "vacaciones_autorizada_nominas",
        titulo: "Vacaciones autorizadas — Nóminas",
        mensaje: `${aprobadorNombre} autorizó las vacaciones de ${empleadoNombre}. Periodo: ${inc.fechaIncidencia || "N/A"}${inc.fechaFin ? " al " + inc.fechaFin : ""}.`,
        referenciaId: inc.id,
      });
    }
  });

  return res.json(actualizada);
});

/** PUT /api/vacaciones/:id/rechazar */
router.put("/:id/rechazar", (req, res) => {
  const inc = store.getIncidenciaById(req.params.id);
  if (!inc) return res.status(404).json({ error: "Solicitud no encontrada" });

  const puedeAprobar = ROLES_APROBACION.includes(req.user.rol) ||
    (inc.jefeInmediatoId && inc.jefeInmediatoId === req.user.id);
  if (!puedeAprobar) {
    return res.status(403).json({ error: "No tienes permisos para rechazar esta solicitud" });
  }

  if (!["pendiente", "pre_aprobada"].includes(inc.estado)) {
    return res.status(400).json({ error: "Solo se puede rechazar solicitudes pendientes o pre-aprobadas" });
  }

  const actualizada = store.updateIncidencia(req.params.id, {
    estado: "rechazada",
    supervisorId: req.user.id,
    comentarioSupervisor: req.body.comentario || null,
    revisadoEn: new Date().toISOString(),
  });

  notifService.notificarUsuario(inc.usuarioId, req.user.id, {
    tipo: "vacaciones_rechazada",
    titulo: "Solicitud de vacaciones rechazada",
    mensaje: `Tu solicitud de vacaciones fue rechazada.${req.body.comentario ? " Motivo: " + req.body.comentario : ""}`,
    referenciaId: inc.id,
  });

  return res.json(actualizada);
});

module.exports = router;
