# Manual de Uso para Personal Administrativo

## 1. Objetivo
Este manual describe la operacion de `Kronos` para personal administrativo, de supervision, control de asistencia, soporte TI y super administracion.

## 2. Modulos principales
- Dashboard
- Eventos
- Empleados
- Sucursales
- Grupos
- Registros
- Incidencias
- Reportes
- Administracion
- Auditoria
- Logs

## 3. Gestion de empleados
Desde `Empleados` es posible:
- dar de alta usuarios;
- editar informacion;
- cambiar correo, sucursal, puesto, rol y horario;
- cargar foto;
- desactivar usuarios.

### Alta de empleado
1. Entrar a `Empleados`.
2. Elegir `Nuevo`.
3. Capturar datos generales.
4. Asignar puesto, rol, horario y sucursal.
5. Guardar.

## 4. Gestion de sucursales
Desde `Sucursales` se puede:
- crear sedes;
- editar direccion;
- configurar geocerca;
- activar o desactivar sucursales.

## 5. Gestion de horarios y puestos
En `Administracion`:
- crear horarios laborales;
- definir dias laborables;
- asociar tolerancias;
- crear puestos;
- agregar campos personalizados por puesto.

## 6. Configuracion de empresa
Desde `Administracion` se puede actualizar:
- nombre institucional;
- razon social;
- RFC;
- domicilio;
- telefono;
- correo institucional;
- logotipo.

## 7. Configuracion de modulos por rol
El super administrador puede decidir que modulos ve cada rol. Esta configuracion afecta menu, rutas y experiencia de usuario.

## 8. Eventos en tiempo real
En `Eventos` se observa:
- registros nuevos;
- modificaciones manuales;
- aprobaciones y rechazos;
- actividad reciente por sucursal y empleado.

## 9. Registros manuales
Roles autorizados pueden:
- crear registros manuales;
- justificar la captura;
- editar registros;
- aprobar o rechazar correcciones.

### Recomendacion
Toda captura manual debe contener una justificacion clara y verificable.

## 10. Incidencias y aclaraciones
El personal de supervision puede:
- revisar solicitudes;
- aprobar o rechazar;
- dejar comentario;
- mantener trazabilidad.

## 11. Reportes
En `Reportes` se pueden consultar:
- asistencia por sucursal;
- incidencias por periodo;
- minutos trabajados;
- exportacion a formatos de analisis.

## 12. Auditoria
La seccion `Auditoria` muestra cambios de sistema:
- aprobacion o rechazo de incidencias;
- altas y actualizaciones;
- cambios manuales en registros;
- configuraciones administrativas.

## 13. Logs y salud
La seccion `Logs` permite:
- revisar estado de base de datos;
- tiempo de actividad;
- memoria;
- errores del sistema;
- volumen de peticiones.

## 14. Buenas practicas operativas
- No editar datos sin evidencia.
- Registrar comentarios en cambios manuales.
- Revisar logs y salud periodicamente.
- Mantener actualizados usuarios, horarios y sucursales.
- Resguardar credenciales administrativas.

## 15. Recomendaciones para administracion central
- Definir responsables por modulo.
- Realizar revisiones semanales de incidencias y auditoria.
- Validar consistencia de geocercas y horarios por sucursal.
- Mantener respaldo y control de cambios.
