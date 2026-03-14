const { ROLES } = require("../middleware/roles");

const ROLES_SIN_RESTRICCION = new Set([
  ROLES.SUPER_ADMIN,
  ROLES.AGENTE_SOPORTE_TI,
]);

const unique = (values) => [...new Set(values.filter(Boolean))];

const getAllowedSucursalIds = (user, store) => {
  if (!user) return [];
  if (ROLES_SIN_RESTRICCION.has(user.rol)) return null;

  const sucursalIds = [];
  if (user.sucursalId) sucursalIds.push(user.sucursalId);

  if (user.rol === ROLES.SUPERVISOR_SUCURSALES) {
    const grupos = store.getGrupos({ supervisorId: user.id });
    grupos.forEach((grupo) => {
      if (Array.isArray(grupo.sucursalIds)) sucursalIds.push(...grupo.sucursalIds);
    });
  }

  return unique(sucursalIds);
};

const canAccessSucursal = (user, sucursalId, store) => {
  const allowedSucursalIds = getAllowedSucursalIds(user, store);
  return allowedSucursalIds === null || allowedSucursalIds.includes(sucursalId);
};

const canAccessUsuario = (user, usuario, store) => {
  if (!user || !usuario) return false;
  if (user.id === usuario.id) return true;
  if (ROLES_SIN_RESTRICCION.has(user.rol)) return true;
  return !!usuario.sucursalId && canAccessSucursal(user, usuario.sucursalId, store);
};

module.exports = {
  getAllowedSucursalIds,
  canAccessSucursal,
  canAccessUsuario,
};
