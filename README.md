# 🏥 Previta — Sistema de Control de Acceso por Sucursales

Aplicación web full-stack para gestionar el acceso y asistencia de empleados en múltiples sucursales, con geocercas GPS, módulo de auditoría, reportes detallados y configuración dinámica de empresa.

---

## 📁 Estructura del Proyecto

```
access-control/
├── backend/                         # API REST con Express.js
│   ├── server.js                    # Punto de entrada; aplica middlewares globales
│   ├── package.json
│   └── src/
│       ├── data/
│       │   └── store.js             # Almacén en memoria (reemplazar por BD)
│       ├── middleware/
│       │   ├── auth.js              # Autenticación JWT
│       │   ├── roles.js             # requireRoles() + constantes ROLES
│       │   └── auditoria.middleware.js  # Intercepta res.json y guarda auditoría
│       ├── routes/
│       │   ├── auth.routes.js           # Login / perfil propio
│       │   ├── sucursales.routes.js     # CRUD sucursales + geocerca
│       │   ├── usuarios.routes.js       # CRUD empleados + subida de foto
│       │   ├── registros.routes.js      # Registros de acceso + manual + mapa
│       │   ├── reportes.routes.js       # Reportes exportables
│       │   ├── incidencias.routes.js    # Solicitudes y aprobaciones
│       │   ├── notificaciones.routes.js # Centro de notificaciones
│       │   ├── horarios.routes.js       # CRUD horarios laborales
│       │   ├── puestos.routes.js        # CRUD puestos + campos personalizados
│       │   ├── grupos.routes.js         # Agrupación de sucursales
│       │   ├── config.routes.js         # Configuración de roles y empresa
│       │   └── auditoria.routes.js      # Consulta de bitácora de acciones
│       ├── services/
│       │   ├── notificaciones.service.js  # WebSocket / eventos en tiempo real
│       │   └── storage.service.js         # Abstracción de almacenamiento (S3-ready)
│       └── utils/
│           ├── geo.js                # Fórmula de Haversine para geocercas
│           ├── minutos.js            # Cálculo de minutos trabajados
│           └── access-scope.js       # Alcance de acceso por sucursal/grupo
│
└── frontend/                        # SPA React + Vite
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx                 # Entrada React; envuelve App con providers
        ├── App.jsx                  # Router principal con rutas protegidas
        ├── index.css                # Estilos globales (tema oscuro/claro + Previta)
        ├── context/
        │   ├── AuthContext.jsx      # Estado global de autenticación + JWT
        │   ├── EmpresaContext.jsx   # Configuración dinámica de la empresa
        │   ├── ThemeContext.jsx     # Gestor de temas: oscuro/claro/sistema/custom
        │   ├── NotificacionesContext.jsx
        │   └── SocketContext.jsx    # Conexión WebSocket para eventos en tiempo real
        ├── components/
        │   ├── Layout.jsx           # Sidebar + topbar + navegación responsiva
        │   ├── ProtectedRoute.jsx   # Guarda de rutas por módulo/rol
        │   ├── NotificationBell.jsx # Campana de notificaciones en tiempo real
        │   ├── ThemeToggle.jsx      # Selector de tema (oscuro/claro/sistema/fondo)
        │   └── FileUpload.jsx       # Componente reutilizable de subida de archivos
        ├── pages/
        │   ├── Login.jsx            # Pantalla de inicio de sesión con animación
        │   ├── Dashboard.jsx        # Registro diario con GPS y progreso del día
        │   ├── Eventos.jsx          # Feed en tiempo real de asistencia
        │   ├── Sucursales.jsx       # Gestión de sucursales y geocercas
        │   ├── Usuarios.jsx         # Gestión de empleados
        │   ├── Registros.jsx        # Historial de registros + registro manual
        │   ├── Incidencias.jsx      # Solicitudes y aprobaciones de incidencias
        │   ├── Reportes.jsx         # Reportes de asistencia y minutos trabajados
        │   ├── Notificaciones.jsx   # Centro de notificaciones
        │   ├── Admin.jsx            # Panel de administración (horarios, puestos, roles, empresa)
        │   ├── Grupos.jsx           # Agrupación de sucursales por región
        │   ├── Mapa.jsx             # Mapa interactivo con filtros por grupo y estado
        │   ├── Perfil.jsx           # Edición del perfil propio (foto, datos, contraseña)
        │   └── Auditoria.jsx        # Bitácora de acciones del sistema (solo super_admin)
        └── utils/
            ├── api.js               # Capa completa de comunicación HTTP
            ├── export.js            # Exportación a CSV/Excel
            ├── minutos.js           # Helpers de formato de tiempo
            └── module-access.js     # Permisos dinámicos de módulos por rol
```

---

## 🚀 Instrucciones de instalación

### Requisitos previos
- **Node.js** v18 o superior
- **npm** v9 o superior

### 1. Instalar y levantar el Backend

```bash
cd backend
npm install
npm run dev       # Con recarga automática (nodemon)
# ó
npm start         # Sin recarga automática
```

El servidor queda corriendo en: **http://localhost:4000**

### 2. Instalar y levantar el Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend queda disponible en: **http://localhost:5173** (o el puerto que asigne Vite)

---

## 👥 Usuarios de prueba

| Rol                        | Email                            | Contraseña | Acceso                              |
|----------------------------|----------------------------------|------------|-------------------------------------|
| 👑 Super Admin             | ana.garcia@empresa.com           | 123456     | Todo el sistema                     |
| 🔧 Soporte TI              | luis.ramirez@empresa.com         | 123456     | Gestión técnica, horarios, puestos  |
| 🏢 Supervisor Sucursales   | carlos.mendoza@empresa.com       | 123456     | Ver empleados, aprobar incidencias  |
| 🩺 Médico Titular          | sofia.torres@empresa.com         | 123456     | Dashboard, incidencias, notificaciones |
| 🩺 Médico de Guardia       | maria.lopez@empresa.com          | 123456     | Dashboard (selecciona sucursal al login) |
| 📊 Control Asistencia      | roberto.fuentes@empresa.com      | 123456     | Registros manuales, reportes        |
| 👁️ Visor Reportes          | patricia.morales@empresa.com     | 123456     | Solo lectura de reportes y mapa     |

---

## 🔑 Funcionalidades

### Registro de asistencia
- ✅ 4 registros diarios obligatorios: entrada, salida a alimentos, regreso, salida final
- ✅ Validación de geocerca circular con fórmula de Haversine
- ✅ Cooldown de 1 hora entre registros para prevenir duplicados
- ✅ **Registro manual** por agentes autorizados (agente_control_asistencia, supervisor, soporte_ti, super_admin)
- ✅ Aprobación/rechazo de registros manuales por supervisores
- ✅ Feed en tiempo real de eventos de asistencia (`/eventos`)

### Gestión de personal
- ✅ CRUD de empleados con foto de perfil
- ✅ Asignación de puesto, sucursal, grupo y horario laboral
- ✅ **Campos personalizados por puesto** (texto, número, fecha, selección)
- ✅ Cada usuario puede editar su propio perfil (foto, email, teléfono, contraseña) en `/perfil`

### Sucursales y geocercas
- ✅ CRUD de sucursales con geocercas configurables (lat, lng, radio en metros)
- ✅ Agrupación de sucursales por grupos/regiones
- ✅ **Mapa interactivo** con filtros por grupo y estado de la república

### Reportes y análisis
- ✅ Reporte de asistencia por sucursal y fecha
- ✅ **Minutos trabajados** con desglose por empleado y por día
- ✅ Exportación a CSV/Excel
- ✅ Tiempo trabajado en tiempo real para el empleado activo

### Incidencias
- ✅ Solicitud y gestión de incidencias (permisos, faltas, ajustes)
- ✅ Flujo de aprobación/rechazo con comentarios

### Administración
- ✅ **Horarios laborales**: CRUD con horarios de alimentos incluidos
- ✅ **Puestos**: CRUD con campos extra personalizados por puesto
- ✅ **Configuración de roles**: Matriz de acceso a módulos por rol (dinámica)
- ✅ **Configuración de empresa**: Nombre, RFC, dirección, logo (aparece en login y sidebar)

### Seguridad y auditoría
- ✅ Autenticación con **JWT** (expiración configurable, por defecto 8 horas)
- ✅ Control de acceso por **roles** (7 roles con permisos granulares)
- ✅ **Módulo de auditoría** (super_admin): bitácora completa de acciones con IP, usuario, fecha, método HTTP
- ✅ Logs de auditoría filtrables por usuario, acción, fecha y método

### Interfaz y experiencia
- ✅ **Tema Previta**: colores corporativos verde (#77B328) y azul marino (#004269)
- ✅ Selector de tema: Oscuro / Claro / Sistema (OS) / Fondo personalizado
- ✅ Sidebar colapsable en desktop, hamburger en móvil
- ✅ Perfil del usuario en la barra superior (foto, nombre, rol)
- ✅ **Animación de bienvenida** al iniciar sesión
- ✅ Notificaciones en tiempo real (WebSocket)

---

## 📡 API Endpoints principales

| Método | Ruta                              | Descripción                             | Rol mínimo             |
|--------|-----------------------------------|-----------------------------------------|------------------------|
| POST   | /api/auth/login                   | Iniciar sesión                          | Público                |
| GET    | /api/auth/me                      | Perfil del usuario actual               | Cualquiera             |
| GET    | /api/sucursales                   | Listar sucursales                       | Cualquiera             |
| POST   | /api/sucursales                   | Crear sucursal                          | super_admin            |
| GET    | /api/usuarios                     | Listar empleados                        | supervisor+            |
| POST   | /api/usuarios                     | Crear empleado                          | super_admin/soporte_ti |
| PUT    | /api/usuarios/:id                 | Actualizar empleado / perfil propio     | gestión / propio       |
| POST   | /api/usuarios/:id/foto            | Subir foto de perfil                    | propio / gestión       |
| GET    | /api/registros                    | Listar registros (filtrados por rol)    | Cualquiera             |
| POST   | /api/registros                    | Realizar siguiente registro del día     | Cualquiera             |
| GET    | /api/registros/hoy                | Registros de hoy del usuario            | Cualquiera             |
| POST   | /api/registros/manual             | Captura manual de asistencia            | agente_control+        |
| GET    | /api/registros/reporte            | Reporte por sucursal y fecha            | supervisor+            |
| GET    | /api/registros/minutos-empleados  | Minutos trabajados por empleado         | supervisor+            |
| GET    | /api/registros/mapa               | Datos del mapa de sucursales activas    | supervisor+            |
| GET    | /api/horarios                     | Listar horarios laborales               | Cualquiera autenticado |
| POST   | /api/horarios                     | Crear horario                           | super_admin/soporte_ti |
| GET    | /api/puestos                      | Listar puestos de trabajo               | Cualquiera autenticado |
| PUT    | /api/puestos/:id/campos           | Actualizar campos extra de un puesto    | super_admin/soporte_ti |
| GET    | /api/incidencias                  | Listar incidencias                      | rol gestión            |
| GET    | /api/config/roles                 | Configuración de módulos por rol        | super_admin            |
| PUT    | /api/config/roles/:rol            | Actualizar módulos de un rol            | super_admin            |
| GET    | /api/config/empresa               | Datos de la empresa                     | Cualquiera autenticado |
| PUT    | /api/config/empresa               | Actualizar datos de la empresa          | super_admin            |
| PUT    | /api/config/empresa/logo          | Subir logo de la empresa                | super_admin            |
| GET    | /api/auditoria                    | Consultar bitácora de acciones          | super_admin            |
| GET    | /api/grupos                       | Listar grupos de sucursales             | supervisor+            |

---

## 🛰️ Geocercas

Cada sucursal tiene una geocerca circular:
- **Latitud y Longitud** del punto central
- **Radio en metros** (ej: 200 m)

Al registrar, el sistema usa la **fórmula de Haversine** para calcular la distancia entre el GPS del empleado y el centro. Si supera el radio, el registro es rechazado.

---

## 🎨 Identidad visual (Previta)

| Variable CSS        | Valor       | Uso                              |
|---------------------|-------------|----------------------------------|
| `--accent`          | `#77B328`   | Verde Previta — botones y activos |
| `--accent2`         | `#8CC830`   | Verde claro (hover)              |
| `--previta-navy`    | `#004269`   | Azul marino — overlay bienvenida |
| Tema claro `--accent` | `#004269` | Azul marino para tema claro      |

---

## 🔄 Migración a Base de Datos

Cuando quieras migrar a SQL/MySQL/PostgreSQL:

1. Instalar ORM: `npm install sequelize mysql2` (backend)
2. Crear modelos: `Sucursal`, `Usuario`, `Registro`, `Horario`, `Puesto`, `Incidencia`, `AuditLog`
3. Reemplazar las funciones en `backend/src/data/store.js` con llamadas al ORM
4. Los **controladores (routes) no necesitan cambios**, ya que dependen de la interfaz del store

---

## 🔐 Seguridad

- Autenticación con **JWT** (expiración: 8 horas)
- Control de acceso por **7 roles** con permisos granulares y configurables
- **Bitácora de auditoría** automática para todas las acciones de escritura
- Contraseñas en texto plano solo en desarrollo — usar `bcrypt` en producción
- Middleware de sanitización de datos sensibles (password/token/secret) en logs
