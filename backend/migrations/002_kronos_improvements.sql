-- =============================================================================
-- Migration 002: Mejoras mayores — Kronos Access Control
-- Fecha: 2026-03-17
-- Descripción: Agrega módulos de vacaciones, incapacidades, calendario y
--   organigrama; rol nóminas; pre-aprobación de incidencias; jerarquía de
--   empleados; tabla de anuncios; regla de bloqueo de registro.
-- Instrucciones: mysql -u root -p kronos < migrations/002_kronos_improvements.sql
-- NOTA: Versión corregida — sin IF NOT EXISTS en ADD COLUMN ni CREATE INDEX
--       (compatible con MySQL < 8.0.3)
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- -----------------------------------------------------------------------------
-- 1. tipos_incidencia — campo para bloquear registro de asistencia
-- -----------------------------------------------------------------------------
ALTER TABLE tipos_incidencia
  ADD COLUMN categoria_bloqueo ENUM('vacaciones','incapacidad','falta') NULL
  COMMENT 'Si no es null, bloquea el registro de asistencia cuando el empleado tiene una incidencia aprobada de este tipo que cubre el día actual'
  AFTER requiere_archivo;

-- -----------------------------------------------------------------------------
-- 2. incidencias — extender estados y agregar campos de fecha/aprobación
-- -----------------------------------------------------------------------------

-- Ampliar el ENUM de estado para incluir pre_aprobada
ALTER TABLE incidencias
  MODIFY COLUMN estado ENUM('pendiente','pre_aprobada','aprobada','rechazada') NOT NULL DEFAULT 'pendiente'
  COMMENT 'pendiente → pre_aprobada (control asistencia) → aprobada | rechazada (supervisor/nóminas/jefeInmediato)';

-- Nuevas columnas de fecha
ALTER TABLE incidencias
  ADD COLUMN fecha_incidencia   DATE         NULL
    COMMENT 'Fecha del día de la incidencia (puede diferir de created_at)'
    AFTER descripcion,
  ADD COLUMN fecha_fin          DATE         NULL
    COMMENT 'Fecha fin para incidencias multi-día. NULL = solo fecha_incidencia'
    AFTER fecha_incidencia,
  ADD COLUMN pre_aprobaciones_json JSON NULL
    COMMENT 'Array de {preAprobadoPorId, preAprobadoEn, comentario} — historial de pre-aprobaciones'
    AFTER fecha_fin,
  ADD COLUMN jefe_inmediato_id  VARCHAR(36)  NULL
    COMMENT 'Snapshot del jefeInmediatoId del empleado al momento de crear la incidencia'
    AFTER pre_aprobaciones_json;

-- FK para jefe_inmediato_id en incidencias
ALTER TABLE incidencias
  ADD CONSTRAINT fk_inc_jefe_inmediato
    FOREIGN KEY (jefe_inmediato_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 3. usuarios — jerarquía organizacional
-- -----------------------------------------------------------------------------
ALTER TABLE usuarios
  ADD COLUMN jefe_inmediato_id  VARCHAR(36)  NULL
    COMMENT 'FK self-reference → usuarios.id. Jefe directo del empleado'
    AFTER grupo_id,
  ADD COLUMN area               VARCHAR(120) NULL
    COMMENT 'Área organizacional. Ej: Recursos Humanos, Tecnología, Operaciones'
    AFTER jefe_inmediato_id;

-- FK self-referencing para jefe_inmediato_id en usuarios
ALTER TABLE usuarios
  ADD CONSTRAINT fk_usuario_jefe_inmediato
    FOREIGN KEY (jefe_inmediato_id) REFERENCES usuarios(id) ON DELETE SET NULL;

CREATE INDEX idx_usuarios_jefe_inmediato ON usuarios(jefe_inmediato_id);

-- -----------------------------------------------------------------------------
-- 4. Nuevo rol: nóminas
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO roles (clave, nombre, descripcion) VALUES
  ('nominas', 'Nóminas', 'Gestión de nóminas, importación masiva de empleados y aprobación de incidencias');

-- -----------------------------------------------------------------------------
-- 5. Nueva tabla: anuncios (panel lateral derecho)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS anuncios (
  id         VARCHAR(36)   NOT NULL  COMMENT 'UUID generado por la aplicación',
  titulo     VARCHAR(200)  NOT NULL  COMMENT 'Título corto del anuncio',
  texto      TEXT          NOT NULL  COMMENT 'Cuerpo del anuncio',
  activo     TINYINT(1)    NOT NULL  DEFAULT 1  COMMENT '0 = eliminado (soft delete)',
  creado_por VARCHAR(36)   NULL      COMMENT 'FK → usuarios.id del super_admin que creó el anuncio',
  created_at DATETIME      NOT NULL  DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NOT NULL  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_anuncios_activo (activo),
  KEY idx_anuncios_created (created_at),

  CONSTRAINT fk_anuncio_creador
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Anuncios breves del panel lateral. Administrados por super_admin.';

-- -----------------------------------------------------------------------------
-- 6. Nuevos módulos
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO modulos (clave, nombre, orden_menu) VALUES
  ('vacaciones',    'Vacaciones',   13),
  ('incapacidades', 'Incapacidades',14),
  ('calendario',    'Calendario',   15),
  ('organigrama',   'Organigrama',  16),
  ('horarios',      'Horarios',     17);

-- -----------------------------------------------------------------------------
-- 7. Permisos de módulos para el rol nóminas y nuevos módulos en roles existentes
-- -----------------------------------------------------------------------------

-- Rol nóminas
INSERT IGNORE INTO rol_modulo (rol_clave, modulo_clave) VALUES
  ('nominas','dashboard'),
  ('nominas','incidencias'),
  ('nominas','empleados'),
  ('nominas','reportes'),
  ('nominas','notificaciones'),
  ('nominas','vacaciones'),
  ('nominas','incapacidades');

-- vacaciones
INSERT IGNORE INTO rol_modulo (rol_clave, modulo_clave) VALUES
  ('super_admin','vacaciones'),
  ('agente_soporte_ti','vacaciones'),
  ('supervisor_sucursales','vacaciones'),
  ('agente_control_asistencia','vacaciones');

-- incapacidades
INSERT IGNORE INTO rol_modulo (rol_clave, modulo_clave) VALUES
  ('super_admin','incapacidades'),
  ('agente_soporte_ti','incapacidades'),
  ('supervisor_sucursales','incapacidades'),
  ('agente_control_asistencia','incapacidades');

-- calendario
INSERT IGNORE INTO rol_modulo (rol_clave, modulo_clave) VALUES
  ('super_admin','calendario'),
  ('agente_soporte_ti','calendario'),
  ('supervisor_sucursales','calendario'),
  ('agente_control_asistencia','calendario');

-- organigrama
INSERT IGNORE INTO rol_modulo (rol_clave, modulo_clave) VALUES
  ('super_admin','organigrama'),
  ('agente_soporte_ti','organigrama'),
  ('supervisor_sucursales','organigrama');

-- horarios
INSERT IGNORE INTO rol_modulo (rol_clave, modulo_clave) VALUES
  ('super_admin','horarios'),
  ('agente_soporte_ti','horarios'),
  ('nominas','horarios');

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Fin de migration 002
-- Para verificar: SHOW COLUMNS FROM incidencias; SHOW COLUMNS FROM usuarios;
--                 SELECT * FROM modulos ORDER BY orden_menu;
--                 SELECT * FROM roles;
-- =============================================================================
