/**
 * gen_presentation.js
 * Genera la presentación ejecutiva de Kronos para Alta Dirección (14 diapositivas).
 * Salida: Kronos_Presentacion_Directivos.pptx
 */

const PptxGenJS = require("pptxgenjs");
const pptx = new PptxGenJS();

pptx.layout  = "LAYOUT_WIDE";
pptx.author  = "Kronos Platform";
pptx.company = "Kronos — Sistema de Control de Acceso y Asistencia";
pptx.subject = "Presentación Ejecutiva — Alta Dirección";
pptx.title   = "Kronos — Presentación Ejecutiva";

// ── Colores Kronos ────────────────────────────────────────────────────────────
const NAVY  = "004269";
const GREEN = "77B328";
const WHITE = "FFFFFF";
const LGRAY = "EAF2F8";
const MGRAY = "8BA0B4";
const DGRAY = "1A2F3E";

// ── Helpers ───────────────────────────────────────────────────────────────────
const navyFill  = () => ({ type: "solid", color: NAVY });
const greenFill = () => ({ type: "solid", color: GREEN });
const whiteFill = () => ({ type: "solid", color: WHITE });
const lightFill = () => ({ type: "solid", color: LGRAY });

const navyBg  = (slide) => { slide.background = { color: NAVY  }; };
const lightBg = (slide) => { slide.background = { color: LGRAY }; };
const whiteBg = (slide) => { slide.background = { color: WHITE }; };

let slideCount = 0;

/** Franja superior azul con línea verde */
function addTopBar(slide, title, subtitle = "") {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1.1, fill: navyFill() });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 1.1, w: "100%", h: 0.06, fill: greenFill() });
  slide.addText(title, {
    x: 0.4, y: 0.1, w: 8, h: 0.55,
    fontSize: 22, bold: true, color: WHITE, fontFace: "Calibri",
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.4, y: 0.65, w: 7, h: 0.35,
      fontSize: 11, color: GREEN, fontFace: "Calibri",
    });
  }
  slide.addText("KRONOS", {
    x: 8.8, y: 0.18, w: 2.4, h: 0.4,
    fontSize: 18, bold: true, color: GREEN, fontFace: "Calibri", align: "right",
  });
}

function addSlide() {
  slideCount++;
  return pptx.addSlide();
}

/** Tarjeta con borde redondeado */
function card(slide, x, y, w, h, title, body, opts = {}) {
  const bg = opts.bg || WHITE;
  const tc = opts.titleColor || NAVY;
  const bc = opts.bodyColor  || "333333";
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { type: "solid", color: bg },
    line: { color: opts.lineColor || "C8D8E8", width: 1 },
    rectRadius: 0.08,
  });
  if (title) {
    slide.addText(title, {
      x: x + 0.12, y: y + 0.1, w: w - 0.24, h: 0.32,
      fontSize: opts.titleSize || 11, bold: true, color: tc, fontFace: "Calibri",
    });
  }
  if (body) {
    slide.addText(body, {
      x: x + 0.12, y: y + (title ? 0.44 : 0.12), w: w - 0.24, h: h - (title ? 0.58 : 0.24),
      fontSize: opts.bodySize || 9.5, color: bc, fontFace: "Calibri",
      valign: "top", wrap: true,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — PORTADA
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  navyBg(s);
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.12, h: "100%", fill: greenFill() });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 6.8, w: "100%", h: 0.6,  fill: greenFill() });

  s.addText("KRONOS", { x: 0.5, y: 2.0, w: 6, h: 1.3, fontSize: 72, bold: true, color: WHITE, fontFace: "Calibri" });
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 3.25, w: 5, h: 0.07, fill: greenFill() });
  s.addText("Sistema de Control de Acceso\ny Gestión de Asistencia", {
    x: 0.5, y: 3.4, w: 7.5, h: 0.85, fontSize: 18, color: GREEN, fontFace: "Calibri", bold: true,
  });
  s.addText("Presentación Ejecutiva — Alta Dirección", {
    x: 0.5, y: 4.35, w: 8, h: 0.45, fontSize: 13, color: "A0BCCC", fontFace: "Calibri",
  });
  s.addText("Versión 1.0  ·  2025", { x: 0.5, y: 6.88, w: 5, h: 0.3, fontSize: 10, color: NAVY, fontFace: "Calibri" });
  s.addText("Documento Confidencial — Distribución Interna", { x: 4.5, y: 6.88, w: 6.5, h: 0.3, fontSize: 10, color: NAVY, fontFace: "Calibri", align: "right" });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — AGENDA
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  whiteBg(s);
  addTopBar(s, "Contenido de la presentación", "Resumen ejecutivo de la plataforma Kronos");

  const items = [
    "01  ¿Qué es Kronos?",              "08  Monitoreo y salud en tiempo real",
    "02  Problemática que resuelve",    "09  Seguridad empresarial",
    "03  Arquitectura tecnológica",     "10  Beneficios para la organización",
    "04  12 módulos integrados",        "11  Hoja de ruta",
    "05  7 perfiles de usuario",        "12  Entregables del proyecto",
    "06  Flujo de registro diario",     "13  Cierre",
    "07  Reportes y exportación",       "",
  ];

  const half = 7;
  items.slice(0, half).forEach((item, i) => {
    if (!item) return;
    s.addShape(pptx.ShapeType.rect, { x: 0.55, y: 1.3 + i * 0.52, w: 0.06, h: 0.28, fill: greenFill() });
    s.addText(item, { x: 0.7, y: 1.3 + i * 0.52, w: 4.5, h: 0.4, fontSize: 11.5, color: NAVY, fontFace: "Calibri" });
  });
  items.slice(half, 14).forEach((item, i) => {
    if (!item) return;
    s.addShape(pptx.ShapeType.rect, { x: 5.8, y: 1.3 + i * 0.52, w: 0.06, h: 0.28, fill: greenFill() });
    s.addText(item, { x: 5.95, y: 1.3 + i * 0.52, w: 5.3, h: 0.4, fontSize: 11.5, color: NAVY, fontFace: "Calibri" });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — ¿QUÉ ES KRONOS?
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  whiteBg(s);
  addTopBar(s, "¿Qué es Kronos?", "Plataforma digital de gestión de asistencia y control de acceso");

  s.addShape(pptx.ShapeType.rect, { x: 0, y: 1.18, w: 4.1, h: 5.85, fill: navyFill() });
  s.addText("KRONOS es una plataforma web empresarial que digitaliza y automatiza el control de asistencia del personal, eliminando los procesos manuales y proporcionando datos en tiempo real para la toma de decisiones.", {
    x: 0.2, y: 1.4, w: 3.7, h: 2.2, fontSize: 11, color: WHITE, fontFace: "Calibri", wrap: true,
  });
  s.addText("Control preciso.\nDecisiones inteligentes.", {
    x: 0.2, y: 5.95, w: 3.7, h: 0.9, fontSize: 13, bold: true, color: GREEN, fontFace: "Calibri",
  });

  const features = [
    { ico: "📍", t: "Validación GPS automática",    d: "Geovallas configurables por sucursal" },
    { ico: "⏱️", t: "Registro en tiempo real",       d: "WebSockets para notificaciones instantáneas" },
    { ico: "📊", t: "Reportes inteligentes",          d: "Asistencia, minutos trabajados, incidencias" },
    { ico: "🔐", t: "Seguridad empresarial",          d: "JWT, bcrypt, RBAC con 7 roles" },
    { ico: "🖥️", t: "Monitoreo con gráfica de dona",  d: "Dashboard de salud en tiempo real" },
    { ico: "📱", t: "100% web responsive",            d: "Sin instalación de apps adicionales" },
  ];

  features.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 4.3 + col * 3.1, y = 1.4 + row * 1.55;
    card(s, x, y, 2.95, 1.4, `${f.ico}  ${f.t}`, f.d,
      { bg: LGRAY, lineColor: "C8D8E8", titleSize: 10, bodySize: 9 });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — PROBLEMÁTICA
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  whiteBg(s);
  addTopBar(s, "Del control manual a la gestión digital", "Transformación del proceso de asistencia");

  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.4, w: 4.9, h: 0.46, fill: { type: "solid", color: "D32F2F" } });
  s.addText("❌  ANTES — Proceso Manual", { x: 0.35, y: 1.43, w: 4.8, h: 0.38, fontSize: 12, bold: true, color: WHITE, fontFace: "Calibri" });
  [
    "Registro en papel o Excel, propenso a errores y alteraciones",
    "Sin validación de ubicación — registros falsos indetectables",
    "Reportes manuales tardíos, información siempre desactualizada",
    "Sin trazabilidad de cambios ni historial de modificaciones",
    "Proceso de nómina con errores por datos incorrectos o faltantes",
    "Sin visibilidad del estado de asistencia en tiempo real",
  ].forEach((t, i) => {
    s.addText(`•  ${t}`, { x: 0.5, y: 1.97 + i * 0.42, w: 4.7, h: 0.36, fontSize: 9.5, color: "333333", fontFace: "Calibri" });
  });

  s.addText("➜", { x: 5.3, y: 3.75, w: 0.8, h: 0.7, fontSize: 32, color: GREEN, align: "center" });

  s.addShape(pptx.ShapeType.rect, { x: 6.2, y: 1.4, w: 5.1, h: 0.46, fill: { type: "solid", color: "2E7D32" } });
  s.addText("✅  AHORA — Con Kronos", { x: 6.25, y: 1.43, w: 5, h: 0.38, fontSize: 12, bold: true, color: WHITE, fontFace: "Calibri" });
  [
    "Registro digital con validación GPS obligatoria en cada evento",
    "Geovallas por sucursal — imposible registrar fuera del área",
    "Reportes automatizados en PDF, Excel y CSV al instante",
    "Auditoría completa: usuario, rol, IP, fecha y hora exacta",
    "Datos precisos para nómina: minutos trabajados, incidencias",
    "Dashboard y mapa con presencia activa del personal en tiempo real",
  ].forEach((t, i) => {
    s.addText(`✓  ${t}`, { x: 6.35, y: 1.97 + i * 0.42, w: 4.9, h: 0.36, fontSize: 9.5, color: "1a3a1a", fontFace: "Calibri" });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — ARQUITECTURA TECNOLÓGICA
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  lightBg(s);
  addTopBar(s, "Arquitectura tecnológica", "Stack moderno, escalable y de código abierto — sin licencias privativas");

  const cols = [
    { title: "🖥️  Frontend",   color: "1565C0", bg: "E3F2FD", items: ["React 18 + Vite", "React Router DOM v6", "Socket.io Client", "CSS Variables (Dark/Light)", "Geolocation API", "SVG Charts (sin librerías)"] },
    { title: "⚙️  Backend",    color: "2E7D32", bg: "E8F5E9", items: ["Node.js + Express.js", "Socket.io WebSockets", "JWT (jsonwebtoken)", "bcryptjs (hash seguro)", "Nodemailer (email reset)", "Multer (archivos)"] },
    { title: "🗄️  Datos",      color: "6A1B9A", bg: "F3E5F5", items: ["MySQL 8.x", "mysql2 driver", "Store dual-mode (mem+BD)", "Modo offline (sin MySQL)", "Sync async con cola", "UUID como IDs únicos"] },
    { title: "🚀  Despliegue", color: "E65100", bg: "FFF3E0", items: ["Nginx (proxy reverso)", "PM2 (proceso Node.js)", "HTTPS / SSL", "Variables .env por entorno", "Logs del servidor", "Estático desde /dist"] },
  ];

  cols.forEach((col, i) => {
    const x = 0.3 + i * 2.85;
    s.addShape(pptx.ShapeType.rect, { x, y: 1.3, w: 2.65, h: 0.42, fill: { type: "solid", color: col.color } });
    s.addText(col.title, { x: x + 0.1, y: 1.33, w: 2.5, h: 0.35, fontSize: 10, bold: true, color: WHITE, fontFace: "Calibri" });
    s.addShape(pptx.ShapeType.rect, { x, y: 1.72, w: 2.65, h: 5, fill: { type: "solid", color: col.bg }, line: { color: "CCCCCC", width: 0.5 } });
    col.items.forEach((item, j) => {
      s.addText(`• ${item}`, { x: x + 0.14, y: 1.85 + j * 0.62, w: 2.4, h: 0.52, fontSize: 9, color: "222222", fontFace: "Calibri", wrap: true });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — 12 MÓDULOS
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  whiteBg(s);
  addTopBar(s, "12 módulos completamente integrados", "Solución end-to-end para la gestión de asistencia laboral");

  const mods = [
    { ico: "📊", t: "Dashboard",        d: "Registro GPS + estadísticas del día" },
    { ico: "📡", t: "Eventos",          d: "Matriz de asistencia + edición manual" },
    { ico: "📋", t: "Incidencias",      d: "Solicitud y aprobación de permisos" },
    { ico: "📈", t: "Reportes",         d: "PDF, Excel y CSV en tiempo real" },
    { ico: "🏢", t: "Sucursales",       d: "Geocercas, horarios y tolerancias" },
    { ico: "👥", t: "Empleados",        d: "Alta, edición y gestión de usuarios" },
    { ico: "🔗", t: "Grupos",           d: "Agrupación de sucursales por zona" },
    { ico: "🗺️", t: "Mapa",            d: "Presencia activa en tiempo real" },
    { ico: "⚙️", t: "Administración",  d: "Empresa, roles, puestos, tipos incid." },
    { ico: "🔍", t: "Auditoría",        d: "Historial completo e inmutable" },
    { ico: "🖥️", t: "Logs / Salud",    d: "Dona SVG + métricas del servidor" },
    { ico: "🔔", t: "Notificaciones",  d: "Alertas en tiempo real (WebSocket)" },
  ];

  mods.forEach((m, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.25 + col * 2.95, y = 1.35 + row * 1.68;
    card(s, x, y, 2.75, 1.52, `${m.ico}  ${m.t}`, m.d,
      { bg: LGRAY, lineColor: "C0D5E8", titleColor: NAVY, titleSize: 10.5, bodySize: 9 });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — 7 ROLES
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  whiteBg(s);
  addTopBar(s, "7 perfiles de usuario con acceso diferenciado", "Control granular por módulo y por sucursal");

  const roles = [
    { ico: "👑", rol: "Super Administrador",       color: "F57C00", mods: 12, desc: "Acceso total. Configura empresa, roles, módulos, usuarios, auditoría y logs." },
    { ico: "🔧", rol: "Agente de Soporte TI",       color: "1565C0", mods: 11, desc: "Gestión técnica de usuarios y monitoreo de salud y logs del sistema." },
    { ico: "🏢", rol: "Supervisor de Sucursales",   color: "2E7D32", mods:  9, desc: "Aprueba registros e incidencias. Genera reportes de sus sucursales." },
    { ico: "📋", rol: "Agente Control Asistencia",  color: "6A1B9A", mods:  8, desc: "Captura manual de registros y generación de reportes." },
    { ico: "📊", rol: "Visor de Reportes",          color: "D32F2F", mods:  4, desc: "Solo lectura. Consulta reportes y métricas sin modificar datos." },
    { ico: "👨‍⚕️", rol: "Médico Titular",             color: "00838F", mods:  3, desc: "Registro de asistencia. Puede trabajar en múltiples sucursales." },
    { ico: "🩺", rol: "Médico de Guardia",           color: "558B2F", mods:  3, desc: "Registro en la sucursal de guardia asignada por el día." },
  ];

  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.3, w: 10.9, h: 0.38, fill: navyFill() });
  ["Rol", "Descripción", "Módulos"].forEach((h, i) => {
    const xs = [0.3, 3.5, 10.3];
    s.addText(h, { x: xs[i] + 0.1, y: 1.34, w: [3.1, 6.7, 0.85][i], h: 0.3, fontSize: 10, bold: true, color: WHITE, fontFace: "Calibri" });
  });

  roles.forEach((r, i) => {
    const y = 1.68 + i * 0.64;
    s.addShape(pptx.ShapeType.rect, {
      x: 0.3, y, w: 10.9, h: 0.58,
      fill: { type: "solid", color: i % 2 === 0 ? LGRAY : WHITE },
      line: { color: "D0E0EC", width: 0.5 },
    });
    s.addText(`${r.ico}  ${r.rol}`, { x: 0.4, y: y + 0.08, w: 3.0, h: 0.42, fontSize: 10, bold: true, color: r.color, fontFace: "Calibri" });
    s.addText(r.desc, { x: 3.6, y: y + 0.08, w: 6.7, h: 0.42, fontSize: 9, color: "333333", fontFace: "Calibri", wrap: true });
    s.addText(`${r.mods}/12`, { x: 10.35, y: y + 0.08, w: 0.7, h: 0.42, fontSize: 11, bold: true, color: r.color, fontFace: "Calibri", align: "center" });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 8 — FLUJO DE REGISTRO DIARIO
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  lightBg(s);
  addTopBar(s, "Flujo de registro de asistencia diario", "4 eventos — reinicio automático a medianoche — cooldown por día");

  const steps = [
    { n: "1", t: "Entrada",          ico: "🟢", sub: "Al llegar al trabajo" },
    { n: "2", t: "Salida a comer",   ico: "🍽️", sub: "Inicio de pausa de alimentos" },
    { n: "3", t: "Regreso de comer", ico: "↩️", sub: "Regreso a actividades" },
    { n: "4", t: "Salida final",     ico: "🔴", sub: "Fin de jornada laboral" },
  ];

  steps.forEach((st, i) => {
    const x = 0.45 + i * 2.85;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.55, w: 2.65, h: 2.25, fill: navyFill(), line: { color: GREEN, width: 1.5 }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.ellipse, { x: x + 1.07, y: 1.6, w: 0.52, h: 0.52, fill: greenFill() });
    s.addText(st.n, { x: x + 1.07, y: 1.62, w: 0.52, h: 0.48, fontSize: 14, bold: true, color: WHITE, align: "center", fontFace: "Calibri" });
    s.addText(st.ico, { x, y: 2.2, w: 2.65, h: 0.55, fontSize: 30, align: "center" });
    s.addText(st.t, { x: x + 0.1, y: 2.82, w: 2.45, h: 0.35, fontSize: 11, bold: true, color: WHITE, align: "center", fontFace: "Calibri" });
    s.addText(st.sub, { x: x + 0.1, y: 3.2, w: 2.45, h: 0.46, fontSize: 8.5, color: "88C0D8", align: "center", fontFace: "Calibri" });
    if (i < 3) s.addText("→", { x: x + 2.68, y: 2.55, w: 0.42, h: 0.5, fontSize: 20, color: GREEN, align: "center" });
  });

  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 4.0, w: 10.9, h: 0.38, fill: navyFill() });
  s.addText("Validaciones automáticas en cada registro", { x: 0.4, y: 4.03, w: 10.7, h: 0.3, fontSize: 11, bold: true, color: WHITE, fontFace: "Calibri" });

  [
    "📍 Verificación GPS contra geovalla de la sucursal (radio configurable en metros)",
    "📅 Los 4 registros se reinician automáticamente cada día a medianoche",
    "⏱️ Cooldown de 1 hora entre registros — solo aplica dentro del mismo día",
    "🔔 Si hay irregularidad, se solicita justificación sin bloquear el registro",
    "📝 Registros de días anteriores NO son editables por el empleado",
    "✏️ Corrección solo por supervisor con trazabilidad en auditoría",
  ].forEach((v, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    s.addText(v, { x: 0.4 + col * 5.55, y: 4.5 + row * 0.44, w: 5.35, h: 0.38, fontSize: 9, color: "222222", fontFace: "Calibri" });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 9 — REPORTES
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  whiteBg(s);
  addTopBar(s, "Reportes y exportación de datos", "Información precisa para nómina y toma de decisiones");

  const reportes = [
    { ico: "📊", t: "Reporte de Asistencia",  d: "Entradas, salidas, ausencias y resumen por empleado. Filtrable por sucursal, grupo, período.", color: "1565C0", bg: "E3F2FD" },
    { ico: "⏱️", t: "Reporte de Minutos",      d: "Horas trabajadas, análisis de puntualidad y minutos de retraso acumulados por empleado.", color: "2E7D32", bg: "E8F5E9" },
    { ico: "📋", t: "Reporte de Incidencias",  d: "Historial de permisos, faltas y justificaciones con estado de aprobación del supervisor.", color: "E65100", bg: "FFF3E0" },
  ];

  reportes.forEach((r, i) => {
    const x = 0.3 + i * 3.7;
    s.addShape(pptx.ShapeType.rect, { x, y: 1.3, w: 3.5, h: 0.46, fill: { type: "solid", color: r.color } });
    s.addText(`${r.ico}  ${r.t}`, { x: x + 0.1, y: 1.33, w: 3.3, h: 0.38, fontSize: 11, bold: true, color: WHITE, fontFace: "Calibri" });
    s.addShape(pptx.ShapeType.rect, { x, y: 1.76, w: 3.5, h: 1.8, fill: { type: "solid", color: r.bg }, line: { color: "CCCCCC", width: 0.5 } });
    s.addText(r.d, { x: x + 0.15, y: 1.9, w: 3.2, h: 1.52, fontSize: 10, color: "333333", fontFace: "Calibri", wrap: true });
  });

  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 3.72, w: 10.9, h: 0.42, fill: navyFill() });
  s.addText("Formatos de exportación disponibles", { x: 0.4, y: 3.76, w: 10.7, h: 0.32, fontSize: 12, bold: true, color: WHITE, fontFace: "Calibri" });

  [
    { ico: "📄", t: "PDF Ejecutivo",  d: "Con logo corporativo, encabezados y paginación. Listo para presentar a dirección." },
    { ico: "📊", t: "Excel (.xlsx)", d: "Para análisis avanzado, tablas dinámicas y cruce con datos de nómina del ERP." },
    { ico: "📑", t: "CSV",           d: "Compatible con cualquier sistema de BI, ERP o análisis de datos externo." },
  ].forEach((f, i) => {
    card(s, 0.3 + i * 3.7, 4.26, 3.5, 2.5, `${f.ico}  ${f.t}`, f.d,
      { bg: LGRAY, lineColor: "B0C8DC", titleSize: 11, bodySize: 9.5 });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 10 — MONITOREO (LOGS + DONA)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  whiteBg(s);
  addTopBar(s, "Monitoreo y salud de la plataforma en tiempo real", "Dashboard técnico exclusivo para Super Admin y Soporte TI");

  s.addText("El módulo Logs / Salud proporciona visibilidad total del estado técnico del servidor con gráfica de dona interactiva y actualización automática cada 30 segundos.", {
    x: 0.3, y: 1.35, w: 11.1, h: 0.5, fontSize: 11, color: "333333", fontFace: "Calibri",
  });

  const metrics = [
    { ico: "⏱️", t: "Tiempo activo",      d: "Uptime desde el último reinicio" },
    { ico: "📡", t: "Peticiones HTTP",     d: "Total de requests procesados" },
    { ico: "🔴", t: "Errores última hora", d: "Contador de errores / 60 min" },
    { ico: "🧠", t: "Memoria RAM",         d: "Heap + RSS del proceso Node" },
    { ico: "🗄️", t: "Base de datos",       d: "Estado conexión MySQL live" },
  ];

  metrics.forEach((m, i) => {
    card(s, 0.3 + i * 2.25, 2.05, 2.1, 1.65, `${m.ico}  ${m.t}`, m.d,
      { bg: LGRAY, titleSize: 9.5, bodySize: 8.5 });
  });

  // Gráfica de dona
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 3.9, w: 5.3, h: 0.38, fill: navyFill() });
  s.addText("📊 Gráfica de dona SVG — Distribución de eventos por nivel", {
    x: 0.4, y: 3.93, w: 5.1, h: 0.3, fontSize: 10, bold: true, color: WHITE, fontFace: "Calibri",
  });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.3, y: 4.32, w: 5.3, h: 2.55, fill: lightFill(), line: { color: "C8D8E8", width: 0.5 }, rectRadius: 0.08 });
  s.addText("La gráfica interactiva muestra la distribución de eventos del buffer (máx 200) por nivel, con hover para ver el conteo y porcentaje de cada segmento.", {
    x: 0.45, y: 4.42, w: 5.0, h: 0.75, fontSize: 9, color: "333333", fontFace: "Calibri", wrap: true,
  });
  [
    { color: "D32F2F", label: "🔴  Errores críticos del servidor" },
    { color: "F57C00", label: "🟡  Advertencias del sistema" },
    { color: "1565C0", label: "🔵  Mensajes informativos" },
    { color: "43A047", label: "✅  Sin eventos (sistema limpio)" },
  ].forEach((li, i) => {
    s.addShape(pptx.ShapeType.rect, { x: 0.55, y: 5.22 + i * 0.34, w: 0.18, h: 0.18, fill: { type: "solid", color: li.color } });
    s.addText(li.label, { x: 0.8, y: 5.2 + i * 0.34, w: 4.6, h: 0.26, fontSize: 9, color: "333333", fontFace: "Calibri" });
  });

  // Estados
  s.addShape(pptx.ShapeType.rect, { x: 5.8, y: 3.9, w: 5.4, h: 0.38, fill: navyFill() });
  s.addText("🚦 Estados de salud del sistema", { x: 5.9, y: 3.93, w: 5.2, h: 0.3, fontSize: 10, bold: true, color: WHITE, fontFace: "Calibri" });
  [
    { s: "✅ Operativo",  c: "2E7D32", bg: "E8F5E9", d: "0–5 errores/hora y BD conectada" },
    { s: "⚠️ Degradado", c: "E65100", bg: "FFF3E0", d: ">5 errores/hora o BD desconectada" },
    { s: "🔴 Crítico",   c: "C62828", bg: "FFEBEE", d: ">20 errores/hora — acción inmediata" },
  ].forEach((e, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 5.8, y: 4.38 + i * 0.86, w: 5.35, h: 0.72, fill: { type: "solid", color: e.bg }, line: { color: e.c + "80", width: 1 }, rectRadius: 0.06 });
    s.addText(e.s, { x: 5.95, y: 4.44 + i * 0.86, w: 2.1, h: 0.56, fontSize: 11, bold: true, color: e.c, fontFace: "Calibri" });
    s.addText(e.d, { x: 8.05, y: 4.44 + i * 0.86, w: 3.0, h: 0.56, fontSize: 9, color: "333333", fontFace: "Calibri" });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 11 — SEGURIDAD
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  navyBg(s);
  addTopBar(s, "Seguridad de nivel empresarial", "Múltiples capas de protección para datos y accesos");

  [
    { ico: "🔑", t: "Autenticación JWT",         d: "Tokens firmados con expiración de 8 horas. Sin sesiones en el servidor." },
    { ico: "🔒", t: "bcryptjs (hash)",            d: "Contraseñas hasheadas con salt. Nunca almacenadas en texto plano." },
    { ico: "👥", t: "RBAC — 7 roles",             d: "Control de acceso por rol. 12 módulos configurables por perfil." },
    { ico: "📍", t: "Geovalla obligatoria",       d: "Validación GPS en cada registro. Imposible registrar fuera del área." },
    { ico: "🔍", t: "Auditoría completa",         d: "Cada acción registra usuario, rol, IP, fecha y hora exacta." },
    { ico: "📧", t: "Reset seguro de contraseña", d: "Token UUID de 1 hora por correo. Un solo uso. Anti-enumeración." },
  ].forEach((item, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.3 + col * 3.85, y = 1.5 + row * 2.3;
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 3.65, h: 2.1, fill: { type: "solid", color: "0A2A3E" }, line: { color: GREEN, width: 1 }, rectRadius: 0.08 });
    s.addText(item.ico, { x, y: y + 0.18, w: 3.65, h: 0.56, fontSize: 28, align: "center" });
    s.addText(item.t,   { x: x + 0.15, y: y + 0.78, w: 3.35, h: 0.38, fontSize: 11, bold: true, color: GREEN, align: "center", fontFace: "Calibri" });
    s.addText(item.d,   { x: x + 0.15, y: y + 1.18, w: 3.35, h: 0.78, fontSize: 9,  color: "A0BCCC", align: "center", fontFace: "Calibri", wrap: true });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 12 — BENEFICIOS
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  whiteBg(s);
  addTopBar(s, "Beneficios para la organización", "Impacto medible en eficiencia, costos y control operativo");

  [
    { ico: "💰", t: "Reducción de costos",    color: "2E7D32", bg: "E8F5E9", items: ["Elimina papel y procesos manuales", "Reduce errores en cálculo de nómina", "Sin inversión en hardware adicional"] },
    { ico: "⚡", t: "Mayor eficiencia",        color: "1565C0", bg: "E3F2FD", items: ["Reportes al instante (antes: días)", "Aprobaciones digitales sin desplazamientos", "Acceso desde cualquier dispositivo"] },
    { ico: "🔒", t: "Control y cumplimiento", color: "6A1B9A", bg: "F3E5F5", items: ["Imposible falsificar registros GPS", "Auditoría inmutable de todos los cambios", "Cumplimiento de normativas laborales"] },
    { ico: "📈", t: "Decisiones con datos",   color: "E65100", bg: "FFF3E0", items: ["Visibilidad de presencia en tiempo real", "KPIs de puntualidad por sucursal", "Tendencias históricas exportables"] },
  ].forEach((b, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.3 + col * 5.65, y = 1.45 + row * 2.85;
    s.addShape(pptx.ShapeType.rect, { x, y, w: 5.45, h: 0.46, fill: { type: "solid", color: b.color } });
    s.addText(`${b.ico}  ${b.t}`, { x: x + 0.12, y: y + 0.06, w: 5.2, h: 0.34, fontSize: 13, bold: true, color: WHITE, fontFace: "Calibri" });
    s.addShape(pptx.ShapeType.rect, { x, y: y + 0.46, w: 5.45, h: 2.26, fill: { type: "solid", color: b.bg }, line: { color: "CCCCCC", width: 0.5 } });
    b.items.forEach((item, j) => {
      s.addText(`✓  ${item}`, { x: x + 0.2, y: y + 0.62 + j * 0.58, w: 5.1, h: 0.5, fontSize: 10.5, color: "333333", fontFace: "Calibri" });
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 13 — ENTREGABLES
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  whiteBg(s);
  addTopBar(s, "Entregables del proyecto", "Documentación completa y plataforma lista para producción");

  [
    { ico: "🖥️", t: "Plataforma web Kronos",           d: "Frontend React + Backend Node.js + Base de datos MySQL configurada" },
    { ico: "📄", t: "Documentación técnica",            d: "Arquitectura, API REST, guía de instalación y mantenimiento (DOCX)" },
    { ico: "📊", t: "Presentación ejecutiva",           d: "Diapositivas para alta dirección (PPTX, 13 slides)" },
    { ico: "📋", t: "Acta de entrega formal",           d: "Documento oficial con inventario, criterios de aceptación y firmas (PDF)" },
    { ico: "📘", t: "Manual del empleado",              d: "Guía de uso paso a paso para registro de asistencia (PDF, 7 páginas)" },
    { ico: "📗", t: "Manual administrativo",            d: "Guía para supervisores, agentes y administradores (PDF, 9 páginas)" },
    { ico: "🔧", t: "Plantilla de configuración",       d: ".env.example con todas las variables de entorno documentadas" },
    { ico: "🚀", t: "Soporte de puesta en marcha",     d: "Configuración inicial, datos maestros y capacitación de primer acceso" },
  ].forEach((e, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.25 + col * 5.7, y = 1.38 + row * 1.42;
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.5, h: 1.28, fill: lightFill(), line: { color: "B0C8DC", width: 0.8 }, rectRadius: 0.07 });
    s.addText(`${e.ico}  ${e.t}`, { x: x + 0.14, y: y + 0.1, w: 5.2, h: 0.38, fontSize: 11, bold: true, color: NAVY, fontFace: "Calibri" });
    s.addText(e.d, { x: x + 0.14, y: y + 0.52, w: 5.2, h: 0.62, fontSize: 9, color: "444444", fontFace: "Calibri", wrap: true });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 14 — CIERRE
// ═══════════════════════════════════════════════════════════════════════════════
{
  const s = addSlide();
  navyBg(s);
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0,   w: 0.14, h: "100%", fill: greenFill() });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 6.82, w: "100%", h: 0.68, fill: greenFill() });

  s.addText("KRONOS", { x: 0.5, y: 1.5, w: 10.7, h: 1.4, fontSize: 72, bold: true, color: WHITE, fontFace: "Calibri", align: "center" });
  s.addText("Control preciso. Decisiones inteligentes.", { x: 0.5, y: 3.1, w: 10.7, h: 0.7, fontSize: 20, color: GREEN, fontFace: "Calibri", align: "center", bold: true });
  s.addText("Sistema de Control de Acceso y Gestión de Asistencia — Versión 1.0 — 2025", { x: 0.5, y: 3.95, w: 10.7, h: 0.4, fontSize: 11, color: "6090B0", fontFace: "Calibri", align: "center" });
  s.addText("Gracias", { x: 0.5, y: 6.88, w: 10.7, h: 0.42, fontSize: 14, bold: true, color: NAVY, fontFace: "Calibri", align: "center" });
}

// ── Guardar ───────────────────────────────────────────────────────────────────
const OUT = "C:/jestrada/Proyectos/access-control/docs/Kronos_Presentacion_Directivos.pptx";
pptx.writeFile({ fileName: OUT })
  .then(() => console.log("✅ Presentación guardada:", OUT))
  .catch((e) => { console.error("Error:", e); process.exit(1); });
