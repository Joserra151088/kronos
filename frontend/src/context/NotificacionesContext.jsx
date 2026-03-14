/**
 * NotificacionesContext.jsx
 * Gestiona el estado de notificaciones del usuario.
 * Carga las notificaciones iniciales y escucha nuevas vía Socket.io.
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getNotificaciones, marcarNotificacionLeida, marcarTodasLeidas } from "../utils/api";

const NotificacionesContext = createContext(null);

export const NotificacionesProvider = ({ children, usuario, socket }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    if (!usuario) return;
    try {
      setCargando(true);
      const data = await getNotificaciones();
      setNotificaciones(data.notificaciones || []);
      setNoLeidas(data.noLeidas || 0);
    } catch {
      // silencioso
    } finally {
      setCargando(false);
    }
  }, [usuario?.id]);

  // Cargar al montar o cambiar de usuario
  useEffect(() => {
    if (usuario) cargar();
    else { setNotificaciones([]); setNoLeidas(0); }
  }, [usuario?.id, cargar]);

  // Escuchar nuevas notificaciones en tiempo real
  useEffect(() => {
    if (!socket) return;
    const handler = (notif) => {
      setNotificaciones((prev) => [notif, ...prev]);
      setNoLeidas((prev) => prev + 1);
    };
    socket.on("nueva_notificacion", handler);
    return () => socket.off("nueva_notificacion", handler);
  }, [socket]);

  const marcarLeida = async (id) => {
    try {
      await marcarNotificacionLeida(id);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const marcarTodas = async () => {
    try {
      await marcarTodasLeidas();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch {}
  };

  return (
    <NotificacionesContext.Provider value={{ notificaciones, noLeidas, cargando, marcarLeida, marcarTodas, recargar: cargar }}>
      {children}
    </NotificacionesContext.Provider>
  );
};

export const useNotificaciones = () => useContext(NotificacionesContext);
