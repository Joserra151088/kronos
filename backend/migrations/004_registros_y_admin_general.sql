-- =============================================================================
-- Migration 004: Registros + Rol Administrador General
-- Fecha: 2026-03-19
-- Descripción:
--   • registros.hora_original      — hora real del primer registro (inmutable)
--   • registros.hora_modificada    — hora editada por un administrador
--   • roles: seed del nuevo rol administrador_general
--   • usuarios.rol_clave ENUM ampliado con 'administrador_general'
--   • modulos: seed del módulo 'licencias'
-- Instrucciones: mysql -u root -p kronos < migrations/004_registros_y_admin_general.sql
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- -----------------------------------------------------------------------------
-- 1. registros — hora original y hora modificada
-- -----------------------------------------------------------------------------
ALTER TABLE registros
  ADD COLUMN hora_original   TIME NULL
    COMMENT 'Hora exacta del registro original (immutable, se llena al crear)'
    AFTER hora,
  ADD COLUMN hora_modificada TIME NULL
    COMMENT 'Hora editada por un administrador mediante aclaración'
    AFTER hora_original;

-- Poblar hora_original con el valor actual de hora para registros existentes
-- SET SQL_SAFE_UPDATES = 0 es necesario en MySQL Workbench (safe update mode activo)
SET SQL_SAFE_UPDATES = 0;
UPDATE registros SET hora_original = hora WHERE hora_original IS NULL;
SET SQL_SAFE_UPDATES = 1;

-- -----------------------------------------------------------------------------
-- 2. Nuevo rol: administrador_general
-- -----------------------------------------------------------------------------
-- Si la tabla roles existe como catálogo (depende del schema)
INSERT IGNORE INTO roles (clave, nombre, descripcion)
  VALUES ('administrador_general', 'Administrador General',
          'Acceso total al sistema, incluyendo gestión de licencias y configuración global.');

-- -----------------------------------------------------------------------------
-- 3. Ampliar ENUM de rol_clave en usuarios para aceptar el nuevo rol
--    NOTA: En MySQL, ALTER COLUMN ENUM requiere redefinir el campo completo.
-- -----------------------------------------------------------------------------
ALTER TABLE usuarios
  MODIFY COLUMN rol_clave ENUM(
    'administrador_general',
    'super_admin',
    'agente_soporte_ti',
    'supervisor_sucursales',
    'agente_control_asistencia',
    'visor_reportes',
    'medico_titular',
    'medico_de_guardia',
    'nominas'
  ) NOT NULL DEFAULT 'medico_de_guardia';

-- -----------------------------------------------------------------------------
-- 4. Módulo licencias
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO modulos (clave, nombre, orden_menu) VALUES
  ('licencias', 'Licencias', 99);

-- Sólo el administrador_general tiene acceso al módulo de licencias
INSERT IGNORE INTO rol_modulo (rol_clave, modulo_clave) VALUES
  ('administrador_general', 'licencias'),
  -- El admin general también hereda todos los demás módulos
  ('administrador_general', 'dashboard'),
  ('administrador_general', 'eventos'),
  ('administrador_general', 'incidencias'),
  ('administrador_general', 'vacaciones'),
  ('administrador_general', 'incapacidades'),
  ('administrador_general', 'calendario'),
  ('administrador_general', 'reportes'),
  ('administrador_general', 'sucursales'),
  ('administrador_general', 'empleados'),
  ('administrador_general', 'grupos'),
  ('administrador_general', 'mapa'),
  ('administrador_general', 'administracion'),
  ('administrador_general', 'auditoria'),
  ('administrador_general', 'logs'),
  ('administrador_general', 'notificaciones'),
  ('administrador_general', 'organigrama'),
  ('administrador_general', 'horarios');

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Para verificar:
--   SHOW COLUMNS FROM registros LIKE 'hora%';
--   SELECT rol_clave FROM usuarios LIMIT 5;
--   SELECT * FROM modulos WHERE clave = 'licencias';
-- =============================================================================
