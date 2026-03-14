/**
 * ProtectedRoute.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente de ruta protegida.
 * Redirige al login si el usuario no está autenticado.
 * Opcionalmente valida que el usuario tenga el rol requerido.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasModuleAccess } from "../utils/module-access";

/**
 * ProtectedRoute
 * Envuelve rutas que requieren autenticación.
 *
 * @param {React.ReactNode} children   - Componente a renderizar si autenticado
 * @param {string[]}        roles      - Roles permitidos (opcional). Si no se pasa,
 *                                       cualquier usuario autenticado puede acceder.
 */
const ProtectedRoute = ({ children, roles, moduleKey }) => {
  const { usuario, cargando } = useAuth();

  // Mientras se verifica la sesión inicial, no renderizar nada
  if (cargando) return <div className="splash">Cargando…</div>;

  // Si no hay usuario, redirigir al login
  if (!usuario) return <Navigate to="/login" replace />;

  // Si se especifican roles y el usuario no los tiene, redirigir al dashboard
  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (moduleKey && !hasModuleAccess(usuario, moduleKey)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
