-- =============================================================================
-- Migration 004: Horario personalizado por día para empleados
-- Fecha: 2026-03-18
-- Descripción:
--   • usuarios.config_dias_horario — JSON con configuración por día de la semana
--     cuando el empleado usa horario personalizado (usa_horario_puesto = 0 y
--     horario_id es null). Estructura del JSON:
--     [{ dia: 1, activo: true, entrada: "09:00", salida: "19:00",
--        tieneComida: true, comidaInicio: "13:00", comidaFin: "14:00" }, ...]
--     dia: 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb, 0=Dom
-- Instrucciones: mysql -u root -p kronos < migrations/004_config_dias_horario.sql
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP PROCEDURE IF EXISTS _add_column_if_missing;
DELIMITER $$
CREATE PROCEDURE _add_column_if_missing(
  IN p_table  VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_ddl    TEXT
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

CALL _add_column_if_missing(
  'usuarios', 'config_dias_horario',
  'ALTER TABLE usuarios
     ADD COLUMN config_dias_horario JSON NULL
     COMMENT ''Array JSON con configuración por día: entrada, salida y hora de comida. Usado cuando usa_horario_puesto=0 y horario_id es null.''
     AFTER usa_horario_puesto'
);

DROP PROCEDURE IF EXISTS _add_column_if_missing;

SET FOREIGN_KEY_CHECKS = 1;

-- Para verificar:
--   SHOW COLUMNS FROM usuarios LIKE 'config%';
