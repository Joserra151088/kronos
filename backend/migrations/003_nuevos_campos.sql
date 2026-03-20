-- =============================================================================
-- Migration 003: Nuevos campos de empleados + 2FA
-- Fecha: 2026-03-18
-- Descripción:
--   • usuarios.fecha_nacimiento         — fecha de nacimiento (para cumpleaños)
--   • usuarios.fecha_inicio_actividades — antigüedad en la empresa
--   • usuarios.usa_horario_puesto       — 1=heredar horario del puesto, 0=horario personalizado
--   • usuarios.totp_secret              — secreto TOTP para 2FA (base32)
--   • usuarios.totp_habilitado          — 1=2FA activo para este usuario
--   • tipos_incidencia: seed inicial de Vacaciones e Incapacidad con categoriaBloqueo
--   • modulos: agregar 'horarios' si no existe
-- Instrucciones: mysql -u root -p kronos < migrations/003_nuevos_campos.sql
-- NOTA: Sin IF NOT EXISTS en ADD COLUMN (MySQL < 8.0.3 compatible)
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- -----------------------------------------------------------------------------
-- 1. usuarios — fecha de nacimiento y fecha de inicio de actividades
-- -----------------------------------------------------------------------------
ALTER TABLE usuarios
  ADD COLUMN fecha_nacimiento         DATE         NULL
    COMMENT 'Fecha de nacimiento del empleado. Se usa para el panel de cumpleaños.'
    AFTER edad,
  ADD COLUMN fecha_inicio_actividades DATE         NULL
    COMMENT 'Fecha en que el empleado inició sus actividades en la empresa. Antigüedad.'
    AFTER fecha_nacimiento,
  ADD COLUMN usa_horario_puesto       TINYINT(1)   NOT NULL DEFAULT 0
    COMMENT '1 = el empleado hereda el horario de su puesto; 0 = usa horario_id propio'
    AFTER fecha_inicio_actividades,
  ADD COLUMN totp_secret              VARCHAR(64)  NULL
    COMMENT 'Secreto TOTP en base32 para autenticación de doble factor (Google Authenticator compatible)'
    AFTER usa_horario_puesto,
  ADD COLUMN totp_habilitado          TINYINT(1)   NOT NULL DEFAULT 0
    COMMENT '1 = el usuario tiene 2FA activado; 0 = login normal sin segundo factor'
    AFTER totp_secret;

-- Índice para búsqueda rápida de cumpleaños (mes y día)
CREATE INDEX idx_usuarios_fecha_nac ON usuarios(fecha_nacimiento);

-- -----------------------------------------------------------------------------
-- 2. Seed: tipos de incidencia para Vacaciones e Incapacidad
--    (INSERT IGNORE para no duplicar si ya existen)
--    Usamos UUIDs fijos para facilitar referencias en el código
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO tipos_incidencia
  (id, nombre, descripcion, requiere_archivo, categoria_bloqueo, activo, created_at, updated_at)
VALUES
  ('vac-0000-0000-0000-000000000001',
   'Vacaciones',
   'Período vacacional del empleado conforme a la Ley Federal del Trabajo. Solo disponible con 1+ año de antigüedad.',
   0, 'vacaciones', 1, NOW(), NOW()),
  ('inc-0000-0000-0000-000000000001',
   'Incapacidad Médica',
   'Ausencia por incapacidad médica con constancia del IMSS o médico particular.',
   1, 'incapacidad', 1, NOW(), NOW()),
  ('inc-0000-0000-0000-000000000002',
   'Incapacidad por Maternidad/Paternidad',
   'Licencia de maternidad (84 días) o paternidad (5 días) conforme a la ley.',
   1, 'incapacidad', 1, NOW(), NOW());

-- -----------------------------------------------------------------------------
-- 3. Módulo horarios (en caso de que la migration 002 no lo haya insertado)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO modulos (clave, nombre, orden_menu) VALUES
  ('horarios', 'Horarios', 17);

-- Permisos para el módulo horarios
INSERT IGNORE INTO rol_modulo (rol_clave, modulo_clave) VALUES
  ('super_admin','horarios'),
  ('agente_soporte_ti','horarios'),
  ('nominas','horarios');

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Fin de migration 003
-- Para verificar:
--   SHOW COLUMNS FROM usuarios LIKE 'fecha%';
--   SHOW COLUMNS FROM usuarios LIKE 'totp%';
--   SELECT id, nombre, categoria_bloqueo FROM tipos_incidencia;
-- =============================================================================
