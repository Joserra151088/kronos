/**
 * api.js - Capa de comunicación con el backend.
 */

const BASE_URL = "http://localhost:4000/api";

const getToken = () => localStorage.getItem("token");

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers, ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || "Error en la petición"), data);
  return data;
};

/** Petición multipart/form-data (para subida de archivos) */
const requestMultipart = async (endpoint, formData, method = "POST") => {
  const token = getToken();
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, { method, headers, body: formData });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || "Error en la petición"), data);
  return data;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = async (email, password, sucursalIdLogin = null) => {
  const body = { email, password };
  if (sucursalIdLogin) body.sucursalIdLogin = sucursalIdLogin;
  const data = await request("/auth/login", { method: "POST", body });
  if (data.token) localStorage.setItem("token", data.token);
  return data;
};

export const logout = () => localStorage.removeItem("token");
export const getMe = () => request("/auth/me");

// ─── Sucursales ───────────────────────────────────────────────────────────────
export const getSucursales = () => request("/sucursales");
export const getSucursal = (id) => request(`/sucursales/${id}`);
export const crearSucursal = (data) => request("/sucursales", { method: "POST", body: data });
export const actualizarSucursal = (id, data) => request(`/sucursales/${id}`, { method: "PUT", body: data });
export const eliminarSucursal = (id) => request(`/sucursales/${id}`, { method: "DELETE" });

// ─── Usuarios ─────────────────────────────────────────────────────────────────
export const getUsuarios = (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  return request(`/usuarios${params ? "?" + params : ""}`);
};
export const getPuestos = () => request("/puestos");
export const getUsuario = (id) => request(`/usuarios/${id}`);
export const crearUsuario = (data) => request("/usuarios", { method: "POST", body: data });
export const actualizarUsuario = (id, data) => request(`/usuarios/${id}`, { method: "PUT", body: data });
export const eliminarUsuario = (id) => request(`/usuarios/${id}`, { method: "DELETE" });
export const subirFotoEmpleado = (id, file) => {
  const fd = new FormData();
  fd.append("foto", file);
  return requestMultipart(`/usuarios/${id}/foto`, fd, "PUT");
};

// ─── Puestos ──────────────────────────────────────────────────────────────────
export const getPuestosAdmin = () => request("/puestos");
export const crearPuesto = (data) => request("/puestos", { method: "POST", body: data });
export const actualizarPuesto = (id, data) => request(`/puestos/${id}`, { method: "PUT", body: data });
export const eliminarPuesto = (id) => request(`/puestos/${id}`, { method: "DELETE" });
export const actualizarCamposPuesto = (id, campos) =>
  request(`/puestos/${id}/campos`, { method: "PUT", body: { campos } });

// ─── Horarios ─────────────────────────────────────────────────────────────────
export const getHorarios = () => request("/horarios");
export const crearHorario = (data) => request("/horarios", { method: "POST", body: data });
export const actualizarHorario = (id, data) => request(`/horarios/${id}`, { method: "PUT", body: data });
export const eliminarHorario = (id) => request(`/horarios/${id}`, { method: "DELETE" });
export const asignarHorario = (usuarioId, horarioId) =>
  request(`/horarios/asignar/${usuarioId}`, { method: "PUT", body: { horarioId } });

// ─── Grupos ───────────────────────────────────────────────────────────────────
export const getGrupos = () => request("/grupos");
export const getGrupo = (id) => request(`/grupos/${id}`);
export const crearGrupo = (data) => request("/grupos", { method: "POST", body: data });
export const actualizarGrupo = (id, data) => request(`/grupos/${id}`, { method: "PUT", body: data });
export const actualizarSucursalesGrupo = (id, sucursalIds) =>
  request(`/grupos/${id}/sucursales`, { method: "PUT", body: { sucursalIds } });
export const eliminarGrupo = (id) => request(`/grupos/${id}`, { method: "DELETE" });

// ─── Incidencias ──────────────────────────────────────────────────────────────
export const getTiposIncidencia = () => request("/incidencias/tipos");
export const crearTipoIncidencia = (data) => request("/incidencias/tipos", { method: "POST", body: data });
export const actualizarTipoIncidencia = (id, data) => request(`/incidencias/tipos/${id}`, { method: "PUT", body: data });
export const eliminarTipoIncidencia = (id) => request(`/incidencias/tipos/${id}`, { method: "DELETE" });

export const getIncidencias = (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  return request(`/incidencias${params ? "?" + params : ""}`);
};
export const getIncidencia = (id) => request(`/incidencias/${id}`);

export const crearIncidencia = (formData) => requestMultipart("/incidencias", formData);

export const aprobarIncidencia = (id, comentario = "") =>
  request(`/incidencias/${id}/aprobar`, { method: "PUT", body: { comentario } });
export const rechazarIncidencia = (id, comentario = "") =>
  request(`/incidencias/${id}/rechazar`, { method: "PUT", body: { comentario } });

// ─── Notificaciones ───────────────────────────────────────────────────────────
export const getNotificaciones = () => request("/notificaciones");
export const marcarNotificacionLeida = (id) => request(`/notificaciones/${id}/leer`, { method: "PUT" });
export const marcarTodasLeidas = () => request("/notificaciones/leer-todas", { method: "PUT" });
export const enviarNotificacion = (data) => request("/notificaciones/enviar", { method: "POST", body: data });

// ─── Registros ────────────────────────────────────────────────────────────────
export const getRegistros = (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  return request(`/registros${params ? "?" + params : ""}`);
};
export const getRegistrosHoy = () => request("/registros/hoy");
export const crearRegistro = (latitud, longitud, motivoFueraHorario = null, sucursalId = null, motivoFueraGeocerca = null) =>
  request("/registros", { method: "POST", body: {
    latitud, longitud,
    ...(motivoFueraHorario ? { motivoFueraHorario } : {}),
    ...(sucursalId ? { sucursalId } : {}),
    ...(motivoFueraGeocerca ? { motivoFueraGeocerca } : {}),
  } });

export const forgotPassword  = (email)           => request("/auth/forgot-password", { method: "POST", body: { email } });
export const resetPassword   = (token, password) => request("/auth/reset-password",  { method: "POST", body: { token, password } });
export const crearRegistroManual = (data) => request("/registros/manual", { method: "POST", body: data });
export const actualizarRegistroManual = (id, data) => request(`/registros/${id}/manual`, { method: "PUT", body: data });
export const aprobarRegistro = (id) => request(`/registros/${id}/aprobar`, { method: "PUT" });
export const rechazarRegistro = (id, motivo) => request(`/registros/${id}/rechazar`, { method: "PUT", body: { motivo } });
export const getMinutosTrabajados = (desde, hasta) => request(`/registros/minutos?desde=${desde}&hasta=${hasta}`);
export const getReporte = (sucursalId, fecha) => request(`/registros/reporte?sucursalId=${sucursalId}&fecha=${fecha}`);
export const getMapaSucursales = () => request("/registros/mapa");

// ─── Configuración de roles ───────────────────────────────────────────────────
export const getConfigRoles    = () => request("/config/roles");
export const getMisModulos     = () => request("/config/modulos");
export const updateConfigRol   = (rol, modulos) =>
  request(`/config/roles/${rol}`, { method: "PUT", body: { modulos } });

// ─── Empresa ──────────────────────────────────────────────────────────────────
export const getEmpresaConfig = () => request("/config/empresa");
export const updateEmpresaConfig = (data) => request("/config/empresa", { method: "PUT", body: data });
export const uploadLogoEmpresa = (file) => {
  const fd = new FormData();
  fd.append("logo", file);
  return requestMultipart("/config/empresa/logo", fd, "PUT");
};

// ─── Reportes ─────────────────────────────────────────────────────────────────
export const getReporteAsistencia = (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  return request(`/reportes/asistencia?${params}`);
};
export const getReporteMinutos = (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  return request(`/reportes/minutos?${params}`);
};
export const getReporteIncidencias = (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  return request(`/reportes/incidencias?${params}`);
};

// ─── Logs / Salud de plataforma ───────────────────────────────────────────────
export const getLogsHealth = () => request("/logs/salud");
export const getLogsErrores = (filtros = {}) => {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== "" && v !== null && v !== undefined))
  ).toString();
  return request(`/logs/errores${params ? "?" + params : ""}`);
};

// ─── Auditoría ────────────────────────────────────────────────────────────────
export const getAuditoria = (filtros = {}) => {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filtros).filter(([,v]) => v !== "" && v !== null && v !== undefined))
  ).toString();
  return request(`/auditoria${params ? "?" + params : ""}`);
};

// ─── Registros manuales por gestión ──────────────────────────────────────────
export const getMinutosEmpleados = (filtros = {}) => {
  const params = new URLSearchParams(filtros).toString();
  return request(`/registros/minutos-empleados${params ? "?" + params : ""}`);
};

// ─── Registros propios del usuario ────────────────────────────────────────────
export const getRegistrosPropios = (params) =>
  request("/registros?" + new URLSearchParams(params));

// ─── Aclaraciones de horario ──────────────────────────────────────────────────
export const createAclaracion = (data) =>
  request("/aclaraciones", { method: "POST", body: data });

export const getAclaraciones = () => request("/aclaraciones");
