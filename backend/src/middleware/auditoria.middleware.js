/**
 * auditoria.middleware.js
 * Registra cada acción autenticada en el log de auditoría.
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
    // Detectar acción a partir del método + ruta
    const accion = detectarAccion(req.method, ruta, body);
    store.createAuditEntry({
      usuarioId:     req.user.id,
      usuarioNombre: `${req.user.nombre || ""} ${req.user.apellido || ""}`.trim(),
      usuarioRol:    req.user.rol,
      metodo:        req.method,
      ruta,
      accion,
      statusCode,
      ip: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "desconocida",
      exito: statusCode >= 200 && statusCode < 300,
      detalles: req.method !== "GET" ? sanitizarBody(req.body) : undefined,
    });
    return originalJson(body);
  };

  next();
};

const detectarAccion = (metodo, ruta, body) => {
  if (ruta.includes("/auth/logout"))        return "Cierre de sesión";
  if (ruta.includes("/usuarios") && metodo === "POST") return "Crear empleado";
  if (ruta.includes("/usuarios") && metodo === "PUT")  return "Actualizar empleado";
  if (ruta.includes("/usuarios") && metodo === "DELETE") return "Desactivar empleado";
  if (ruta.includes("/sucursales") && metodo === "POST") return "Crear sucursal";
  if (ruta.includes("/sucursales") && metodo === "PUT")  return "Actualizar sucursal";
  if (ruta.includes("/grupos") && metodo === "POST") return "Crear grupo";
  if (ruta.includes("/grupos") && metodo === "PUT")  return "Actualizar grupo";
  if (ruta.includes("/puestos") && metodo === "POST") return "Crear puesto";
  if (ruta.includes("/puestos") && metodo === "PUT")  return "Actualizar puesto";
  if (ruta.includes("/horarios") && metodo === "POST") return "Crear horario";
  if (ruta.includes("/horarios") && metodo === "PUT")  return "Actualizar horario";
  if (ruta.includes("/incidencias") && ruta.includes("/aprobar")) return "Aprobar incidencia";
  if (ruta.includes("/incidencias") && ruta.includes("/rechazar")) return "Rechazar incidencia";
  if (ruta.includes("/incidencias") && metodo === "POST") return "Registrar incidencia";
  if (ruta.includes("/registros/manual") && metodo === "POST") return "Crear registro manual";
  if (ruta.includes("/registros/") && ruta.includes("/manual") && metodo === "PUT") return "Editar registro manual";
  if (ruta.includes("/registros/") && ruta.includes("/aprobar")) return "Aprobar registro manual";
  if (ruta.includes("/registros/") && ruta.includes("/rechazar")) return "Rechazar registro manual";
  if (ruta.includes("/registros") && metodo === "POST") return "Registro de acceso";
  if (ruta.includes("/config/roles")) return "Configurar roles";
  if (ruta.includes("/config/empresa")) return "Configurar empresa";
  if (metodo === "DELETE") return "Eliminar / Desactivar";
  if (metodo === "POST")   return "Crear registro";
  if (metodo === "PUT")    return "Actualizar registro";
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
