/**
 * notificaciones.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Servicio de notificaciones: crea registros en el store y emite eventos
 * Socket.io en tiempo real al destinatario.
 *
 * Estrategia de salas Socket.io:
 *   - Cada usuario autenticado se une a su sala privada: `user:{userId}`
 *   - El servidor emite a esa sala con: io.to(`user:${id}`).emit(...)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const store = require("../data/store");

let _io = null;

/**
 * setIo — Inyecta la instancia de Socket.io.
 * Llamar desde server.js después de crear el servidor http.
 * @param {import('socket.io').Server} io
 */
const setIo = (io) => {
  _io = io;
};

/**
 * crearNotificacion
 * Persiste la notificación y la entrega en tiempo real al destinatario.
 *
 * @param {object} data
 * @param {string} data.paraUsuarioId - Destinatario
 * @param {string} data.deUsuarioId   - Remitente
 * @param {string} data.tipo          - Tipo de notificación
 * @param {string} data.titulo
 * @param {string} data.mensaje
 * @param {string|null} data.referenciaId - ID del objeto relacionado (incidencia, registro, etc.)
 * @returns {object} Notificación creada
 */
const crearNotificacion = (data) => {
  const notif = store.createNotificacion(data);

  if (_io) {
    _io.to(`user:${data.paraUsuarioId}`).emit("nueva_notificacion", notif);
  }

  return notif;
};

/**
 * notificarSupervisoresDeSucursal
 * Envía la misma notificación a todos los supervisores activos de una sucursal.
 *
 * @param {string} sucursalId
 * @param {string} deUsuarioId
 * @param {object} payload - { tipo, titulo, mensaje, referenciaId }
 */
const notificarSupervisoresDeSucursal = (sucursalId, deUsuarioId, payload) => {
  const supervisores = store.getSupervisoresDeSucursal(sucursalId);
  supervisores.forEach((s) => {
    crearNotificacion({ paraUsuarioId: s.id, deUsuarioId, ...payload });
  });
};

/**
 * notificarUsuario
 * Atajo para notificar a un usuario específico.
 */
const notificarUsuario = (paraUsuarioId, deUsuarioId, payload) => {
  return crearNotificacion({ paraUsuarioId, deUsuarioId, ...payload });
};

const emitirEventoRegistro = (payload) => {
  if (_io) _io.emit("registro_evento", payload);
};

module.exports = {
  setIo,
  crearNotificacion,
  notificarSupervisoresDeSucursal,
  notificarUsuario,
  emitirEventoRegistro,
};
