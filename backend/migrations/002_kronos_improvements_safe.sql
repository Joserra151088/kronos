-- =============================================================================
-- Migration 002 SAFE: Mejoras mayores — Kronos Access Control
-- Versión idempotente: verifica la existencia de columnas/índices antes de crearlos.
-- Compatible con MySQL 5.7+ y MySQL 8+.
-- Instrucciones: mysql -u root -p kronos < migrations/002_kronos_improvements_safe.sql
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: procedure para ADD COLUMN solo si no existe
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

-- Helper: procedure para ADD INDEX solo si no existe
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

-- Helper: procedure para ADD CONSTRAINT FK solo si no existe
DROP PROCEDURE IF EXISTS _add_fk_if_missing;
DELIMITER $$
CREATE PROCEDURE _add_fk_if_missing(
  IN p_table       VARCHAR(64),
  IN p_constraint  VARCHAR(64),
  IN p_ddl         TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA      = DATABASE()
      AND TABLE_NAME        = p_table
      AND CONSTRAINT_NAME   = p_constraint
      AND CONSTRAINT_TYPE   = 'FOREIGN KEY'
  ) THEN
    SET @_sql = p_ddl;
    PREPARE _stmt FROM @_sql;
    EXECUTE _stmt;
    DEALLOCATE PREPARE _stmt;
  END IF;
END$$
DELIMITER ;

-- =============================================================================
-- 1. tipos_incidencia — campo categoria_bloqueo
-- =============================================================================
CALL _add_column_if_missing(
  'tipos_incidencia', 'categoria_bloqueo',
  'ALTER TABLE tipos_incidencia
     ADD COLUMN categoria_bloqueo ENUM(''vacaciones'',''incapacidad'',''falta'') NULL
     COMMENT ''Si no es null, bloquea el registro de asistencia cuando el empleado tiene una incidencia aprobada de este tipo que cubre el día actual''
     AFTER requiere_archivo'
);

-- =============================================================================
-- 2. incidencias — ampliar ENUM de estado
-- =============================================================================
-- MODIFY COLUMN es seguro de repetir (solo actualiza la definición)
ALTER TABLE incidencias
  MODIFY COLUMN estado ENUM('pendiente','pre_aprobada','aprobada','rechazada')
  NOT NULL DEFAULT 'pendiente'
  COMMENT 'pendiente → pre_aprobada → aprobada | rechazada';

-- 2a. Columnas nuevas en incidencias
CALL _add_column_if_missing(
  'incidencias', 'fecha_incidencia',
  'ALTER TABLE incidencias
     ADD COLUMN fecha_incidencia DATE NULL
     COMMENT ''Fecha del día de la incidencia (puede diferir de created_at)''
     AFTER descripcion'
);

CALL _add_column_if_missing(
  'incidencias', 'fecha_fin',
  'ALTER TABLE incidencias
     ADD COLUMN fecha_fin DATE NULL
     COMMENT ''Fecha fin para incidencias multi-día. NULL = solo fecha_incidencia''
     AFTER fecha_incidencia'
);

CALL _add_column_if_missing(
  'incidencias', 'pre_aprobaciones_json',
  'ALTER TABLE incidencias
     ADD COLUMN pre_aprobaciones_json JSON NULL
     COMMENT ''Array de {preAprobadoPorId, preAprobadoEn, comentario}''
     AFTER fecha_fin'
);

CALL _add_column_if_missing(
  'incidencias', 'jefe_inmediato_id',
  'ALTER TABLE incidencias
     ADD COLUMN jefe_inmediato_id VARCHAR(36) NULL
     COMMENT ''Snapshot del jefeInmediatoId al momento de crear la incidencia''
     AFTER pre_aprobaciones_json'
);

-- FK para jefe_inmediato_id en incidencias
CALL _add_fk_if_missing(
  'incidencias', 'fk_inc_jefe_inmediato',
  'ALTER TABLE incidencias
     ADD CONSTRAINT fk_inc_jefe_inmediato
       FOREIGN KEY (jefe_inmediato_id) REFERENCES usuarios(id) ON DELETE SET NULL'
);

-- =============================================================================
-- 3. usuarios — jerarquía organizacional
-- =============================================================================
CALL _add_column_if_missing(
  'usuarios', 'jefe_inmediato_id',
  'ALTER TABLE usuarios
     ADD COLUMN jefe_inmediato_id VARCHAR(36) NULL
     COMMENT ''FK self-reference → usuarios.id. Jefe directo del empleado''
     AFTER grupo_id'
);

CALL _add_column_if_missing(
  'usuarios', 'area',
  'ALTER TABLE usuarios
     ADD COLUMN area VARCHAR(120) NULL
     COMMENT ''Área organizacional. Ej: Recursos Humanos, Tecnología, Operaciones''
     AFTER jefe_inmediato_id'
);

CALL _add_fk_if_missing(
  'usuarios', 'fk_usuario_jefe_inmediato',
  'ALTER TABLE usuarios
     ADD CONSTRAINT fk_usuario_jefe_inmediato
       FOREIGN KEY (jefe_inmediato_id) REFERENCES usuarios(id) ON DELETE SET NULL'
);

CALL _add_index_if_missing(
  'usuarios', 'idx_usuarios_jefe_inmediato',
  'CREATE INDEX idx_usuarios_jefe_inmediato ON usuarios(jefe_inmediato_id)'
);

-- =============================================================================
-- 4. Nuevo rol: nóminas
-- =============================================================================
INSERT IGNORE INTO roles (clave, nombre, descripcion) VALUES
  ('nominas', 'Nóminas', 'Gestión de nóminas, importación masiva de empleados y aprobación de incidencias');

-- =============================================================================
-- 5. Nueva tabla: anuncios
-- =============================================================================
CREATE TABLE IF NOT EXISTS anuncios (
  id         VARCHAR(36)   NOT NULL  COMMENT 'UUID generado por la aplicación',
  titulo     VARCHAR(200)  NOT NULL  COMMENT 'Título corto del anuncio',
  texto      TEXT          NOT NULL  COMMENT 'Cuerpo del anuncio',
  activo     TINYINT(1)    NOT NULL  DEFAULT 1  COMMENT '0 = eliminado (soft delete)',
  creado_por VARCHAR(36)   NULL      COMMENT 'FK → usuarios.id del super_admin que creó el anuncio',
  created_at DATETIME      NOT NULL  DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NOT NULL  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_anuncios_activo  (activo),
  KEY idx_anuncios_created (created_at),
  CONSTRAINT fk_anuncio_creador
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Anuncios breves del panel lateral. Administrados por super_admin.';

-- =============================================================================
-- 6. Nuevos módulos
-- =============================================================================
INSERT IGNORE INTO modulos (clave, nombre, orden_menu) VALUES
  ('vacaciones',    'Vacaciones',   13),
  ('incapacidades', 'Incapacidades',14),
  ('calendario',    'Calendario',   15),
  ('organigrama',   'Organigrama',  16),
  ('horarios',      'Horarios',     17);

-- =============================================================================
-- 7. Permisos de módulos
-- =============================================================================
INSERT IGNORE INTO rol_modulo (rol_clave, modulo_clave) VALUES
  -- rol nóminas
  ('nominas','dashboard'),
  ('nominas','incidencias'),
  ('nominas','empleados'),
  ('nominas','reportes'),
  ('nominas','notificaciones'),
  ('nominas','vacaciones'),
  ('nominas','incapacidades'),
  ('nominas','horarios'),
  -- vacaciones
  ('super_admin','vacaciones'),
  ('agente_soporte_ti','vacaciones'),
  ('supervisor_sucursales','vacaciones'),
  ('agente_control_asistencia','vacaciones'),
  -- incapacidades
  ('super_admin','incapacidades'),
  ('agente_soporte_ti','incapacidades'),
  ('supervisor_sucursales','incapacidades'),
  ('agente_control_asistencia','incapacidades'),
  -- calendario
  ('super_admin','calendario'),
  ('agente_soporte_ti','calendario'),
  ('supervisor_sucursales','calendario'),
  ('agente_control_asistencia','calendario'),
  -- organigrama
  ('super_admin','organigrama'),
  ('agente_soporte_ti','organigrama'),
  ('supervisor_sucursales','organigrama'),
  -- horarios
  ('super_admin','horarios'),
  ('agente_soporte_ti','horarios');

-- =============================================================================
-- Limpieza de procedures helpers
-- =============================================================================
DROP PROCEDURE IF EXISTS _add_column_if_missing;
DROP PROCEDURE IF EXISTS _add_index_if_missing;
DROP PROCEDURE IF EXISTS _add_fk_if_missing;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Fin de migration 002 SAFE
-- Para verificar:
--   SHOW COLUMNS FROM tipos_incidencia;
--   SHOW COLUMNS FROM incidencias;
--   SHOW COLUMNS FROM usuarios;
--   SELECT * FROM modulos ORDER BY orden_menu;
--   SELECT * FROM roles;
-- =============================================================================
