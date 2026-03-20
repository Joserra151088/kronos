/**
 * auditoria.middleware.js
 * Registra cada acción autenticada en el log de auditoría.
 * Incluye información del actor (quien realizó la acción) y del objetivo (a quién/qué afecta).
 */
const jwt = require("jsonwebtoken");
const store = require("../data/store");

const JWT_SECRET = process.env.JWT_SECRET || "access_control_secret_2025";

const METODOS_WRITE = ["POST", "PUT", "PATCH", "DELETE"];

const auditarAccion = (req, res, next) => {
  // El middleware corre antes que varias rutas validen el token.
  // Para no perder auditoría, intentamos resolver el usuario desde Authorization.
  if (!req.user) {
    const authHeader = req.headers["authorization"];
    if (authHeader?.startsWith("Bearer ")) {
      try {
        req.user = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
      } catch {
        return next();
      }
    }
  }

  // Solo auditar si hay usuario autenticado
  if (!req.user) return next();

  const ruta = req.originalUrl || req.url;

  if (!METODOS_WRITE.includes(req.method)) return next();

  // Escuchar la respuesta para saber si fue exitosa
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const statusCode = res.statusCode;
    const objetivo = extraerObjetivo(ruta, req.body, body);
    const accion = detectarAccion(req.method, ruta, body, objetivo);
    store.createAuditEntry({
      usuarioId:     req.user.id,
      usuarioNombre: `${req.user.nombre || ""} ${req.user.apellido || ""}`.trim(),
      usuarioRol:    req.user.rol,
      metodo:        req.method,
      ruta,
      accion,
      objetivoId:    objetivo.id,
      objetivoNombre: objetivo.nombre,
      objetivoTipo:  objetivo.tipo,
      statusCode,
      ip: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "desconocida",
      exito: statusCode >= 200 && statusCode < 300,
      detalles: req.method !== "GET" ? sanitizarBody(req.body) : undefined,
    });
    return originalJson(body);
  };

  next();
};

/**
 * extraerObjetivo
 * Extrae el id y nombre del recurso afectado por la acción.
 * Intenta detectar el objetivo mirando el UUID en la URL y buscándolo en el store.
 */
const extraerObjetivo = (ruta, reqBody, resBody) => {
  // 1. Extraer UUID de la ruta (ej: /api/usuarios/abc-123)
  const uuidMatch = ruta.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  const idEnRuta = uuidMatch ? uuidMatch[1] : null;

  // 2. Intentar identificar el tipo de recurso y su nombre
  if (idEnRuta) {
    // ¿Es un usuario?
    if (ruta.includes("/usuarios/") || ruta.includes("/empleados/")) {
      const u = store.getUsuarioById(idEnRuta);
      if (u) return { id: idEnRuta, nombre: `${u.nombre} ${u.apellido}`.trim(), tipo: "usuario" };
    }
    // ¿Es una sucursal?
    if (ruta.includes("/sucursales/")) {
      const s = store.getSucursalById(idEnRuta);
      if (s) return { id: idEnRuta, nombre: s.nombre, tipo: "sucursal" };
    }
    // ¿Es un grupo?
    if (ruta.includes("/grupos/")) {
      const g = store.getGrupoById ? store.getGrupoById(idEnRuta) : null;
      if (g) return { id: idEnRuta, nombre: g.nombre, tipo: "grupo" };
    }
    // ¿Es un horario?
    if (ruta.includes("/horarios/")) {
      const h = store.getHorarioById ? store.getHorarioById(idEnRuta) : null;
      if (h) return { id: idEnRuta, nombre: h.nombre, tipo: "horario" };
    }
    // ¿Es una incidencia?
    if (ruta.includes("/incidencias/")) {
      const inc = store.getIncidenciaById ? store.getIncidenciaById(idEnRuta) : null;
      if (inc) {
        const u = store.getUsuarioById(inc.usuarioId);
        return { id: idEnRuta, nombre: u ? `${u.nombre} ${u.apellido}`.trim() : idEnRuta, tipo: "incidencia" };
      }
    }
    // ¿Es un registro de asistencia?
    if (ruta.includes("/registros/")) {
      const r = store.getRegistroById ? store.getRegistroById(idEnRuta) : null;
      if (r) {
        const u = store.getUsuarioById(r.usuarioId);
        return { id: idEnRuta, nombre: u ? `${u.nombre} ${u.apellido}`.trim() : idEnRuta, tipo: "registro" };
      }
    }
    // ID encontrado pero tipo desconocido
    return { id: idEnRuta, nombre: null, tipo: null };
  }

  // 3. Para POST (creaciones), intentar extraer usuarioId del body de la petición
  if (reqBody?.usuarioId) {
    const u = store.getUsuarioById(reqBody.usuarioId);
    if (u) return { id: reqBody.usuarioId, nombre: `${u.nombre} ${u.apellido}`.trim(), tipo: "usuario" };
  }

  // 4. Si la respuesta contiene un usuario directamente (POST crear empleado)
  if (resBody?.id && (ruta.includes("/usuarios") || ruta.includes("/empleados"))) {
    const nombre = resBody.nombre && resBody.apellido
      ? `${resBody.nombre} ${resBody.apellido}`.trim()
      : resBody.nombre || null;
    if (nombre) return { id: resBody.id, nombre, tipo: "usuario" };
  }

  return { id: null, nombre: null, tipo: null };
};

/**
 * detectarAccion
 * Genera una descripción legible de la acción realizada, incluyendo el objetivo si está disponible.
 */
const detectarAccion = (metodo, ruta, body, objetivo = {}) => {
  const obj = objetivo.nombre ? ` → ${objetivo.nombre}` : "";

  if (ruta.includes("/auth/logout"))                                          return "Cierre de sesión";
  if (ruta.includes("/usuarios") && metodo === "POST")                        return `Crear empleado${obj}`;
  if (ruta.includes("/usuarios") && metodo === "PUT")                         return `Actualizar empleado${obj}`;
  if (ruta.includes("/usuarios") && metodo === "DELETE")                      return `Desactivar empleado${obj}`;
  if (ruta.includes("/sucursales") && metodo === "POST")                      return `Crear sucursal${obj}`;
  if (ruta.includes("/sucursales") && metodo === "PUT")                       return `Actualizar sucursal${obj}`;
  if (ruta.includes("/sucursales") && metodo === "DELETE")                    return `Eliminar sucursal${obj}`;
  if (ruta.includes("/grupos") && metodo === "POST")                          return `Crear grupo${obj}`;
  if (ruta.includes("/grupos") && metodo === "PUT")                           return `Actualizar grupo${obj}`;
  if (ruta.includes("/grupos") && metodo === "DELETE")                        return `Eliminar grupo${obj}`;
  if (ruta.includes("/puestos") && metodo === "POST")                         return `Crear puesto${obj}`;
  if (ruta.includes("/puestos") && metodo === "PUT")                          return `Actualizar puesto${obj}`;
  if (ruta.includes("/horarios") && metodo === "POST")                        return `Crear horario${obj}`;
  if (ruta.includes("/horarios") && metodo === "PUT")                         return `Actualizar horario${obj}`;
  if (ruta.includes("/horarios") && metodo === "DELETE")                      return `Eliminar horario${obj}`;
  if (ruta.includes("/incidencias") && ruta.includes("/pre-aprobar"))         return `Pre-aprobar incidencia${obj}`;
  if (ruta.includes("/incidencias") && ruta.includes("/aprobar"))             return `Aprobar incidencia${obj}`;
  if (ruta.includes("/incidencias") && ruta.includes("/rechazar"))            return `Rechazar incidencia${obj}`;
  if (ruta.includes("/incidencias") && metodo === "POST")                     return `Registrar incidencia${obj}`;
  if (ruta.includes("/registros/manual") && metodo === "POST")                return `Crear registro manual${obj}`;
  if (ruta.includes("/registros/") && ruta.includes("/manual") && metodo === "PUT") return `Editar registro manual${obj}`;
  if (ruta.includes("/registros/") && ruta.includes("/aprobar"))              return `Aprobar registro manual${obj}`;
  if (ruta.includes("/registros/") && ruta.includes("/rechazar"))             return `Rechazar registro manual${obj}`;
  if (ruta.includes("/registros") && metodo === "POST")                       return `Registro de acceso${obj}`;
  if (ruta.includes("/anuncios") && metodo === "POST")                        return "Crear anuncio";
  if (ruta.includes("/anuncios") && metodo === "PUT")                         return "Actualizar anuncio";
  if (ruta.includes("/anuncios") && metodo === "DELETE")                      return "Eliminar anuncio";
  if (ruta.includes("/config/roles"))                                         return "Configurar roles";
  if (ruta.includes("/config/empresa"))                                       return "Configurar empresa";
  if (metodo === "DELETE") return `Eliminar / Desactivar${obj}`;
  if (metodo === "POST")   return `Crear registro${obj}`;
  if (metodo === "PUT")    return `Actualizar registro${obj}`;
  return `${metodo} ${ruta}`;
};

const sanitizarBody = (body) => {
  if (!body || typeof body !== "object") return body;
  const sanitized = { ...body };
  const campos_privados = ["password", "token", "secret"];
  campos_privados.forEach((k) => { if (k in sanitized) sanitized[k] = "***"; });
  return sanitized;
};

module.exports = { auditarAccion };
