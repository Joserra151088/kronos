-- =============================================================================
-- Migration 008: Corregir email de José Ramón Estrada
-- Fecha: 2026-03-19
-- Descripción:
--   • Actualiza el email del administrador general de .com a .com.mx
--   • Asegura que el rol administrador_general tenga acceso a todos los módulos
-- Instrucciones: mysql -u root -p kronos < migrations/008_fix_jose_estrada_email.sql
-- =============================================================================

-- Corregir email
UPDATE usuarios
  SET email = 'jose.estrada@previta.com.mx', updated_at = NOW()
  WHERE email = 'jose.estrada@previta.com'
    AND rol_clave = 'administrador_general';

-- Si el usuario no existía con el email antiguo, insertar con el email correcto
INSERT IGNORE INTO usuarios (
  id, nombre, apellido, email, password, rol_clave,
  sucursal_id, tipo, activo, created_at, updated_at
) VALUES (
  'jose-ramon-estrada-0000-administrador',
  'José Ramón',
  'Estrada Rendón',
  'jose.estrada@previta.com.mx',
  'Previta2026',
  'administrador_general',
  NULL,
  'corporativo',
  1,
  NOW(),
  NOW()
);

-- Asegurar módulos completos para administrador_general
INSERT IGNORE INTO modulos (clave, nombre, orden_menu) VALUES
  ('licencias',    'Licencias',    99),
  ('vacaciones',   'Vacaciones',   13),
  ('incapacidades','Incapacidades',14),
  ('calendario',   'Calendario',   15),
  ('organigrama',  'Organigrama',  16);

INSERT IGNORE INTO rol_modulo (rol_clave, modulo_clave)
  SELECT 'administrador_general', clave FROM modulos;

-- =============================================================================
-- Para verificar:
--   SELECT id, nombre, email, rol_clave FROM usuarios
--     WHERE rol_clave = 'administrador_general';
--   SELECT modulo_clave FROM rol_modulo WHERE rol_clave = 'administrador_general';
-- =============================================================================
