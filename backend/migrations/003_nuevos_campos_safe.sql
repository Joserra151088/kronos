-- =============================================================================
-- Migration 003 SAFE: Nuevos campos de empleados + 2FA
-- Versión idempotente: verifica la existencia de columnas/índices antes de crearlos.
-- Compatible con MySQL 5.7+ y MySQL 8+.
-- Instrucciones: mysql -u root -p kronos < migrations/003_nuevos_campos_safe.sql
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper procedures (mismos que en 002_safe)
-- ─────────────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS _add_column_if_missing;
DELIMITER $$
CREATE PROCEDURE _add_column_if_missing(
  IN p_table   VARCHAR(64),
  IN p_column  VARCHAR(64),
  IN p_ddl     TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = p_table
      AND COLUMN_NAME  = p_column
  ) THEN
    SET @_sql = p_ddl;
    PREPARE _stmt FROM @_sql;
    EXECUTE _stmt;
    DEALLOCATE PREPARE _stmt;
  END IF;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS _add_index_if_missing;
DELIMITER $$
CREATE PROCEDURE _add_index_if_missing(
  IN p_table   VARCHAR(64),
  IN p_index   VARCHAR(64),
  IN p_ddl     TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = p_table
      AND INDEX_NAME   = p_index
  ) THEN
    SET @_sql = p_ddl;
    PREPARE _stmt FROM @_sql;
    EXECUTE _stmt;
    DEALLOCATE PREPARE _stmt;
  END IF;
END$$
DELIMITER ;

-- =============================================================================
-- 1. usuarios — fecha de nacimiento, inicio de actividades, horario y 2FA
-- =============================================================================
CALL _add_column_if_missing(
  'usuarios', 'fecha_nacimiento',
  'ALTER TABLE usuarios
     ADD COLUMN fecha_nacimiento DATE NULL
     COMMENT ''Fecha de nacimiento del empleado. Se usa para el panel de cumpleaños.''
     AFTER edad'
);

CALL _add_column_if_missing(
  'usuarios', 'fecha_inicio_actividades',
  'ALTER TABLE usuarios
     ADD COLUMN fecha_inicio_actividades DATE NULL
     COMMENT ''Fecha en que el empleado inició sus actividades en la empresa. Antigüedad.''
     AFTER fecha_nacimiento'
);

CALL _add_column_if_missing(
  'usuarios', 'usa_horario_puesto',
  'ALTER TABLE usuarios
     ADD COLUMN usa_horario_puesto TINYINT(1) NOT NULL DEFAULT 0
     COMMENT ''1 = el empleado hereda el horario de su puesto; 0 = usa horario_id propio''
     AFTER fecha_inicio_actividades'
);

CALL _add_column_if_missing(
  'usuarios', 'totp_secret',
  'ALTER TABLE usuarios
     ADD COLUMN totp_secret VARCHAR(64) NULL
     COMMENT ''Secreto TOTP en base32 para autenticación de doble factor (Google Authenticator compatible)''
     AFTER usa_horario_puesto'
);

CALL _add_column_if_missing(
  'usuarios', 'totp_habilitado',
  'ALTER TABLE usuarios
     ADD COLUMN totp_habilitado TINYINT(1) NOT NULL DEFAULT 0
     COMMENT ''1 = el usuario tiene 2FA activado; 0 = login normal sin segundo factor''
     AFTER totp_secret'
);

-- Índice para búsqueda rápida de cumpleaños (mes y día)
CALL _add_index_if_missing(
  'usuarios', 'idx_usuarios_fecha_nac',
  'CREATE INDEX idx_usuarios_fecha_nac ON usuarios(fecha_nacimiento)'
);

-- =============================================================================
-- 2. Seed: tipos de incidencia para Vacaciones e Incapacidad
--    INSERT IGNORE no duplica si ya existen
-- =============================================================================
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

-- =============================================================================
-- 3. Módulo horarios (por si migration 002 no lo insertó)
-- =============================================================================
INSERT IGNORE INTO modulos (clave, nombre, orden_menu) VALUES
  ('horarios', 'Horarios', 17);

-- Permisos para el módulo horarios
INSERT IGNORE INTO rol_modulo (rol_clave, modulo_clave) VALUES
  ('super_admin','horarios'),
  ('agente_soporte_ti','horarios'),
  ('nominas','horarios');

-- =============================================================================
-- Limpieza de procedures helpers
-- =============================================================================
DROP PROCEDURE IF EXISTS _add_column_if_missing;
DROP PROCEDURE IF EXISTS _add_index_if_missing;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Fin de migration 003 SAFE
-- Para verificar:
--   SHOW COLUMNS FROM usuarios LIKE 'fecha%';
--   SHOW COLUMNS FROM usuarios LIKE 'totp%';
--   SHOW COLUMNS FROM usuarios LIKE 'usa_horario%';
--   SELECT id, nombre, categoria_bloqueo FROM tipos_incidencia;
-- =============================================================================
