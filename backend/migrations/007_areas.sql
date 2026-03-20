-- =============================================================================
-- Migration 007: Tabla de Áreas organizacionales
-- Fecha: 2026-03-19
-- Descripción:
--   • Crea la tabla `areas` para gestión de departamentos/áreas
--   • Agrega columna `area_id` a `puestos` como referencia opcional
--   • Instrucciones: mysql -u root -p kronos < migrations/007_areas.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS areas (
  id          VARCHAR(36)  NOT NULL COMMENT 'UUID generado por la aplicación',
  nombre      VARCHAR(120) NOT NULL COMMENT 'Nombre del área organizacional',
  descripcion TEXT         NULL     COMMENT 'Descripción breve del área',
  activo      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_areas_nombre (nombre),
  KEY idx_areas_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Áreas organizacionales (departamentos) de la empresa';

-- Agregar área_id a puestos (referencia opcional)
ALTER TABLE puestos
  ADD COLUMN area_id VARCHAR(36) NULL
  COMMENT 'FK → areas.id. Área a la que pertenece este puesto'
  AFTER horario_id;

ALTER TABLE puestos
  ADD CONSTRAINT fk_puesto_area FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL;

-- Datos iniciales
INSERT IGNORE INTO areas (id, nombre, descripcion) VALUES
  (UUID(), 'Recursos Humanos',  'Gestión de personal y nóminas'),
  (UUID(), 'Tecnología',        'Soporte TI y desarrollo de sistemas'),
  (UUID(), 'Operaciones',       'Operaciones y logística'),
  (UUID(), 'Administración',    'Administración general y finanzas'),
  (UUID(), 'Ventas',            'Área comercial y ventas');

-- =============================================================================
-- Para verificar:
--   DESCRIBE areas;
--   SELECT * FROM areas;
--   DESCRIBE puestos;
-- =============================================================================
