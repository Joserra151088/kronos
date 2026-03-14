/**
 * AuthContext.jsx - Contexto de autenticación + Socket.io + Notificaciones.
 */

import { createContext, useContext, useState, useEffect } from "react";
import { getMe, getMisModulos, login as apiLogin, logout as apiLogout } from "../utils/api";
import { SocketProvider, useSocket } from "./SocketContext";
import { NotificacionesProvider } from "./NotificacionesContext";
import { getModulesForUser } from "../utils/module-access";

const AuthContext = createContext(null);

const InnerProvider = ({ children, usuario }) => {
  const { socket } = useSocket();
  return (
    <NotificacionesProvider usuario={usuario} socket={socket}>
      {children}
    </NotificacionesProvider>
  );
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarSesion = async () => {
    const perfil = await getMe();
    try {
      const permisos = await getMisModulos();
      return { ...perfil, modulos: permisos.modulos || getModulesForUser(perfil) };
    } catch {
      return { ...perfil, modulos: getModulesForUser(perfil) };
    }
  };

  useEffect(() => {
    const verificarSesion = async () => {
      const token = localStorage.getItem("token");
      if (!token) { setCargando(false); return; }
      try {
        const perfil = await cargarSesion();
        setUsuario(perfil);
      } catch {
        localStorage.removeItem("token");
      } finally {
        setCargando(false);
      }
    };
    verificarSesion();
  }, []);

  const login = async (email, password, sucursalIdLogin = null) => {
    const data = await apiLogin(email, password, sucursalIdLogin);
    if (data.token) {
      const perfil = await cargarSesion();
      setUsuario(perfil);
    }
    return data;
  };

  const logout = () => {
    apiLogout();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, setUsuario }}>
      <SocketProvider usuario={usuario}>
        <InnerProvider usuario={usuario}>
          {children}
        </InnerProvider>
      </SocketProvider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
