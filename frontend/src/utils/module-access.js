const DEFAULT_MODULES_BY_ROLE = {
  super_admin: ["dashboard", "eventos", "incidencias", "reportes", "sucursales", "empleados", "grupos", "mapa", "administracion", "auditoria", "notificaciones"],
  agente_soporte_ti: ["dashboard", "eventos", "incidencias", "reportes", "sucursales", "empleados", "grupos", "mapa", "administracion", "notificaciones"],
  supervisor_sucursales: ["dashboard", "eventos", "incidencias", "reportes", "empleados", "grupos", "mapa", "notificaciones"],
  agente_control_asistencia: ["dashboard", "eventos", "incidencias", "reportes", "mapa", "notificaciones"],
  visor_reportes: ["dashboard", "reportes", "mapa", "notificaciones"],
  medico_titular: ["dashboard", "incidencias", "notificaciones"],
  medico_de_guardia: ["dashboard", "incidencias", "notificaciones"],
};

export const getModulesForUser = (usuario) => {
  if (!usuario) return [];
  if (Array.isArray(usuario.modulos) && usuario.modulos.length > 0) return usuario.modulos;
  return DEFAULT_MODULES_BY_ROLE[usuario.rol] || [];
};

export const hasModuleAccess = (usuario, moduleKey) => {
  if (!moduleKey) return true;
  return getModulesForUser(usuario).includes(moduleKey);
};
