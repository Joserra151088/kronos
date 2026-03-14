/**
 * gen_employee_manual.js
 * Genera el manual de usuario para EMPLEADOS de Kronos (PDFKit)
 * Salida: Kronos_Manual_Empleado.pdf
 */

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "Kronos_Manual_Empleado.pdf");

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
const M = 50; // margen izquierdo/derecho

// ─── Utilidades ───────────────────────────────────────────────────────────────

function pageNum() { return doc.bufferedPageRange().count; }

function header(title) {
  // Franja azul arriba
  doc.rect(0, 0, W, 46).fill(NAVY);
  doc.fontSize(9).fillColor(WHITE).font("Helvetica")
    .text("KRONOS — Manual de Usuario · Empleados", M, 16, { width: W - M * 2 - 80, align: "left" });
  doc.text(`Pág. ${pageNum()}`, W - M - 80, 16, { width: 80, align: "right" });
  // Línea verde
  doc.rect(0, 46, W, 4).fill(GREEN);
  // Título de sección
  if (title) {
    doc.fontSize(13).font("Helvetica-Bold").fillColor(NAVY)
      .text(title, M, 66, { width: W - M * 2 });
  }
}

function footer() {
  const y = H - 30;
  doc.rect(0, y - 4, W, 1).fill(BORDER);
  doc.fontSize(8).fillColor(GRAY).font("Helvetica")
    .text("Kronos — Sistema de Control de Acceso y Asistencia  |  Manual del Empleado  |  Versión 1.0 — 2025", M, y, { width: W - M * 2, align: "center" });
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

function stepBox(num, title, desc, x, y, w) {
  const boxH = 78;
  doc.rect(x, y, w, boxH).fill(NAVY).stroke(NAVY);
  // Número
  doc.circle(x + 24, y + 20, 14).fill(GREEN);
  doc.fontSize(14).font("Helvetica-Bold").fillColor(WHITE).text(num, x + 18, y + 13, { width: 12, align: "center" });
  // Título
  doc.fontSize(9).font("Helvetica-Bold").fillColor(WHITE).text(title, x + 42, y + 10, { width: w - 50 });
  // Descripción
  doc.fontSize(8).font("Helvetica").fillColor("#b0c8e0").text(desc, x + 14, y + 38, { width: w - 24 });
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

// Gradiente simulado con rectángulos
for (let i = 0; i < 20; i++) {
  doc.rect(0, H - 220 + i * 11, W, 11).fill(`#0${Math.floor(i * 3).toString(16).padStart(2, "0")}${(42 + i * 3).toString(16).padStart(2, "0")}69`);
}

// Franja verde
doc.rect(0, 220, W, 6).fill(GREEN);
doc.rect(0, 520, W, 6).fill(GREEN);

// Ícono grande
doc.fontSize(72).fillColor(WHITE).font("Helvetica")
  .text("👤", W / 2 - 50, 90, { width: 100, align: "center" });

doc.fontSize(48).font("Helvetica-Bold").fillColor(WHITE)
  .text("KRONOS", M, 240, { width: W - M * 2, align: "center" });

doc.fontSize(16).font("Helvetica").fillColor(GREEN)
  .text("MANUAL DE USUARIO", M, 300, { width: W - M * 2, align: "center" });

doc.fontSize(22).font("Helvetica-Bold").fillColor(WHITE)
  .text("EMPLEADOS", M, 335, { width: W - M * 2, align: "center" });

doc.rect(W / 2 - 100, 375, 200, 1).fill(GREEN);

doc.fontSize(12).font("Helvetica").fillColor("#90B8D0")
  .text("Sistema de Control de Acceso y Asistencia", M, 392, { width: W - M * 2, align: "center" });

doc.fontSize(10).fillColor("#70A0C0")
  .text("Guía paso a paso para el registro diario de asistencia", M, 418, { width: W - M * 2, align: "center" });

// Caja de info inferior
doc.rect(M, 534, W - M * 2, 80).fill("rgba(255,255,255,0.05)").stroke("#1A4269");
doc.fontSize(9).font("Helvetica").fillColor("#8BB8D0")
  .text("Documento:", M + 20, 550)
  .text("Versión:", M + 20, 565)
  .text("Dirigido a:", M + 20, 580)
  .text("Fecha:", M + 20, 595);
doc.font("Helvetica-Bold").fillColor(WHITE)
  .text("Manual de Usuario — Empleados", 145, 550)
  .text("1.0", 145, 565)
  .text("Empleados de la organización", 145, 580)
  .text("2025", 145, 595);

footer();

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 2 — INTRODUCCIÓN
// ═══════════════════════════════════════════════════════════════════════════════

newPage("Introducción al sistema");

let y = 100;

y = sectionTitle("¿Qué es Kronos?", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text(
    "Kronos es la plataforma digital de tu empresa para el registro de asistencia y gestión de incidencias laborales. Gracias a Kronos, ya no necesitas firmar listas en papel ni acercarte a ningún módulo físico: todo se realiza desde tu celular o computadora, con validación de tu ubicación GPS para garantizar que te encuentras en tu lugar de trabajo.",
    M, y, { width: W - M * 2 }
  );
y += 56;

y = infoBox([
  "✅  Sin instalación de aplicaciones — funciona desde cualquier navegador web",
  "✅  Disponible en celular, tablet y computadora",
  "✅  Tus registros quedan guardados automáticamente",
  "✅  Puedes consultar tu historial de asistencia en cualquier momento",
], y);

y = sectionTitle("¿Qué puedes hacer con Kronos?", y);

y = bullet("📍", "Registrar tu entrada y salida del trabajo (con validación GPS)", y);
y = bullet("🍽️", "Registrar tu salida y regreso a la hora de comida", y);
y = bullet("📋", "Reportar incidencias: permisos, faltas justificadas, llegadas tarde, etc.", y);
y = bullet("📊", "Ver tu historial de asistencia y estadísticas personales", y);
y = bullet("🔔", "Recibir notificaciones sobre tus solicitudes y aprobaciones", y);
y = bullet("👤", "Actualizar tu información de perfil y contraseña", y);

y += 10;
y = sectionTitle("Antes de comenzar", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("Para acceder a Kronos necesitas:", M, y, { width: W - M * 2 });
y += 18;
y = bullet("1.", "La dirección web (URL) de tu empresa — te la proporcionará Recursos Humanos", y, 10);
y = bullet("2.", "Tu correo electrónico corporativo como usuario", y, 10);
y = bullet("3.", "Tu contraseña inicial — te la proporcionará tu supervisor o el área de TI", y, 10);

y += 10;
y = infoBox([
  "💡 CONSEJO: Guarda la dirección de Kronos en favoritos de tu navegador para acceder rápidamente cada día.",
], y, "#E8F5E9", GREEN);

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 3 — INICIO DE SESIÓN
// ═══════════════════════════════════════════════════════════════════════════════

newPage("Inicio de sesión");

y = 100;
y = sectionTitle("Cómo iniciar sesión", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("Sigue estos pasos para entrar a Kronos:", M, y, { width: W - M * 2 });
y += 20;

// Pasos de login
const loginSteps = [
  { n: "1", t: "Abre tu navegador", d: "Chrome, Firefox, Edge o Safari desde tu celular o computadora" },
  { n: "2", t: "Ingresa la dirección", d: "Escribe la URL de Kronos que te proporcionó tu empresa" },
  { n: "3", t: "Escribe tu correo", d: "Usa tu correo corporativo (ej: nombre@empresa.com)" },
  { n: "4", t: "Escribe tu contraseña", d: "Ingresa tu contraseña. El ícono 👁️ permite ver/ocultar" },
  { n: "5", t: "Clic en 'Iniciar sesión'", d: "Si los datos son correctos, entrarás al sistema" },
];

const sw = (W - M * 2 - 8) / 5;
loginSteps.forEach((s, i) => {
  stepBox(s.n, s.t, s.d, M + i * (sw + 2), y, sw);
});
y += 90;

y = sectionTitle("Médico de Guardia — Selección de sucursal", y);
doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("Si eres médico de guardia, después de ingresar tus credenciales el sistema te pedirá que selecciones en qué sucursal trabajarás hoy. Esto es obligatorio y puede cambiar cada día.", M, y, { width: W - M * 2 });
y += 40;

y = sectionTitle("Olvidé mi contraseña", y);

y = infoBox([
  "Si olvidaste tu contraseña, sigue estos pasos:",
  "",
  "1. En la pantalla de inicio de sesión, haz clic en '¿Olvidaste tu contraseña?'",
  "2. Escribe tu correo corporativo y haz clic en 'Enviar enlace'",
  "3. Revisa tu bandeja de entrada (y la carpeta de spam)",
  "4. Abre el correo de Kronos y haz clic en el botón 'Restablecer contraseña'",
  "5. Escribe tu nueva contraseña (mínimo 6 caracteres) y confírmala",
  "6. Haz clic en 'Guardar nueva contraseña' — serás redirigido al inicio",
  "",
  "⚠️ El enlace del correo tiene una vigencia de 1 hora. Si no lo usas a tiempo, deberás solicitar uno nuevo.",
], y);

y = sectionTitle("Cerrar sesión", y);
doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("Para cerrar sesión de forma segura, haz clic en tu nombre en la esquina superior derecha y selecciona 'Cerrar sesión'. Tu sesión también cerrará automáticamente después de 8 horas de inactividad.", M, y, { width: W - M * 2 });

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 4 — REGISTRO DE ASISTENCIA
// ═══════════════════════════════════════════════════════════════════════════════

newPage("Registro de asistencia");

y = 100;
y = sectionTitle("Cómo registrar tu asistencia diaria", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("Cada día laboral debes registrar hasta 4 eventos. Todos se hacen desde el mismo lugar: la pantalla de Inicio (Dashboard).", M, y, { width: W - M * 2 });
y += 24;

// Los 4 eventos
const eventos = [
  { n: "1", ico: "🟢", t: "ENTRADA", sub: "Al llegar al trabajo", color: "#E8F5E9", border: GREEN },
  { n: "2", ico: "🍽️", t: "SALIDA A COMER", sub: "Cuando salgas a tomar alimentos", color: "#FFF8E1", border: "#F9A825" },
  { n: "3", ico: "↩️", t: "REGRESO DE COMER", sub: "Cuando regreses de la pausa", color: "#E3F2FD", border: "#1565C0" },
  { n: "4", ico: "🔴", t: "SALIDA FINAL", sub: "Al terminar tu jornada laboral", color: "#FCE4EC", border: DANGER },
];

const ew = (W - M * 2 - 12) / 4;
eventos.forEach((ev, i) => {
  const ex = M + i * (ew + 4);
  doc.roundedRect(ex, y, ew, 72, 6).fill(ev.color).stroke(ev.border);
  doc.fontSize(20).text(ev.ico, ex, y + 8, { width: ew, align: "center" });
  doc.fontSize(8).font("Helvetica-Bold").fillColor(NAVY).text(ev.t, ex + 4, y + 36, { width: ew - 8, align: "center" });
  doc.fontSize(7).font("Helvetica").fillColor(GRAY).text(ev.sub, ex + 4, y + 52, { width: ew - 8, align: "center" });
});
y += 84;

y = sectionTitle("Pasos para registrar un evento", y);

y = bullet("1.", "Abre Kronos e ingresa al Inicio (Dashboard). Verás los botones de registro activos según el momento del día.", y, 10);
y = bullet("2.", "Haz clic en el botón correspondiente (Entrada, Salida a comer, etc.).", y, 10);
y = bullet("3.", "El sistema validará automáticamente tu ubicación GPS. Asegúrate de tener la ubicación activada en tu dispositivo.", y, 10);
y = bullet("4.", "Si estás dentro de la geovalla de tu sucursal y en el horario correcto, el registro se guardará de inmediato.", y, 10);
y = bullet("5.", "Si hay alguna irregularidad, el sistema te pedirá que escribas una justificación breve.", y, 10);
y += 6;

y = infoBox([
  "📍 UBICACIÓN GPS: Debes estar físicamente dentro de tu sucursal para registrar. El sistema verifica automáticamente que estés dentro del área permitida.",
  "",
  "⏱️ HORARIO: Tienes una ventana de tiempo configurable (por ejemplo, ±15 minutos) para registrar sin necesidad de justificar.",
  "",
  "🔒 COOLDOWN: El sistema no permite registros repetidos en menos de 1 hora para el mismo tipo de evento.",
], y, LIGHT, NAVY);

y = sectionTitle("¿Qué pasa si estoy fuera de horario o de la geovalla?", y);
doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("El sistema mostrará un aviso y te solicitará que escribas una justificación del motivo. Tu registro se guardará, pero quedará marcado para revisión por tu supervisor.", M, y, { width: W - M * 2 });

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 5 — INCIDENCIAS
// ═══════════════════════════════════════════════════════════════════════════════

newPage("Incidencias y permisos");

y = 100;
y = sectionTitle("¿Qué es una incidencia?", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("Una incidencia es cualquier situación que afecte tu asistencia normal: una falta, un permiso, una llegada tarde justificada, una salida anticipada, etc. Kronos te permite reportar estas situaciones de forma digital para que tu supervisor las revise y apruebe.", M, y, { width: W - M * 2 });
y += 50;

y = sectionTitle("Tipos de incidencias más comunes", y);

const incidencias = [
  ["Permiso con goce de sueldo", "Ausencia autorizada con pago normal"],
  ["Permiso sin goce de sueldo", "Ausencia autorizada sin pago"],
  ["Falta justificada", "Ausencia con comprobante (médico, etc.)"],
  ["Falta injustificada", "Ausencia sin motivo comprobable"],
  ["Llegada tarde", "Entrada posterior al horario establecido"],
  ["Salida anticipada", "Salida antes del horario de término"],
  ["Incapacidad médica", "Baja médica por enfermedad o accidente"],
  ["Vacaciones", "Días de descanso correspondientes"],
];

// tabla
const colW = [(W - M * 2) * 0.45, (W - M * 2) * 0.55];
doc.rect(M, y, W - M * 2, 20).fill(NAVY);
doc.fontSize(9).font("Helvetica-Bold").fillColor(WHITE)
  .text("Tipo de incidencia", M + 8, y + 5, { width: colW[0] })
  .text("Descripción", M + colW[0] + 8, y + 5, { width: colW[1] });
y += 20;
incidencias.forEach((row, i) => {
  doc.rect(M, y, W - M * 2, 18).fill(i % 2 === 0 ? LIGHT : WHITE).stroke(BORDER);
  doc.fontSize(9).font("Helvetica").fillColor("#222")
    .text(row[0], M + 8, y + 4, { width: colW[0] - 10 })
    .text(row[1], M + colW[0] + 8, y + 4, { width: colW[1] - 10 });
  y += 18;
});
y += 14;

y = sectionTitle("Cómo reportar una incidencia", y);

y = bullet("1.", "En el menú lateral, haz clic en 'Incidencias'.", y, 10);
y = bullet("2.", "Haz clic en el botón 'Nueva Incidencia' (ícono +).", y, 10);
y = bullet("3.", "Selecciona el tipo de incidencia del listado desplegable.", y, 10);
y = bullet("4.", "Elige la fecha o el rango de fechas que corresponde a la incidencia.", y, 10);
y = bullet("5.", "Escribe los comentarios o justificación en el campo de notas.", y, 10);
y = bullet("6.", "Si tienes un comprobante (constancia médica, etc.), adjúntalo si el sistema lo permite.", y, 10);
y = bullet("7.", "Haz clic en 'Guardar'. Tu incidencia quedará en estado 'Pendiente'.", y, 10);
y += 6;

y = infoBox([
  "🔔 Recibirás una notificación en cuanto tu supervisor apruebe o rechace tu incidencia.",
  "📋 Puedes ver el estado de todas tus incidencias en la sección 'Incidencias' de la plataforma.",
], y, "#FFF8E1", WARN);

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 6 — HISTORIAL Y PERFIL
// ═══════════════════════════════════════════════════════════════════════════════

newPage("Historial de asistencia y Perfil");

y = 100;
y = sectionTitle("Ver tu historial de asistencia", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("Puedes consultar tus registros anteriores en la sección 'Eventos'. Esta vista muestra una matriz con tus entradas y salidas por día.", M, y, { width: W - M * 2 });
y += 24;

y = bullet("📅", "Usa los filtros de fecha para ver períodos específicos (semana, mes, etc.)", y);
y = bullet("🔍", "Cada celda de la matriz muestra el tipo de registro y la hora exacta", y);
y = bullet("📊", "Puedes ver el resumen de tu puntualidad en el panel de inicio", y);
y += 10;

y = sectionTitle("Sección de Notificaciones", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("El ícono de campana 🔔 en la barra superior muestra tus notificaciones más recientes:", M, y, { width: W - M * 2 });
y += 20;

y = bullet("✅", "Aprobaciones de incidencias", y);
y = bullet("❌", "Rechazos de solicitudes (con el motivo indicado por tu supervisor)", y);
y = bullet("⚠️", "Alertas de registros con irregularidades", y);
y = bullet("📢", "Comunicados generales de la empresa", y);
y += 12;

y = sectionTitle("Tu perfil de usuario", y);

doc.fontSize(10).font("Helvetica").fillColor("#222")
  .text("Para acceder a tu perfil, haz clic en tu nombre en la esquina superior derecha y selecciona 'Mi Perfil'. Desde ahí puedes:", M, y, { width: W - M * 2 });
y += 24;

y = bullet("✏️", "Ver tus datos personales (nombre, correo, puesto, sucursal)", y);
y = bullet("🔑", "Cambiar tu contraseña (necesitas saber la contraseña actual)", y);
y = bullet("🌙", "Activar el modo oscuro para mayor comodidad visual", y);
y += 14;

y = sectionTitle("Preguntas frecuentes", y);

const faqs = [
  ["¿Puedo registrar desde casa?", "No. El sistema valida que estés dentro de la geovalla de tu sucursal. Los registros fuera del área quedan marcados y requieren justificación."],
  ["¿Qué hago si olvidé registrar mi entrada?", "Reporta una incidencia inmediatamente. Tu supervisor deberá aprobarla para que quede justificado en tu historial."],
  ["¿Puedo editar un registro ya guardado?", "No. Los empleados no pueden modificar registros. Si hay un error, debes contactar a tu supervisor para que lo corrija desde su panel."],
  ["¿Cuántos registros debo hacer al día?", "Idealmente 4: entrada, salida a comer, regreso de comer y salida final. Si tu empresa no tiene horario de comida, solo entrada y salida."],
  ["¿Mis datos son privados?", "Tus registros son visibles para ti, tu supervisor directo y el área de recursos humanos. Nadie más tiene acceso."],
];

faqs.forEach(([q, a]) => {
  doc.rect(M, y, W - M * 2, 16).fill(NAVY);
  doc.fontSize(9).font("Helvetica-Bold").fillColor(WHITE).text("❓ " + q, M + 8, y + 3, { width: W - M * 2 - 16 });
  y += 16;
  const ah = doc.heightOfString(a, { width: W - M * 2 - 16, fontSize: 9 }) + 10;
  doc.rect(M, y, W - M * 2, ah).fill(LIGHT).stroke(BORDER);
  doc.fontSize(9).font("Helvetica").fillColor("#222").text(a, M + 8, y + 5, { width: W - M * 2 - 16 });
  y += ah + 4;
});

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA 7 — SOLUCIÓN DE PROBLEMAS Y CIERRE
// ═══════════════════════════════════════════════════════════════════════════════

newPage("Solución de problemas");

y = 100;
y = sectionTitle("Problemas comunes y soluciones", y);

const probs = [
  { ico: "🔴", prob: "No puedo iniciar sesión", sol: "Verifica que tu correo y contraseña sean correctos. Si el problema persiste, usa '¿Olvidaste tu contraseña?' para recuperar acceso. Si sigue sin funcionar, contacta a TI." },
  { ico: "📍", prob: "El botón de registro está desactivado", sol: "El sistema puede estar esperando la validación de tu ubicación GPS. Asegúrate de que tu dispositivo tenga la ubicación activada y que hayas dado permiso al navegador para usarla." },
  { ico: "⏱️", prob: "El botón de registro no aparece", sol: "Es posible que ya hayas registrado el evento del día, que estés fuera del horario permitido, o que debas esperar el tiempo de cooldown (1 hora mínima entre registros del mismo tipo)." },
  { ico: "🌐", prob: "La página no carga o se ve mal", sol: "Intenta recargar la página (F5 o Ctrl+R). Si el problema persiste, borra el caché de tu navegador o intenta con otro navegador. Verifica tu conexión a internet." },
  { ico: "🔔", prob: "No recibo notificaciones", sol: "Asegúrate de tener activas las notificaciones del navegador para la página de Kronos. Si usas modo incógnito, las notificaciones pueden estar bloqueadas." },
  { ico: "📧", prob: "No recibí el correo de restablecimiento", sol: "Revisa la carpeta de spam o correo no deseado. El enlace expira en 1 hora. Si no aparece, intenta solicitar otro desde la pantalla de inicio de sesión." },
];

probs.forEach(p => {
  const boxH = doc.heightOfString(p.sol, { width: W - M * 2 - 80, fontSize: 9 }) + 28;
  doc.roundedRect(M, y, W - M * 2, boxH, 5).fill(LIGHT).stroke(BORDER);
  doc.fontSize(16).text(p.ico, M + 12, y + (boxH - 20) / 2, { width: 30 });
  doc.fontSize(9).font("Helvetica-Bold").fillColor(NAVY).text(p.prob, M + 46, y + 8, { width: W - M * 2 - 58 });
  doc.fontSize(9).font("Helvetica").fillColor("#333").text(p.sol, M + 46, y + 20, { width: W - M * 2 - 58 });
  y += boxH + 6;
});

y += 10;
y = infoBox([
  "📞 SOPORTE TÉCNICO: Si ninguna de las soluciones anteriores resuelve tu problema,",
  "contacta al área de Tecnologías de la Información (TI) de tu empresa.",
  "Proporciona: tu nombre, correo, el problema que presentas y una captura de pantalla si es posible.",
], y, "#E8F5E9", GREEN);

// Bloque de cierre
y += 14;
doc.rect(M, y, W - M * 2, 70).fill(NAVY);
doc.fontSize(18).font("Helvetica-Bold").fillColor(WHITE)
  .text("KRONOS", M, y + 12, { width: W - M * 2, align: "center" });
doc.fontSize(10).font("Helvetica").fillColor(GREEN)
  .text("Control preciso. Decisiones inteligentes.", M, y + 36, { width: W - M * 2, align: "center" });
doc.fontSize(9).fillColor("#90B8D0")
  .text("Manual del Empleado  ·  Versión 1.0  ·  2025", M, y + 52, { width: W - M * 2, align: "center" });

// ─── FIN ──────────────────────────────────────────────────────────────────────
doc.end();
console.log("✅ Employee manual saved:", OUT);
