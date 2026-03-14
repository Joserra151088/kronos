/**
 * gen_admin_manual.js
 * Genera el manual de usuario para PERSONAL ADMINISTRATIVO / OPERATIVO de Kronos (PDFKit)
 * Salida: Kronos_Manual_Administrativo.pdf
 */

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "Kronos_Manual_Administrativo.pdf");

// ── Colores Kronos ────────────────────────────────────────────────────────────
const NAVY   = "#004269";
const GREEN  = "#77B328";
const LIGHT  = "#F0F7FF";
const GRAY   = "#5A6A7A";
const BORDER = "#C8D8E8";
const WHITE  = "#FFFFFF";
const DANGER = "#D32F2F";
const WARN   = "#F57C00";

const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
doc.pipe(fs.createWriteStream(OUT));

const W = 595.28;
const H = 841.89;
const M = 50;

// ─── Utilidades ───────────────────────────────────────────────────────────────

function pageNum() { return doc.bufferedPageRange().count; }

function header(title) {
  doc.rect(0, 0, W, 46).fill(NAVY);
  doc.fontSize(9).fillColor(WHITE).font("Helvetica")
    .text("KRONOS — Manual de Usuario · Personal Administrativo", M, 16, { width: W - M * 2 - 80, align: "left" });
  doc.text(`Pág. ${pageNum()}`, W - M - 80, 16, { width: 80, align: "right" });
  doc.rect(0, 46, W, 4).fill(GREEN);
  if (title) {
    doc.fontSize(13).font("Helvetica-Bold").fillColor(NAVY)
      .text(title, M, 66, { width: W - M * 2 });
  }
}

function footer() {
  const y = H - 30;
  doc.rect(0, y - 4, W, 1).fill(BORDER);
  doc.fontSize(8).fillColor(GRAY).font("Helvetica")
    .text("Kronos — Sistema de Control de Acceso y Asistencia  |  Manual del Personal Administrativo  |  Versión 1.0 — 2025", M, y, { width: W - M * 2, align: "center" });
}

function sectionTitle(text, y) {
  doc.rect(M, y, 4, 18).fill(GREEN);
  doc.fontSize(12).font("Helvetica-Bold").fillColor(NAVY)
    .text(text, M + 12, y + 1, { width: W - M * 2 - 12 });
  return y + 28;
}

function bullet(icon, text, y, indent = 0) {
  const x = M + indent;
  doc.fontSize(10).font("Helvetica").fillColor(NAVY).text(icon, x, y, { width: 18 });
  doc.fillColor("#222").text(text, x + 20, y, { width: W - M * 2 - 20 - indent });
  const h = doc.heightOfString(text, { width: W - M * 2 - 20 - indent });
  return y + Math.max(18, h + 4);
}

function infoBox(lines, y, color = LIGHT, borderColor = NAVY) {
  const textH = lines.reduce((s, l) => s + doc.heightOfString(l, { width: W - M * 2 - 32, fontSize: 10 }) + 4, 0) + 16;
  doc.roundedRect(M, y, W - M * 2, textH, 6).fill(color).stroke(borderColor);
  let ty = y + 10;
  lines.forEach(line => {
    doc.fontSize(10).font("Helvetica").fillColor("#1a2a3a").text(line, M + 16, ty, { width: W - M * 2 - 32 });
    ty += doc.heightOfString(line, { width: W - M * 2 - 32, fontSize: 10 }) + 4;
  });
  return y + textH + 10;
}

function tableHeader(cols, y, heights = 20) {
  doc.rect(M, y, W - M * 2, heights).fill(NAVY);
  let x = M;
  cols.forEach(([label, w]) => {
    doc.fontSize(9).font("Helvetica-Bold").fillColor(WHITE)
      .text(label, x + 6, y + (heights - 9) / 2, { width: w - 8 });
    x += w;
  });
  return y + heights;
}

function tableRow(cols, vals, y, i) {
  const maxH = vals.reduce((acc, v, idx) => {
    const h = doc.heightOfString(String(v || ""), { width: cols[idx][1] - 12, fontSize: 9 });
    return Math.max(acc, h);
  }, 0) + 10;
  doc.rect(M, y, W - M * 2, maxH).fill(i % 2 === 0 ? LIGHT : WHITE).stroke(BORDER);
  let x = M;
  vals.forEach((v, idx) => {
    doc.fontSize(9).font("Helvetica").fillColor("#222")
      .text(String(v || ""), x + 6, y + 5, { width: cols[idx][1] - 12 });
    x += cols[idx][1];
  });
  return y + maxH;
}

function newPage(title) {
  doc.addPage({ size: "A4", margin: 0 });
  header(title);
  footer();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PORTADA
// ═══════════════════════════════════════════════════════════════════════════════

doc.rect(0, 0, W, H).fill(NAVY);
doc.rect(0, 220, W, 6).fill(GREEN);
doc.rect(0, 520, W, 6).fill(GREEN);

doc.fontSize(72).fillColor(WHITE).font("Helvetica")
  .text("⚙️", W / 2 - 50, 90, { width: 100, align: "center" });

doc.fontSize(48).font("Helvetica-Bold").fillColor(WHITE)
  .text("KRONOS", M, 240, { width: W - M * 2, align: "center" });

doc.fontSize(14).font("Helvetica").fillColor(GREEN)
  .text("MANUAL DE USUARIO", M, 300, { width: W - M * 2, align: "center" });

doc.fontSize(22).font("Helvetica-Bold").fillColor(WHITE)
  .text("PERSONAL ADMINISTRATIVO", M, 330, { width: W - M * 2, align: "center" });

doc.fontSize(11).font("Helvetica").fillColor("#90B8D0")
  .text("Supervisores  ·  Agentes de Control de Asistencia  ·  Administradores  ·  Soporte TI", M, 364, { width: W - M * 2, align: "center" });

doc.rect(W / 2 - 120, 390, 240, 1).fill(GREEN);

doc.fontSize(10).fillColor("#90B8D0")
  .text("Gestión completa de asistencia, incidencias, reportes,", M, 402, { width: W - M * 2, align: "center" });
doc.text("usuarios, sucursales y configuración de la plataforma", M, 418, { width: W - M * 2, align: "center" });

doc.rect(M, 534, W - M * 2, 80).fill("#00000020").stroke("#1A4269");
doc.fontSize(9).font("Helvetica").fillColor("#8BB8D0")
  .text("Documento:", M + 20, 550)
  .text("Versión:", M + 20, 565)
  .text("Dirigido a:", M + 20, 580)
  .text("Fecha:", M + 20, 595);
doc.font("Helvetica-Bold").fillColor(WHITE)
  .text("Manual de Usuario — Personal Administrativo", 145, 550)
  .text("1.0", 145, 565)
  .text("Supervisores, Administradores y Soporte TI", 145, 580)
  .text("2025", 145, 595);

footer();

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 2 — ROLES Y ACCESOS
// ═══════════════════════════════════════════════════════════════════════════════

newPage("Roles y niveles de acceso");

let y = 100;
y = sectionTitle("Perfiles de usuario administrativo en Kronos", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("Kronos define 7 roles con permisos específicos. El presente manual cubre los roles con funciones de gestión y administración:", M, y, { width: W - M * 2 });
y += 22;

const roles = [
  { ico: "👑", rol: "Super Administrador", desc: "Acceso total. Configura empresa, roles, módulos, usuarios y visualiza auditoría y logs del sistema.", color: "#FFF3E0", border: "#F57C00" },
  { ico: "🔧", rol: "Agente de Soporte TI", desc: "Gestión técnica: administración de usuarios, visualización de logs de salud del sistema y soporte general.", color: "#E8F5E9", border: GREEN },
  { ico: "🏢", rol: "Supervisor de Sucursales", desc: "Aprueba registros e incidencias de su zona. Genera reportes de sus sucursales.", color: "#E3F2FD", border: "#1565C0" },
  { ico: "📋", rol: "Agente de Control de Asistencia", desc: "Captura y corrige registros manualmente. Genera y exporta reportes.", color: LIGHT, border: NAVY },
  { ico: "📊", rol: "Visor de Reportes", desc: "Solo lectura. Puede consultar reportes y métricas sin modificar datos.", color: "#F3E5F5", border: "#7B1FA2" },
];

roles.forEach(r => {
  const bh = 52;
  doc.roundedRect(M, y, W - M * 2, bh, 5).fill(r.color).stroke(r.border);
  doc.fontSize(20).text(r.ico, M + 10, y + 14, { width: 30 });
  doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY).text(r.rol, M + 46, y + 8, { width: W - M * 2 - 58 });
  doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(r.desc, M + 46, y + 24, { width: W - M * 2 - 58 });
  y += bh + 6;
});

y += 4;
y = infoBox([
  "⚙️ Los módulos accesibles para cada rol son configurables desde el panel de Administración → Roles y permisos.",
  "Solo el Super Administrador puede modificar qué módulos ve cada rol.",
], y, "#FFF8E1", WARN);

y = sectionTitle("Módulos disponibles para el personal administrativo", y);

const modulos = ["📊 Dashboard", "📡 Eventos", "📋 Incidencias", "📈 Reportes", "🏢 Sucursales", "👥 Empleados", "🔗 Grupos", "🗺️ Mapa", "⚙️ Administración", "🔍 Auditoría", "🖥️ Logs", "🔔 Notificaciones"];
const mw = (W - M * 2 - 8) / 3;
modulos.forEach((m, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const mx = M + col * (mw + 4);
  const my = y + row * 24;
  doc.roundedRect(mx, my, mw, 20, 4).fill(i % 2 === 0 ? LIGHT : WHITE).stroke(BORDER);
  doc.fontSize(9).font("Helvetica").fillColor(NAVY).text(m, mx + 8, my + 5, { width: mw - 12 });
});
y += Math.ceil(modulos.length / 3) * 24 + 12;

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 3 — DASHBOARD Y EVENTOS
// ═══════════════════════════════════════════════════════════════════════════════

newPage("Dashboard y módulo de Eventos");

y = 100;
y = sectionTitle("Panel de inicio (Dashboard)", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("El Dashboard es la pantalla principal de Kronos. Presenta un resumen del estado actual de la plataforma:", M, y, { width: W - M * 2 });
y += 22;

y = bullet("📊", "Estadísticas del día: total de entradas registradas, ausentes, incidencias pendientes", y);
y = bullet("👥", "Gráficas de asistencia por sucursal (dependiendo de tu rol)", y);
y = bullet("🔔", "Acceso rápido a notificaciones y alertas recientes", y);
y = bullet("📍", "Acceso al Mapa de presencia activa en tiempo real", y);
y += 10;

y = sectionTitle("Módulo de Eventos — Matriz de asistencia", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("La sección Eventos muestra una vista tipo matriz donde cada fila es un empleado y cada columna es un día del período seleccionado. Permite ver de un vistazo el estado de asistencia de todo el personal.", M, y, { width: W - M * 2 });
y += 32;

y = bullet("🔍", "Filtros disponibles: sucursal, grupo, rango de fechas, empleado específico", y);
y = bullet("📋", "Cada celda de la matriz muestra los registros del día (tipos y horas)", y);
y = bullet("✏️", "Doble clic en una celda para ver el detalle completo de los registros de ese día", y);
y = bullet("📝", "Clic en el botón de edición para agregar o corregir un registro manualmente", y);
y += 10;

y = infoBox([
  "⚠️ CORRECCIÓN MANUAL: Solo los Supervisores y Agentes de Control de Asistencia pueden agregar o modificar registros manualmente.",
  "Toda corrección queda registrada en la Auditoría del sistema con el nombre del operador que la realizó.",
], y, "#FFF8E1", WARN);

y += 4;
y = sectionTitle("Cómo agregar un registro manual", y);
y = bullet("1.", "Ve al módulo 'Eventos' y busca al empleado y la fecha.", y, 10);
y = bullet("2.", "Haz clic en el ícono de edición (✏️) en la celda del día.", y, 10);
y = bullet("3.", "Selecciona el tipo de evento (Entrada, Salida a comer, Regreso, Salida final).", y, 10);
y = bullet("4.", "Ingresa la hora y agrega una justificación en el campo de notas.", y, 10);
y = bullet("5.", "Guarda. El registro aparecerá marcado como 'Registro manual' en el sistema.", y, 10);
y += 6;

y = sectionTitle("Mapa de presencia activa", y);
doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("El módulo Mapa muestra en tiempo real la ubicación registrada de los empleados que han hecho check-in en el día. Cada sucursal aparece con su geovalla y el número de empleados presentes.", M, y, { width: W - M * 2 });

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 4 — GESTIÓN DE INCIDENCIAS
// ═══════════════════════════════════════════════════════════════════════════════

newPage("Gestión de incidencias");

y = 100;
y = sectionTitle("Flujo de aprobación de incidencias", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("Cuando un empleado reporta una incidencia, el supervisor o agente responsable recibe una notificación y debe revisarla:", M, y, { width: W - M * 2 });
y += 22;

// Flujo visual
const estados = [
  { ico: "🆕", label: "PENDIENTE", color: "#FFF8E1", border: WARN },
  { ico: "👁️", label: "EN REVISIÓN", color: "#E3F2FD", border: "#1565C0" },
  { ico: "✅", label: "APROBADA", color: "#E8F5E9", border: GREEN },
  { ico: "❌", label: "RECHAZADA", color: "#FFEBEE", border: DANGER },
];

const ew2 = (W - M * 2 - 12) / 4;
estados.forEach((e, i) => {
  const ex = M + i * (ew2 + 4);
  doc.roundedRect(ex, y, ew2, 56, 6).fill(e.color).stroke(e.border);
  doc.fontSize(20).text(e.ico, ex, y + 6, { width: ew2, align: "center" });
  doc.fontSize(8).font("Helvetica-Bold").fillColor(NAVY).text(e.label, ex + 4, y + 36, { width: ew2 - 8, align: "center" });
  if (i < 3) {
    doc.fontSize(14).fillColor(GRAY).text("→", ex + ew2, y + 18, { width: 16, align: "center" });
  }
});
y += 68;

y = sectionTitle("Cómo revisar y aprobar una incidencia", y);
y = bullet("1.", "Ve al módulo 'Incidencias'. Verás la lista de todas las incidencias activas.", y, 10);
y = bullet("2.", "Usa los filtros para encontrar incidencias pendientes: Filtrar por Estado → 'Pendiente'.", y, 10);
y = bullet("3.", "Haz clic en una incidencia para ver el detalle: tipo, fechas, empleado, notas y evidencias.", y, 10);
y = bullet("4.", "Si apruebas, haz clic en '✅ Aprobar'. Si rechazas, haz clic en '❌ Rechazar' y escribe el motivo.", y, 10);
y = bullet("5.", "El empleado recibirá una notificación automática con la resolución.", y, 10);
y += 6;

y = sectionTitle("Filtros de incidencias disponibles", y);

const filtrosInc = [
  ["Estado", "Pendiente, En revisión, Aprobada, Rechazada"],
  ["Tipo", "Permiso, Falta justificada, Llegada tarde, Incapacidad, etc."],
  ["Sucursal", "Filtrar por la sucursal del empleado"],
  ["Empleado", "Buscar una persona específica por nombre"],
  ["Fecha", "Rango de fechas de la incidencia"],
];

const fc = [[W - M * 2] * 0.3, (W - M * 2) * 0.7].map((w, i) => [["Filtro", "Valores disponibles"][i], i === 0 ? (W - M * 2) * 0.3 : (W - M * 2) * 0.7]);
y = tableHeader([["Filtro", (W - M * 2) * 0.3], ["Valores disponibles", (W - M * 2) * 0.7]], y);
filtrosInc.forEach((r, i) => { y = tableRow([["", (W - M * 2) * 0.3], ["", (W - M * 2) * 0.7]], r, y, i); });
y += 12;

y = infoBox([
  "💡 BUENA PRÁCTICA: Revisa las incidencias pendientes cada mañana. Resolverlas en 24-48 horas ayuda a mantener los registros de nómina actualizados.",
], y, "#E8F5E9", GREEN);

y = sectionTitle("Crear una incidencia en nombre de un empleado", y);
doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("Los supervisores y agentes pueden crear incidencias directamente para sus empleados (por ejemplo, si un empleado no tiene acceso al sistema):", M, y, { width: W - M * 2 });
y += 20;
y = bullet("1.", "En la sección 'Incidencias', haz clic en '+ Nueva Incidencia'.", y, 10);
y = bullet("2.", "Selecciona el empleado de la lista (campo 'Empleado').", y, 10);
y = bullet("3.", "Completa el tipo, fechas y observaciones, luego guarda.", y, 10);

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 5 — REPORTES
// ═══════════════════════════════════════════════════════════════════════════════

newPage("Generación de reportes");

y = 100;
y = sectionTitle("Módulo de Reportes", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("El módulo de Reportes permite generar, visualizar y exportar información de asistencia en múltiples formatos para análisis y toma de decisiones.", M, y, { width: W - M * 2 });
y += 24;

// Tipos de reporte
const tiposReporte = [
  { ico: "📊", t: "Reporte de Asistencia", d: "Entradas, salidas, ausencias y resumen por empleado en el período seleccionado.", color: LIGHT, border: NAVY },
  { ico: "⏱️", t: "Reporte de Minutos", d: "Horas trabajadas, análisis de puntualidad, minutos de retraso acumulados.", color: "#E8F5E9", border: GREEN },
  { ico: "📋", t: "Reporte de Incidencias", d: "Historial de incidencias con estados, fechas y evidencias por empleado.", color: "#FFF8E1", border: WARN },
];

tiposReporte.forEach(r => {
  doc.roundedRect(M, y, W - M * 2, 50, 5).fill(r.color).stroke(r.border);
  doc.fontSize(20).text(r.ico, M + 10, y + 13, { width: 30 });
  doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY).text(r.t, M + 46, y + 8, { width: W - M * 2 - 58 });
  doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(r.d, M + 46, y + 24, { width: W - M * 2 - 58 });
  y += 56;
});

y = sectionTitle("Cómo generar un reporte", y);
y = bullet("1.", "Ve al módulo 'Reportes' desde el menú lateral.", y, 10);
y = bullet("2.", "Selecciona el tipo de reporte: Asistencia, Minutos o Incidencias.", y, 10);
y = bullet("3.", "Configura los filtros: sucursal, grupo, empleado, período (desde – hasta).", y, 10);
y = bullet("4.", "Haz clic en 'Generar'. El reporte se mostrará en pantalla.", y, 10);
y = bullet("5.", "Para exportar, selecciona el formato deseado y haz clic en el botón de descarga.", y, 10);
y += 8;

y = sectionTitle("Formatos de exportación disponibles", y);

const formatos = [
  { ico: "📄", fmt: "PDF Ejecutivo", desc: "Documento con diseño corporativo, logo de la empresa, encabezados y paginación. Ideal para presentaciones a dirección." },
  { ico: "📊", fmt: "Excel (.xlsx)", desc: "Archivo de hoja de cálculo listo para análisis, tablas dinámicas y cruce con datos de nómina." },
  { ico: "📑", fmt: "CSV", desc: "Formato de texto separado por comas, compatible con cualquier sistema de Business Intelligence o ERP." },
];

const fw = (W - M * 2 - 8) / 3;
formatos.forEach((f, i) => {
  const fx = M + i * (fw + 4);
  doc.roundedRect(fx, y, fw, 80, 5).fill(LIGHT).stroke(BORDER);
  doc.fontSize(24).text(f.ico, fx, y + 8, { width: fw, align: "center" });
  doc.fontSize(9).font("Helvetica-Bold").fillColor(NAVY).text(f.fmt, fx + 6, y + 38, { width: fw - 12, align: "center" });
  doc.fontSize(8).font("Helvetica").fillColor(GRAY).text(f.desc, fx + 6, y + 52, { width: fw - 12, align: "center" });
});
y += 92;

y = infoBox([
  "💡 PDF EJECUTIVO: El reporte PDF incluye automáticamente el logo y nombre de tu empresa tal como está configurado en el panel de Administración.",
  "Los datos de empresa (razón social, RFC, dirección) también aparecen en el encabezado del PDF.",
], y, LIGHT, NAVY);

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 6 — GESTIÓN DE USUARIOS Y SUCURSALES
// ═══════════════════════════════════════════════════════════════════════════════

newPage("Gestión de usuarios y sucursales");

y = 100;
y = sectionTitle("Módulo de Empleados — Gestión de usuarios", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("Desde el módulo 'Empleados' puedes administrar todo el personal de la organización. Solo disponible para Super Admin, Soporte TI y Supervisores con permiso.", M, y, { width: W - M * 2 });
y += 22;

y = bullet("➕", "Crear nuevo empleado: nombre, apellido, correo, número de empleado, puesto, sucursal asignada y rol", y);
y = bullet("✏️", "Editar datos: actualizar información de contacto, puesto o sucursal de un empleado", y);
y = bullet("🔄", "Cambiar contraseña: el administrador puede generar una nueva contraseña para el empleado", y);
y = bullet("🚫", "Desactivar usuario: el empleado pierde acceso sin eliminar su historial de registros", y);
y = bullet("🔍", "Filtros: buscar por nombre, rol, sucursal, estado activo/inactivo", y);
y += 10;

y = infoBox([
  "⚠️ IMPORTANTE: No es posible ELIMINAR un usuario del sistema para preservar la integridad del historial de registros.",
  "En su lugar, desactiva al usuario. El historial de asistencia permanece íntegro y auditable.",
], y, "#FFF8E1", WARN);

y = sectionTitle("Módulo de Sucursales", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("El módulo de Sucursales permite administrar las plantas o ubicaciones de la empresa:", M, y, { width: W - M * 2 });
y += 20;

y = bullet("🏢", "Crear / editar sucursales: nombre, dirección, estado, teléfono, responsable", y);
y = bullet("📍", "Configurar geocerca: latitud, longitud y radio en metros para la validación GPS", y);
y = bullet("⏱️", "Configurar horario y tolerancia de entrada/salida por sucursal (en minutos)", y);
y = bullet("🗺️", "La geocerca se visualiza en el módulo Mapa en tiempo real", y);
y += 10;

y = sectionTitle("Módulo de Grupos", y);
doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("Los grupos permiten agrupar varias sucursales por región o área (ej: 'Zona Norte', 'Campus Central'). Los supervisores de grupo pueden gestionar todas las sucursales dentro de su grupo.", M, y, { width: W - M * 2 });
y += 32;

y = sectionTitle("Cómo configurar una nueva sucursal", y);
y = bullet("1.", "Ve al módulo 'Sucursales' y haz clic en '+ Nueva Sucursal'.", y, 10);
y = bullet("2.", "Ingresa nombre, dirección y datos de contacto de la sucursal.", y, 10);
y = bullet("3.", "En el campo de Mapa, busca la dirección o coloca el marcador en la ubicación exacta.", y, 10);
y = bullet("4.", "Ajusta el radio de la geocerca (recomendado: 100–200 metros según el tamaño del predio).", y, 10);
y = bullet("5.", "Configura el horario de entrada, salida y la tolerancia en minutos.", y, 10);
y = bullet("6.", "Guarda. La sucursal estará disponible para asignar empleados y aparecerá en el mapa.", y, 10);

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 7 — ADMINISTRACIÓN Y CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

newPage("Panel de Administración");

y = 100;
y = sectionTitle("Módulo de Administración — Solo Super Admin y Soporte TI", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("El panel de Administración centraliza todas las configuraciones globales de la plataforma. Está organizado en secciones:", M, y, { width: W - M * 2 });
y += 22;

const adminSecciones = [
  { ico: "🏢", t: "Empresa", d: "Configura el nombre, logo, RFC, dirección y datos generales de la organización. El logo aparece en los reportes PDF." },
  { ico: "👑", t: "Roles y permisos", d: "Define qué módulos puede ver y usar cada rol. Activa o desactiva el acceso a módulos específicos por perfil." },
  { ico: "💼", t: "Puestos", d: "Crea, edita o elimina los puestos de trabajo de la empresa (Director, Jefe, Empleado, Médico, etc.)." },
  { ico: "📅", t: "Tipos de incidencia", d: "Configura los tipos de incidencia disponibles: nombre, descripción, si afecta la asistencia, etc." },
];

adminSecciones.forEach(s => {
  const bh = 48;
  doc.roundedRect(M, y, W - M * 2, bh, 5).fill(LIGHT).stroke(BORDER);
  doc.fontSize(20).text(s.ico, M + 10, y + 12, { width: 30 });
  doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY).text(s.t, M + 46, y + 8, { width: W - M * 2 - 58 });
  doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(s.d, M + 46, y + 22, { width: W - M * 2 - 58 });
  y += bh + 6;
});

y += 4;
y = sectionTitle("Cómo cambiar los módulos visibles para un rol", y);
y = bullet("1.", "Ve a Administración → Roles y permisos.", y, 10);
y = bullet("2.", "Selecciona el rol que deseas configurar (ej: Supervisor de Sucursales).", y, 10);
y = bullet("3.", "Activa o desactiva los módulos usando los interruptores (toggles).", y, 10);
y = bullet("4.", "Guarda los cambios. Los usuarios con ese rol verán los cambios en su próxima sesión.", y, 10);
y += 8;

y = infoBox([
  "⚠️ PRECAUCIÓN: Desactivar el módulo 'Dashboard' para un rol dejará a esos usuarios sin acceso al registro de asistencia.",
  "Desactivar 'Notificaciones' no elimina las notificaciones existentes, solo oculta el módulo del menú.",
], y, "#FFEBEE", DANGER);

y = sectionTitle("Módulo de Auditoría", y);
doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("La Auditoría registra automáticamente cada acción realizada en el sistema:", M, y, { width: W - M * 2 });
y += 20;

y = bullet("👤", "Quién realizó la acción (usuario y rol)", y);
y = bullet("🕐", "Cuándo (fecha y hora exacta)", y);
y = bullet("📋", "Qué acción realizó (descripción de la operación)", y);
y = bullet("🌐", "Desde qué dirección IP accedió", y);
y += 8;

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("Usa los filtros de la auditoría para investigar incidentes de seguridad, cambios no autorizados o inconsistencias en los datos.", M, y, { width: W - M * 2 });

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 8 — LOGS Y NOTIFICACIONES
// ═══════════════════════════════════════════════════════════════════════════════

newPage("Logs del sistema y Notificaciones");

y = 100;
y = sectionTitle("Módulo de Logs — Solo Super Admin y Soporte TI", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("El módulo Logs muestra el estado de salud técnico de la plataforma en tiempo real. Actualiza automáticamente cada 30 segundos.", M, y, { width: W - M * 2 });
y += 22;

y = sectionTitle("Métricas de salud disponibles", y);

const metricas = [
  ["Estado del sistema", "Operativo (verde), Degradado (naranja) o Crítico (rojo)"],
  ["Tiempo activo (Uptime)", "Tiempo desde el último reinicio del servidor"],
  ["Peticiones totales", "Número de solicitudes HTTP procesadas desde el inicio"],
  ["Errores última hora", "Contador de errores en los últimos 60 minutos"],
  ["Memoria RAM (Heap)", "Memoria JavaScript usada actualmente por el servidor"],
  ["Estado de base de datos", "Si la conexión a MySQL está activa o no"],
];

y = tableHeader([["Métrica", (W - M * 2) * 0.4], ["Descripción", (W - M * 2) * 0.6]], y);
metricas.forEach((r, i) => { y = tableRow([["", (W - M * 2) * 0.4], ["", (W - M * 2) * 0.6]], r, y, i); });
y += 12;

y = sectionTitle("Criterios de estado del sistema", y);

const estados2 = [
  { ico: "✅", s: "Operativo", c: "#E8F5E9", b: GREEN, d: "0–5 errores en la última hora y base de datos conectada." },
  { ico: "⚠️", s: "Degradado", c: "#FFF8E1", b: WARN, d: "Más de 5 errores en la última hora o la BD no está conectada." },
  { ico: "🔴", s: "Crítico", c: "#FFEBEE", b: DANGER, d: "Más de 20 errores en la última hora. Requiere atención inmediata." },
];

estados2.forEach(e => {
  const bh = 38;
  doc.roundedRect(M, y, W - M * 2, bh, 5).fill(e.c).stroke(e.b);
  doc.fontSize(16).text(e.ico, M + 10, y + 8, { width: 30 });
  doc.fontSize(10).font("Helvetica-Bold").fillColor(NAVY).text(e.s, M + 46, y + 6, { width: 90 });
  doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(e.d, M + 46, y + 20, { width: W - M * 2 - 60 });
  y += bh + 6;
});

y += 4;
y = sectionTitle("Registro de eventos del sistema", y);
doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("La tabla de logs muestra los últimos 200 eventos registrados por el servidor (errores, advertencias e información). Puedes filtrar por nivel:", M, y, { width: W - M * 2 });
y += 20;
y = bullet("🔴", "Errores — Excepciones y fallos del sistema que requieren atención", y);
y = bullet("🟡", "Advertencias — Situaciones anómalas que no bloquean el funcionamiento", y);
y = bullet("🔵", "Info — Eventos informativos generales del servidor", y);
y += 10;

y = sectionTitle("Módulo de Notificaciones", y);
doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("El centro de notificaciones muestra alertas del sistema en tiempo real (vía WebSocket):", M, y, { width: W - M * 2 });
y += 20;

y = bullet("🔔", "Solicitudes de restablecimiento de contraseña", y);
y = bullet("📋", "Incidencias pendientes de aprobación", y);
y = bullet("✅", "Confirmaciones de cambios y aprobaciones realizadas", y);
y = bullet("⚠️", "Alertas de registros fuera de horario o geovalla", y);
y += 8;
y = infoBox([
  "💡 Las notificaciones se entregan en tiempo real gracias a WebSocket.",
  "Si cierras sesión, las notificaciones no leídas permanecerán al iniciar sesión nuevamente.",
], y, LIGHT, NAVY);

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 9 — BUENAS PRÁCTICAS Y CIERRE
// ═══════════════════════════════════════════════════════════════════════════════

newPage("Buenas prácticas y referencia rápida");

y = 100;
y = sectionTitle("Buenas prácticas operativas", y);

const bps = [
  { ico: "📅", t: "Revisión diaria", d: "Revisa cada mañana las incidencias pendientes y los registros marcados con alertas del día anterior." },
  { ico: "🔐", t: "Contraseñas seguras", d: "Asigna contraseñas iniciales seguras (mínimo 8 caracteres con mayúsculas y números) y solicita al empleado que la cambie en su primer acceso." },
  { ico: "📍", t: "Mantener geocercas actualizadas", d: "Si una sucursal cambia de ubicación o amplía sus instalaciones, actualiza el radio y las coordenadas de la geocerca." },
  { ico: "👥", t: "Desactivar usuarios al separarse", d: "Cuando un empleado se separa de la empresa, desactiva su usuario el mismo día para revocar el acceso." },
  { ico: "📊", t: "Reportes semanales", d: "Genera reportes semanales de asistencia para cada sucursal y envíalos a los responsables antes del cierre de nómina." },
  { ico: "🔍", t: "Revisión de auditoría", d: "Revisa la auditoría mensualmente para detectar acciones inusuales o accesos fuera de horario laboral." },
];

bps.forEach(b => {
  const bh = doc.heightOfString(b.d, { width: W - M * 2 - 58, fontSize: 9 }) + 22;
  doc.roundedRect(M, y, W - M * 2, bh, 5).fill(LIGHT).stroke(BORDER);
  doc.fontSize(16).text(b.ico, M + 10, y + (bh - 16) / 2, { width: 28 });
  doc.fontSize(9).font("Helvetica-Bold").fillColor(NAVY).text(b.t, M + 42, y + 6, { width: W - M * 2 - 54 });
  doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(b.d, M + 42, y + 18, { width: W - M * 2 - 54 });
  y += bh + 5;
});

y += 8;
y = sectionTitle("Tabla de referencia rápida — Acceso por módulo", y);

const tablaRef = [
  ["Dashboard",       "✅", "✅", "✅", "✅", "✅"],
  ["Eventos",         "✅", "✅", "✅", "✅", "—"],
  ["Incidencias",     "✅", "✅", "✅", "✅", "—"],
  ["Reportes",        "✅", "✅", "✅", "✅", "✅"],
  ["Sucursales",      "✅", "✅", "✅", "—",  "—"],
  ["Empleados",       "✅", "✅", "✅", "—",  "—"],
  ["Administración",  "✅", "✅", "—",  "—",  "—"],
  ["Auditoría",       "✅", "—",  "—",  "—",  "—"],
  ["Logs",            "✅", "✅", "—",  "—",  "—"],
];

const refCols = [
  ["Módulo", 150], ["Super\nAdmin", 75], ["Soporte\nTI", 75], ["Supervisor", 75], ["C. Asistencia", 80], ["Visor\nReportes", 40]
].map(([l, w]) => [l, w]);

// ajuste de anchos para que sumen W-M*2
const totalW2 = refCols.reduce((s, [, w]) => s + w, 0);
const scale = (W - M * 2) / totalW2;
const scaledCols = refCols.map(([l, w]) => [l, w * scale]);

y = tableHeader(scaledCols, y);
tablaRef.forEach((r, i) => { y = tableRow(scaledCols, r, y, i); });

y += 16;

// Bloque de cierre
doc.rect(M, y, W - M * 2, 60).fill(NAVY);
doc.fontSize(18).font("Helvetica-Bold").fillColor(WHITE)
  .text("KRONOS", M, y + 10, { width: W - M * 2, align: "center" });
doc.fontSize(10).font("Helvetica").fillColor(GREEN)
  .text("Control preciso. Decisiones inteligentes.", M, y + 34, { width: W - M * 2, align: "center" });
doc.fontSize(8).fillColor("#90B8D0")
  .text("Manual del Personal Administrativo  ·  Versión 1.0  ·  2025", M, y + 50, { width: W - M * 2, align: "center" });

// ─── FIN ──────────────────────────────────────────────────────────────────────
doc.end();
console.log("✅ Admin manual saved:", OUT);
