/**
 * minutos.js (frontend)
 * Formateador de minutos para mostrar tiempo trabajado.
 */

export const formatearMinutos = (minutos) => {
  if (minutos === null || minutos === undefined) return "—";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const minutosAHoraLegible = (minutos) => {
  if (!minutos) return "0h 0m";
  return formatearMinutos(minutos);
};
