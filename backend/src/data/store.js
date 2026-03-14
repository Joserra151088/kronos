/**
 * store.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Almacén de datos en memoria.
 * Para migrar a SQL: reemplazar las funciones de cada colección por llamadas ORM.
 * Los controladores (routes) no necesitan cambios al migrar.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { v4: uuidv4 } = require("uuid");
const { pool, DB_ENABLED, testConnection, getExistingTables } = require("../config/db");

// ─── Tipos de registro de acceso ──────────────────────────────────────────────
const TIPOS_REGISTRO = {
  ENTRADA: "entrada",
  SALIDA_ALIMENTOS: "salida_alimentos",
  REGRESO_ALIMENTOS: "regreso_alimentos",
  SALIDA: "salida",
};

const newId = () => uuidv4();

const databaseState = {
  enabled: DB_ENABLED,
  connected: false,
  database: process.env.DB_NAME || "kronos",
  tables: new Set(),
  lastSyncAt: null,
  lastError: null,
};

let persistenceQueue = Promise.resolve();
let syncScheduled = false;
let writeActive = false;
let refreshInProgress = null;
let lastRefreshAt = 0;
const REFRESH_TTL_MS = 3000;

const toBool = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === "boolean") return value;
  return Number(value) === 1;
};

const parseJson = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const toIsoString = (value, fallback = null) => {
  if (!value) return fallback;
  if (typeof value === "string") {
    if (value.includes("T")) return value;
    if (value.includes(" ")) return value.replace(" ", "T");
    return `${value}T00:00:00.000Z`;
  }
  try {
    return new Date(value).toISOString();
  } catch {
    return fallback;
  }
};

const toMySqlDateTime = (value, fallback = null) => {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const hasTable = (tableName) => databaseState.tables.has(tableName);

const trackDatabaseError = (error) => {
  databaseState.lastError = error?.message || String(error);
  databaseState.connected = false;
  console.error("[store] Error de sincronizacion MySQL:", databaseState.lastError);
};

const scheduleDatabaseSync = () => {
  if (!databaseState.connected || syncScheduled) return;
  syncScheduled = true;
  persistenceQueue = persistenceQueue
    .then(async () => {
      syncScheduled = false;
      writeActive = true;
      try {
        await persistDatabaseSnapshot();
        databaseState.lastSyncAt = new Date().toISOString();
      } finally {
        writeActive = false;
      }
    })
    .catch((error) => {
      syncScheduled = false;
      writeActive = false;
      trackDatabaseError(error);
    });
};

const refreshFromDatabaseIfNeeded = async (force = false) => {
  if (!databaseState.connected || !pool) return false;
  if (syncScheduled || writeActive) return false;

  const now = Date.now();
  if (!force && now - lastRefreshAt < REFRESH_TTL_MS) return false;
  if (refreshInProgress) return refreshInProgress;

  refreshInProgress = (async () => {
    try {
      databaseState.tables = await getExistingTables();
      await loadDatabaseSnapshot();
      lastRefreshAt = Date.now();
      databaseState.lastError = null;
      return true;
    } catch (error) {
      trackDatabaseError(error);
      return false;
    } finally {
      refreshInProgress = null;
    }
  })();

  return refreshInProgress;
};

// ─── Puestos (catálogo dinámico) ──────────────────────────────────────────────
// horarioId: horario por defecto que se hereda al crear un usuario con este puesto
let puestos = [
  { id: newId(), nombre: "Gerente de Sucursal",  descripcion: "", horarioId: null, activo: true, camposExtra: [], creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Subgerente",            descripcion: "", horarioId: null, activo: true, camposExtra: [], creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Cajero",                descripcion: "", horarioId: null, activo: true, camposExtra: [], creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Vendedor",              descripcion: "", horarioId: null, activo: true, camposExtra: [], creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Almacenista",           descripcion: "", horarioId: null, activo: true, camposExtra: [], creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Seguridad",             descripcion: "", horarioId: null, activo: true, camposExtra: [], creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Limpieza",              descripcion: "", horarioId: null, activo: true, camposExtra: [], creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Recursos Humanos",      descripcion: "", horarioId: null, activo: true, camposExtra: [], creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Médico Titular",        descripcion: "", horarioId: null, activo: true, camposExtra: [], creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Médico de Guardia",     descripcion: "", horarioId: null, activo: true, camposExtra: [], creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Soporte TI",            descripcion: "", horarioId: null, activo: true, camposExtra: [], creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Otro",                  descripcion: "", horarioId: null, activo: true, camposExtra: [], creadoEn: new Date().toISOString() },
];

// Backwards-compat: array de nombres para código antiguo
const PUESTOS = puestos.map((p) => p.nombre);
const refreshLegacyPuestos = () => {
  PUESTOS.splice(0, PUESTOS.length, ...puestos.map((puesto) => puesto.nombre));
};

// ─── Horarios ─────────────────────────────────────────────────────────────────
let horarios = [
  {
    id: newId(),
    nombre: "Turno Matutino",
    horaEntrada: "08:00",
    horaSalidaAlimentos: "14:00",   // Hora en que sale a comer
    horaRegresoAlimentos: "15:00",  // Hora en que regresa de comer
    horaSalida: "17:00",
    diasLaborales: [1, 2, 3, 4, 5], // Lunes-Viernes
    toleranciaMinutos: 10,
    activo: true,
    creadoEn: new Date().toISOString(),
  },
  {
    id: newId(),
    nombre: "Turno Vespertino",
    horaEntrada: "14:00",
    horaSalidaAlimentos: "19:00",
    horaRegresoAlimentos: "20:00",
    horaSalida: "22:00",
    diasLaborales: [1, 2, 3, 4, 5],
    toleranciaMinutos: 10,
    activo: true,
    creadoEn: new Date().toISOString(),
  },
];

// ─── Sucursales ───────────────────────────────────────────────────────────────
let sucursales = [
  {
    id: newId(),
    nombre: "Sucursal Centro",
    direccion: "Av. Juárez 100, Col. Centro",
    ciudad: "Ciudad de México",
    estado: "CDMX",
    activa: true,
    geocerca: { latitud: 19.4326, longitud: -99.1332, radio: 200 },
    creadoEn: new Date().toISOString(),
  },
  {
    id: newId(),
    nombre: "Sucursal Norte",
    direccion: "Blvd. Manuel Ávila Camacho 200",
    ciudad: "Ciudad de México",
    estado: "CDMX",
    activa: true,
    geocerca: { latitud: 19.4794, longitud: -99.2067, radio: 150 },
    creadoEn: new Date().toISOString(),
  },
];

// ─── Usuarios ─────────────────────────────────────────────────────────────────
let usuarios = [
  {
    id: newId(),
    nombre: "Ana",
    apellido: "García López",
    email: "ana.garcia@empresa.com",
    password: "123456",
    sexo: "femenino",
    edad: 28,
    puestoId: puestos[0].id,
    sucursalId: sucursales[0].id,
    rol: "super_admin",
    grupoId: null,
    horarioId: horarios[0].id,
    tipo: "sucursal",
    activo: true,
    creadoEn: new Date().toISOString(),
  },
  {
    id: newId(),
    nombre: "Carlos",
    apellido: "Mendoza Ruiz",
    email: "carlos.mendoza@empresa.com",
    password: "123456",
    sexo: "masculino",
    edad: 35,
    puestoId: puestos[2].id,
    sucursalId: sucursales[0].id,
    rol: "supervisor_sucursales",
    grupoId: null,
    horarioId: horarios[0].id,
    tipo: "sucursal",
    activo: true,
    creadoEn: new Date().toISOString(),
  },
  {
    id: newId(),
    nombre: "Sofía",
    apellido: "Torres Vega",
    email: "sofia.torres@empresa.com",
    password: "123456",
    sexo: "femenino",
    edad: 24,
    puestoId: puestos[3].id,
    sucursalId: sucursales[1].id,
    rol: "medico_titular",
    grupoId: null,
    horarioId: horarios[0].id,
    tipo: "sucursal",
    activo: true,
    creadoEn: new Date().toISOString(),
  },
  {
    id: newId(),
    nombre: "Luis",
    apellido: "Ramírez Torres",
    email: "luis.ramirez@empresa.com",
    password: "123456",
    sexo: "masculino",
    edad: 30,
    puestoId: puestos[10].id,
    sucursalId: sucursales[0].id,
    rol: "agente_soporte_ti",
    grupoId: null,
    horarioId: horarios[0].id,
    tipo: "sucursal",
    activo: true,
    creadoEn: new Date().toISOString(),
  },
  {
    id: newId(),
    nombre: "María",
    apellido: "López Sánchez",
    email: "maria.lopez@empresa.com",
    password: "123456",
    sexo: "femenino",
    edad: 27,
    puestoId: puestos[9].id,
    sucursalId: null, // medico_de_guardia no tiene sucursal fija
    rol: "medico_de_guardia",
    grupoId: null,
    horarioId: null,
    tipo: "corporativo",
    activo: true,
    creadoEn: new Date().toISOString(),
  },
  {
    id: newId(),
    nombre: "Roberto",
    apellido: "Fuentes García",
    email: "roberto.fuentes@empresa.com",
    password: "123456",
    sexo: "masculino",
    edad: 33,
    puestoId: puestos[7].id,
    sucursalId: sucursales[0].id,
    rol: "agente_control_asistencia",
    grupoId: null,
    horarioId: horarios[0].id,
    tipo: "sucursal",
    activo: true,
    creadoEn: new Date().toISOString(),
  },
  {
    id: newId(),
    nombre: "Patricia",
    apellido: "Morales Cruz",
    email: "patricia.morales@empresa.com",
    password: "123456",
    sexo: "femenino",
    edad: 31,
    puestoId: puestos[7].id,
    sucursalId: sucursales[0].id,
    rol: "visor_reportes",
    grupoId: null,
    horarioId: horarios[0].id,
    tipo: "sucursal",
    activo: true,
    creadoEn: new Date().toISOString(),
  },
];

// ─── Grupos ───────────────────────────────────────────────────────────────────
let grupos = [];

// ─── Tipos de Incidencia ──────────────────────────────────────────────────────
let tiposIncidencia = [
  { id: newId(), nombre: "Enfermedad",                descripcion: "Baja por enfermedad con o sin certificado médico", requiereArchivo: true,  activo: true, creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Permiso Personal",          descripcion: "Ausencia justificada por motivos personales",       requiereArchivo: false, activo: true, creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Ausencia Sin Goce de Sueldo", descripcion: "Falta injustificada sin pago",                   requiereArchivo: false, activo: true, creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Maternidad/Paternidad",    descripcion: "Licencia de maternidad o paternidad",               requiereArchivo: true,  activo: true, creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Duelo",                     descripcion: "Permiso por fallecimiento de familiar",             requiereArchivo: false, activo: true, creadoEn: new Date().toISOString() },
  { id: newId(), nombre: "Retardo Justificado",       descripcion: "Llegada tarde con justificación",                  requiereArchivo: false, activo: true, creadoEn: new Date().toISOString() },
];

// ─── Incidencias ──────────────────────────────────────────────────────────────
let incidencias = [];

// ─── Aclaraciones de horario ───────────────────────────────────────────────────
let aclaraciones = [];

// ─── Notificaciones ───────────────────────────────────────────────────────────
let notificaciones = [];

// ─── Configuración de acceso por rol ──────────────────────────────────────────
// Catálogo de módulos del sistema (corresponden a las rutas del frontend)
const MODULOS_SISTEMA = [
  { key: "dashboard",      label: "Inicio / Dashboard" },
  { key: "eventos",        label: "Eventos" },
  { key: "incidencias",    label: "Incidencias" },
  { key: "reportes",       label: "Reportes" },
  { key: "sucursales",     label: "Sucursales" },
  { key: "empleados",      label: "Empleados" },
  { key: "grupos",         label: "Grupos de Sucursales" },
  { key: "mapa",           label: "Mapa" },
  { key: "administracion", label: "Administración" },
  { key: "auditoria",      label: "Auditoría" },
  { key: "notificaciones", label: "Notificaciones" },
];

// Mapa rol → módulos permitidos (configurable desde el panel de Admin)
let configuracionRoles = {
  super_admin:                 ["dashboard","eventos","incidencias","reportes","sucursales","empleados","grupos","mapa","administracion","auditoria","notificaciones"],
  agente_soporte_ti:           ["dashboard","eventos","incidencias","reportes","sucursales","empleados","grupos","mapa","administracion","notificaciones"],
  supervisor_sucursales:       ["dashboard","eventos","incidencias","reportes","empleados","grupos","mapa","notificaciones"],
  agente_control_asistencia:   ["dashboard","eventos","incidencias","notificaciones"],
  visor_reportes:              ["dashboard","reportes","mapa","notificaciones"],
  medico_titular:              ["dashboard","incidencias","notificaciones"],
  medico_de_guardia:           ["dashboard","incidencias","notificaciones"],
};

const ROLE_DEFINITIONS = {
  super_admin: "Super Administrador",
  agente_soporte_ti: "Agente Soporte TI",
  supervisor_sucursales: "Supervisor de Sucursales",
  agente_control_asistencia: "Agente Control de Asistencia",
  visor_reportes: "Visor de Reportes",
  medico_titular: "Medico Titular",
  medico_de_guardia: "Medico de Guardia",
};

// ─── Registros de acceso ──────────────────────────────────────────────────────
const mkReg = (usuarioIdx, sucursalIdx, tipo, fecha, hora, fueraDeHorario = false, motivo = null) => ({
  id: newId(),
  usuarioId: usuarios[usuarioIdx].id,
  sucursalId: sucursalIdx !== null ? sucursales[sucursalIdx].id : null,
  tipo,
  fecha,
  hora,
  latitud:  sucursalIdx !== null ? sucursales[sucursalIdx].geocerca.latitud  : null,
  longitud: sucursalIdx !== null ? sucursales[sucursalIdx].geocerca.longitud : null,
  fueraDeHorario,
  motivoFueraHorario: motivo,
  esManual: false,
  captadoPor: null,
  editadoManual: false,
  editadoPor: null,
  editadoEn: null,
  motivoEdicionManual: "",
  manualOriginal: null,
  estadoAprobacion: null,
  aprobadoPor: null,
  aprobadoEn: null,
  creadoEn: new Date(`${fecha}T${hora}:00`).toISOString(),
});

let registros = [
  // ─── Semana 9-13 mar 2026 ────────────────────────────────────────────────────
  // 9 mar (lun) ─ Ana (completo), Carlos (completo), Sofía (completo), Luis (incompleto), Roberto (completo)
  mkReg(0, 0, "entrada",           "2026-03-09", "08:02"),
  mkReg(0, 0, "salida_alimentos",  "2026-03-09", "14:00"),
  mkReg(0, 0, "regreso_alimentos", "2026-03-09", "15:01"),
  mkReg(0, 0, "salida",            "2026-03-09", "17:03"),

  mkReg(1, 0, "entrada",           "2026-03-09", "08:05"),
  mkReg(1, 0, "salida_alimentos",  "2026-03-09", "14:02"),
  mkReg(1, 0, "regreso_alimentos", "2026-03-09", "15:05"),
  mkReg(1, 0, "salida",            "2026-03-09", "17:10"),

  mkReg(2, 1, "entrada",           "2026-03-09", "08:08"),
  mkReg(2, 1, "salida_alimentos",  "2026-03-09", "14:00"),
  mkReg(2, 1, "regreso_alimentos", "2026-03-09", "15:00"),
  mkReg(2, 1, "salida",            "2026-03-09", "17:05"),

  mkReg(3, 0, "entrada",           "2026-03-09", "08:15"),
  mkReg(3, 0, "salida_alimentos",  "2026-03-09", "14:10"),

  mkReg(5, 0, "entrada",           "2026-03-09", "07:55"),
  mkReg(5, 0, "salida_alimentos",  "2026-03-09", "14:00"),
  mkReg(5, 0, "regreso_alimentos", "2026-03-09", "15:00"),
  mkReg(5, 0, "salida",            "2026-03-09", "17:02"),

  // 10 mar (mar) ─ Ana (completo), Carlos (tarde ⚠️), Sofía (completo), Luis (completo), Roberto (sin salida final)
  mkReg(0, 0, "entrada",           "2026-03-10", "07:58"),
  mkReg(0, 0, "salida_alimentos",  "2026-03-10", "14:00"),
  mkReg(0, 0, "regreso_alimentos", "2026-03-10", "14:59"),
  mkReg(0, 0, "salida",            "2026-03-10", "17:00"),

  mkReg(1, 0, "entrada",           "2026-03-10", "09:30", true, "Tráfico en la ciudad"),
  mkReg(1, 0, "salida_alimentos",  "2026-03-10", "14:00"),
  mkReg(1, 0, "regreso_alimentos", "2026-03-10", "15:00"),
  mkReg(1, 0, "salida",            "2026-03-10", "17:30"),

  mkReg(2, 1, "entrada",           "2026-03-10", "08:10"),
  mkReg(2, 1, "salida_alimentos",  "2026-03-10", "14:00"),
  mkReg(2, 1, "regreso_alimentos", "2026-03-10", "15:00"),
  mkReg(2, 1, "salida",            "2026-03-10", "17:00"),

  mkReg(3, 0, "entrada",           "2026-03-10", "08:00"),
  mkReg(3, 0, "salida_alimentos",  "2026-03-10", "14:00"),
  mkReg(3, 0, "regreso_alimentos", "2026-03-10", "15:00"),
  mkReg(3, 0, "salida",            "2026-03-10", "17:05"),

  mkReg(5, 0, "entrada",           "2026-03-10", "08:00"),
  mkReg(5, 0, "salida_alimentos",  "2026-03-10", "14:00"),
  mkReg(5, 0, "regreso_alimentos", "2026-03-10", "15:00"),
  // Roberto sin salida el mar 10

  // 11 mar (mié) ─ Ana (completo), Carlos (completo), Sofía (AUSENTE), Luis (completo), Roberto (completo)
  mkReg(0, 0, "entrada",           "2026-03-11", "08:05"),
  mkReg(0, 0, "salida_alimentos",  "2026-03-11", "14:00"),
  mkReg(0, 0, "regreso_alimentos", "2026-03-11", "14:58"),
  mkReg(0, 0, "salida",            "2026-03-11", "17:00"),

  mkReg(1, 0, "entrada",           "2026-03-11", "08:08"),
  mkReg(1, 0, "salida_alimentos",  "2026-03-11", "14:00"),
  mkReg(1, 0, "regreso_alimentos", "2026-03-11", "15:00"),
  mkReg(1, 0, "salida",            "2026-03-11", "17:00"),

  mkReg(3, 0, "entrada",           "2026-03-11", "08:00"),
  mkReg(3, 0, "salida_alimentos",  "2026-03-11", "14:00"),
  mkReg(3, 0, "regreso_alimentos", "2026-03-11", "15:00"),
  mkReg(3, 0, "salida",            "2026-03-11", "17:00"),

  mkReg(5, 0, "entrada",           "2026-03-11", "08:00"),
  mkReg(5, 0, "salida_alimentos",  "2026-03-11", "14:00"),
  mkReg(5, 0, "regreso_alimentos", "2026-03-11", "15:00"),
  mkReg(5, 0, "salida",            "2026-03-11", "17:00"),

  // 12 mar (jue) ─ Ana (completo), Carlos (parcial), Sofía (completo), Luis (completo), Roberto (⚠️ salida tarde)
  mkReg(0, 0, "entrada",           "2026-03-12", "08:03"),
  mkReg(0, 0, "salida_alimentos",  "2026-03-12", "14:00"),
  mkReg(0, 0, "regreso_alimentos", "2026-03-12", "15:00"),
  mkReg(0, 0, "salida",            "2026-03-12", "17:00"),

  mkReg(1, 0, "entrada",           "2026-03-12", "08:00"),
  mkReg(1, 0, "salida_alimentos",  "2026-03-12", "14:00"),
  // Carlos sin regreso ni salida el jue 12

  mkReg(2, 1, "entrada",           "2026-03-12", "08:00"),
  mkReg(2, 1, "salida_alimentos",  "2026-03-12", "14:05"),
  mkReg(2, 1, "regreso_alimentos", "2026-03-12", "15:00"),
  mkReg(2, 1, "salida",            "2026-03-12", "17:00"),

  mkReg(3, 0, "entrada",           "2026-03-12", "08:00"),
  mkReg(3, 0, "salida_alimentos",  "2026-03-12", "14:00"),
  mkReg(3, 0, "regreso_alimentos", "2026-03-12", "15:00"),
  mkReg(3, 0, "salida",            "2026-03-12", "17:00"),

  mkReg(5, 0, "entrada",           "2026-03-12", "08:00"),
  mkReg(5, 0, "salida_alimentos",  "2026-03-12", "14:00"),
  mkReg(5, 0, "regreso_alimentos", "2026-03-12", "15:00"),
  mkReg(5, 0, "salida",            "2026-03-12", "19:30", true, "Cierre de inventario mensual"),
];

// ─── Auditoría ────────────────────────────────────────────────────────────────
let auditLog = [];
const MAX_AUDIT_LOG = 10000; // keep last 10k entries in memory

const createAuditEntry = (data) => {
  const entry = {
    id: newId(),
    timestamp: new Date().toISOString(),
    ...data,
  };
  auditLog.unshift(entry); // most recent first
  if (auditLog.length > MAX_AUDIT_LOG) auditLog = auditLog.slice(0, MAX_AUDIT_LOG);
  scheduleDatabaseSync();
  return entry;
};

const getAuditLog = (filtros = {}) => {
  let lista = [...auditLog];
  if (filtros.usuarioId) lista = lista.filter((e) => e.usuarioId === filtros.usuarioId);
  if (filtros.accion)    lista = lista.filter((e) => e.accion && e.accion.toLowerCase().includes(filtros.accion.toLowerCase()));
  if (filtros.desde)     lista = lista.filter((e) => e.timestamp >= filtros.desde);
  if (filtros.hasta)     lista = lista.filter((e) => e.timestamp <= filtros.hasta + "T23:59:59.999Z");
  if (filtros.metodo)    lista = lista.filter((e) => e.metodo === filtros.metodo.toUpperCase());
  const total = lista.length;
  const page  = parseInt(filtros.page  || 1, 10);
  const limit = parseInt(filtros.limit || 50, 10);
  const items = lista.slice((page - 1) * limit, page * limit);
  return { total, page, limit, items };
};

// ─── Configuración de empresa ─────────────────────────────────────────────────
let empresaConfig = {
  nombre:      "Control de Acceso",
  razonSocial: "",
  rfc:         "",
  domicilio:   "",
  telefono:    "",
  email:       "",
  logoUrl:     null,
  actualizadoEn: null,
};

const getEmpresaConfig = () => ({ ...empresaConfig });
const updateEmpresaConfig = (data) => {
  empresaConfig = { ...empresaConfig, ...data, actualizadoEn: new Date().toISOString() };
  scheduleDatabaseSync();
  return empresaConfig;
};

// ─────────────────────────────────────────────────────────────────────────────
// API del store — Puestos
// ─────────────────────────────────────────────────────────────────────────────

const getPuestos = (soloActivos = true) =>
  soloActivos ? puestos.filter((p) => p.activo) : puestos;

const getPuestoById = (id) => puestos.find((p) => p.id === id) || null;

const createPuesto = (data) => {
  const nuevo = { id: newId(), activo: true, creadoEn: new Date().toISOString(), ...data };
  puestos.push(nuevo);
  refreshLegacyPuestos();
  scheduleDatabaseSync();
  return nuevo;
};

const updatePuesto = (id, data) => {
  const idx = puestos.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  puestos[idx] = { ...puestos[idx], ...data };
  refreshLegacyPuestos();
  scheduleDatabaseSync();
  return puestos[idx];
};

const deletePuesto = (id) => {
  const idx = puestos.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  puestos[idx].activo = false;
  refreshLegacyPuestos();
  scheduleDatabaseSync();
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// API del store — Horarios
// ─────────────────────────────────────────────────────────────────────────────

const getHorarios = (soloActivos = true) =>
  soloActivos ? horarios.filter((h) => h.activo) : horarios;

const getHorarioById = (id) => horarios.find((h) => h.id === id) || null;

const createHorario = (data) => {
  const nuevo = { id: newId(), activo: true, creadoEn: new Date().toISOString(), ...data };
  horarios.push(nuevo);
  scheduleDatabaseSync();
  return nuevo;
};

const updateHorario = (id, data) => {
  const idx = horarios.findIndex((h) => h.id === id);
  if (idx === -1) return null;
  horarios[idx] = { ...horarios[idx], ...data };
  scheduleDatabaseSync();
  return horarios[idx];
};

const deleteHorario = (id) => {
  const idx = horarios.findIndex((h) => h.id === id);
  if (idx === -1) return false;
  horarios[idx].activo = false;
  scheduleDatabaseSync();
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// API del store — Sucursales
// ─────────────────────────────────────────────────────────────────────────────

const getSucursales = () => sucursales;
const getSucursalById = (id) => sucursales.find((s) => s.id === id) || null;

const createSucursal = (data) => {
  const nueva = { id: newId(), creadoEn: new Date().toISOString(), ...data };
  sucursales.push(nueva);
  scheduleDatabaseSync();
  return nueva;
};

const updateSucursal = (id, data) => {
  const idx = sucursales.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  sucursales[idx] = { ...sucursales[idx], ...data };
  scheduleDatabaseSync();
  return sucursales[idx];
};

const deleteSucursal = (id) => {
  const idx = sucursales.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  sucursales[idx].activa = false;
  scheduleDatabaseSync();
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// API del store — Usuarios
// ─────────────────────────────────────────────────────────────────────────────

const getUsuarios = (filtros = {}) => {
  let resultado = usuarios.map(({ password, ...u }) => u);
  if (filtros.sucursalId) resultado = resultado.filter((u) => u.sucursalId === filtros.sucursalId);
  if (filtros.rol) resultado = resultado.filter((u) => u.rol === filtros.rol);
  if (filtros.grupoId) resultado = resultado.filter((u) => u.grupoId === filtros.grupoId);
  if (filtros.activo !== undefined) resultado = resultado.filter((u) => u.activo === filtros.activo);
  if (filtros.tipo) resultado = resultado.filter((u) => u.tipo === filtros.tipo);
  return resultado;
};

const getUsuarioById = (id) => usuarios.find((u) => u.id === id) || null;
const getUsuarioByEmail = (email) => usuarios.find((u) => u.email === email) || null;

const createUsuario = (data) => {
  const nuevo = {
    id: newId(),
    grupoId: null,
    horarioId: null,
    activo: true,
    creadoEn: new Date().toISOString(),
    ...data,
  };
  usuarios.push(nuevo);
  scheduleDatabaseSync();
  const { password, ...sin } = nuevo;
  return sin;
};

const updateUsuario = (id, data) => {
  const idx = usuarios.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  usuarios[idx] = { ...usuarios[idx], ...data };
  scheduleDatabaseSync();
  const { password, ...sin } = usuarios[idx];
  return sin;
};

const deleteUsuario = (id) => {
  const idx = usuarios.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  usuarios[idx].activo = false;
  scheduleDatabaseSync();
  return true;
};

/**
 * Devuelve todos los supervisores que tienen visibilidad sobre una sucursal:
 * - Supervisores cuyo campo sucursalId coincide directamente, O
 * - Supervisores cuyo grupo de sucursales incluye la sucursal indicada.
 */
const getSupervisoresDeSucursal = (sucursalId) => {
  const directos = usuarios.filter(
    (u) => u.activo && u.rol === "supervisor_sucursales" && u.sucursalId === sucursalId
  );
  // Supervisores asignados a grupos que contienen esta sucursal
  const gruposConSucursal = grupos.filter(
    (g) => g.activo && Array.isArray(g.sucursalIds) && g.sucursalIds.includes(sucursalId)
  );
  const idsEnGrupos = gruposConSucursal.map((g) => g.supervisorId);
  const deGrupos = usuarios.filter(
    (u) => u.activo && u.rol === "supervisor_sucursales" && idsEnGrupos.includes(u.id)
  );
  // Unir sin duplicados
  const todos = [...directos];
  deGrupos.forEach((s) => { if (!todos.find((t) => t.id === s.id)) todos.push(s); });
  return todos;
};

/** Devuelve los grupos activos que contienen la sucursal indicada */
const getGruposBySucursalId = (sucursalId) =>
  grupos.filter(
    (g) => g.activo && Array.isArray(g.sucursalIds) && g.sucursalIds.includes(sucursalId)
  );

// ─────────────────────────────────────────────────────────────────────────────
// API del store — Grupos
// ─────────────────────────────────────────────────────────────────────────────

const getGrupos = (filtros = {}) => {
  let resultado = grupos.filter((g) => g.activo);
  if (filtros.supervisorId) resultado = resultado.filter((g) => g.supervisorId === filtros.supervisorId);
  // filtro por sucursal: busca grupos que contengan esa sucursal en su array
  if (filtros.sucursalId)
    resultado = resultado.filter(
      (g) => Array.isArray(g.sucursalIds) && g.sucursalIds.includes(filtros.sucursalId)
    );
  return resultado;
};

const getGrupoById = (id) => grupos.find((g) => g.id === id) || null;

const createGrupo = (data) => {
  const nuevo = {
    id: newId(),
    sucursalIds: [],   // grupo de sucursales
    activo: true,
    creadoEn: new Date().toISOString(),
    ...data,
  };
  grupos.push(nuevo);
  scheduleDatabaseSync();
  return nuevo;
};

const updateGrupo = (id, data) => {
  const idx = grupos.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  grupos[idx] = { ...grupos[idx], ...data };
  scheduleDatabaseSync();
  return grupos[idx];
};

const deleteGrupo = (id) => {
  const idx = grupos.findIndex((g) => g.id === id);
  if (idx === -1) return false;
  grupos[idx].activo = false;
  scheduleDatabaseSync();
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// API del store — Tipos de Incidencia
// ─────────────────────────────────────────────────────────────────────────────

const getTiposIncidencia = (soloActivos = true) =>
  soloActivos ? tiposIncidencia.filter((t) => t.activo) : tiposIncidencia;

const getTipoIncidenciaById = (id) => tiposIncidencia.find((t) => t.id === id) || null;

const createTipoIncidencia = (data) => {
  const nuevo = { id: newId(), activo: true, creadoEn: new Date().toISOString(), ...data };
  tiposIncidencia.push(nuevo);
  scheduleDatabaseSync();
  return nuevo;
};

const updateTipoIncidencia = (id, data) => {
  const idx = tiposIncidencia.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tiposIncidencia[idx] = { ...tiposIncidencia[idx], ...data };
  scheduleDatabaseSync();
  return tiposIncidencia[idx];
};

const deleteTipoIncidencia = (id) => {
  const idx = tiposIncidencia.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  tiposIncidencia[idx].activo = false;
  scheduleDatabaseSync();
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// API del store — Incidencias
// ─────────────────────────────────────────────────────────────────────────────

const getIncidencias = (filtros = {}) => {
  let resultado = [...incidencias];
  if (filtros.usuarioId) resultado = resultado.filter((i) => i.usuarioId === filtros.usuarioId);
  if (filtros.sucursalId) resultado = resultado.filter((i) => i.sucursalId === filtros.sucursalId);
  // Filtro por array de sucursales (usado por supervisor con múltiples sucursales en su grupo)
  if (Array.isArray(filtros.sucursalIds) && filtros.sucursalIds.length > 0)
    resultado = resultado.filter((i) => filtros.sucursalIds.includes(i.sucursalId));
  if (filtros.estado) resultado = resultado.filter((i) => i.estado === filtros.estado);
  if (filtros.tipoIncidenciaId) resultado = resultado.filter((i) => i.tipoIncidenciaId === filtros.tipoIncidenciaId);
  if (filtros.supervisorId) resultado = resultado.filter((i) => i.supervisorId === filtros.supervisorId);
  return resultado.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
};

const getIncidenciaById = (id) => incidencias.find((i) => i.id === id) || null;

const createIncidencia = (data) => {
  const nueva = {
    id: newId(),
    estado: "pendiente",
    supervisorId: null,
    comentarioSupervisor: null,
    revisadoEn: null,
    archivoUrl: null,
    archivoNombre: null,
    archivoMime: null,
    creadoEn: new Date().toISOString(),
    ...data,
  };
  incidencias.push(nueva);
  scheduleDatabaseSync();
  return nueva;
};

const updateIncidencia = (id, data) => {
  const idx = incidencias.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  incidencias[idx] = { ...incidencias[idx], ...data };
  scheduleDatabaseSync();
  return incidencias[idx];
};

// ─────────────────────────────────────────────────────────────────────────────
// API del store — Aclaraciones de horario
// ─────────────────────────────────────────────────────────────────────────────

const getAclaraciones = (filtros = {}) => {
  let resultado = [...aclaraciones];
  if (filtros.usuarioId) resultado = resultado.filter((a) => a.usuarioId === filtros.usuarioId);
  if (filtros.estado) resultado = resultado.filter((a) => a.estado === filtros.estado);
  if (filtros.supervisorId) resultado = resultado.filter((a) => a.supervisorId === filtros.supervisorId);
  return resultado.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
};

const getAclaracionById = (id) => aclaraciones.find((a) => a.id === id) || null;

const createAclaracion = (data) => {
  const nueva = {
    id: newId(),
    estado: "pendiente",
    supervisorId: null,
    comentarioSupervisor: null,
    revisadoEn: null,
    creadoEn: new Date().toISOString(),
    ...data,
  };
  aclaraciones.push(nueva);
  scheduleDatabaseSync();
  return nueva;
};

const updateAclaracion = (id, data) => {
  const idx = aclaraciones.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  aclaraciones[idx] = { ...aclaraciones[idx], ...data };
  scheduleDatabaseSync();
  return aclaraciones[idx];
};

// ─────────────────────────────────────────────────────────────────────────────
// API del store — Notificaciones
// ─────────────────────────────────────────────────────────────────────────────

const getNotificaciones = (filtros = {}) => {
  let resultado = [...notificaciones];
  if (filtros.paraUsuarioId) resultado = resultado.filter((n) => n.paraUsuarioId === filtros.paraUsuarioId);
  if (filtros.leida !== undefined) resultado = resultado.filter((n) => n.leida === filtros.leida);
  return resultado.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
};

const getNotificacionById = (id) => notificaciones.find((n) => n.id === id) || null;

const createNotificacion = (data) => {
  const nueva = {
    id: newId(),
    leida: false,
    referenciaId: null,
    creadoEn: new Date().toISOString(),
    ...data,
  };
  notificaciones.push(nueva);
  scheduleDatabaseSync();
  return nueva;
};

const updateNotificacion = (id, data) => {
  const idx = notificaciones.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  notificaciones[idx] = { ...notificaciones[idx], ...data };
  scheduleDatabaseSync();
  return notificaciones[idx];
};

const marcarTodasLeidas = (paraUsuarioId) => {
  notificaciones = notificaciones.map((n) =>
    n.paraUsuarioId === paraUsuarioId ? { ...n, leida: true } : n
  );
  scheduleDatabaseSync();
};

// ─────────────────────────────────────────────────────────────────────────────
// API del store — Registros de acceso
// ─────────────────────────────────────────────────────────────────────────────

const getRegistros = (filtros = {}) => {
  let resultado = [...registros];
  if (filtros.usuarioId) resultado = resultado.filter((r) => r.usuarioId === filtros.usuarioId);
  if (filtros.sucursalId) resultado = resultado.filter((r) => r.sucursalId === filtros.sucursalId);
  if (filtros.fecha) resultado = resultado.filter((r) => r.fecha === filtros.fecha);
  if (filtros.tipo) resultado = resultado.filter((r) => r.tipo === filtros.tipo);
  if (filtros.fechaInicio) resultado = resultado.filter((r) => r.fecha >= filtros.fechaInicio);
  if (filtros.fechaFin) resultado = resultado.filter((r) => r.fecha <= filtros.fechaFin);
  if (filtros.esManual !== undefined) resultado = resultado.filter((r) => r.esManual === filtros.esManual);
  if (filtros.estadoAprobacion) resultado = resultado.filter((r) => r.estadoAprobacion === filtros.estadoAprobacion);
  return resultado.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
};

const getRegistroById = (id) => registros.find((r) => r.id === id) || null;

const createRegistro = (data) => {
  const nuevo = {
    id: newId(),
    esManual: false,
    captadoPor: null,
    editadoManual: false,
    editadoPor: null,
    editadoEn: null,
    motivoEdicionManual: "",
    manualOriginal: null,
    estadoAprobacion: null,
    aprobadoPor: null,
    aprobadoEn: null,
    creadoEn: new Date().toISOString(),
    ...data,
  };
  registros.push(nuevo);
  scheduleDatabaseSync();
  return nuevo;
};

const updateRegistro = (id, data) => {
  const idx = registros.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  registros[idx] = { ...registros[idx], ...data };
  scheduleDatabaseSync();
  return registros[idx];
};

/** Obtiene los registros de un usuario para hoy */
const getRegistrosHoyDeUsuario = (usuarioId) => {
  const hoy = new Date().toISOString().split("T")[0];
  return registros
    .filter((r) => r.usuarioId === usuarioId && r.fecha === hoy)
    .sort((a, b) => a.hora.localeCompare(b.hora));
};

/** Determina el siguiente tipo de registro pendiente */
const getSiguienteRegistro = (usuarioId) => {
  const orden = [
    TIPOS_REGISTRO.ENTRADA,
    TIPOS_REGISTRO.SALIDA_ALIMENTOS,
    TIPOS_REGISTRO.REGRESO_ALIMENTOS,
    TIPOS_REGISTRO.SALIDA,
  ];
  const hechos = getRegistrosHoyDeUsuario(usuarioId).map((r) => r.tipo);
  return orden.find((t) => !hechos.includes(t)) || null;
};

/** Obtiene el último registro del usuario (cualquier día) para validar cooldown */
const getLastRegistroDeUsuario = (usuarioId) => {
  const regsUsuario = registros
    .filter((r) => r.usuarioId === usuarioId)
    .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
  return regsUsuario[0] || null;
};

/** Obtiene registros en rango de fechas para cálculo de minutos trabajados */
const getRegistrosByDateRange = (usuarioId, fechaInicio, fechaFin) => {
  return registros
    .filter(
      (r) =>
        r.usuarioId === usuarioId &&
        r.fecha >= fechaInicio &&
        r.fecha <= fechaFin
    )
    .sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
      return a.hora.localeCompare(b.hora);
    });
};

const updateModulosDeRol = (rol, modulos) => {
  if (!configuracionRoles[rol]) return false;
  configuracionRoles[rol] = Array.isArray(modulos) ? modulos : [];
  scheduleDatabaseSync();
  return true;
};

const getDatabaseStatus = () => ({
  enabled: databaseState.enabled,
  connected: databaseState.connected,
  database: databaseState.database,
  tables: Array.from(databaseState.tables),
  lastSyncAt: databaseState.lastSyncAt,
  lastError: databaseState.lastError,
});

const initializeFromDatabase = async () => {
  if (!DB_ENABLED || !pool) {
    databaseState.enabled = false;
    return getDatabaseStatus();
  }

  try {
    await testConnection();
    databaseState.connected = true;
    databaseState.lastError = null;
    databaseState.tables = await getExistingTables();
    await loadDatabaseSnapshot();
    await persistDatabaseSnapshot();
    databaseState.lastSyncAt = new Date().toISOString();
    lastRefreshAt = Date.now();
  } catch (error) {
    trackDatabaseError(error);
  }

  return getDatabaseStatus();
};

const loadDatabaseSnapshot = async () => {
  if (!databaseState.connected) return;

  if (hasTable("empresa_config")) {
    const [rows] = await pool.query(
      `SELECT nombre, razon_social AS razonSocial, rfc, domicilio, telefono, email,
              logo_url AS logoUrl, updated_at AS actualizadoEn
       FROM empresa_config
       WHERE id = 1
       LIMIT 1`
    );
    if (rows[0]) empresaConfig = { ...empresaConfig, ...rows[0] };
  }

  if (hasTable("modulos")) {
    const [rows] = await pool.query(
      `SELECT clave AS \`key\`, nombre AS label
       FROM modulos
       WHERE activo = 1
       ORDER BY orden_menu, nombre`
    );
    if (rows.length > 0) {
      MODULOS_SISTEMA.splice(0, MODULOS_SISTEMA.length, ...rows);
    }
  }

  if (hasTable("rol_modulo")) {
    const rolesBase = Object.fromEntries(Object.keys(configuracionRoles).map((rol) => [rol, []]));
    const [rows] = await pool.query(
      `SELECT rol_clave AS rol, modulo_clave AS modulo
       FROM rol_modulo
       ORDER BY rol_clave, modulo_clave`
    );
    rows.forEach((row) => {
      if (!rolesBase[row.rol]) rolesBase[row.rol] = [];
      rolesBase[row.rol].push(row.modulo);
    });
    configuracionRoles = { ...configuracionRoles, ...rolesBase };
  }

  if (hasTable("horarios")) {
    const [horarioRows] = await pool.query(
      `SELECT id, nombre, hora_entrada AS horaEntrada, hora_salida AS horaSalida,
              hora_salida_alimentos AS horaSalidaAlimentos,
              hora_regreso_alimentos AS horaRegresoAlimentos,
              tolerancia_minutos AS toleranciaMinutos, activo, created_at AS creadoEn
       FROM horarios`
    );
    const diasPorHorario = {};
    if (hasTable("horario_dias")) {
      const [diasRows] = await pool.query(
        `SELECT horario_id AS horarioId, dia_semana AS diaSemana
         FROM horario_dias
         ORDER BY horario_id, dia_semana`
      );
      diasRows.forEach((row) => {
        if (!diasPorHorario[row.horarioId]) diasPorHorario[row.horarioId] = [];
        diasPorHorario[row.horarioId].push(Number(row.diaSemana));
      });
    }
    if (horarioRows.length > 0) {
      horarios = horarioRows.map((row) => ({
        ...row,
        activo: toBool(row.activo, true),
        diasLaborales: diasPorHorario[row.id] || [],
      }));
    }
  }

  if (hasTable("puestos")) {
    const [puestosRows] = await pool.query(
      `SELECT id, nombre, descripcion, horario_id AS horarioId, activo, created_at AS creadoEn
       FROM puestos`
    );
    const camposPorPuesto = {};
    if (hasTable("puesto_campos_extra")) {
      const [camposRows] = await pool.query(
        `SELECT id, puesto_id AS puestoId, nombre, tipo,
                opciones_json AS opciones, obligatorio, orden_visual AS ordenVisual, activo
         FROM puesto_campos_extra
         ORDER BY puesto_id, orden_visual, nombre`
      );
      camposRows.forEach((row) => {
        if (!camposPorPuesto[row.puestoId]) camposPorPuesto[row.puestoId] = [];
        camposPorPuesto[row.puestoId].push({
          id: row.id,
          nombre: row.nombre,
          tipo: row.tipo,
          opciones: parseJson(row.opciones, []),
          obligatorio: toBool(row.obligatorio),
          ordenVisual: Number(row.ordenVisual || 0),
          activo: toBool(row.activo, true),
        });
      });
    }
    if (puestosRows.length > 0) {
      puestos = puestosRows.map((row) => ({
        ...row,
        activo: toBool(row.activo, true),
        camposExtra: camposPorPuesto[row.id] || [],
      }));
      refreshLegacyPuestos();
    }
  }

  if (hasTable("sucursales")) {
    const [rows] = await pool.query(
      `SELECT id, nombre, direccion, ciudad, estado, latitud, longitud,
              radio_metros AS radio, activa, created_at AS creadoEn
       FROM sucursales`
    );
    if (rows.length > 0) {
      sucursales = rows.map((row) => ({
        id: row.id,
        nombre: row.nombre,
        direccion: row.direccion || "",
        ciudad: row.ciudad || "",
        estado: row.estado || "",
        activa: toBool(row.activa, true),
        geocerca: {
          latitud: Number(row.latitud),
          longitud: Number(row.longitud),
          radio: Number(row.radio || 0),
        },
        creadoEn: toIsoString(row.creadoEn, new Date().toISOString()),
      }));
    }
  }

  if (hasTable("usuarios")) {
    const [rows] = await pool.query(
      `SELECT id, nombre, apellido, email, password_hash AS password, sexo, edad, telefono,
              rol_clave AS rol, tipo_usuario AS tipo, departamento, datos_extra_json AS datosExtra,
              puesto_id AS puestoId, sucursal_id AS sucursalId, horario_id AS horarioId,
              grupo_id AS grupoId, foto_url AS fotoUrl, activo, created_at AS creadoEn
       FROM usuarios`
    );
    if (rows.length > 0) {
      usuarios = rows.map((row) => ({
        ...row,
        edad: Number(row.edad || 0),
        activo: toBool(row.activo, true),
        datosExtra: parseJson(row.datosExtra, null),
        creadoEn: toIsoString(row.creadoEn, new Date().toISOString()),
      }));
    }
  }

  if (hasTable("grupos")) {
    const [groupRows] = await pool.query(
      `SELECT id, nombre, supervisor_id AS supervisorId, activo, created_at AS creadoEn
       FROM grupos`
    );
    const sucursalesPorGrupo = {};
    if (hasTable("grupo_sucursales")) {
      const [groupBranchRows] = await pool.query(
        `SELECT grupo_id AS grupoId, sucursal_id AS sucursalId
         FROM grupo_sucursales
         ORDER BY grupo_id, sucursal_id`
      );
      groupBranchRows.forEach((row) => {
        if (!sucursalesPorGrupo[row.grupoId]) sucursalesPorGrupo[row.grupoId] = [];
        sucursalesPorGrupo[row.grupoId].push(row.sucursalId);
      });
    }
    if (groupRows.length > 0) {
      grupos = groupRows.map((row) => ({
        ...row,
        activo: toBool(row.activo, true),
        sucursalIds: sucursalesPorGrupo[row.id] || [],
        creadoEn: toIsoString(row.creadoEn, new Date().toISOString()),
      }));
    }
  }

  if (hasTable("tipos_incidencia")) {
    const [rows] = await pool.query(
      `SELECT id, nombre, descripcion, requiere_archivo AS requiereArchivo, activo, created_at AS creadoEn
       FROM tipos_incidencia`
    );
    if (rows.length > 0) {
      tiposIncidencia = rows.map((row) => ({
        ...row,
        requiereArchivo: toBool(row.requiereArchivo),
        activo: toBool(row.activo, true),
        creadoEn: toIsoString(row.creadoEn, new Date().toISOString()),
      }));
    }
  }

  if (hasTable("incidencias")) {
    const [rows] = await pool.query(
      `SELECT id, usuario_id AS usuarioId, sucursal_id AS sucursalId, tipo_incidencia_id AS tipoIncidenciaId,
              descripcion, estado, supervisor_id AS supervisorId,
              comentario_supervisor AS comentarioSupervisor, revisado_en AS revisadoEn,
              archivo_url AS archivoUrl, archivo_nombre AS archivoNombre,
              archivo_mime AS archivoMime, created_at AS creadoEn
       FROM incidencias`
    );
    if (rows.length > 0) {
      incidencias = rows.map((row) => ({
        ...row,
        creadoEn: toIsoString(row.creadoEn, new Date().toISOString()),
        revisadoEn: toIsoString(row.revisadoEn),
      }));
    }
  }

  if (hasTable("aclaraciones")) {
    const [rows] = await pool.query(
      `SELECT id, usuario_id AS usuarioId, registro_id AS registroId,
              fecha_registro AS fechaRegistro, tipo_registro AS tipoRegistro,
              motivo, estado, supervisor_id AS supervisorId,
              comentario_supervisor AS comentarioSupervisor, revisado_en AS revisadoEn,
              created_at AS creadoEn
       FROM aclaraciones`
    );
    if (rows.length > 0) {
      aclaraciones = rows.map((row) => ({
        ...row,
        creadoEn: toIsoString(row.creadoEn, new Date().toISOString()),
        revisadoEn: toIsoString(row.revisadoEn),
      }));
    }
  }

  if (hasTable("notificaciones")) {
    const [rows] = await pool.query(
      `SELECT id, para_usuario_id AS paraUsuarioId, de_usuario_id AS deUsuarioId, tipo, titulo, mensaje,
              referencia_id AS referenciaId, leida, created_at AS creadoEn
       FROM notificaciones`
    );
    if (rows.length > 0) {
      notificaciones = rows.map((row) => ({
        ...row,
        leida: toBool(row.leida),
        creadoEn: toIsoString(row.creadoEn, new Date().toISOString()),
      }));
    }
  }

  if (hasTable("registros")) {
    const [rows] = await pool.query(
      `SELECT id, usuario_id AS usuarioId, sucursal_id AS sucursalId, tipo, fecha, hora,
              latitud, longitud, dentro_geocerca AS dentroGeocerca, distancia_al_centro AS distanciaAlCentro,
              es_manual AS esManual, justificacion,
              fuera_de_horario AS fueraDeHorario, motivo_fuera_horario AS motivoFueraHorario,
              captado_por AS captadoPor,
              estado_aprobacion AS estadoAprobacion, aprobado_por AS aprobadoPor, aprobado_en AS aprobadoEn,
              comentario_supervisor AS comentarioSupervisor, editado_manual AS editadoManual,
              editado_por AS editadoPor, editado_en AS editadoEn,
              motivo_edicion_manual AS motivoEdicionManual, manual_original_json AS manualOriginal,
              created_at AS creadoEn
       FROM registros`
    );
    if (rows.length > 0) {
      registros = rows.map((row) => ({
        ...row,
        latitud: row.latitud !== null ? Number(row.latitud) : null,
        longitud: row.longitud !== null ? Number(row.longitud) : null,
        dentroGeocerca: row.dentroGeocerca !== null ? toBool(row.dentroGeocerca) : null,
        distanciaAlCentro: row.distanciaAlCentro !== null ? Number(row.distanciaAlCentro) : null,
        esManual: toBool(row.esManual),
        fueraDeHorario: toBool(row.fueraDeHorario),
        motivoFueraHorario: row.motivoFueraHorario || null,
        editadoManual: toBool(row.editadoManual),
        manualOriginal: parseJson(row.manualOriginal, null),
        creadoEn: toIsoString(row.creadoEn, new Date().toISOString()),
        aprobadoEn: toIsoString(row.aprobadoEn),
        editadoEn: toIsoString(row.editadoEn),
      }));
    }
  }

  if (hasTable("auditoria_eventos")) {
    const [rows] = await pool.query(
      `SELECT id, usuario_id AS usuarioId, usuario_nombre AS usuarioNombre, usuario_rol AS usuarioRol,
              accion, metodo, ruta, status_code AS statusCode, exito, ip,
              detalles_json AS detalles, created_at AS timestamp
       FROM auditoria_eventos
       ORDER BY created_at DESC
       LIMIT ?`,
      [MAX_AUDIT_LOG]
    );
    if (rows.length > 0) {
      auditLog = rows.map((row) => ({
        ...row,
        exito: toBool(row.exito, true),
        detalles: parseJson(row.detalles, null),
        timestamp: toIsoString(row.timestamp, new Date().toISOString()),
      }));
    }
  }
};

const persistDatabaseSnapshot = async () => {
  if (!databaseState.connected || !pool) return;

  const connection = await pool.getConnection();
  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    await connection.beginTransaction();

    if (hasTable("empresa_config")) {
      await connection.query(
        `REPLACE INTO empresa_config
          (id, nombre, razon_social, rfc, domicilio, telefono, email, logo_url, updated_at)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          empresaConfig.nombre || "Control de Acceso",
          empresaConfig.razonSocial || null,
          empresaConfig.rfc || null,
          empresaConfig.domicilio || null,
          empresaConfig.telefono || null,
          empresaConfig.email || null,
          empresaConfig.logoUrl || null,
        ]
      );
    }

    if (hasTable("roles")) {
      await connection.query("DELETE FROM roles");
      for (const [clave, nombre] of Object.entries(ROLE_DEFINITIONS)) {
        await connection.query(
          `INSERT INTO roles (clave, nombre, descripcion, activo, created_at, updated_at)
           VALUES (?, ?, NULL, 1, NOW(), NOW())`,
          [clave, nombre]
        );
      }
    }

    if (hasTable("modulos")) {
      await connection.query("DELETE FROM modulos");
      for (let index = 0; index < MODULOS_SISTEMA.length; index += 1) {
        const modulo = MODULOS_SISTEMA[index];
        await connection.query(
          `INSERT INTO modulos (clave, nombre, descripcion, orden_menu, activo, created_at, updated_at)
           VALUES (?, ?, NULL, ?, 1, NOW(), NOW())`,
          [modulo.key, modulo.label, (index + 1) * 10]
        );
      }
    }

    if (hasTable("rol_modulo")) {
      await connection.query("DELETE FROM rol_modulo");
      for (const [rol, modulos] of Object.entries(configuracionRoles)) {
        for (const modulo of modulos) {
          await connection.query(
            `INSERT INTO rol_modulo (rol_clave, modulo_clave, created_at)
             VALUES (?, ?, NOW())`,
            [rol, modulo]
          );
        }
      }
    }

    if (hasTable("horario_dias")) await connection.query("DELETE FROM horario_dias");
    if (hasTable("horarios")) {
      await connection.query("DELETE FROM horarios");
      for (const horario of horarios) {
        await connection.query(
          `INSERT INTO horarios
            (id, nombre, hora_entrada, hora_salida_alimentos, hora_regreso_alimentos, hora_salida,
             tolerancia_minutos, activo, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            horario.id,
            horario.nombre,
            horario.horaEntrada,
            horario.horaSalidaAlimentos || null,
            horario.horaRegresoAlimentos || null,
            horario.horaSalida,
            Number(horario.toleranciaMinutos || 0),
            horario.activo ? 1 : 0,
            toMySqlDateTime(horario.creadoEn, toMySqlDateTime(new Date())),
          ]
        );

        if (hasTable("horario_dias")) {
          for (const dia of horario.diasLaborales || []) {
            await connection.query(
              `INSERT INTO horario_dias (horario_id, dia_semana) VALUES (?, ?)`,
              [horario.id, Number(dia)]
            );
          }
        }
      }
    }

    if (hasTable("puesto_campos_extra")) await connection.query("DELETE FROM puesto_campos_extra");
    if (hasTable("puestos")) {
      await connection.query("DELETE FROM puestos");
      for (const puesto of puestos) {
        await connection.query(
          `INSERT INTO puestos
            (id, nombre, descripcion, horario_id, activo, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            puesto.id,
            puesto.nombre,
            puesto.descripcion || "",
            puesto.horarioId || null,
            puesto.activo ? 1 : 0,
            toMySqlDateTime(puesto.creadoEn, toMySqlDateTime(new Date())),
          ]
        );

        if (hasTable("puesto_campos_extra")) {
          for (let index = 0; index < (puesto.camposExtra || []).length; index += 1) {
            const campo = puesto.camposExtra[index];
            await connection.query(
              `INSERT INTO puesto_campos_extra
                (id, puesto_id, nombre, tipo, opciones_json, obligatorio, orden_visual, activo, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                campo.id || newId(),
                puesto.id,
                campo.nombre,
                campo.tipo,
                JSON.stringify(campo.opciones || []),
                campo.obligatorio ? 1 : 0,
                Number(campo.ordenVisual ?? index),
                campo.activo === false ? 0 : 1,
              ]
            );
          }
        }
      }
    }

    if (hasTable("sucursales")) {
      await connection.query("DELETE FROM sucursales");
      for (const sucursal of sucursales) {
        await connection.query(
          `INSERT INTO sucursales
            (id, nombre, direccion, ciudad, estado, latitud, longitud, radio_metros, activa, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            sucursal.id,
            sucursal.nombre,
            sucursal.direccion || "",
            sucursal.ciudad || "",
            sucursal.estado || "",
            Number(sucursal.geocerca?.latitud || 0),
            Number(sucursal.geocerca?.longitud || 0),
            Number(sucursal.geocerca?.radio || 0),
            sucursal.activa ? 1 : 0,
            toMySqlDateTime(sucursal.creadoEn, toMySqlDateTime(new Date())),
          ]
        );
      }
    }

    if (hasTable("grupo_sucursales")) await connection.query("DELETE FROM grupo_sucursales");
    if (hasTable("grupos")) {
      await connection.query("DELETE FROM grupos");
      for (const grupo of grupos) {
        await connection.query(
          `INSERT INTO grupos (id, nombre, supervisor_id, activo, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            grupo.id,
            grupo.nombre,
            grupo.supervisorId,
            grupo.activo ? 1 : 0,
            toMySqlDateTime(grupo.creadoEn, toMySqlDateTime(new Date())),
          ]
        );

        if (hasTable("grupo_sucursales")) {
          for (const sucursalId of grupo.sucursalIds || []) {
            await connection.query(
              `INSERT INTO grupo_sucursales (grupo_id, sucursal_id, created_at)
               VALUES (?, ?, NOW())`,
              [grupo.id, sucursalId]
            );
          }
        }
      }
    }

    if (hasTable("usuarios")) {
      await connection.query("DELETE FROM usuarios");
      for (const usuario of usuarios) {
        await connection.query(
          `INSERT INTO usuarios
            (id, nombre, apellido, email, password_hash, sexo, edad, telefono,
             rol_clave, tipo_usuario, departamento, datos_extra_json,
             puesto_id, sucursal_id, horario_id, grupo_id, foto_url, activo, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            usuario.id,
            usuario.nombre,
            usuario.apellido || "",
            usuario.email,
            usuario.password,
            usuario.sexo,
            Number(usuario.edad || 0),
            usuario.telefono || null,
            usuario.rol,
            usuario.tipo || "sucursal",
            usuario.departamento || null,
            usuario.datosExtra ? JSON.stringify(usuario.datosExtra) : null,
            usuario.puestoId || null,
            usuario.sucursalId || null,
            usuario.horarioId || null,
            usuario.grupoId || null,
            usuario.fotoUrl || null,
            usuario.activo ? 1 : 0,
            toMySqlDateTime(usuario.creadoEn, toMySqlDateTime(new Date())),
          ]
        );
      }
    }

    if (hasTable("tipos_incidencia")) {
      await connection.query("DELETE FROM tipos_incidencia");
      for (const tipo of tiposIncidencia) {
        await connection.query(
          `INSERT INTO tipos_incidencia
            (id, nombre, descripcion, requiere_archivo, activo, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            tipo.id,
            tipo.nombre,
            tipo.descripcion || "",
            tipo.requiereArchivo ? 1 : 0,
            tipo.activo ? 1 : 0,
            toMySqlDateTime(tipo.creadoEn, toMySqlDateTime(new Date())),
          ]
        );
      }
    }

    if (hasTable("incidencias")) {
      await connection.query("DELETE FROM incidencias");
      for (const incidencia of incidencias) {
        await connection.query(
          `INSERT INTO incidencias
            (id, usuario_id, sucursal_id, tipo_incidencia_id, descripcion, estado, supervisor_id,
             comentario_supervisor, revisado_en, archivo_url, archivo_nombre, archivo_mime, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            incidencia.id,
            incidencia.usuarioId,
            incidencia.sucursalId || null,
            incidencia.tipoIncidenciaId,
            incidencia.descripcion || null,
            incidencia.estado || "pendiente",
            incidencia.supervisorId || null,
            incidencia.comentarioSupervisor || null,
            toMySqlDateTime(incidencia.revisadoEn),
            incidencia.archivoUrl || null,
            incidencia.archivoNombre || null,
            incidencia.archivoMime || null,
            toMySqlDateTime(incidencia.creadoEn, toMySqlDateTime(new Date())),
          ]
        );
      }
    }

    if (hasTable("aclaraciones")) {
      await connection.query("DELETE FROM aclaraciones");
      for (const aclaracion of aclaraciones) {
        await connection.query(
          `INSERT INTO aclaraciones
            (id, usuario_id, registro_id, fecha_registro, tipo_registro, motivo, estado,
             supervisor_id, comentario_supervisor, revisado_en, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            aclaracion.id,
            aclaracion.usuarioId,
            aclaracion.registroId || null,
            aclaracion.fechaRegistro,
            aclaracion.tipoRegistro,
            aclaracion.motivo,
            aclaracion.estado || "pendiente",
            aclaracion.supervisorId || null,
            aclaracion.comentarioSupervisor || null,
            toMySqlDateTime(aclaracion.revisadoEn),
            toMySqlDateTime(aclaracion.creadoEn, toMySqlDateTime(new Date())),
          ]
        );
      }
    }

    if (hasTable("notificaciones")) {
      await connection.query("DELETE FROM notificaciones");
      for (const notificacion of notificaciones) {
        await connection.query(
          `INSERT INTO notificaciones
            (id, para_usuario_id, de_usuario_id, tipo, titulo, mensaje, referencia_id, leida, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            notificacion.id,
            notificacion.paraUsuarioId,
            notificacion.deUsuarioId || null,
            notificacion.tipo,
            notificacion.titulo,
            notificacion.mensaje,
            notificacion.referenciaId || null,
            notificacion.leida ? 1 : 0,
            toMySqlDateTime(notificacion.creadoEn, toMySqlDateTime(new Date())),
          ]
        );
      }
    }

    if (hasTable("registros")) {
      await connection.query("DELETE FROM registros");
      for (const registro of registros) {
        await connection.query(
          `INSERT INTO registros
            (id, usuario_id, sucursal_id, tipo, fecha, hora, latitud, longitud, dentro_geocerca,
             distancia_al_centro, es_manual, justificacion, fuera_de_horario, motivo_fuera_horario,
             captado_por, estado_aprobacion,
             aprobado_por, aprobado_en, comentario_supervisor, editado_manual, editado_por,
             editado_en, motivo_edicion_manual, manual_original_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            registro.id,
            registro.usuarioId,
            registro.sucursalId,
            registro.tipo,
            registro.fecha,
            registro.hora,
            registro.latitud,
            registro.longitud,
            registro.dentroGeocerca === null ? null : (registro.dentroGeocerca ? 1 : 0),
            registro.distanciaAlCentro ?? null,
            registro.esManual ? 1 : 0,
            registro.justificacion || registro.motivoFueraHorario || null,
            registro.fueraDeHorario ? 1 : 0,
            registro.motivoFueraHorario || null,
            registro.captadoPor || null,
            registro.estadoAprobacion || null,
            registro.aprobadoPor || null,
            toMySqlDateTime(registro.aprobadoEn),
            registro.comentarioSupervisor || null,
            registro.editadoManual ? 1 : 0,
            registro.editadoPor || null,
            toMySqlDateTime(registro.editadoEn),
            registro.motivoEdicionManual || null,
            registro.manualOriginal ? JSON.stringify(registro.manualOriginal) : null,
            toMySqlDateTime(registro.creadoEn, toMySqlDateTime(new Date())),
          ]
        );
      }
    }

    if (hasTable("auditoria_eventos")) {
      await connection.query("DELETE FROM auditoria_eventos");
      for (const evento of auditLog) {
        await connection.query(
          `INSERT INTO auditoria_eventos
            (id, usuario_id, usuario_nombre, usuario_rol, accion, metodo, ruta,
             status_code, exito, ip, detalles_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            evento.id,
            evento.usuarioId || null,
            evento.usuarioNombre || null,
            evento.usuarioRol || null,
            evento.accion,
            evento.metodo,
            evento.ruta,
            Number(evento.statusCode || 200),
            evento.exito ? 1 : 0,
            evento.ip || null,
            evento.detalles ? JSON.stringify(evento.detalles) : null,
            toMySqlDateTime(evento.timestamp, toMySqlDateTime(new Date())),
          ]
        );
      }
    }

    await connection.commit();
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    databaseState.lastError = null;
    databaseState.connected = true;
  } catch (error) {
    await connection.rollback();
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    throw error;
  } finally {
    connection.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Exportaciones
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  PUESTOS, // backwards-compat
  TIPOS_REGISTRO,
  initializeFromDatabase,
  refreshFromDatabaseIfNeeded,
  getDatabaseStatus,
  // Puestos
  getPuestos,
  getPuestoById,
  createPuesto,
  updatePuesto,
  deletePuesto,
  // Horarios
  getHorarios,
  getHorarioById,
  createHorario,
  updateHorario,
  deleteHorario,
  // Sucursales
  getSucursales,
  getSucursalById,
  createSucursal,
  updateSucursal,
  deleteSucursal,
  // Usuarios
  getUsuarios,
  getUsuarioById,
  getUsuarioByEmail,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getSupervisoresDeSucursal,
  // Configuración de roles
  MODULOS_SISTEMA,
  getConfiguracionRoles: () => ({ ...configuracionRoles }),
  getModulosDeRol: (rol) => configuracionRoles[rol] || [],
  updateModulosDeRol,
  // Grupos
  getGrupos,
  getGrupoById,
  getGruposBySucursalId,
  createGrupo,
  updateGrupo,
  deleteGrupo,
  // Tipos de incidencia
  getTiposIncidencia,
  getTipoIncidenciaById,
  createTipoIncidencia,
  updateTipoIncidencia,
  deleteTipoIncidencia,
  // Incidencias
  getIncidencias,
  getIncidenciaById,
  createIncidencia,
  updateIncidencia,
  // Aclaraciones
  getAclaraciones,
  getAclaracionById,
  createAclaracion,
  updateAclaracion,
  // Notificaciones
  getNotificaciones,
  getNotificacionById,
  createNotificacion,
  updateNotificacion,
  marcarTodasLeidas,
  // Registros
  getRegistros,
  getRegistroById,
  createRegistro,
  updateRegistro,
  getRegistrosHoyDeUsuario,
  getSiguienteRegistro,
  getLastRegistroDeUsuario,
  getRegistrosByDateRange,
  // Auditoría
  createAuditEntry,
  getAuditLog,
  // Configuración de empresa
  getEmpresaConfig,
  updateEmpresaConfig,
};
