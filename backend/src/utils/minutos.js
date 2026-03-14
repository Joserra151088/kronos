/**
 * minutos.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilidades para calcular el tiempo trabajado a partir de los registros de acceso.
 *
 * Períodos de trabajo:
 *   Período 1: entrada → salida_alimentos
 *   Período 2: regreso_alimentos → salida
 *
 * El tiempo de comida (salida_alimentos → regreso_alimentos) NO se cuenta.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * horaAMinutos
 * Convierte "HH:MM:SS" a minutos desde medianoche.
 * @param {string} hora - "HH:MM:SS" o "HH:MM"
 * @returns {number}
 */
const horaAMinutos = (hora) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

/**
 * calcularMinutosTrabajados
 * Dado un array de registros de un mismo día, calcula los minutos trabajados.
 *
 * @param {Array} registrosDelDia - Registros del mismo usuario y día, ordenados por hora
 * @returns {number|null} Minutos trabajados, o null si no hay suficientes datos
 */
const calcularMinutosTrabajados = (registrosDelDia) => {
  const byTipo = {};
  registrosDelDia.forEach((r) => {
    byTipo[r.tipo] = r.hora;
  });

  let total = 0;

  // Período 1: entrada → salida_alimentos
  if (byTipo["entrada"] && byTipo["salida_alimentos"]) {
    const diff = horaAMinutos(byTipo["salida_alimentos"]) - horaAMinutos(byTipo["entrada"]);
    if (diff > 0) total += diff;
  }

  // Período 2: regreso_alimentos → salida
  if (byTipo["regreso_alimentos"] && byTipo["salida"]) {
    const diff = horaAMinutos(byTipo["salida"]) - horaAMinutos(byTipo["regreso_alimentos"]);
    if (diff > 0) total += diff;
  }

  // Si no hay ningún período completo, devolver null
  if (total === 0 && !byTipo["salida_alimentos"] && !byTipo["salida"]) return null;

  return total;
};

/**
 * formatearMinutos
 * Convierte minutos totales a un string legible.
 * @param {number|null} minutos
 * @returns {string} e.g. "8h 30m"
 */
const formatearMinutos = (minutos) => {
  if (minutos === null || minutos === undefined) return "—";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

module.exports = { calcularMinutosTrabajados, formatearMinutos, horaAMinutos };
