/**
 * export.js
 * Utilidades para exportar datos a Excel, CSV y PDF.
 * Reciben columns: [{ key, label }] y rows: [{}]
 */

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
 * exportToPdf — Descarga un archivo .pdf usando jsPDF + autoTable
 */
export const exportToPdf = async (columns, rows, filename = "reporte", titulo = "Reporte") => {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(titulo, 14, 15);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString("es-MX")}`, 14, 22);
  doc.autoTable({
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => row[c.key] ?? "")),
    startY: 27,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [47, 129, 247] },
    alternateRowStyles: { fillColor: [240, 244, 255] },
  });
  doc.save(`${filename}.pdf`);
};
