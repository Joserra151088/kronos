"use strict";

const pptxgen = require("C:\\Users\\JoseRamonEstradaRend\\AppData\\Roaming\\Claude\\local-agent-mode-sessions\\skills-plugin\\d7d799c7-c68d-4735-9f18-5020fbbe8e77\\246afd61-2015-4905-b7d3-2bf63e539570\\skills\\pptx\\node_modules\\pptxgenjs");

const OUTPUT = "C:/jestrada/Proyectos/access-control/docs/KronOS_PresentacionEjecutiva_2026.pptx";

const makeShadow = () => ({ type: "outer", blur: 8, offset: 3, color: "000000", opacity: 0.12 });

const pptx = new pptxgen();
pptx.layout = "LAYOUT_16x9";
pptx.author = "KronOS Team";
pptx.company = "KronOS";
pptx.title = "KronOS — Presentación Ejecutiva 2026";

// ─────────────────────────────────────────────────────────────
// SLIDE 1: PORTADA
// ─────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide();
  slide.background = { color: "1B2A4A" };

  // Left teal vertical bar
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.35, h: 5.625, fill: { color: "0D9488" }, line: { type: "none" } });

  // Top-right decorative circle
  slide.addShape(pptx.ShapeType.ellipse, { x: 7.5, y: -1.5, w: 5, h: 5, fill: { color: "0D9488", transparency: 75 }, line: { type: "none" } });

  // Bottom-right decorative circle
  slide.addShape(pptx.ShapeType.ellipse, { x: 8.5, y: 3.5, w: 3, h: 3, fill: { color: "0D9488", transparency: 85 }, line: { type: "none" } });

  // Tag
  slide.addText("PRESENTACIÓN EJECUTIVA", {
    x: 0.6, y: 0.7, w: 5, h: 0.35,
    fontSize: 11, bold: true, charSpacing: 3,
    color: "0D9488", fontFace: "Calibri",
  });

  // Main title
  slide.addText("KronOS", {
    x: 0.6, y: 1.2, w: 8.5, h: 1.2,
    fontSize: 72, bold: true,
    color: "FFFFFF", fontFace: "Georgia",
  });

  // Subtitle
  slide.addText("Plataforma de Control de Acceso y Gestión de Personal", {
    x: 0.6, y: 2.5, w: 7.5, h: 0.7,
    fontSize: 20, color: "B8D4F0", fontFace: "Calibri",
  });

  // Separator line
  slide.addShape(pptx.ShapeType.line, {
    x: 0.6, y: 3.35, w: 4, h: 0,
    line: { color: "0D9488", width: 2 },
  });

  // Date / audience
  slide.addText("Alta Dirección · Marzo 2026", {
    x: 0.6, y: 3.55, w: 5, h: 0.4,
    fontSize: 14, color: "94A3B8", fontFace: "Calibri",
  });

  // Bottom footer bar
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 5.2, w: 10, h: 0.425, fill: { color: "0D9488", transparency: 20 }, line: { type: "none" } });

  // Footer text
  slide.addText("Confidencial — Uso Interno", {
    x: 0.5, y: 5.25, w: 5, h: 0.35,
    fontSize: 10, color: "B8D4F0", fontFace: "Calibri",
  });
}

// ─────────────────────────────────────────────────────────────
// SLIDE 2: AGENDA
// ─────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide();
  slide.background = { color: "F8FAFC" };

  // Left nav bar
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 3.2, h: 5.625, fill: { color: "1B2A4A" }, line: { type: "none" } });

  // AGENDA label
  slide.addText("AGENDA", {
    x: 0.2, y: 0.4, w: 2.8, h: 0.6,
    fontSize: 22, bold: true, color: "0D9488", fontFace: "Georgia",
  });

  // Agenda items
  const items = [
    { y: 1.1, text: "01  Problemática Actual" },
    { y: 1.9, text: "02  Impacto en Operaciones" },
    { y: 2.7, text: "03  KronOS: La Solución" },
    { y: 3.5, text: "04  Beneficios vs RUNAHR" },
    { y: 4.3, text: "05  Análisis de Costos AWS" },
  ];
  items.forEach(item => {
    slide.addText(item.text, {
      x: 0.25, y: item.y, w: 2.7, h: 0.55,
      fontSize: 12, color: "FFFFFF", fontFace: "Calibri",
    });
  });

  // Right title
  slide.addText("Lo que cubriremos hoy", {
    x: 3.6, y: 0.4, w: 6, h: 0.7,
    fontSize: 28, bold: true, color: "1B2A4A", fontFace: "Georgia",
  });

  // Paragraph
  slide.addText(
    "Esta presentación analiza los desafíos actuales con la plataforma RUNAHR, presenta los beneficios de KronOS como alternativa, y proyecta el impacto económico de la migración para 300 usuarios en infraestructura AWS.",
    {
      x: 3.6, y: 1.2, w: 6, h: 3.2,
      fontSize: 14, color: "64748B", fontFace: "Calibri",
    }
  );

  // Teal circle decoration
  slide.addShape(pptx.ShapeType.ellipse, { x: 8.5, y: 3.8, w: 1.8, h: 1.8, fill: { color: "0D9488", transparency: 85 }, line: { type: "none" } });
}

// ─────────────────────────────────────────────────────────────
// SLIDE 3: PROBLEMÁTICA ACTUAL
// ─────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide();
  slide.background = { color: "1B2A4A" };

  // Title
  slide.addText("El Costo Real de la Dependencia RUNAHR", {
    x: 0.5, y: 0.3, w: 9, h: 0.7,
    fontSize: 30, bold: true, color: "FFFFFF", fontFace: "Georgia",
  });

  // Subtitle
  slide.addText("5 problemas críticos identificados en operaciones", {
    x: 0.5, y: 1.0, w: 9, h: 0.4,
    fontSize: 15, color: "94A3B8", fontFace: "Calibri",
  });

  // Box 1
  slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.6, w: 2.8, h: 1.7, fill: { color: "DC2626", transparency: 15 }, line: { type: "none" } });
  slide.addText("3 hrs", { x: 0.5, y: 1.75, w: 2.6, h: 0.7, fontSize: 42, bold: true, color: "FFFFFF" });
  slide.addText("para registrar 1 empleado", { x: 0.5, y: 2.55, w: 2.6, h: 0.4, fontSize: 11, color: "FCA5A5" });

  // Box 2
  slide.addShape(pptx.ShapeType.rect, { x: 3.6, y: 1.6, w: 2.8, h: 1.7, fill: { color: "D97706", transparency: 15 }, line: { type: "none" } });
  slide.addText("97", { x: 3.7, y: 1.75, w: 2.6, h: 0.7, fontSize: 42, bold: true, color: "FFFFFF" });
  slide.addText("tickets generados (solo 3 incidencias)", { x: 3.7, y: 2.55, w: 2.6, h: 0.4, fontSize: 11, color: "FDE68A" });

  // Box 3
  slide.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.6, w: 2.8, h: 1.7, fill: { color: "DC2626", transparency: 15 }, line: { type: "none" } });
  slide.addText("1 hr", { x: 6.9, y: 1.75, w: 2.6, h: 0.7, fontSize: 42, bold: true, color: "FFFFFF" });
  slide.addText("promedio por ticket de soporte", { x: 6.9, y: 2.55, w: 2.6, h: 0.4, fontSize: 11, color: "FCA5A5" });

  // Separator line
  slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 3.5, w: 9, h: 0, line: { color: "0D9488", width: 1 } });

  // Stat 4
  slide.addShape(pptx.ShapeType.rect, { x: 1.5, y: 3.65, w: 3, h: 1.4, fill: { color: "0D9488", transparency: 20 }, line: { type: "none" } });
  slide.addText("+4 registros", { x: 1.6, y: 3.8, w: 2.8, h: 0.45, fontSize: 28, bold: true, color: "FFFFFF" });
  slide.addText("diarios por médico (exceso)", { x: 1.6, y: 4.35, w: 2.8, h: 0.4, fontSize: 11, color: "A7F3D0" });

  // Stat 5
  slide.addShape(pptx.ShapeType.rect, { x: 5.5, y: 3.65, w: 3, h: 1.4, fill: { color: "0D9488", transparency: 20 }, line: { type: "none" } });
  slide.addText("Registros no confiables", { x: 5.6, y: 3.8, w: 2.8, h: 0.35, fontSize: 20, bold: true, color: "FFFFFF" });
  slide.addText("impiden conciliación correcta", { x: 5.6, y: 4.25, w: 2.8, h: 0.4, fontSize: 11, color: "A7F3D0" });
}

// ─────────────────────────────────────────────────────────────
// SLIDE 4: 5 PROBLEMAS DETALLADOS
// ─────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide();
  slide.background = { color: "F8FAFC" };

  // Top bar
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.9, fill: { color: "1B2A4A" }, line: { type: "none" } });

  // Title
  slide.addText("Los 5 Problemas Principales", {
    x: 0.5, y: 0.15, w: 9, h: 0.6,
    fontSize: 26, bold: true, color: "FFFFFF", fontFace: "Georgia",
  });

  // ---- ROW 1 ----
  // Card 1
  slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.05, w: 2.9, h: 1.7, fill: { color: "FFFFFF" }, shadow: makeShadow(), line: { type: "none" } });
  slide.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.05, w: 0.08, h: 1.7, fill: { color: "DC2626" }, line: { type: "none" } });
  slide.addText("01", { x: 0.5, y: 1.15, w: 0.6, h: 0.35, fontSize: 11, bold: true, color: "DC2626" });
  slide.addText("Registro Lento", { x: 0.5, y: 1.5, w: 2.5, h: 0.4, fontSize: 14, bold: true, color: "1B2A4A" });
  slide.addText("Cada empleado nuevo requiere solicitarse vía correo/chat a RUNAHR. Tiempo promedio: 3 horas para completar el registro.", {
    x: 0.5, y: 1.9, w: 2.5, h: 0.75, fontSize: 10, color: "64748B",
  });

  // Card 2
  slide.addShape(pptx.ShapeType.rect, { x: 3.55, y: 1.05, w: 2.9, h: 1.7, fill: { color: "FFFFFF" }, shadow: makeShadow(), line: { type: "none" } });
  slide.addShape(pptx.ShapeType.rect, { x: 3.55, y: 1.05, w: 0.08, h: 1.7, fill: { color: "D97706" }, line: { type: "none" } });
  slide.addText("02", { x: 3.75, y: 1.15, w: 0.6, h: 0.35, fontSize: 11, bold: true, color: "D97706" });
  slide.addText("Sin Comunicación", { x: 3.75, y: 1.5, w: 2.5, h: 0.4, fontSize: 14, bold: true, color: "1B2A4A" });
  slide.addText("Actualizaciones sin previo aviso generan fallas masivas. 3 incidencias fuertes han derivado en 97 tickets activos.", {
    x: 3.75, y: 1.9, w: 2.5, h: 0.75, fontSize: 10, color: "64748B",
  });

  // Card 3
  slide.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.05, w: 2.9, h: 1.7, fill: { color: "FFFFFF" }, shadow: makeShadow(), line: { type: "none" } });
  slide.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.05, w: 0.08, h: 1.7, fill: { color: "DC2626" }, line: { type: "none" } });
  slide.addText("03", { x: 7.0, y: 1.15, w: 0.6, h: 0.35, fontSize: 11, bold: true, color: "DC2626" });
  slide.addText("Alto Costo de Tickets", { x: 7.0, y: 1.5, w: 2.5, h: 0.4, fontSize: 14, bold: true, color: "1B2A4A" });
  slide.addText("Cada ticket consume ~1 hr de soporte: reinicio de servicios, módem, reinstalación de app y coordinación con médicos en sucursal.", {
    x: 7.0, y: 1.9, w: 2.5, h: 0.75, fontSize: 10, color: "64748B",
  });

  // ---- ROW 2 ----
  // Card 4
  slide.addShape(pptx.ShapeType.rect, { x: 1.8, y: 2.95, w: 2.9, h: 1.7, fill: { color: "FFFFFF" }, shadow: makeShadow(), line: { type: "none" } });
  slide.addShape(pptx.ShapeType.rect, { x: 1.8, y: 2.95, w: 0.08, h: 1.7, fill: { color: "D97706" }, line: { type: "none" } });
  slide.addText("04", { x: 2.0, y: 3.05, w: 0.6, h: 0.35, fontSize: 11, bold: true, color: "D97706" });
  slide.addText("Registros No Confiables", { x: 2.0, y: 3.4, w: 2.5, h: 0.4, fontSize: 14, bold: true, color: "1B2A4A" });
  slide.addText("Los registros de RUNAHR no permiten la conciliación correcta de días trabajados, horas y asistencia real.", {
    x: 2.0, y: 3.8, w: 2.5, h: 0.75, fontSize: 10, color: "64748B",
  });

  // Card 5
  slide.addShape(pptx.ShapeType.rect, { x: 5.3, y: 2.95, w: 2.9, h: 1.7, fill: { color: "FFFFFF" }, shadow: makeShadow(), line: { type: "none" } });
  slide.addShape(pptx.ShapeType.rect, { x: 5.3, y: 2.95, w: 0.08, h: 1.7, fill: { color: "DC2626" }, line: { type: "none" } });
  slide.addText("05", { x: 5.5, y: 3.05, w: 0.6, h: 0.35, fontSize: 11, bold: true, color: "DC2626" });
  slide.addText("Exceso de Registros", { x: 5.5, y: 3.4, w: 2.5, h: 0.4, fontSize: 14, bold: true, color: "1B2A4A" });
  slide.addText("Los médicos realizan más de 4 registros diarios, saturando el sistema y generando datos incoherentes.", {
    x: 5.5, y: 3.8, w: 2.5, h: 0.75, fontSize: 10, color: "64748B",
  });

  // Footer note
  slide.addText("* Los tickets activos continúan reportándose al momento de esta presentación.", {
    x: 0.5, y: 4.85, w: 9, h: 0.4,
    fontSize: 10, color: "94A3B8", italic: true,
  });
}

// ─────────────────────────────────────────────────────────────
// SLIDE 5: IMPACTO EN OPERACIONES
// ─────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide();
  slide.background = { color: "F8FAFC" };

  // Top bar
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.9, fill: { color: "0D9488" }, line: { type: "none" } });
  slide.addText("Impacto Acumulado en Operaciones", {
    x: 0.5, y: 0.15, w: 9, h: 0.6,
    fontSize: 26, bold: true, color: "FFFFFF", fontFace: "Georgia",
  });

  // Subsection title
  slide.addText("Tiempo Perdido por Incidencias", {
    x: 0.4, y: 1.1, w: 4, h: 0.45,
    fontSize: 16, bold: true, color: "1B2A4A",
  });

  // Block A
  slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.65, w: 4.2, h: 0.85, fill: { color: "DC2626", transparency: 10 }, line: { type: "none" } });
  slide.addText("97 tickets × 1 hora = 97 horas de soporte", { x: 0.55, y: 1.75, w: 4.0, h: 0.3, fontSize: 13, bold: true, color: "FFFFFF" });
  slide.addText("Solo en las 3 incidencias acumuladas", { x: 0.55, y: 2.1, w: 4.0, h: 0.3, fontSize: 10, color: "FCA5A5" });

  // Block B
  slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 2.6, w: 4.2, h: 0.85, fill: { color: "D97706", transparency: 10 }, line: { type: "none" } });
  slide.addText("3 hrs × N empleados = tiempo de onboarding", { x: 0.55, y: 2.7, w: 4.0, h: 0.3, fontSize: 13, bold: true, color: "FFFFFF" });
  slide.addText("Costo operativo elevado al incorporar personal", { x: 0.55, y: 3.05, w: 4.0, h: 0.3, fontSize: 10, color: "FDE68A" });

  // Block C
  slide.addShape(pptx.ShapeType.rect, { x: 0.4, y: 3.55, w: 4.2, h: 0.85, fill: { color: "1B2A4A", transparency: 10 }, line: { type: "none" } });
  slide.addText("Fallas activas sin resolución", { x: 0.55, y: 3.65, w: 4.0, h: 0.3, fontSize: 13, bold: true, color: "FFFFFF" });
  slide.addText("97 tickets siguen reportando fallas al cierre", { x: 0.55, y: 4.0, w: 4.0, h: 0.3, fontSize: 10, color: "B8D4F0" });

  // Bar chart
  const chartData = [{
    name: "Horas perdidas",
    labels: ["Registro\nempleados (×10)", "Tickets\nsoporte", "Coordinación\nmédicos", "Reinstalaciones\napp"],
    values: [30, 97, 20, 30],
  }];
  slide.addChart(pptx.ChartType.bar, chartData, {
    x: 5.0, y: 1.1, w: 4.6, h: 4.0,
    barDir: "col",
    chartColors: ["DC2626", "D97706", "DC2626", "D97706"],
    chartArea: { fill: { color: "FFFFFF" }, roundedCorners: true },
    showValue: true,
    valAxisLabelColor: "64748B",
    catAxisLabelColor: "64748B",
    valGridLine: { color: "E2E8F0", size: 0.5 },
    catGridLine: { style: "none" },
    showLegend: false,
    showTitle: true,
    title: "Horas Operativas Perdidas (estimado)",
    titleFontSize: 12,
    titleColor: "1B2A4A",
  });
}

// ─────────────────────────────────────────────────────────────
// SLIDE 6: KRONOS LA SOLUCIÓN
// ─────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide();
  slide.background = { color: "1B2A4A" };

  // Large teal circle
  slide.addShape(pptx.ShapeType.ellipse, { x: 5.5, y: -1, w: 7, h: 7, fill: { color: "0D9488", transparency: 80 }, line: { type: "none" } });
  // Small circle
  slide.addShape(pptx.ShapeType.ellipse, { x: 0.5, y: 3.5, w: 2.5, h: 2.5, fill: { color: "0D9488", transparency: 88 }, line: { type: "none" } });
  // Left vertical accent
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.4, h: 5.625, fill: { color: "0D9488" }, line: { type: "none" } });

  slide.addText("LA SOLUCIÓN", {
    x: 0.65, y: 0.6, w: 5, h: 0.4,
    fontSize: 12, bold: true, charSpacing: 4, color: "0D9488",
  });

  slide.addText("KronOS", {
    x: 0.65, y: 1.1, w: 7, h: 1.4,
    fontSize: 80, bold: true, color: "FFFFFF", fontFace: "Georgia",
  });

  slide.addText("Control total. Sin dependencias externas.", {
    x: 0.65, y: 2.6, w: 7.5, h: 0.5,
    fontSize: 20, color: "A7F3D0", fontFace: "Calibri", italic: true,
  });

  // Separator
  slide.addShape(pptx.ShapeType.line, { x: 0.65, y: 3.25, w: 4.5, h: 0, line: { color: "0D9488", width: 1.5 } });

  slide.addText(
    "KronOS es una plataforma desarrollada internamente que elimina la dependencia de terceros para el control de asistencia, gestión de personal y comunicación organizacional. Diseñada para operar de forma autónoma en infraestructura AWS con control total de datos y configuraciones.",
    {
      x: 0.65, y: 3.45, w: 7, h: 1.6,
      fontSize: 14, color: "CBD5E1", fontFace: "Calibri",
    }
  );
}

// ─────────────────────────────────────────────────────────────
// SLIDE 7: BENEFICIOS DE KRONOS (2×3 grid)
// ─────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide();
  slide.background = { color: "F8FAFC" };

  // Top bar
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.85, fill: { color: "1B2A4A" }, line: { type: "none" } });
  slide.addText("Beneficios de KronOS", {
    x: 0.5, y: 0.1, w: 9, h: 0.65,
    fontSize: 26, bold: true, color: "FFFFFF", fontFace: "Georgia",
  });

  const cards = [
    {
      x: 0.35, y: 1.05, w: 4.35, h: 1.3,
      title: "Alta velocidad de registro",
      body: "Registro de empleado en minutos. Sin depender de soporte externo ni correos a RUNAHR.",
    },
    {
      x: 5.3, y: 1.05, w: 4.35, h: 1.3,
      title: "Comunicacion interna",
      body: "Sistema de anuncios con imagen y segmentacion por area, grupo o persona. Sin intermediarios.",
    },
    {
      x: 0.35, y: 2.55, w: 4.35, h: 1.3,
      title: "Registros confiables",
      body: "Bitacora de acceso precisa con control de duplicados. Datos fiables para conciliacion de nomina y RH.",
    },
    {
      x: 5.3, y: 2.55, w: 4.35, h: 1.3,
      title: "Autonomia y seguridad",
      body: "Datos propios en AWS. Autenticacion con JWT + 2FA. Sin actualizaciones sorpresa de terceros.",
    },
    {
      x: 0.35, y: 4.05, w: 4.35, h: 1.3,
      title: "Gestion de personal",
      body: "Organigrama, puestos, horarios, vacaciones, incapacidades y grupos. Todo integrado.",
    },
    {
      x: 5.3, y: 4.05, w: 4.35, h: 1.3,
      title: "Reportes y auditoria",
      body: "Dashboard ejecutivo, reportes exportables y log de auditoria completo por usuario.",
    },
  ];

  cards.forEach(card => {
    // Card background
    slide.addShape(pptx.ShapeType.rect, {
      x: card.x, y: card.y, w: card.w, h: card.h,
      fill: { color: "FFFFFF" }, shadow: makeShadow(), line: { type: "none" },
    });
    // Teal accent top bar
    slide.addShape(pptx.ShapeType.rect, {
      x: card.x, y: card.y, w: card.w, h: 0.06,
      fill: { color: "0D9488" }, line: { type: "none" },
    });
    // Title
    slide.addText(card.title, {
      x: card.x + 0.2, y: card.y + 0.15, w: card.w - 0.3, h: 0.4,
      fontSize: 13, bold: true, color: "1B2A4A",
    });
    // Body
    slide.addText(card.body, {
      x: card.x + 0.2, y: card.y + 0.5, w: card.w - 0.3, h: 0.7,
      fontSize: 10, color: "64748B",
    });
  });
}

// ─────────────────────────────────────────────────────────────
// SLIDE 8: KRONOS VS RUNAHR — COMPARATIVA TABLE
// ─────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide();
  slide.background = { color: "F8FAFC" };

  // Top bar
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.85, fill: { color: "1B2A4A" }, line: { type: "none" } });
  slide.addText("KronOS vs RUNAHR — Comparativa", {
    x: 0.5, y: 0.1, w: 9, h: 0.65,
    fontSize: 26, bold: true, color: "FFFFFF", fontFace: "Georgia",
  });

  const rows = [
    // Header
    [
      { text: "Característica", options: { fill: { color: "1B2A4A" }, color: "FFFFFF", bold: true, fontSize: 13, align: "left" } },
      { text: "RUNAHR", options: { fill: { color: "DC2626" }, color: "FFFFFF", bold: true, fontSize: 13, align: "center" } },
      { text: "KronOS", options: { fill: { color: "0D9488" }, color: "FFFFFF", bold: true, fontSize: 13, align: "center" } },
    ],
    // Data rows
    [
      { text: "Tiempo de registro de empleado", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10 } },
      { text: "~3 horas (correo/chat)", options: { fill: { color: "FEE2E2" }, color: "DC2626", fontSize: 10, align: "center" } },
      { text: "~5 minutos (autogestion)", options: { fill: { color: "E6F7F5" }, color: "0D9488", fontSize: 10, align: "center" } },
    ],
    [
      { text: "Comunicacion de actualizaciones", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10 } },
      { text: "Sin aviso previo", options: { fill: { color: "FEE2E2" }, color: "DC2626", fontSize: 10, align: "center" } },
      { text: "Control total interno", options: { fill: { color: "E6F7F5" }, color: "0D9488", fontSize: 10, align: "center" } },
    ],
    [
      { text: "Tickets por actualizaciones", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10 } },
      { text: "97+ tickets activos", options: { fill: { color: "FEE2E2" }, color: "DC2626", fontSize: 10, align: "center" } },
      { text: "0 dependencias externas", options: { fill: { color: "E6F7F5" }, color: "0D9488", fontSize: 10, align: "center" } },
    ],
    [
      { text: "Confiabilidad de registros", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10 } },
      { text: "Fallas frecuentes", options: { fill: { color: "FEE2E2" }, color: "DC2626", fontSize: 10, align: "center" } },
      { text: "Bitacora en tiempo real", options: { fill: { color: "E6F7F5" }, color: "0D9488", fontSize: 10, align: "center" } },
    ],
    [
      { text: "Control de datos", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10 } },
      { text: "Tercero (RUNAHR)", options: { fill: { color: "FEE2E2" }, color: "DC2626", fontSize: 10, align: "center" } },
      { text: "Propio (AWS)", options: { fill: { color: "E6F7F5" }, color: "0D9488", fontSize: 10, align: "center" } },
    ],
    [
      { text: "Soporte", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10 } },
      { text: "Mesa de ayuda externa (3+ hrs)", options: { fill: { color: "FEE2E2" }, color: "DC2626", fontSize: 10, align: "center" } },
      { text: "Equipo interno inmediato", options: { fill: { color: "E6F7F5" }, color: "0D9488", fontSize: 10, align: "center" } },
    ],
    [
      { text: "Segmentacion de comunicados", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10 } },
      { text: "No disponible", options: { fill: { color: "FEE2E2" }, color: "DC2626", fontSize: 10, align: "center" } },
      { text: "Por area, grupo o persona", options: { fill: { color: "E6F7F5" }, color: "0D9488", fontSize: 10, align: "center" } },
    ],
    [
      { text: "Costo mensual (300 usuarios)", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10 } },
      { text: "~$24,000 MXN estimado", options: { fill: { color: "FEE2E2" }, color: "DC2626", fontSize: 10, align: "center" } },
      { text: "~$2,000 MXN (infraestructura)", options: { fill: { color: "E6F7F5" }, color: "0D9488", fontSize: 10, align: "center" } },
    ],
  ];

  slide.addTable(rows, {
    x: 0.4, y: 1.0, w: 9.2, h: 4.35,
    colW: [3.5, 3.0, 3.0],
    rowH: 0.48,
    border: { type: "solid", color: "E2E8F0", pt: 0.5 },
    fontFace: "Calibri",
  });
}

// ─────────────────────────────────────────────────────────────
// SLIDE 9: ANÁLISIS DE COSTOS AWS
// ─────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide();
  slide.background = { color: "F8FAFC" };

  // Top bar
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.85, fill: { color: "0D9488" }, line: { type: "none" } });
  slide.addText("Analisis de Costos — AWS (300 usuarios)", {
    x: 0.5, y: 0.1, w: 9, h: 0.65,
    fontSize: 24, bold: true, color: "FFFFFF", fontFace: "Georgia",
  });

  // AWS Cost table
  const awsRows = [
    [
      { text: "Servicio AWS", options: { fill: { color: "1B2A4A" }, color: "FFFFFF", bold: true, fontSize: 11 } },
      { text: "USD/mes", options: { fill: { color: "1B2A4A" }, color: "FFFFFF", bold: true, fontSize: 11, align: "center" } },
      { text: "MXN/mes", options: { fill: { color: "1B2A4A" }, color: "FFFFFF", bold: true, fontSize: 11, align: "center" } },
    ],
    [
      { text: "EC2 t3.medium (Backend Node.js)", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10 } },
      { text: "$30", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10, align: "center" } },
      { text: "$555", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10, align: "center" } },
    ],
    [
      { text: "RDS MySQL db.t3.micro", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10 } },
      { text: "$35", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10, align: "center" } },
      { text: "$648", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10, align: "center" } },
    ],
    [
      { text: "S3 (Archivos y fotos, 100 GB)", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10 } },
      { text: "$5", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10, align: "center" } },
      { text: "$93", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10, align: "center" } },
    ],
    [
      { text: "CloudFront CDN", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10 } },
      { text: "$8", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10, align: "center" } },
      { text: "$148", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10, align: "center" } },
    ],
    [
      { text: "Application Load Balancer", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10 } },
      { text: "$20", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10, align: "center" } },
      { text: "$370", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10, align: "center" } },
    ],
    [
      { text: "Route 53 (DNS)", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10 } },
      { text: "$1", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10, align: "center" } },
      { text: "$19", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10, align: "center" } },
    ],
    [
      { text: "CloudWatch (Monitoreo)", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10 } },
      { text: "$5", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10, align: "center" } },
      { text: "$93", options: { fill: { color: "FFFFFF" }, color: "1B2A4A", fontSize: 10, align: "center" } },
    ],
    [
      { text: "SES (Notificaciones email)", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10 } },
      { text: "$1", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10, align: "center" } },
      { text: "$19", options: { fill: { color: "F1F9F8" }, color: "1B2A4A", fontSize: 10, align: "center" } },
    ],
    // Total row
    [
      { text: "TOTAL INFRAESTRUCTURA", options: { fill: { color: "0D9488" }, color: "FFFFFF", bold: true, fontSize: 11 } },
      { text: "$105 USD", options: { fill: { color: "0D9488" }, color: "FFFFFF", bold: true, fontSize: 11, align: "center" } },
      { text: "$1,945 MXN", options: { fill: { color: "0D9488" }, color: "FFFFFF", bold: true, fontSize: 11, align: "center" } },
    ],
  ];

  slide.addTable(awsRows, {
    x: 0.4, y: 1.0, w: 5.6, h: 4.3,
    colW: [2.9, 1.35, 1.35],
    rowH: 0.4,
    border: { type: "solid", color: "E2E8F0", pt: 0.5 },
    fontFace: "Calibri",
  });

  // Right section
  slide.addText("Resumen Anual", {
    x: 6.3, y: 1.0, w: 3.4, h: 0.4,
    fontSize: 14, bold: true, color: "1B2A4A",
  });

  // Box 1 Infra
  slide.addShape(pptx.ShapeType.rect, { x: 6.3, y: 1.5, w: 3.3, h: 1.0, fill: { color: "0D9488", transparency: 10 }, line: { type: "none" } });
  slide.addText("$23,340 MXN/año", { x: 6.45, y: 1.6, w: 3.0, h: 0.35, fontSize: 20, bold: true, color: "FFFFFF" });
  slide.addText("Infraestructura AWS", { x: 6.45, y: 1.95, w: 3.0, h: 0.3, fontSize: 10, color: "A7F3D0" });

  // Box 2 Maintenance
  slide.addShape(pptx.ShapeType.rect, { x: 6.3, y: 2.65, w: 3.3, h: 1.0, fill: { color: "1B2A4A", transparency: 10 }, line: { type: "none" } });
  slide.addText("$96,000 MXN/año", { x: 6.45, y: 2.75, w: 3.0, h: 0.35, fontSize: 20, bold: true, color: "FFFFFF" });
  slide.addText("Mantenimiento (20 hrs/mes)", { x: 6.45, y: 3.1, w: 3.0, h: 0.3, fontSize: 10, color: "B8D4F0" });

  // Box 3 Total
  slide.addShape(pptx.ShapeType.rect, { x: 6.3, y: 3.8, w: 3.3, h: 1.2, fill: { color: "1B2A4A" }, line: { type: "none" } });
  slide.addText("$119,340 MXN/año", { x: 6.45, y: 3.95, w: 3.0, h: 0.45, fontSize: 22, bold: true, color: "0D9488" });
  slide.addText("Total KronOS en AWS", { x: 6.45, y: 4.45, w: 3.0, h: 0.3, fontSize: 11, color: "FFFFFF" });

  // Note
  slide.addText("* Tipo de cambio: $18.50 MXN/USD · Mantenimiento: 20 hrs/mes a $400 MXN/hr", {
    x: 6.3, y: 5.1, w: 3.3, h: 0.35,
    fontSize: 8, color: "94A3B8", italic: true,
  });
}

// ─────────────────────────────────────────────────────────────
// SLIDE 10: COMPARATIVA DE INVERSIÓN
// ─────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide();
  slide.background = { color: "F8FAFC" };

  // Top bar
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.85, fill: { color: "1B2A4A" }, line: { type: "none" } });
  slide.addText("Comparativa de Inversion Anual", {
    x: 0.5, y: 0.1, w: 9, h: 0.65,
    fontSize: 26, bold: true, color: "FFFFFF", fontFace: "Georgia",
  });

  // Bar chart
  const chartData = [
    { name: "Plataforma", labels: ["RUNAHR (~)", "KronOS AWS"], values: [361000, 119340] },
  ];
  slide.addChart(pptx.ChartType.bar, chartData, {
    x: 0.5, y: 1.0, w: 5.5, h: 3.8,
    barDir: "col",
    chartColors: ["DC2626", "0D9488"],
    chartArea: { fill: { color: "FFFFFF" }, roundedCorners: true },
    showValue: true,
    valAxisLabelColor: "64748B",
    catAxisLabelColor: "64748B",
    valGridLine: { color: "E2E8F0", size: 0.5 },
    catGridLine: { style: "none" },
    showLegend: false,
    dataLabelColor: "1E293B",
    dataLabelFontSize: 11,
    showTitle: true,
    title: "Costo Anual Estimado (MXN)",
    titleFontSize: 12,
    titleColor: "1B2A4A",
  });

  // Right: ROI summary
  slide.addText("Ahorro Potencial", {
    x: 6.3, y: 1.0, w: 3.5, h: 0.45,
    fontSize: 16, bold: true, color: "1B2A4A",
  });

  // Saving box
  slide.addShape(pptx.ShapeType.rect, { x: 6.3, y: 1.6, w: 3.4, h: 1.3, fill: { color: "16A34A", transparency: 10 }, line: { type: "none" } });
  slide.addText("$241,660 MXN", { x: 6.45, y: 1.75, w: 3.1, h: 0.5, fontSize: 28, bold: true, color: "FFFFFF" });
  slide.addText("Ahorro estimado por año", { x: 6.45, y: 2.35, w: 3.1, h: 0.3, fontSize: 11, color: "A7F3D0" });

  // ROI box
  slide.addShape(pptx.ShapeType.rect, { x: 6.3, y: 3.1, w: 3.4, h: 1.0, fill: { color: "0D9488" }, line: { type: "none" } });
  slide.addText("67% reduccion", { x: 6.45, y: 3.25, w: 3.1, h: 0.45, fontSize: 24, bold: true, color: "FFFFFF" });
  slide.addText("en costos de plataforma", { x: 6.45, y: 3.75, w: 3.1, h: 0.3, fontSize: 11, color: "A7F3D0" });

  // Note box
  slide.addShape(pptx.ShapeType.rect, {
    x: 6.3, y: 4.25, w: 3.4, h: 1.0,
    fill: { color: "F8FAFC" }, line: { color: "E2E8F0", width: 1 },
  });
  slide.addText(
    "Estimacion RUNAHR incluye licencias (~$24K MXN/mes) + 97+ hrs soporte x $250 MXN/hr = ~$361K MXN/año. RUNAHR pricing es estimado de mercado.",
    { x: 6.4, y: 4.3, w: 3.2, h: 0.9, fontSize: 9, color: "64748B" }
  );
}

// ─────────────────────────────────────────────────────────────
// SLIDE 11: SIGUIENTES PASOS
// ─────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide();
  slide.background = { color: "F8FAFC" };

  // Left panel
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 4, h: 5.625, fill: { color: "1B2A4A" }, line: { type: "none" } });

  slide.addText("SIGUIENTES PASOS", {
    x: 0.3, y: 0.4, w: 3.4, h: 0.7,
    fontSize: 22, bold: true, color: "0D9488", fontFace: "Georgia",
  });

  slide.addText(
    "Para migrar exitosamente a KronOS y eliminar la dependencia de RUNAHR, proponemos el siguiente plan de accion por fases.",
    {
      x: 0.3, y: 1.3, w: 3.4, h: 2.0,
      fontSize: 13, color: "CBD5E1", fontFace: "Calibri",
    }
  );

  // Teal circles decoration on left
  slide.addShape(pptx.ShapeType.ellipse, { x: 0.5, y: 3.8, w: 1.5, h: 1.5, fill: { color: "0D9488", transparency: 85 }, line: { type: "none" } });
  slide.addShape(pptx.ShapeType.ellipse, { x: 2.5, y: 4.5, w: 1.0, h: 1.0, fill: { color: "0D9488", transparency: 88 }, line: { type: "none" } });

  // Steps
  const steps = [
    {
      y: 0.4, num: "1", color: "0D9488",
      title: "Aprobacion y asignacion de presupuesto AWS",
      desc: "Aprobacion formal del proyecto y contratacion de infraestructura AWS (~$105 USD/mes).",
    },
    {
      y: 1.45, num: "2", color: "0D9488",
      title: "Migracion de datos y configuracion",
      desc: "Importacion de empleados, puestos, horarios y sucursales desde RUNAHR a KronOS.",
    },
    {
      y: 2.5, num: "3", color: "0D9488",
      title: "Piloto en 1-2 sucursales",
      desc: "Operacion paralela durante 30 dias para validar registros y ajustar configuraciones.",
    },
    {
      y: 3.55, num: "4", color: "0D9488",
      title: "Rollout nacional",
      desc: "Despliegue a todas las sucursales y capacitacion del personal. Soporte de transicion.",
    },
    {
      y: 4.6, num: "5", color: "16A34A",
      title: "Desactivacion de RUNAHR",
      desc: "Cancelacion de licencias RUNAHR. Ahorro inmediato.",
      titleColor: "16A34A",
    },
  ];

  steps.forEach(step => {
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 4.4, y: step.y, w: 0.55, h: 0.55,
      fill: { color: step.color }, line: { type: "none" },
    });
    slide.addText(step.num, {
      x: 4.4, y: step.y, w: 0.55, h: 0.55,
      fontSize: 16, bold: true, color: "FFFFFF", align: "center", valign: "middle",
    });
    slide.addText(step.title, {
      x: 5.1, y: step.y, w: 4.7, h: 0.3,
      fontSize: 13, bold: true, color: step.titleColor || "1B2A4A",
    });
    slide.addText(step.desc, {
      x: 5.1, y: step.y + 0.25, w: 4.7, h: 0.35,
      fontSize: 10, color: "64748B",
    });
  });
}

// ─────────────────────────────────────────────────────────────
// SLIDE 12: CIERRE
// ─────────────────────────────────────────────────────────────
{
  const slide = pptx.addSlide();
  slide.background = { color: "1B2A4A" };

  // Large decorative circle
  slide.addShape(pptx.ShapeType.ellipse, { x: 6, y: -0.5, w: 6, h: 6, fill: { color: "0D9488", transparency: 82 }, line: { type: "none" } });

  // Left vertical bar
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.4, h: 5.625, fill: { color: "0D9488" }, line: { type: "none" } });

  slide.addText("CONCLUSION", {
    x: 0.65, y: 0.5, w: 5, h: 0.4,
    fontSize: 12, bold: true, charSpacing: 4, color: "0D9488",
  });

  slide.addText("KronOS elimina costos, dependencias y fricciones operativas.", {
    x: 0.65, y: 1.1, w: 7.5, h: 1.6,
    fontSize: 32, bold: true, color: "FFFFFF", fontFace: "Georgia",
  });

  // Separator
  slide.addShape(pptx.ShapeType.line, { x: 0.65, y: 2.85, w: 5, h: 0, line: { color: "0D9488", width: 2 } });

  slide.addText(
    "La transicion a KronOS representa una reduccion del 67% en costos anuales de plataforma, eliminacion total de dependencias externas y control absoluto sobre los datos y operaciones de la organizacion.",
    {
      x: 0.65, y: 3.1, w: 7, h: 1.2,
      fontSize: 15, color: "CBD5E1", fontFace: "Calibri",
    }
  );

  // Bottom bar
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 5.2, w: 10, h: 0.425, fill: { color: "0D9488", transparency: 20 }, line: { type: "none" } });

  slide.addText("KronOS · Plataforma de Control de Acceso · Marzo 2026", {
    x: 0.5, y: 5.25, w: 9, h: 0.35,
    fontSize: 11, color: "B8D4F0", align: "center",
  });
}

// ─────────────────────────────────────────────────────────────
// SAVE
// ─────────────────────────────────────────────────────────────
pptx.writeFile({ fileName: OUTPUT })
  .then(() => console.log("SUCCESS: " + OUTPUT))
  .catch(err => { console.error("ERROR:", err); process.exit(1); });
