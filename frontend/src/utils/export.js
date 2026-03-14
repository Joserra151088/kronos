/**
 * export.js
 * Utilidades para exportar datos a Excel, CSV y PDF.
 * Reciben columns: [{ key, label }] y rows: [{}]
 */

// ─── Colores corporativos Kronos ──────────────────────────────────────────────
const BRAND = {
  navy:       [0,   66,  105],   // #004269
  green:      [119, 179, 40],    // #77B328
  greenLight: [240, 247, 230],   // fondo alternado verde muy claro
  white:      [255, 255, 255],
  headerText: [255, 255, 255],
  bodyText:   [30,  40,  50],
  muted:      [120, 135, 150],
  border:     [200, 215, 225],
  rowAlt:     [245, 249, 252],
};

/**
 * exportToExcel — Descarga un archivo .xlsx
 */
export const exportToExcel = async (columns, rows, filename = "reporte") => {
  const { utils, writeFile } = await import("xlsx");
  const data = rows.map((row) => {
    const obj = {};
    columns.forEach((col) => { obj[col.label] = row[col.key] ?? ""; });
    return obj;
  });
  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Reporte");
  writeFile(wb, `${filename}.xlsx`);
};

/**
 * exportToCsv — Descarga un archivo .csv
 */
export const exportToCsv = (columns, rows, filename = "reporte") => {
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const body = rows
    .map((row) =>
      columns.map((c) => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  const csv = `${header}\n${body}`;
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * exportToPdf — Reporte ejecutivo en PDF usando jsPDF + autoTable
 * Diseño corporativo Kronos: encabezado con marca, metadatos, tabla estilizada y pie de página.
 *
 * @param {Array}  columns      - [{ key, label }]
 * @param {Array}  rows         - Array de objetos con los datos
 * @param {string} filename     - Nombre base del archivo (sin .pdf)
 * @param {string} titulo       - Título visible en el reporte
 * @param {Object} [meta]       - Metadatos adicionales { desde, hasta, empresa, usuario }
 */
export const exportToPdf = async (
  columns,
  rows,
  filename  = "reporte",
  titulo    = "Reporte",
  meta      = {}
) => {
  const { default: jsPDF }    = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  const PW  = doc.internal.pageSize.getWidth();   // 279 mm (letter landscape)
  const PH  = doc.internal.pageSize.getHeight();  // 216 mm
  const ML  = 14;  // margen izquierdo
  const MR  = 14;  // margen derecho

  // ── Encabezado corporativo ────────────────────────────────────────────────
  // Barra navy superior
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, 0, PW, 22, "F");

  // Logo / marca textual "K"
  doc.setTextColor(...BRAND.green);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("KRONOS", ML, 14);

  // Nombre del sistema
  doc.setFontSize(8);
  doc.setTextColor(180, 200, 220);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Control de Acceso y Asistencia", ML, 19);

  // Empresa a la derecha
  if (meta.empresa) {
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.headerText);
    doc.setFont("helvetica", "bold");
    doc.text(meta.empresa, PW - MR, 11, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(180, 200, 220);
    doc.text("Reporte generado por Kronos", PW - MR, 17, { align: "right" });
  }

  // ── Banda verde delgada bajo el header ───────────────────────────────────
  doc.setFillColor(...BRAND.green);
  doc.rect(0, 22, PW, 1.2, "F");

  // ── Título del reporte ────────────────────────────────────────────────────
  const startY = 30;
  doc.setTextColor(...BRAND.navy);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(titulo, ML, startY);

  // ── Metadatos (fila de chips) ─────────────────────────────────────────────
  const metaY = startY + 7;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.muted);

  const fechaGen = new Date().toLocaleString("es-MX", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const metaParts = [
    `📅 Generado: ${fechaGen}`,
    meta.desde && meta.hasta ? `📆 Período: ${meta.desde} — ${meta.hasta}` : null,
    meta.usuario            ? `👤 Usuario: ${meta.usuario}` : null,
    `📊 Registros: ${rows.length}`,
  ].filter(Boolean);

  let xMeta = ML;
  metaParts.forEach((part) => {
    const tw = doc.getStringUnitWidth(part) * 8 / doc.internal.scaleFactor;
    doc.setFillColor(...BRAND.rowAlt);
    doc.roundedRect(xMeta - 2, metaY - 4, tw + 6, 6, 1, 1, "F");
    doc.setTextColor(...BRAND.navy);
    doc.text(part, xMeta, metaY);
    xMeta += tw + 10;
    if (xMeta > PW - 80) { /* overflow: saltar a nueva línea no implementado */ }
  });

  // ── Línea separadora ──────────────────────────────────────────────────────
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.3);
  doc.line(ML, metaY + 4, PW - MR, metaY + 4);

  // ── Tabla principal ───────────────────────────────────────────────────────
  const tableStartY = metaY + 8;

  autoTable(doc, {
    head: [columns.map((c) => c.label)],
    body: rows.map((row) =>
      columns.map((c) => {
        const val = row[c.key];
        if (val === null || val === undefined) return "—";
        if (typeof val === "boolean") return val ? "Sí" : "No";
        return String(val);
      })
    ),
    startY: tableStartY,
    margin: { left: ML, right: MR },
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, right: 5, bottom: 3, left: 5 },
      textColor: BRAND.bodyText,
      lineColor: BRAND.border,
      lineWidth: 0.2,
      font: "helvetica",
      overflow: "ellipsize",
    },
    headStyles: {
      fillColor:  BRAND.navy,
      textColor:  BRAND.headerText,
      fontStyle:  "bold",
      fontSize:   8.5,
      halign:     "left",
      cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
    },
    alternateRowStyles: {
      fillColor: BRAND.rowAlt,
    },
    bodyStyles: {
      fillColor: BRAND.white,
    },
    columnStyles: columns.reduce((acc, _, i) => {
      // Distribuir columnas proporcionalmente
      acc[i] = { cellWidth: "auto" };
      return acc;
    }, {}),
    // Subrayado en hover (visual)
    rowPageBreak: "auto",
    tableLineColor: BRAND.border,
    tableLineWidth: 0.3,

    // Hook para la barra lateral verde en la primera columna
    didParseCell(data) {
      if (data.section === "head") {
        data.cell.styles.fillColor = BRAND.navy;
      }
    },

    // Pie de página por cada hoja
    didDrawPage(data) {
      const pageCount = doc.internal.getNumberOfPages();
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

      // Franja inferior
      doc.setFillColor(...BRAND.navy);
      doc.rect(0, PH - 10, PW, 10, "F");

      // Banda verde superior del pie
      doc.setFillColor(...BRAND.green);
      doc.rect(0, PH - 10, PW, 1, "F");

      // Texto del pie
      doc.setFontSize(7);
      doc.setTextColor(180, 200, 220);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Kronos – Control de Acceso y Asistencia  •  ${titulo}`,
        ML,
        PH - 4
      );
      doc.text(
        `Página ${currentPage} de ${pageCount}`,
        PW - MR,
        PH - 4,
        { align: "right" }
      );
    },
  });

  // ── Guardar ───────────────────────────────────────────────────────────────
  doc.save(`${filename}.pdf`);
};
