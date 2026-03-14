/**
 * gen_delivery_pdf.js
 * Generates Kronos Formal Platform Delivery Document (PDF)
 */
const PDFDocument = require("pdfkit");
const fs = require("fs");

const OUT = "C:/jestrada/Proyectos/access-control/docs/Kronos_Acta_Entrega_Formal.pdf";

// ─── Colors ───────────────────────────────────────────────────────────────────
const NAVY   = "#004269";
const GREEN  = "#77B328";
const WHITE  = "#FFFFFF";
const LIGHT  = "#E8F4FB";
const GRAY   = "#F5F7FA";
const DGRAY  = "#D0DCE8";
const TEXT1  = "#1A2B3C";
const TEXT2  = "#4A6070";
const DARKBG = "#002847";

// ─── PDF Setup ────────────────────────────────────────────────────────────────
const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: 60, bottom: 60, left: 60, right: 60 },
  info: {
    Title: "Kronos – Acta de Entrega Formal",
    Author: "Kronos System",
    Subject: "Entrega formal de la plataforma Kronos v1.0",
    Keywords: "Kronos, control de acceso, asistencia, entrega",
    CreationDate: new Date()
  }
});

const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

const PW = doc.page.width;
const PH = doc.page.height;
const ML = 60, MR = 60;
const CW = PW - ML - MR;
let currentY = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function headerBar(text) {
  doc.rect(0, 0, PW, 50).fill(DARKBG);
  doc.rect(0, 50, PW, 4).fill(GREEN);
  doc.font("Helvetica-Bold").fontSize(14).fillColor(GREEN).text("KRONOS", ML, 16, { continued: true });
  doc.font("Helvetica").fillColor("#A8C8E0").text("  –  Sistema de Control de Acceso y Asistencia");
  currentY = 68;
}

function footerBar(pageNum, total) {
  const fy = PH - 45;
  doc.rect(0, fy, PW, 4).fill(GREEN);
  doc.rect(0, fy + 4, PW, 41).fill(DARKBG);
  doc.font("Helvetica").fontSize(8).fillColor("#A8C8E0");
  doc.text("Kronos – Acta de Entrega Formal  |  Versión 1.0  |  2025  |  Confidencial", ML, fy + 16, { width: CW - 80 });
  doc.text(`Página ${pageNum} de ${total}`, PW - 130, fy + 16, { width: 70, align: "right" });
}

function sectionTitle(text) {
  doc.moveDown(0.8);
  const y = doc.y;
  doc.rect(ML, y, CW, 32).fill(NAVY);
  doc.rect(ML, y + 32, CW, 3).fill(GREEN);
  doc.font("Helvetica-Bold").fontSize(13).fillColor(WHITE);
  doc.text(text, ML + 10, y + 9);
  doc.moveDown(0.6);
  doc.fillColor(TEXT1);
}

function subTitle(text) {
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(NAVY).text(text, ML, doc.y);
  doc.moveDown(0.2);
  doc.fillColor(TEXT1);
}

function bodyText(text, opts = {}) {
  doc.font("Helvetica").fontSize(10).fillColor(TEXT2);
  doc.text(text, ML, doc.y, { width: CW, align: "justify", ...opts });
  doc.moveDown(0.3);
}

function bullet(text) {
  const bx = ML + 12, tw = CW - 20;
  const y = doc.y;
  doc.circle(ML + 4, y + 5, 2.5).fill(GREEN);
  doc.font("Helvetica").fontSize(10).fillColor(TEXT1);
  doc.text(text, bx, y, { width: tw });
  doc.moveDown(0.15);
}

function checkRow(label, value, odd) {
  const y = doc.y;
  doc.rect(ML, y, CW, 22).fill(odd ? LIGHT : WHITE);
  doc.rect(ML, y, 3, 22).fill(GREEN);
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(NAVY).text(label, ML + 8, y + 6, { width: CW / 2 - 10 });
  doc.font("Helvetica").fontSize(9.5).fillColor(TEXT1).text(value, ML + CW / 2, y + 6, { width: CW / 2 - 5 });
  doc.y = y + 22;
}

function signatureLine(label, name, role, x, y, w) {
  doc.rect(x, y + 60, w, 1).fill(DGRAY);
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(NAVY).text(label, x, y + 65, { width: w, align: "center" });
  doc.font("Helvetica").fontSize(9).fillColor(TEXT2).text(name, x, y + 79, { width: w, align: "center" });
  doc.font("Helvetica").fontSize(8.5).fillColor("#888888").text(role, x, y + 91, { width: w, align: "center" });
}

function infoBox(text, color = LIGHT) {
  const y = doc.y;
  const h = 36;
  doc.rect(ML, y, CW, h).fill(color);
  doc.rect(ML, y, 4, h).fill(GREEN);
  doc.font("Helvetica").fontSize(9.5).fillColor(NAVY).text(text, ML + 10, y + 10, { width: CW - 20 });
  doc.y = y + h + 8;
}

// ─── PAGE 1: COVER ────────────────────────────────────────────────────────────
doc.rect(0, 0, PW, PH).fill(DARKBG);
doc.rect(0, 0, 8, PH).fill(GREEN);
doc.rect(0, PH - 8, PW, 8).fill(GREEN);

// Decorative circles
doc.circle(PW + 30, -30, 160).fillOpacity(0.07).fill(GREEN).fillOpacity(1);
doc.circle(PW + 50, PH / 2, 120).fillOpacity(0.05).fill(GREEN).fillOpacity(1);

// Logo / Brand
doc.font("Helvetica-Bold").fontSize(64).fillColor(WHITE).text("KRONOS", ML + 10, 130, { characterSpacing: 8 });
doc.rect(ML + 10, 210, 200, 5).fill(GREEN);
doc.font("Helvetica").fontSize(18).fillColor("#A8C8E0").text("Sistema de Control de Acceso", ML + 10, 224);
doc.text("y Asistencia", ML + 10, 245);

doc.moveDown(3);
doc.rect(ML + 10, 300, PW - ML - 70, 120).fill("#003558");
doc.font("Helvetica-Bold").fontSize(22).fillColor(GREEN);
doc.text("ACTA DE ENTREGA FORMAL", ML + 30, 330, { characterSpacing: 1 });
doc.font("Helvetica").fontSize(13).fillColor("#C8E0F0");
doc.text("Plataforma Kronos – Versión 1.0", ML + 30, 364);

doc.rect(ML + 10, 440, PW - ML - 70, 1).fill("#005080");
doc.font("Helvetica").fontSize(10.5).fillColor("#6A9BB8");
doc.text(`Fecha de entrega: ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`, ML + 30, 460);
doc.text("Documento Confidencial", ML + 30, 480);

// Footer line
doc.rect(0, PH - 60, PW, 60).fill("#001D32");
doc.font("Helvetica").fontSize(9).fillColor("#4A7A96");
doc.text("Kronos – Sistema de Control de Acceso y Asistencia  |  2025  |  Confidencial", ML, PH - 40, { width: CW, align: "center" });

// ─── PAGE 2: HEADER + INTRO ───────────────────────────────────────────────────
doc.addPage();
doc.rect(0, 0, PW, PH).fill(WHITE);
headerBar();

sectionTitle("1. IDENTIFICACIÓN DEL DOCUMENTO");
checkRow("Título del documento",     "Acta de Entrega Formal – Plataforma Kronos",    true);
checkRow("Versión del sistema",       "Kronos v1.0",                                   false);
checkRow("Fecha de elaboración",      new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }), true);
checkRow("Tipo de documento",         "Acta de entrega y aceptación formal",           false);
checkRow("Estado del documento",      "FINAL – Para firma",                            true);
checkRow("Clasificación",             "Confidencial – Uso interno",                    false);

sectionTitle("2. OBJETO Y ALCANCE");
bodyText("El presente documento constituye el Acta de Entrega Formal de la plataforma Kronos – Sistema de Control de Acceso y Asistencia, versión 1.0, y tiene como objeto dejar constancia de la entrega formal del sistema, sus componentes, documentación asociada y el estado de completitud de los entregables comprometidos.");
bodyText("El alcance de la presente entrega comprende:");
bullet("Sistema web funcional con 12 módulos integrados completamente operativos");
bullet("Backend API REST con 14 rutas de módulos y autenticación JWT");
bullet("Frontend React 18 con interfaz responsiva y soporte para temas claro/oscuro");
bullet("Integración con base de datos MySQL y modo fallback en memoria");
bullet("Sistema de notificaciones en tiempo real vía WebSocket (Socket.io)");
bullet("Módulo de restablecimiento de contraseña por correo electrónico");
bullet("Módulo de logs y monitoreo de salud de plataforma");
bullet("Documentación técnica completa y manuales de usuario");

doc.moveDown(0.3);
infoBox("ℹ  Este documento debe ser firmado por el representante del cliente y el responsable técnico del proyecto para formalizar la aceptación de la entrega.");

footerBar(2, 6);

// ─── PAGE 3: ENTREGABLES ──────────────────────────────────────────────────────
doc.addPage();
doc.rect(0, 0, PW, PH).fill(WHITE);
headerBar();

sectionTitle("3. INVENTARIO DE ENTREGABLES");
bodyText("A continuación se detalla el inventario completo de los componentes entregados:");

const deliverables = [
  ["Código fuente – Frontend",           "React 18 + Vite. Directorio frontend/",                                                 "✓ Entregado"],
  ["Código fuente – Backend",            "Node.js + Express. Directorio backend/",                                                "✓ Entregado"],
  ["Base de datos",                       "Esquema MySQL auto-generado. Modo memoria incluido.",                                   "✓ Entregado"],
  ["Directorio de uploads",              "Carpeta backend/uploads/ para archivos y fotos",                                        "✓ Entregado"],
  ["Variables de entorno",               "backend/.env.example con todas las variables documentadas",                             "✓ Entregado"],
  ["Presentación ejecutiva",             "Kronos_Presentacion_Directivos.pptx — 13 diapositivas",                                 "✓ Entregado"],
  ["Documentación técnica",              "Kronos_Documentacion_Tecnica.docx — Arquitectura, APIs, instalación",                   "✓ Entregado"],
  ["Manual de empleados",                "Kronos_Manual_Empleados.pdf — Guía de uso para empleados",                              "✓ Entregado"],
  ["Manual administrativo",              "Kronos_Manual_Administrativo.pdf — Guía para personal operativo",                       "✓ Entregado"],
  ["Acta de entrega formal",             "Kronos_Acta_Entrega_Formal.pdf — Este documento",                                       "✓ Entregado"],
];

const colWidths = [160, 250, 80];
const thY = doc.y;
doc.rect(ML, thY, CW, 22).fill(NAVY);
doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE);
doc.text("Entregable", ML + 8, thY + 6, { width: colWidths[0] });
doc.text("Descripción", ML + colWidths[0] + 8, thY + 6, { width: colWidths[1] });
doc.text("Estado", ML + colWidths[0] + colWidths[1] + 8, thY + 6, { width: colWidths[2] });
doc.y = thY + 22;

deliverables.forEach(([name, desc, status], i) => {
  const ry = doc.y;
  const rh = 22;
  doc.rect(ML, ry, CW, rh).fill(i % 2 === 0 ? WHITE : LIGHT);
  doc.rect(ML, ry, 3, rh).fill(GREEN);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(NAVY).text(name, ML + 8, ry + 6, { width: colWidths[0] - 10 });
  doc.font("Helvetica").fontSize(8.5).fillColor(TEXT2).text(desc, ML + colWidths[0] + 4, ry + 6, { width: colWidths[1] - 8 });
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#1A6E3A").text(status, ML + colWidths[0] + colWidths[1] + 4, ry + 6, { width: colWidths[2] - 4 });
  doc.y = ry + rh;
});

sectionTitle("4. CARACTERÍSTICAS TÉCNICAS");
checkRow("Frontend",          "React 18 + Vite 5.1 — SPA responsiva",                       true);
checkRow("Backend",           "Node.js + Express 4.18 + Socket.io 4.8",                      false);
checkRow("Base de datos",     "MySQL 8.0 con sincronización en memoria",                     true);
checkRow("Autenticación",     "JWT (8h) + bcryptjs + restablecimiento por correo (1h TTL)",  false);
checkRow("Tiempo real",       "Socket.io WebSocket para notificaciones y eventos",           true);
checkRow("Mapas",             "Leaflet 1.9 con geocercas configurables por sucursal",        false);
checkRow("Exportación",       "PDF ejecutivo (jsPDF), Excel (XLSX), CSV",                    true);
checkRow("Módulos",           "12 módulos con acceso configurable por rol (7 roles)",        false);
checkRow("Plataforma",        "Navegador web moderno — Sin instalación en el cliente",       true);

footerBar(3, 6);

// ─── PAGE 4: FUNCIONALIDADES ──────────────────────────────────────────────────
doc.addPage();
doc.rect(0, 0, PW, PH).fill(WHITE);
headerBar();

sectionTitle("5. MÓDULOS Y FUNCIONALIDADES ENTREGADAS");

const modules = [
  ["🏠 Inicio / Dashboard",     "Panel personal con registro GPS de asistencia en 4 pasos diarios. Barra de progreso, validación de geocerca y horario, cooldown de 1 hora."],
  ["📡 Eventos",                "Matriz de asistencia empleado × día con navegación semanal. Captura y edición de registros (supervisores). Actualizaciones en tiempo real."],
  ["📋 Incidencias",            "Reporte de ausencias y permisos con carga de evidencias (JPG, PNG, PDF hasta 10 MB). Flujo de aprobación con notificaciones automáticas."],
  ["📊 Reportes",               "Tres tipos de reportes (asistencia, minutos, incidencias) con filtros avanzados. Exportación a Excel, CSV y PDF con diseño corporativo Kronos."],
  ["🏢 Sucursales",             "Administración de sucursales con geocerca configurable (latitud, longitud, radio en metros). Visualización en mapa interactivo."],
  ["👥 Empleados",              "CRUD completo de empleados con foto de perfil. Asignación de puesto, horario, sucursal y grupo. Campos extra configurables por puesto."],
  ["🔗 Grupos",                 "Agrupación de sucursales por zona geográfica o unidad de negocio. Permite a supervisores gestionar múltiples sucursales."],
  ["🗺️ Mapa",                   "Visualización en tiempo real de empleados presentes en cada sucursal con datos de la última hora."],
  ["⚙️ Administración",         "Gestión de puestos (con campos extra), horarios laborales (días, tolerancia), configuración de módulos por rol y datos de empresa con logo."],
  ["🔍 Auditoría",              "Registro completo de acciones del sistema con filtros por usuario, acción y rango de fechas. Columnas: fecha, usuario, rol, acción, IP."],
  ["🖥️ Logs / Salud",           "Monitoreo de plataforma: uptime, peticiones, errores por hora, memoria RAM, estado de BD. Buffer de 200 errores con stack trace. Solo admin."],
  ["🔔 Notificaciones",         "Centro de alertas en tiempo real. Tipos: asistencia, incidencias, cambios de contraseña, mensajes generales. Contador de no leídas."],
];

modules.forEach(([name, desc], i) => {
  const ry = doc.y;
  const estimatedLines = Math.ceil(desc.length / 80);
  const rh = Math.max(32, estimatedLines * 13 + 14);
  doc.rect(ML, ry, CW, rh).fill(i % 2 === 0 ? WHITE : LIGHT);
  doc.rect(ML, ry, 3, rh).fill(i % 3 === 0 ? NAVY : i % 3 === 1 ? GREEN : "#7B2D8B");
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(NAVY).text(name, ML + 8, ry + 8, { width: 150 });
  doc.font("Helvetica").fontSize(9).fillColor(TEXT2).text(desc, ML + 165, ry + 8, { width: CW - 175 });
  doc.y = ry + rh;
});

sectionTitle("6. CRITERIOS DE ACEPTACIÓN");
bodyText("El sistema se considera formalmente entregado y aceptado cuando:");
bullet("Todos los módulos listados están funcionales y accesibles en el ambiente de producción");
bullet("Los 7 perfiles de usuario pueden autenticarse y acceder a los módulos correspondientes");
bullet("El registro de asistencia GPS funciona correctamente desde dispositivos móviles");
bullet("La exportación de reportes genera archivos válidos en Excel, CSV y PDF");
bullet("El sistema de notificaciones en tiempo real opera correctamente");
bullet("El restablecimiento de contraseña por correo funciona con la configuración SMTP");
bullet("La documentación técnica y los manuales de usuario han sido recibidos");

footerBar(4, 6);

// ─── PAGE 5: CONDICIONES ──────────────────────────────────────────────────────
doc.addPage();
doc.rect(0, 0, PW, PH).fill(WHITE);
headerBar();

sectionTitle("7. CONDICIONES DE LA ENTREGA");
subTitle("7.1 Estado del sistema");
bodyText("El sistema se entrega en estado de producción, con datos de demostración pre-cargados. Antes de comenzar la operación real, el cliente deberá:");
bullet("Cambiar todas las contraseñas de los usuarios de demostración");
bullet("Configurar los datos reales de la empresa (nombre, razón social, RFC, logo)");
bullet("Registrar las sucursales reales con sus geocercas correspondientes");
bullet("Crear los usuarios de producción con sus roles asignados");
bullet("Configurar las variables de entorno de producción (.env)");

subTitle("7.2 Configuración SMTP (correo electrónico)");
bodyText("El módulo de restablecimiento de contraseña requiere configurar las variables SMTP en el archivo .env del servidor backend. Sin esta configuración, el sistema opera en modo de desarrollo con Ethereal (correos capturados pero no enviados). El proveedor de correo SMTP queda a criterio del cliente (Gmail, Outlook, SendGrid, etc.).");

subTitle("7.3 Base de datos");
bodyText("El sistema incluye la capacidad de operar con MySQL o en modo memoria. Para producción se recomienda fuertemente configurar MySQL para garantizar la persistencia de datos. La base de datos se inicializa automáticamente al primer arranque.");

subTitle("7.4 Soporte post-entrega");
bodyText("Esta entrega no incluye contratos de soporte o mantenimiento post-entrega, salvo que se haya acordado expresamente por separado. El código fuente entregado es propiedad del cliente y puede ser mantenido por su equipo técnico con base en la documentación incluida.");

sectionTitle("8. RESPONSABILIDADES DEL CLIENTE");
bullet("Proveer la infraestructura de servidores necesaria (servidor web, MySQL, SMTP)");
bullet("Realizar la carga inicial de datos de producción (sucursales, usuarios, horarios)");
bullet("Impartir la capacitación a los usuarios finales con base en los manuales entregados");
bullet("Configurar los respaldos periódicos de la base de datos MySQL");
bullet("Mantener actualizado el sistema operativo y Node.js del servidor");
bullet("Revisar el módulo de Logs periódicamente para detectar errores en producción");

sectionTitle("9. OBSERVACIONES Y NOTAS ESPECIALES");

doc.rect(ML, doc.y, CW, 80).fill(LIGHT);
doc.rect(ML, doc.y, 4, 80).fill(GREEN);
doc.font("Helvetica-Bold").fontSize(9.5).fillColor(NAVY).text("Sobre el módulo de Logs:", ML + 10, doc.y + 10);
doc.font("Helvetica").fontSize(9).fillColor(TEXT2).text(
  "El buffer de errores es en memoria. Los logs se pierden al reiniciar el servidor. Para persistencia de logs en producción se recomienda integrar un servicio externo (Winston + archivo, Sentry, Datadog, etc.).",
  ML + 10, doc.y + 10 + 14, { width: CW - 20 }
);
doc.y = doc.y + 90;

doc.rect(ML, doc.y, CW, 64).fill("#FFF8E1");
doc.rect(ML, doc.y, 4, 64).fill("#F57F17");
doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#5D4037").text("Sobre la seguridad en producción:", ML + 10, doc.y + 10);
doc.font("Helvetica").fontSize(9).fillColor("#795548").text(
  "Se recomienda cambiar el JWT_SECRET a una cadena aleatoria de al menos 64 caracteres antes de pasar a producción. El valor por defecto incluido en el código es INSEGURO para ambientes expuestos a internet.",
  ML + 10, doc.y + 10 + 14, { width: CW - 20 }
);
doc.y = doc.y + 74;

footerBar(5, 6);

// ─── PAGE 6: SIGNATURES ───────────────────────────────────────────────────────
doc.addPage();
doc.rect(0, 0, PW, PH).fill(WHITE);
headerBar();

sectionTitle("10. FIRMAS DE ACEPTACIÓN");
bodyText("Con la firma del presente documento, las partes manifiestan que han revisado el contenido de la entrega, que los criterios de aceptación han sido cumplidos satisfactoriamente y que se formaliza la recepción de la plataforma Kronos – Sistema de Control de Acceso y Asistencia, versión 1.0.");

doc.moveDown(1);

const sigY = doc.y + 20;
const sigW = (CW - 40) / 2;

// Left signature
doc.rect(ML, sigY, sigW, 105).fill(GRAY);
doc.rect(ML, sigY, sigW, 3).fill(NAVY);
doc.font("Helvetica-Bold").fontSize(10).fillColor(NAVY).text("ENTREGANTE", ML + 10, sigY + 10);
doc.font("Helvetica").fontSize(9).fillColor(TEXT2);
doc.text("Empresa / Desarrollador:", ML + 10, sigY + 28);
doc.text("Nombre: _________________________________", ML + 10, sigY + 44);
doc.text("Cargo: __________________________________", ML + 10, sigY + 58);
doc.text("Fecha: __________________________________", ML + 10, sigY + 72);
doc.moveDown(0.3);
doc.rect(ML + 15, sigY + 92, sigW - 30, 1).fill(DGRAY);
doc.font("Helvetica-Bold").fontSize(8.5).fillColor(NAVY).text("Firma", ML + 15, sigY + 96, { width: sigW - 30, align: "center" });

// Right signature
const sigX2 = ML + sigW + 40;
doc.rect(sigX2, sigY, sigW, 105).fill(GRAY);
doc.rect(sigX2, sigY, sigW, 3).fill(GREEN);
doc.font("Helvetica-Bold").fontSize(10).fillColor("#1A6E3A").text("RECEPTOR / CLIENTE", sigX2 + 10, sigY + 10);
doc.font("Helvetica").fontSize(9).fillColor(TEXT2);
doc.text("Empresa / Organización:", sigX2 + 10, sigY + 28);
doc.text("Nombre: _________________________________", sigX2 + 10, sigY + 44);
doc.text("Cargo: __________________________________", sigX2 + 10, sigY + 58);
doc.text("Fecha: __________________________________", sigX2 + 10, sigY + 72);
doc.moveDown(0.3);
doc.rect(sigX2 + 15, sigY + 92, sigW - 30, 1).fill(DGRAY);
doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#1A6E3A").text("Firma", sigX2 + 15, sigY + 96, { width: sigW - 30, align: "center" });

doc.y = sigY + 120;

// Folio and closing
doc.moveDown(1.5);
const folioY = doc.y;
doc.rect(ML, folioY, CW, 60).fill(DARKBG);
doc.rect(ML, folioY, CW, 4).fill(GREEN);
doc.font("Helvetica-Bold").fontSize(11).fillColor(GREEN).text("KRONOS – Plataforma de Control de Acceso y Asistencia", ML + 10, folioY + 14, { width: CW - 20, align: "center" });
doc.font("Helvetica").fontSize(9).fillColor("#A8C8E0").text(
  `Número de folio: KRN-${new Date().getFullYear()}-001  |  Versión 1.0  |  ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`,
  ML + 10, folioY + 34, { width: CW - 20, align: "center" }
);

doc.moveDown(2);
doc.font("Helvetica").fontSize(8.5).fillColor("#999999").text(
  "Este documento es confidencial. Su contenido está destinado únicamente a las personas o entidades a quienes va dirigido. Queda prohibida su reproducción, distribución o uso sin autorización expresa.",
  ML, doc.y, { width: CW, align: "center" }
);

footerBar(6, 6);

// ─── Finalize ─────────────────────────────────────────────────────────────────
doc.end();
stream.on("finish", () => console.log("✅ Formal delivery PDF saved:", OUT));
stream.on("error", (e) => console.error("Error:", e));
