-- =============================================================================
-- Migration 009: Agregar columna tipo a sucursales (SEGURA — solo si no existe)
-- Fecha: 2026-03-19
-- Descripción:
--   • Agrega columna `tipo` a la tabla `sucursales` SOLO si no existe
--   • Equivale a migration 006 pero segura para ejecutar en cualquier estado de la BD
-- Instrucciones: mysql -u root -p kronos < migrations/009_safe_tipo_column.sql
-- =============================================================================

-- Técnica: usar procedimiento almacenado temporal para verificar columna
DROP PROCEDURE IF EXISTS kronos_add_tipo_column;

DELIMITER $$

CREATE PROCEDURE kronos_add_tipo_column()
BEGIN
  -- Verificar si la columna 'tipo' ya existe en sucursales
  IF NOT EXISTS (
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sucursales'
      AND COLUMN_NAME = 'tipo'
  ) THEN
    ALTER TABLE sucursales
      ADD COLUMN tipo ENUM('sucursal', 'corporativo') NOT NULL DEFAULT 'sucursal'
      COMMENT 'Tipo de ubicación: sucursal regular o sede corporativa'
      AFTER estado;
  END IF;

  -- Verificar si area_id ya existe en puestos
  IF NOT EXISTS (
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'puestos'
      AND COLUMN_NAME = 'area_id'
  ) THEN
    -- Primero crear tabla areas si no existe
    CREATE TABLE IF NOT EXISTS areas (
      id          VARCHAR(36)  NOT NULL COMMENT 'UUID generado por la aplicación',
      nombre      VARCHAR(120) NOT NULL COMMENT 'Nombre del área organizacional',
      descripcion TEXT         NULL,
      activo      TINYINT(1)   NOT NULL DEFAULT 1,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_areas_nombre (nombre),
      KEY idx_areas_activo (activo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    ALTER TABLE puestos
      ADD COLUMN area_id VARCHAR(36) NULL
      COMMENT 'FK → areas.id. Área a la que pertenece este puesto'
      AFTER horario_id;

    ALTER TABLE puestos
      ADD CONSTRAINT fk_puesto_area FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL;
  END IF;

  -- Agregar destinatarios_json a anuncios si no existe
  IF NOT EXISTS (
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'anuncios'
      AND COLUMN_NAME = 'destinatarios_json'
  ) THEN
    ALTER TABLE anuncios
      ADD COLUMN destinatarios_json JSON NULL
      COMMENT 'Destinatarios: {todos:true} | {grupos:[...], usuarios:[...]}'
      AFTER creado_por;
    ALTER TABLE anuncios
      ADD COLUMN fecha_inicio DATE NULL
      COMMENT 'Fecha de inicio de publicación (NULL = publicar inmediatamente)'
      AFTER destinatarios_json;
    ALTER TABLE anuncios
      ADD COLUMN fecha_expiracion DATE NULL
      COMMENT 'Fecha de expiración del anuncio (NULL = nunca expira)'
      AFTER fecha_inicio;
  END IF;
END$$

DELIMITER ;

CALL kronos_add_tipo_column();
DROP PROCEDURE IF EXISTS kronos_add_tipo_column;

-- Insertar áreas iniciales si la tabla está vacía
INSERT IGNORE INTO areas (id, nombre, descripcion) VALUES
  (UUID(), 'Recursos Humanos',  'Gestión de personal y nóminas'),
  (UUID(), 'Tecnología',        'Soporte TI y desarrollo de sistemas'),
  (UUID(), 'Operaciones',       'Operaciones y logística'),
  (UUID(), 'Administración',    'Administración general y finanzas'),
  (UUID(), 'Ventas',            'Área comercial y ventas');

-- =============================================================================
-- Para verificar:
--   DESCRIBE sucursales;
--   DESCRIBE puestos;
--   DESCRIBE anuncios;
--   SHOW TABLES LIKE 'areas';
-- =============================================================================
