-- ============================================================
--  MIGRACIÓN 001 — Alinear schema con el código de la aplicación
--  Fecha: 2026-03-17
--
--  ESTRATEGIA: Para cambiar tipos de columna referenciados por FK,
--  MySQL 8 requiere DROP FK → MODIFY COLUMN → ADD FK de nuevo.
--  SET FOREIGN_KEY_CHECKS = 0 no es suficiente para cambios de tipo.
--
--  CAMBIOS:
--    1. PKs de INT → VARCHAR(36) en tablas que usan UUIDs
--    2. FKs que apuntan a esos PKs → VARCHAR(36)
--    3. usuarios.rol     → renombrar a rol_clave
--    4. usuarios.tipo    → renombrar a tipo_usuario
-- ============================================================

USE kronos;
SET FOREIGN_KEY_CHECKS = 0;

-- ────────────────────────────────────────────────────────────
--  HORARIOS
-- ────────────────────────────────────────────────────────────

-- 1. Eliminar FKs que apuntan a horarios.id
ALTER TABLE horario_dias  DROP FOREIGN KEY fk_hdia_horario;
ALTER TABLE puestos       DROP FOREIGN KEY fk_puesto_horario;
ALTER TABLE usuarios      DROP FOREIGN KEY fk_usuario_horario;

-- 2. Cambiar tipos
ALTER TABLE horarios      MODIFY COLUMN id         VARCHAR(36) NOT NULL  COMMENT 'UUID generado por la aplicación';
ALTER TABLE horario_dias  MODIFY COLUMN horario_id  VARCHAR(36) NOT NULL  COMMENT 'FK → horarios.id (UUID)';
ALTER TABLE puestos       MODIFY COLUMN horario_id  VARCHAR(36) NULL      COMMENT 'FK → horarios.id (UUID)';
ALTER TABLE usuarios      MODIFY COLUMN horario_id  VARCHAR(36) NULL      COMMENT 'FK → horarios.id (UUID)';

-- 3. Recrear FKs
ALTER TABLE horario_dias  ADD CONSTRAINT fk_hdia_horario    FOREIGN KEY (horario_id) REFERENCES horarios(id) ON DELETE CASCADE;
ALTER TABLE puestos       ADD CONSTRAINT fk_puesto_horario  FOREIGN KEY (horario_id) REFERENCES horarios(id) ON DELETE SET NULL;
ALTER TABLE usuarios      ADD CONSTRAINT fk_usuario_horario FOREIGN KEY (horario_id) REFERENCES horarios(id) ON DELETE SET NULL;


-- ────────────────────────────────────────────────────────────
--  SUCURSALES
-- ────────────────────────────────────────────────────────────

ALTER TABLE usuarios          DROP FOREIGN KEY fk_usuario_sucursal;
ALTER TABLE grupo_sucursales  DROP FOREIGN KEY fk_gs_sucursal;
ALTER TABLE registros         DROP FOREIGN KEY fk_reg_sucursal;
ALTER TABLE incidencias       DROP FOREIGN KEY fk_inc_sucursal;

ALTER TABLE sucursales        MODIFY COLUMN id          VARCHAR(36) NOT NULL COMMENT 'UUID generado por la aplicación';
ALTER TABLE usuarios          MODIFY COLUMN sucursal_id VARCHAR(36) NULL     COMMENT 'FK → sucursales.id (UUID)';
ALTER TABLE grupo_sucursales  MODIFY COLUMN sucursal_id VARCHAR(36) NOT NULL COMMENT 'FK → sucursales.id (UUID)';
ALTER TABLE registros         MODIFY COLUMN sucursal_id VARCHAR(36) NULL     COMMENT 'FK → sucursales.id (UUID)';
ALTER TABLE incidencias       MODIFY COLUMN sucursal_id VARCHAR(36) NULL     COMMENT 'FK → sucursales.id (UUID)';

ALTER TABLE usuarios          ADD CONSTRAINT fk_usuario_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;
ALTER TABLE grupo_sucursales  ADD CONSTRAINT fk_gs_sucursal      FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE;
ALTER TABLE registros         ADD CONSTRAINT fk_reg_sucursal     FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;
ALTER TABLE incidencias       ADD CONSTRAINT fk_inc_sucursal     FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;


-- ────────────────────────────────────────────────────────────
--  PUESTOS
-- ────────────────────────────────────────────────────────────

ALTER TABLE puesto_campos_extra  DROP FOREIGN KEY fk_pce_puesto;
ALTER TABLE usuarios             DROP FOREIGN KEY fk_usuario_puesto;

ALTER TABLE puestos              MODIFY COLUMN id        VARCHAR(36) NOT NULL COMMENT 'UUID generado por la aplicación';
ALTER TABLE puesto_campos_extra  MODIFY COLUMN id        VARCHAR(36) NOT NULL COMMENT 'UUID generado por la aplicación';
ALTER TABLE puesto_campos_extra  MODIFY COLUMN puesto_id VARCHAR(36) NOT NULL COMMENT 'FK → puestos.id (UUID)';
ALTER TABLE usuarios             MODIFY COLUMN puesto_id VARCHAR(36) NULL     COMMENT 'FK → puestos.id (UUID)';

ALTER TABLE puesto_campos_extra  ADD CONSTRAINT fk_pce_puesto      FOREIGN KEY (puesto_id) REFERENCES puestos(id) ON DELETE CASCADE;
ALTER TABLE usuarios             ADD CONSTRAINT fk_usuario_puesto  FOREIGN KEY (puesto_id) REFERENCES puestos(id) ON DELETE SET NULL;


-- ────────────────────────────────────────────────────────────
--  GRUPOS
-- ────────────────────────────────────────────────────────────

ALTER TABLE grupo_sucursales  DROP FOREIGN KEY fk_gs_grupo;
ALTER TABLE usuarios          DROP FOREIGN KEY fk_usuario_grupo;

ALTER TABLE grupos            MODIFY COLUMN id       VARCHAR(36) NOT NULL COMMENT 'UUID generado por la aplicación';
ALTER TABLE grupo_sucursales  MODIFY COLUMN grupo_id VARCHAR(36) NOT NULL COMMENT 'FK → grupos.id (UUID)';
ALTER TABLE usuarios          MODIFY COLUMN grupo_id VARCHAR(36) NULL     COMMENT 'FK → grupos.id (UUID)';

ALTER TABLE grupo_sucursales  ADD CONSTRAINT fk_gs_grupo      FOREIGN KEY (grupo_id) REFERENCES grupos(id)   ON DELETE CASCADE;
ALTER TABLE usuarios          ADD CONSTRAINT fk_usuario_grupo FOREIGN KEY (grupo_id) REFERENCES grupos(id)   ON DELETE SET NULL;


-- ────────────────────────────────────────────────────────────
--  USUARIOS
-- ────────────────────────────────────────────────────────────

-- FKs que apuntan a usuarios.id
ALTER TABLE grupos            DROP FOREIGN KEY fk_grupo_supervisor;
ALTER TABLE registros         DROP FOREIGN KEY fk_reg_usuario;
ALTER TABLE registros         DROP FOREIGN KEY fk_reg_captador;
ALTER TABLE registros         DROP FOREIGN KEY fk_reg_aprobador;
ALTER TABLE registros         DROP FOREIGN KEY fk_reg_editor;
ALTER TABLE incidencias       DROP FOREIGN KEY fk_inc_usuario;
ALTER TABLE incidencias       DROP FOREIGN KEY fk_inc_supervisor;
ALTER TABLE aclaraciones      DROP FOREIGN KEY fk_acl_usuario;
ALTER TABLE aclaraciones      DROP FOREIGN KEY fk_acl_supervisor;
ALTER TABLE notificaciones    DROP FOREIGN KEY fk_notif_para;
ALTER TABLE notificaciones    DROP FOREIGN KEY fk_notif_de;
ALTER TABLE auditoria_eventos DROP FOREIGN KEY fk_audit_usuario;

-- Cambiar PK de usuarios
ALTER TABLE usuarios MODIFY COLUMN id VARCHAR(36) NOT NULL COMMENT 'UUID generado por la aplicación';

-- Renombrar columnas que el código espera con nombre diferente
ALTER TABLE usuarios RENAME COLUMN rol  TO rol_clave;
ALTER TABLE usuarios RENAME COLUMN tipo TO tipo_usuario;

-- Cambiar FKs en otras tablas que apuntan a usuarios.id
ALTER TABLE grupos            MODIFY COLUMN supervisor_id  VARCHAR(36) NULL     COMMENT 'FK → usuarios.id (UUID)';
ALTER TABLE registros         MODIFY COLUMN usuario_id     VARCHAR(36) NOT NULL COMMENT 'FK → usuarios.id (UUID)';
ALTER TABLE registros         MODIFY COLUMN captado_por    VARCHAR(36) NULL     COMMENT 'FK → usuarios.id (UUID)';
ALTER TABLE registros         MODIFY COLUMN aprobado_por   VARCHAR(36) NULL     COMMENT 'FK → usuarios.id (UUID)';
ALTER TABLE registros         MODIFY COLUMN editado_por    VARCHAR(36) NULL     COMMENT 'FK → usuarios.id (UUID)';
ALTER TABLE incidencias       MODIFY COLUMN usuario_id     VARCHAR(36) NOT NULL COMMENT 'FK → usuarios.id (UUID)';
ALTER TABLE incidencias       MODIFY COLUMN supervisor_id  VARCHAR(36) NULL     COMMENT 'FK → usuarios.id (UUID)';
ALTER TABLE aclaraciones      MODIFY COLUMN usuario_id     VARCHAR(36) NOT NULL COMMENT 'FK → usuarios.id (UUID)';
ALTER TABLE aclaraciones      MODIFY COLUMN supervisor_id  VARCHAR(36) NULL     COMMENT 'FK → usuarios.id (UUID)';
ALTER TABLE notificaciones    MODIFY COLUMN para_usuario_id VARCHAR(36) NOT NULL COMMENT 'FK → usuarios.id (UUID)';
ALTER TABLE notificaciones    MODIFY COLUMN de_usuario_id   VARCHAR(36) NULL     COMMENT 'FK → usuarios.id (UUID)';
ALTER TABLE auditoria_eventos MODIFY COLUMN usuario_id      VARCHAR(36) NULL     COMMENT 'FK → usuarios.id (UUID)';

-- Recrear todas las FKs
ALTER TABLE grupos            ADD CONSTRAINT fk_grupo_supervisor  FOREIGN KEY (supervisor_id)   REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE registros         ADD CONSTRAINT fk_reg_usuario       FOREIGN KEY (usuario_id)      REFERENCES usuarios(id);
ALTER TABLE registros         ADD CONSTRAINT fk_reg_captador      FOREIGN KEY (captado_por)     REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE registros         ADD CONSTRAINT fk_reg_aprobador     FOREIGN KEY (aprobado_por)    REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE registros         ADD CONSTRAINT fk_reg_editor        FOREIGN KEY (editado_por)     REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE incidencias       ADD CONSTRAINT fk_inc_usuario       FOREIGN KEY (usuario_id)      REFERENCES usuarios(id);
ALTER TABLE incidencias       ADD CONSTRAINT fk_inc_supervisor    FOREIGN KEY (supervisor_id)   REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE aclaraciones      ADD CONSTRAINT fk_acl_usuario       FOREIGN KEY (usuario_id)      REFERENCES usuarios(id);
ALTER TABLE aclaraciones      ADD CONSTRAINT fk_acl_supervisor    FOREIGN KEY (supervisor_id)   REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE notificaciones    ADD CONSTRAINT fk_notif_para        FOREIGN KEY (para_usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE notificaciones    ADD CONSTRAINT fk_notif_de          FOREIGN KEY (de_usuario_id)   REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE auditoria_eventos ADD CONSTRAINT fk_audit_usuario     FOREIGN KEY (usuario_id)      REFERENCES usuarios(id) ON DELETE SET NULL;


-- ────────────────────────────────────────────────────────────
--  TIPOS_INCIDENCIA
-- ────────────────────────────────────────────────────────────

ALTER TABLE incidencias DROP FOREIGN KEY fk_inc_tipo;

ALTER TABLE tipos_incidencia MODIFY COLUMN id                VARCHAR(36) NOT NULL COMMENT 'UUID generado por la aplicación';
ALTER TABLE incidencias      MODIFY COLUMN tipo_incidencia_id VARCHAR(36) NOT NULL COMMENT 'FK → tipos_incidencia.id (UUID)';

ALTER TABLE incidencias ADD CONSTRAINT fk_inc_tipo FOREIGN KEY (tipo_incidencia_id) REFERENCES tipos_incidencia(id);


-- ────────────────────────────────────────────────────────────
--  REGISTROS (solo el PK, las FKs ya se hicieron arriba)
-- ────────────────────────────────────────────────────────────

ALTER TABLE aclaraciones DROP FOREIGN KEY fk_acl_registro;

ALTER TABLE registros    MODIFY COLUMN id          VARCHAR(36) NOT NULL COMMENT 'UUID generado por la aplicación';
ALTER TABLE aclaraciones MODIFY COLUMN registro_id VARCHAR(36) NULL     COMMENT 'FK → registros.id (UUID)';

ALTER TABLE aclaraciones ADD CONSTRAINT fk_acl_registro FOREIGN KEY (registro_id) REFERENCES registros(id) ON DELETE SET NULL;


-- ────────────────────────────────────────────────────────────
--  INCIDENCIAS, ACLARACIONES, NOTIFICACIONES, AUDITORIA
--  (solo sus propios PKs, las FKs ya se hicieron arriba)
-- ────────────────────────────────────────────────────────────

ALTER TABLE incidencias       MODIFY COLUMN id VARCHAR(36) NOT NULL COMMENT 'UUID generado por la aplicación';
ALTER TABLE aclaraciones      MODIFY COLUMN id VARCHAR(36) NOT NULL COMMENT 'UUID generado por la aplicación';
ALTER TABLE notificaciones    MODIFY COLUMN id VARCHAR(36) NOT NULL COMMENT 'UUID generado por la aplicación';
ALTER TABLE auditoria_eventos MODIFY COLUMN id VARCHAR(36) NOT NULL COMMENT 'UUID generado por la aplicación';


SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  Verifica el resultado:
--    SHOW COLUMNS FROM kronos.usuarios;
--    SHOW COLUMNS FROM kronos.registros;
-- ============================================================
