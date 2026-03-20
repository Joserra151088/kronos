const PptxGenJS = require("../node_modules/pptxgenjs");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "OpenAI Codex";
pptx.company = "Previta";
pptx.subject = "Comparativo ejecutivo Azure vs AWS";
pptx.title = "Kronos - Analisis Ejecutivo de Costos Cloud";

const NAVY = "0B2E4F";
const GREEN = "77B328";
const WHITE = "FFFFFF";
const LIGHT = "F5F8FB";
const TEXT = "243447";
const GRAY = "6B7280";
const BORDER = "D6DEE6";
const BLUE_BOX = "E6F0FA";
const GREEN_BOX = "EAF6D8";
const AMBER_BOX = "FFF3D6";

function titleBar(slide, title, subtitle = "") {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.333, h: 0.82,
    fill: { color: NAVY }, line: { color: NAVY }
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0.82, w: 13.333, h: 0.05,
    fill: { color: GREEN }, line: { color: GREEN }
  });
  slide.addText(title, {
    x: 0.45, y: 0.16, w: 9.2, h: 0.25,
    fontFace: "Calibri", fontSize: 22, bold: true, color: WHITE
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.45, y: 0.46, w: 8.5, h: 0.16,
      fontFace: "Calibri", fontSize: 10.5, color: "D9E4EF"
    });
  }
  slide.addText("KRONOS", {
    x: 10.9, y: 0.18, w: 1.8, h: 0.18,
    align: "right", fontFace: "Calibri", fontSize: 18, bold: true, color: GREEN
  });
}

function footer(slide, number) {
  slide.addText(`Direccion | ${number}`, {
    x: 11.6, y: 7.06, w: 1.0, h: 0.12,
    align: "right", fontFace: "Calibri", fontSize: 8.5, color: GRAY
  });
}

function box(slide, x, y, w, h, title, bullets, fill = WHITE) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.04,
    fill: { color: fill },
    line: { color: BORDER, width: 1 }
  });
  slide.addText(title, {
    x: x + 0.12, y: y + 0.1, w: w - 0.24, h: 0.18,
    fontFace: "Calibri", fontSize: 12, bold: true, color: NAVY
  });
  bullets.forEach((item, idx) => {
    slide.addText(`• ${item}`, {
      x: x + 0.14, y: y + 0.38 + idx * 0.24, w: w - 0.28, h: 0.18,
      fontFace: "Calibri", fontSize: 9.6, color: TEXT
    });
  });
}

function metric(slide, x, y, w, h, label, value, note, fill) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.04,
    fill: { color: fill },
    line: { color: BORDER, width: 1 }
  });
  slide.addText(label, {
    x: x + 0.12, y: y + 0.1, w: w - 0.24, h: 0.16,
    fontFace: "Calibri", fontSize: 9.5, bold: true, color: GRAY
  });
  slide.addText(value, {
    x: x + 0.12, y: y + 0.34, w: w - 0.24, h: 0.22,
    fontFace: "Calibri", fontSize: 18, bold: true, color: NAVY
  });
  slide.addText(note, {
    x: x + 0.12, y: y + 0.67, w: w - 0.24, h: 0.14,
    fontFace: "Calibri", fontSize: 8.2, color: TEXT
  });
}

// Slide 1
{
  const s = pptx.addSlide();
  s.background = { color: NAVY };
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 6.62, w: 13.333, h: 0.62,
    fill: { color: GREEN }, line: { color: GREEN }
  });
  s.addText("KRONOS", {
    x: 0.8, y: 1.55, w: 4.5, h: 0.5,
    fontFace: "Calibri", fontSize: 33, bold: true, color: WHITE
  });
  s.addText("Analisis Ejecutivo de Costos en la Nube", {
    x: 0.8, y: 2.42, w: 8.0, h: 0.35,
    fontFace: "Calibri", fontSize: 24, bold: true, color: GREEN
  });
  s.addText("Comparativo Azure vs AWS para 300 usuarios\ncon crecimiento anual escalable", {
    x: 0.8, y: 3.2, w: 7.3, h: 0.8,
    fontFace: "Calibri", fontSize: 15, color: "DDE7F0", breakLine: false
  });
  s.addText("Presentacion para Direccion | 18 de marzo de 2026", {
    x: 0.8, y: 6.82, w: 4.6, h: 0.16,
    fontFace: "Calibri", fontSize: 10, bold: true, color: NAVY
  });
}

// Slide 2
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  titleBar(s, "Resumen ejecutivo", "Lectura de costos, crecimiento y recomendacion");
  metric(s, 0.45, 1.15, 2.3, 1.0, "Usuarios base", "300", "Operacion inicial", BLUE_BOX);
  metric(s, 2.95, 1.15, 2.3, 1.0, "Registros por dia", "1,200", "4 por colaborador", GREEN_BOX);
  metric(s, 5.45, 1.15, 2.3, 1.0, "Registros por mes", "36,000", "Promedio mensual", AMBER_BOX);
  metric(s, 7.95, 1.15, 2.6, 1.0, "Registros por ano", "438,000", "Operacion continua", BLUE_BOX);

  box(s, 0.45, 2.55, 3.9, 2.2, "Hallazgo principal", [
    "La carga esperada es baja a media-baja.",
    "El costo depende mas de la infraestructura minima.",
    "No se requiere arquitectura compleja al inicio."
  ], LIGHT);
  box(s, 4.7, 2.55, 3.9, 2.2, "Azure", [
    "Rango estimado: 45 a 105 USD/mes.",
    "Mas alineado a gobierno corporativo.",
    "Adecuado si la empresa usa Microsoft."
  ], BLUE_BOX);
  box(s, 8.95, 2.55, 3.9, 2.2, "AWS", [
    "Rango estimado: 25 a 48 USD/mes.",
    "Mejor costo-beneficio para arranque.",
    "Ideal para piloto y validacion inicial."
  ], GREEN_BOX);
  box(s, 0.45, 5.05, 12.35, 1.15, "Recomendacion ejecutiva", [
    "AWS si el objetivo es costo minimo de arranque. Azure si el objetivo es integracion institucional, gobierno y crecimiento corporativo."
  ], WHITE);
  footer(s, 2);
}

// Slide 3
{
  const s = pptx.addSlide();
  s.background = { color: LIGHT };
  titleBar(s, "Supuestos del analisis", "Base usada para dimensionar costo y crecimiento");
  box(s, 0.45, 1.2, 4.0, 2.15, "Volumen", [
    "300 usuarios activos.",
    "4 registros diarios por persona.",
    "Monitoreo y consulta todos los dias.",
    "Uso web continuo."
  ], WHITE);
  box(s, 4.65, 1.2, 4.0, 2.15, "Componentes", [
    "Frontend React/Vite.",
    "Backend Node/Express + Socket.IO.",
    "MySQL administrado.",
    "Storage para archivos y evidencias."
  ], WHITE);
  box(s, 8.85, 1.2, 3.95, 2.15, "Notas financieras", [
    "Montos aproximados.",
    "Pueden variar por region y soporte.",
    "No incluyen desarrollos futuros.",
    "No incluyen alta disponibilidad obligatoria."
  ], WHITE);
  box(s, 0.45, 3.75, 12.35, 1.7, "Interpretacion correcta", [
    "La decision no debe basarse solo en precio. Tambien deben valorarse gobierno, identidad corporativa, facilidad operativa, crecimiento, monitoreo y adopcion futura."
  ], WHITE);
  footer(s, 3);
}

// Slide 4
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  titleBar(s, "Arquitectura cloud objetivo", "Modelo recomendado para operacion inicial");
  box(s, 0.55, 1.4, 2.2, 1.45, "Frontend", ["Hosting estatico", "CDN", "HTTPS"], BLUE_BOX);
  box(s, 3.1, 1.4, 2.3, 1.45, "Backend", ["Node/Express", "API REST", "Socket.IO"], GREEN_BOX);
  box(s, 5.75, 1.4, 2.35, 1.45, "Base de datos", ["MySQL administrado", "Backups", "Escalado vertical"], AMBER_BOX);
  box(s, 8.45, 1.4, 2.2, 1.45, "Archivos", ["Adjuntos", "Evidencias", "Storage object"], BLUE_BOX);
  box(s, 10.95, 1.4, 1.85, 1.45, "Monitoreo", ["Logs", "Salud", "Metricas"], GREEN_BOX);
  box(s, 0.55, 3.35, 12.25, 2.0, "Mensaje para direccion", [
    "El sistema actual puede funcionar con una arquitectura pequena y controlada. El crecimiento esperado permite iniciar con una capa minima y aumentar capacidad en forma ordenada conforme suba el numero de usuarios, adjuntos y requerimientos de disponibilidad."
  ], LIGHT);
  footer(s, 4);
}

// Slide 5
{
  const s = pptx.addSlide();
  s.background = { color: LIGHT };
  titleBar(s, "Escenario Azure", "Servicios sugeridos y costo mensual aproximado");
  box(s, 0.45, 1.2, 4.1, 3.0, "Servicios sugeridos", [
    "Static Web Apps o App Service para frontend.",
    "App Service para backend Node.",
    "Azure Database for MySQL Flexible Server.",
    "Azure Blob Storage para adjuntos.",
    "Azure Monitor para observabilidad."
  ], BLUE_BOX);
  box(s, 4.85, 1.2, 3.8, 3.0, "Costo base estimado", [
    "Backend: 15 a 35 USD/mes.",
    "MySQL: 25 a 45 USD/mes.",
    "Storage: 1 a 5 USD/mes.",
    "Logs y extras: 0 a 20 USD/mes.",
    "Total: 45 a 105 USD/mes."
  ], WHITE);
  box(s, 8.95, 1.2, 3.85, 3.0, "Operacion mas formal", [
    "Mejor backend y base.",
    "Mas retencion y monitoreo.",
    "Mayor holgura operativa.",
    "Total: 110 a 180 USD/mes."
  ], WHITE);
  box(s, 0.45, 4.55, 12.35, 1.25, "Ventaja principal", [
    "Azure se recomienda cuando la empresa prioriza integracion corporativa, gobierno, seguridad, control administrativo y alineacion con ecosistema Microsoft."
  ], WHITE);
  footer(s, 5);
}

// Slide 6
{
  const s = pptx.addSlide();
  s.background = { color: LIGHT };
  titleBar(s, "Escenario AWS", "Servicios sugeridos y costo mensual aproximado");
  box(s, 0.45, 1.2, 4.1, 3.0, "Servicios sugeridos", [
    "S3 + CDN o frontend externo.",
    "Lightsail para backend.",
    "Lightsail Managed Database o RDS pequeno.",
    "S3 para adjuntos.",
    "CloudWatch para observabilidad."
  ], GREEN_BOX);
  box(s, 4.85, 1.2, 3.8, 3.0, "Costo base estimado", [
    "Backend: 7 a 12 USD/mes.",
    "Base: 15 USD/mes.",
    "Storage: 1 a 3 USD/mes.",
    "Logs y extras: 1 a 18 USD/mes.",
    "Total: 25 a 48 USD/mes."
  ], WHITE);
  box(s, 8.95, 1.2, 3.85, 3.0, "Operacion mas formal", [
    "Mas CPU y memoria.",
    "Mayor DB y observabilidad.",
    "Mejor margen para crecimiento.",
    "Total: 45 a 85 USD/mes."
  ], WHITE);
  box(s, 0.45, 4.55, 12.35, 1.25, "Ventaja principal", [
    "AWS se recomienda cuando la prioridad es costo de arranque, rapidez de salida y una fase piloto financieramente eficiente."
  ], WHITE);
  footer(s, 6);
}

// Slide 7
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  titleBar(s, "Pros y contras", "Comparativo cualitativo de decision");
  box(s, 0.45, 1.2, 5.95, 4.4, "Azure", [
    "Pros: mejor integracion con Microsoft.",
    "Pros: buen camino para gobierno y cumplimiento.",
    "Pros: adecuado para operacion institucional.",
    "Contras: costo base normalmente mayor.",
    "Contras: el escalamiento formal eleva gasto mas rapido.",
    "Contras: menos eficiente para piloto de bajo costo."
  ], BLUE_BOX);
  box(s, 6.85, 1.2, 5.95, 4.4, "AWS", [
    "Pros: menor costo de entrada.",
    "Pros: muy buen costo-beneficio al inicio.",
    "Pros: buen rendimiento para esta escala.",
    "Contras: mayor complejidad al crecer fuera de Lightsail.",
    "Contras: mas curva de aprendizaje en IAM y arquitectura.",
    "Contras: menos natural si la empresa ya estandarizo Microsoft."
  ], GREEN_BOX);
  footer(s, 7);
}

// Slide 8
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  titleBar(s, "Pronostico de crecimiento", "Escalamiento anual por usuarios y volumen");
  box(s, 0.45, 1.2, 3.0, 2.15, "Escala 300 usuarios", [
    "1,200 registros por dia.",
    "36,000 registros por mes.",
    "438,000 registros por ano."
  ], BLUE_BOX);
  box(s, 3.75, 1.2, 3.0, 2.15, "Escala 500 usuarios", [
    "2,000 registros por dia.",
    "60,000 registros por mes.",
    "730,000 registros por ano."
  ], GREEN_BOX);
  box(s, 7.05, 1.2, 3.0, 2.15, "Escala 1,000 usuarios", [
    "4,000 registros por dia.",
    "120,000 registros por mes.",
    "1,460,000 registros por ano."
  ], AMBER_BOX);
  box(s, 10.35, 1.2, 2.45, 2.15, "Escala 2,000", [
    "8,000 por dia.",
    "240,000 por mes.",
    "2,920,000 por ano."
  ], BLUE_BOX);
  box(s, 0.45, 3.8, 12.35, 1.55, "Lectura ejecutiva", [
    "Hasta 500 usuarios el sistema puede mantenerse en infraestructura pequena. El crecimiento de costo lo explican mas los adjuntos, logs, backups y disponibilidad que el volumen puro de registros."
  ], LIGHT);
  footer(s, 8);
}

// Slide 9
{
  const s = pptx.addSlide();
  s.background = { color: LIGHT };
  titleBar(s, "Costo por escala", "Rangos mensuales orientativos");
  box(s, 0.45, 1.2, 5.95, 4.25, "Azure", [
    "300 usuarios: 45 a 105 USD/mes.",
    "500 usuarios: 50 a 115 USD/mes.",
    "1,000 usuarios: 80 a 150 USD/mes.",
    "2,000 usuarios: 140 a 250 USD/mes.",
    "Operacion institucional: 110 a 380 USD/mes segun madurez."
  ], BLUE_BOX);
  box(s, 6.85, 1.2, 5.95, 4.25, "AWS", [
    "300 usuarios: 25 a 48 USD/mes.",
    "500 usuarios: 30 a 55 USD/mes.",
    "1,000 usuarios: 45 a 85 USD/mes.",
    "2,000 usuarios: 80 a 160 USD/mes.",
    "Operacion institucional: 45 a 240 USD/mes segun madurez."
  ], GREEN_BOX);
  footer(s, 9);
}

// Slide 10
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  titleBar(s, "Recomendacion final", "Decision sugerida por etapa de negocio");
  box(s, 0.55, 1.3, 3.85, 2.45, "Piloto y validacion", [
    "Elegir AWS.",
    "Menor costo de arranque.",
    "Mejor eficiencia financiera inicial.",
    "Ideal para probar adopcion real."
  ], GREEN_BOX);
  box(s, 4.75, 1.3, 3.85, 2.45, "Operacion institucional", [
    "Elegir Azure.",
    "Mejor alineacion corporativa.",
    "Mas natural para gobierno y seguridad.",
    "Escalamiento formal mas ordenado."
  ], BLUE_BOX);
  box(s, 8.95, 1.3, 3.85, 2.45, "Antes de produccion", [
    "Migrar uploads a storage cloud.",
    "Desacoplar snapshot y consultas SQL.",
    "Definir backups y monitoreo.",
    "Formalizar seguridad operativa."
  ], AMBER_BOX);
  box(s, 0.55, 4.2, 12.25, 1.3, "Mensaje para direccion", [
    "Kronos es viable para 300 usuarios con un costo controlado. La eleccion entre Azure y AWS debe definirse por estrategia corporativa, no por limitacion tecnica."
  ], WHITE);
  footer(s, 10);
}

// Slide 11
{
  const s = pptx.addSlide();
  s.background = { color: NAVY };
  s.addText("KRONOS", {
    x: 0.8, y: 1.8, w: 5.0, h: 0.45,
    fontFace: "Calibri", fontSize: 31, bold: true, color: WHITE
  });
  s.addText("Conclusión ejecutiva", {
    x: 0.8, y: 2.7, w: 4.6, h: 0.3,
    fontFace: "Calibri", fontSize: 23, bold: true, color: GREEN
  });
  s.addText("La plataforma puede salir a nube con una inversion moderada y crecer de forma ordenada. AWS maximiza la eficiencia de arranque; Azure maximiza alineacion institucional y gobierno.", {
    x: 0.8, y: 3.55, w: 9.1, h: 0.9,
    fontFace: "Calibri", fontSize: 15, color: "DCE7F0"
  });
  s.addText("Documento preparado para Direccion | Marzo 2026", {
    x: 0.8, y: 6.7, w: 4.8, h: 0.15,
    fontFace: "Calibri", fontSize: 10, color: WHITE
  });
}

const OUT = "C:/jestrada/Proyectos/access-control/docs/entrega_2026-03-14/06_presentacion_ejecutiva_costos_nube.pptx";
pptx.writeFile({ fileName: OUT })
  .then(() => console.log(`Presentacion creada: ${OUT}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
