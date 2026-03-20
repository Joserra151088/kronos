-- =============================================================================
-- Migration 005: Crear usuario Administrador General — José Ramón Estrada
-- Fecha: 2026-03-19
-- Descripción:
--   • Crea el usuario José Ramón Estrada Rendón con rol administrador_general
--   • Contraseña inicial: Previta2026  (cambiar en primer inicio de sesión)
--   • Asegura que el rol administrador_general tenga el módulo de licencias
-- Instrucciones: mysql -u root -p kronos < migrations/005_jose_ramon_admin_general.sql
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Insertar usuario administrador general
--    La contraseña se almacena como texto plano; el sistema la acepta durante
--    la migración y la hashea automáticamente en el siguiente guardado en BD.
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO usuarios (
  id,
  nombre,
  apellido,
  email,
  password,
  rol_clave,
  sucursal_id,
  tipo,
  activo,
  created_at,
  updated_at
) VALUES (
  'jose-ramon-estrada-0000-administrador',
  'José Ramón',
  'Estrada Rendón',
  'jose.estrada@previta.com',
  'Previta2026',
  'administrador_general',
  NULL,
  'corporativo',
  1,
  NOW(),
  NOW()
);

-- -----------------------------------------------------------------------------
-- 2. Asegurar que el módulo licencias exista y esté asignado al rol
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO modulos (clave, nombre, orden_menu)
  VALUES ('licencias', 'Licencias', 99);

INSERT IGNORE INTO rol_modulo (rol_clave, modulo_clave)
  VALUES ('administrador_general', 'licencias');

-- Asegurar que super_admin también tenga acceso a licencias
INSERT IGNORE INTO rol_modulo (rol_clave, modulo_clave)
  VALUES ('super_admin', 'licencias');

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Para verificar:
--   SELECT id, nombre, apellido, email, rol_clave FROM usuarios
--     WHERE email = 'jose.estrada@previta.com';
--
--   SELECT rm.rol_clave, rm.modulo_clave FROM rol_modulo rm
--     WHERE rm.modulo_clave = 'licencias';
--
-- Credenciales de acceso inicial:
--   Email:      jose.estrada@previta.com
--   Contraseña: Previta2026
-- =============================================================================
