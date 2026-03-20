-- =============================================================================
-- Migration 006: Agregar campo tipo a sucursales
-- Fecha: 2026-03-19
-- Descripción:
--   • Agrega columna `tipo` a la tabla `sucursales`
--   • Valores posibles: 'sucursal' (default) | 'corporativo'
--   • Permite distinguir sedes corporativas de sucursales regulares
-- Instrucciones: mysql -u root -p kronos < migrations/006_sucursal_tipo.sql
-- =============================================================================

ALTER TABLE sucursales
  ADD COLUMN tipo ENUM('sucursal', 'corporativo') NOT NULL DEFAULT 'sucursal'
  COMMENT 'Tipo de ubicación: sucursal regular o sede corporativa'
  AFTER estado;

-- Actualizar sucursales existentes que puedan ser corporativas
-- (ajustar manualmente si es necesario)
-- UPDATE sucursales SET tipo = 'corporativo' WHERE nombre LIKE '%corporativo%' OR nombre LIKE '%corporacion%';

-- =============================================================================
-- Para verificar:
--   DESCRIBE sucursales;
--   SELECT id, nombre, tipo FROM sucursales;
-- =============================================================================
