/**
 * gen_technical_doc.js
 * Generates Kronos Technical Documentation as a .docx file
 */
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, PageBreak,
  Header, Footer, PageNumber, NumberFormat, convertInchesToTwip,
  TableOfContents, StyleLevel, ExternalHyperlink, UnderlineType
} = require("docx");
const fs = require("fs");

const OUT = "C:/jestrada/Proyectos/access-control/docs/Kronos_Documentacion_Tecnica.docx";

// ─── Colors ───────────────────────────────────────────────────────────────────
const NAVY  = "004269";
const GREEN = "77B328";
const LIGHT = "E8F4FB";
const GRAY  = "F5F7FA";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const h1 = (text) => new Paragraph({
  text, heading: HeadingLevel.HEADING_1,
  spacing: { before: 480, after: 120 },
  shading: { type: ShadingType.SOLID, color: NAVY },
  children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 36, font: "Calibri" })]
});

const h2 = (text) => new Paragraph({
  spacing: { before: 320, after: 80 },
  children: [new TextRun({ text, bold: true, color: NAVY, size: 28, font: "Calibri" })]
});

const h3 = (text) => new Paragraph({
  spacing: { before: 200, after: 60 },
  children: [new TextRun({ text, bold: true, color: GREEN, size: 24, font: "Calibri" })]
});

const p = (text) => new Paragraph({
  spacing: { before: 80, after: 80 },
  children: [new TextRun({ text, size: 22, font: "Calibri" })]
});

const bullet = (text) => new Paragraph({
  bullet: { level: 0 },
  spacing: { before: 40, after: 40 },
  children: [new TextRun({ text, size: 22, font: "Calibri" })]
});

const bullet2 = (text) => new Paragraph({
  bullet: { level: 1 },
  spacing: { before: 30, after: 30 },
  children: [new TextRun({ text, size: 20, font: "Calibri" })]
});

const code = (text) => new Paragraph({
  spacing: { before: 60, after: 60 },
  shading: { type: ShadingType.SOLID, color: "F0F0F0" },
  children: [new TextRun({ text, font: "Courier New", size: 18, color: "1A2B3C" })]
});

const divider = () => new Paragraph({
  thematicBreak: true,
  spacing: { before: 120, after: 120 },
});

const note = (text) => new Paragraph({
  spacing: { before: 80, after: 80 },
  shading: { type: ShadingType.SOLID, color: LIGHT },
  children: [
    new TextRun({ text: "ℹ  ", bold: true, color: NAVY, size: 20 }),
    new TextRun({ text, color: NAVY, size: 20, font: "Calibri" })
  ]
});

function makeTable(headers, rows) {
  const headerCells = headers.map(h => new TableCell({
    shading: { type: ShadingType.SOLID, color: NAVY },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20, font: "Calibri" })]
    })]
  }));

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map(cell => new TableCell({
      shading: { type: ShadingType.SOLID, color: ri % 2 === 0 ? "FFFFFF" : GRAY },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({
        children: [new TextRun({ text: cell, size: 18, font: "Calibri" })]
      })]
    }))
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells, tableHeader: true }), ...dataRows]
  });
}

// ─── Build Document ────────────────────────────────────────────────────────────
const doc = new Document({
  title: "Kronos – Documentación Técnica",
  description: "Arquitectura, componentes y guía de instalación del sistema Kronos",
  creator: "Equipo Kronos",
  sections: [{
    properties: {
      page: {
        margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1) }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "KRONOS  ", bold: true, color: NAVY, size: 20, font: "Calibri" }),
            new TextRun({ text: "–  Documentación Técnica", color: "666666", size: 18 }),
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Kronos – Sistema de Control de Acceso y Asistencia  |  2025  |  Página ", size: 16, color: "888888" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" }),
          ]
        })]
      })
    },
    children: [

      // ── COVER ────────────────────────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 800, after: 80 },
        shading: { type: ShadingType.SOLID, color: "002847" },
        children: [new TextRun({ text: "KRONOS", bold: true, size: 72, color: "FFFFFF", font: "Calibri", characterSpacing: 600 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        shading: { type: ShadingType.SOLID, color: "002847" },
        children: [new TextRun({ text: "Sistema de Control de Acceso y Asistencia", size: 32, color: GREEN, font: "Calibri" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        shading: { type: ShadingType.SOLID, color: "002847" },
        children: [new TextRun({ text: "DOCUMENTACIÓN TÉCNICA", bold: true, size: 28, color: "A8C8E0", font: "Calibri", characterSpacing: 200 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 200 },
        shading: { type: ShadingType.SOLID, color: "002847" },
        children: [new TextRun({ text: "Versión 1.0  |  2025", size: 22, color: "6A9BB8", font: "Calibri" })]
      }),
      new Paragraph({
        children: [new PageBreak()]
      }),

      // ── 1. DESCRIPCIÓN GENERAL ────────────────────────────────────────────
      h1("1. Descripción General del Sistema"),
      p("Kronos es un sistema web integral de control de acceso y asistencia diseñado para organizaciones con múltiples sucursales. Permite el registro geolocalizado de asistencia, la gestión digital de incidencias laborales, la generación de reportes ejecutivos y la auditoría completa de todas las acciones del sistema."),
      p("La plataforma está construida sobre una arquitectura cliente-servidor desacoplada, con un frontend en React 18 y un backend en Node.js/Express, comunicándose a través de una API REST y eventos en tiempo real vía WebSocket (Socket.io)."),
      h2("1.1 Características principales"),
      bullet("Registro de asistencia en tiempo real con validación GPS y geocercas por sucursal"),
      bullet("Flujo de aprobación digital para registros manuales e incidencias"),
      bullet("Reportes ejecutivos exportables en Excel, CSV y PDF corporativo"),
      bullet("12 módulos de acceso configurables por rol desde el panel de administración"),
      bullet("7 perfiles de usuario con control de acceso granular (RBAC)"),
      bullet("Notificaciones en tiempo real vía WebSocket"),
      bullet("Auditoría completa de todas las acciones del sistema"),
      bullet("Monitoreo de salud de plataforma con buffer de errores en memoria"),
      bullet("Restablecimiento de contraseña por correo electrónico con token de un solo uso"),
      bullet("Compatible con MySQL; modo fallback en memoria para desarrollo/demo"),
      h2("1.2 Tecnologías utilizadas"),
      makeTable(
        ["Componente", "Tecnología", "Versión", "Propósito"],
        [
          ["Frontend", "React + Vite", "18.2 / 5.1", "Interfaz de usuario SPA"],
          ["Routing", "React Router DOM", "6.22", "Navegación cliente"],
          ["Real-time", "Socket.io Client", "4.8.3", "WebSocket para actualizaciones"],
          ["Mapas", "Leaflet", "1.9.4", "Visualización geoespacial"],
          ["Exportación Excel", "XLSX", "0.18.5", "Generación de archivos .xlsx"],
          ["Exportación PDF", "jsPDF + autoTable", "4.2 / 5.0.7", "Reportes PDF corporativos"],
          ["Backend", "Node.js + Express", "4.18.2", "API REST"],
          ["Autenticación", "JSON Web Tokens", "9.0.2", "Tokens de sesión"],
          ["Contraseñas", "bcryptjs", "3.0.3", "Hash + salt de contraseñas"],
          ["Base de datos", "MySQL2", "3.19.1", "Driver MySQL asíncrono"],
          ["Correo", "Nodemailer", "8.0.2", "Envío de correos SMTP"],
          ["Archivos", "Multer", "2.1.1", "Subida de archivos multipart"],
          ["WebSocket", "Socket.io Server", "4.8.3", "Eventos en tiempo real"],
          ["Logging HTTP", "Morgan", "1.10.0", "Logging de peticiones"],
          ["UUIDs", "uuid", "9.0.0", "Generación de identificadores"],
        ]
      ),
      divider(),

      // ── 2. ARQUITECTURA ───────────────────────────────────────────────────
      h1("2. Arquitectura del Sistema"),
      h2("2.1 Vista general"),
      p("El sistema sigue una arquitectura de tres capas desacopladas:"),
      bullet("Capa de presentación: React 18 SPA servida por Vite (desarrollo) o servidor estático (producción)"),
      bullet("Capa de aplicación: Express.js REST API en Node.js con Socket.io para eventos en tiempo real"),
      bullet("Capa de datos: MySQL con sincronización en memoria; store in-memory como fallback"),
      h2("2.2 Estructura de directorios"),
      code("access-control/"),
      code("├── frontend/                    # Aplicación React"),
      code("│   ├── src/"),
      code("│   │   ├── pages/               # Vistas principales (13 páginas)"),
      code("│   │   ├── components/          # Componentes reutilizables"),
      code("│   │   ├── context/             # Contextos React (Auth, Empresa, Theme, Socket, Notif)"),
      code("│   │   ├── utils/               # api.js, export.js, module-access.js"),
      code("│   │   ├── hooks/               # Hooks personalizados (useSidebar)"),
      code("│   │   ├── App.jsx              # Configuración de rutas"),
      code("│   │   ├── main.jsx             # Punto de entrada"),
      code("│   │   └── index.css            # Estilos globales con variables CSS"),
      code("│   ├── index.html"),
      code("│   └── vite.config.js"),
      code("├── backend/"),
      code("│   ├── src/"),
      code("│   │   ├── routes/              # Controladores por módulo (14 archivos)"),
      code("│   │   ├── services/            # notificaciones, email, logs, storage"),
      code("│   │   ├── middleware/          # auth.js, roles.js, auditoria.middleware.js"),
      code("│   │   ├── data/                # store.js (almacén en memoria + MySQL)"),
      code("│   │   ├── utils/               # geo.js, minutos.js, access-scope.js"),
      code("│   │   └── config/              # db.js"),
      code("│   ├── uploads/                 # Archivos subidos (fotos, evidencias)"),
      code("│   ├── server.js                # Punto de entrada del servidor"),
      code("│   └── .env                     # Variables de entorno"),
      code("└── docs/                        # Documentación y archivos generados"),
      h2("2.3 Flujo de autenticación"),
      p("1. El cliente envía POST /api/auth/login con email y contraseña."),
      p("2. El backend verifica las credenciales contra el store (bcrypt hash comparison)."),
      p("3. Si son válidas, genera un JWT firmado con JWT_SECRET, payload: { id, email, rol, sucursalId, nombre }, expiración 8 horas."),
      p("4. El cliente almacena el token en localStorage."),
      p("5. Todas las peticiones protegidas incluyen Authorization: Bearer <token>."),
      p("6. El middleware verificarToken valida firma y expiración en cada petición."),
      h2("2.4 Comunicación en tiempo real"),
      p("Socket.io establece una conexión WebSocket persistente entre cliente y servidor. El cliente se suscribe a su canal personal (user:<userId>) al autenticarse. El servidor emite eventos a los canales relevantes cuando ocurren cambios (nuevos registros, notificaciones, etc.)."),
      h2("2.5 Módulo de datos (store.js)"),
      p("El store.js es el núcleo de persistencia del sistema. Mantiene todos los datos en arrays en memoria y sincroniza de forma asíncrona con MySQL cuando la base de datos está disponible. Las funciones de lectura/escritura son síncronas (en memoria) para garantizar respuestas rápidas."),
      bullet("initializeFromDatabase() — Al inicio, carga todos los datos desde MySQL"),
      bullet("refreshFromDatabaseIfNeeded() — Refresca el snapshot si han pasado más de 3 segundos"),
      bullet("scheduleDatabaseSync() — Programa una escritura diferida a MySQL tras cambios"),
      bullet("getDatabaseStatus() — Retorna estado: connected, enabled, database, lastError"),
      divider(),

      // ── 3. MODELOS DE DATOS ───────────────────────────────────────────────
      h1("3. Modelos de Datos"),
      h2("3.1 Usuarios"),
      makeTable(
        ["Campo", "Tipo", "Descripción"],
        [
          ["id", "UUID", "Identificador único"],
          ["nombre / apellido", "string", "Nombre completo del empleado"],
          ["email", "string (único)", "Correo y credencial de acceso"],
          ["password", "string (bcrypt)", "Contraseña hasheada con salt"],
          ["rol", "enum (7)", "Perfil de acceso del usuario"],
          ["sucursalId", "UUID | null", "Sucursal asignada (null = corporativo)"],
          ["puestoId", "UUID | null", "Puesto de trabajo asignado"],
          ["horarioId", "UUID | null", "Horario laboral asignado"],
          ["grupoId", "UUID | null", "Grupo de sucursales (supervisores)"],
          ["tipo", "sucursal | corporativo", "Tipo de empleado"],
          ["activo", "boolean", "Soft delete: false = desactivado"],
          ["fotoUrl", "string | null", "Ruta del archivo de foto de perfil"],
          ["datosExtra", "JSON | null", "Campos personalizados del puesto"],
        ]
      ),
      h2("3.2 Registros de Asistencia"),
      makeTable(
        ["Campo", "Tipo", "Descripción"],
        [
          ["tipo", "enum (4)", "entrada | salida_alimentos | regreso_alimentos | salida"],
          ["fecha / hora", "string", "Fecha YYYY-MM-DD y hora HH:MM:SS del registro"],
          ["latitud / longitud", "number | null", "Coordenadas GPS (null si es manual)"],
          ["dentroGeocerca", "boolean | null", "Si el registro fue dentro de la geocerca"],
          ["esManual", "boolean", "true si fue capturado por un agente"],
          ["estadoAprobacion", "enum | null", "pendiente | aprobada | rechazada (solo manuales)"],
          ["fueraDeHorario", "boolean", "Si el registro excede tolerancia del horario"],
          ["fueraDeGeocerca", "boolean", "Si el registro está fuera del radio definido"],
          ["motivoFueraHorario", "string | null", "Justificación obligatoria si fuera de horario"],
          ["motivoFueraGeocerca", "string | null", "Justificación si fuera de geocerca"],
        ]
      ),
      h2("3.3 Sucursales"),
      makeTable(
        ["Campo", "Tipo", "Descripción"],
        [
          ["nombre", "string", "Nombre de la sucursal"],
          ["ciudad / estado", "string", "Ubicación geográfica"],
          ["geocerca.latitud", "number", "Latitud del centro de la geocerca"],
          ["geocerca.longitud", "number", "Longitud del centro de la geocerca"],
          ["geocerca.radio", "number", "Radio en metros del perímetro de validación"],
          ["activa", "boolean", "Soft delete de sucursal"],
        ]
      ),
      h2("3.4 Roles del sistema"),
      makeTable(
        ["Rol (clave)", "Nombre descriptivo", "Alcance de datos"],
        [
          ["super_admin", "Super Administrador", "Todo el sistema, todas las sucursales"],
          ["agente_soporte_ti", "Soporte TI", "Todo el sistema (sin auditoría)"],
          ["supervisor_sucursales", "Supervisor de Sucursales", "Su grupo de sucursales asignado"],
          ["agente_control_asistencia", "Agente Control Asistencia", "Sucursales de su grupo"],
          ["visor_reportes", "Visor de Reportes", "Solo lectura (reportes, mapa)"],
          ["medico_titular", "Médico Titular", "Sus propios datos y su sucursal"],
          ["medico_de_guardia", "Médico de Guardia", "Sus propios datos, sucursal por sesión"],
        ]
      ),
      divider(),

      // ── 4. API REST ───────────────────────────────────────────────────────
      h1("4. API REST — Endpoints"),
      h2("4.1 Autenticación (/api/auth)"),
      makeTable(
        ["Método", "Ruta", "Auth", "Descripción"],
        [
          ["POST", "/api/auth/login", "No", "Autenticación. Body: { email, password, sucursalIdLogin? }"],
          ["GET", "/api/auth/me", "JWT", "Perfil del usuario autenticado"],
          ["POST", "/api/auth/forgot-password", "No", "Solicita restablecimiento por correo. Body: { email }"],
          ["POST", "/api/auth/reset-password", "No", "Aplica nueva contraseña. Body: { token, password }"],
        ]
      ),
      h2("4.2 Registros (/api/registros)"),
      makeTable(
        ["Método", "Ruta", "Auth", "Descripción"],
        [
          ["GET", "/api/registros", "JWT", "Lista filtrada de registros (scope por rol)"],
          ["GET", "/api/registros/hoy", "JWT", "Registros de hoy del usuario autenticado"],
          ["GET", "/api/registros/mapa", "JWT Admin", "Datos de presencia activa por sucursal"],
          ["GET", "/api/registros/minutos", "JWT", "Minutos trabajados por rango de fechas"],
          ["GET", "/api/registros/minutos-empleados", "JWT Admin", "Minutos por empleado consolidados"],
          ["POST", "/api/registros", "JWT", "Crear registro GPS. Body: { latitud, longitud, ... }"],
          ["POST", "/api/registros/manual", "JWT Admin", "Crear registro manual. Require aprobación."],
          ["PUT", "/api/registros/:id/manual", "JWT Admin", "Editar registro manual existente"],
          ["PUT", "/api/registros/:id/aprobar", "JWT Supervisor", "Aprobar registro manual pendiente"],
          ["PUT", "/api/registros/:id/rechazar", "JWT Supervisor", "Rechazar con motivo"],
        ]
      ),
      h2("4.3 Módulos adicionales"),
      bullet("GET/POST/PUT/DELETE /api/sucursales — CRUD de sucursales con geocercas"),
      bullet("GET/POST/PUT/DELETE /api/usuarios — CRUD de empleados con foto"),
      bullet("GET/POST/PUT/DELETE /api/incidencias — Gestión de incidencias con archivos"),
      bullet("GET/PUT /api/config/roles — Configuración de módulos por rol"),
      bullet("GET/PUT /api/config/empresa — Configuración corporativa y logo"),
      bullet("GET /api/auditoria — Log de auditoría paginado y filtrable"),
      bullet("GET /api/logs/salud — Health check de plataforma con métricas"),
      bullet("GET /api/logs/errores — Buffer de errores paginado (solo admin)"),
      bullet("GET /api/notificaciones — Centro de notificaciones del usuario"),
      bullet("GET /api/reportes/asistencia — Reporte de asistencia por período"),
      bullet("GET /api/reportes/minutos — Reporte de minutos trabajados"),
      bullet("GET /api/reportes/incidencias — Reporte de incidencias"),
      divider(),

      // ── 5. FRONTEND ───────────────────────────────────────────────────────
      h1("5. Componentes del Frontend"),
      h2("5.1 Páginas principales"),
      makeTable(
        ["Página", "Ruta", "Descripción"],
        [
          ["Login", "/login", "Autenticación con selector de sucursal para médicos de guardia"],
          ["ResetPassword", "/reset-password?token=...", "Formulario de nueva contraseña con token de URL"],
          ["Dashboard", "/dashboard", "Panel de registro diario con GPS y barra de progreso 0/4"],
          ["Eventos", "/eventos", "Matriz de asistencia empleado × día con edición"],
          ["Registros", "/registros", "Historial y aprobación de registros manuales"],
          ["Incidencias", "/incidencias", "Reporte de ausencias/permisos con evidencias"],
          ["Reportes", "/reportes", "Exportación a Excel, CSV y PDF ejecutivo"],
          ["Sucursales", "/sucursales", "CRUD de sucursales con geocercas en mapa"],
          ["Empleados", "/empleados", "Gestión completa de personal"],
          ["Grupos", "/grupos", "Agrupación de sucursales por zona"],
          ["Mapa", "/mapa", "Presencia activa en tiempo real (Leaflet)"],
          ["Administración", "/admin", "Puestos, horarios, roles, configuración empresa"],
          ["Auditoría", "/auditoria", "Log de acciones con filtros: usuario, acción, fecha"],
          ["Logs", "/logs", "Salud de plataforma, métricas y buffer de errores"],
          ["Notificaciones", "/notificaciones", "Centro de alertas del usuario"],
          ["Perfil", "/perfil", "Datos personales, contraseña, registros propios, aclaraciones"],
        ]
      ),
      h2("5.2 Contextos de React"),
      makeTable(
        ["Contexto", "Archivo", "Responsabilidad"],
        [
          ["AuthContext", "context/AuthContext.jsx", "Sesión JWT, login/logout, módulos del usuario"],
          ["EmpresaContext", "context/EmpresaContext.jsx", "Config empresa (nombre, logo, RFC) — actualiza favicon"],
          ["ThemeContext", "context/ThemeContext.jsx", "Modo claro/oscuro con persistencia en localStorage"],
          ["SocketContext", "context/SocketContext.jsx", "Conexión Socket.io y registro del canal personal"],
          ["NotificacionesContext", "context/NotificacionesContext.jsx", "Contador de no leídas y suscripción a eventos WS"],
        ]
      ),
      h2("5.3 Utilidades"),
      makeTable(
        ["Archivo", "Descripción"],
        [
          ["utils/api.js", "Cliente HTTP: todas las llamadas al backend con JWT automático"],
          ["utils/export.js", "exportToExcel, exportToCsv, exportToPdf (diseño corporativo Kronos)"],
          ["utils/module-access.js", "getModulesForUser, hasModuleAccess — RBAC en el frontend"],
        ]
      ),
      divider(),

      // ── 6. GUÍA DE INSTALACIÓN ────────────────────────────────────────────
      h1("6. Guía de Instalación y Configuración"),
      h2("6.1 Prerrequisitos"),
      bullet("Node.js v18+ (recomendado v20 LTS o v24)"),
      bullet("npm v9+ (incluido con Node.js)"),
      bullet("MySQL 8.0+ (opcional — el sistema funciona sin BD en modo memoria)"),
      bullet("Cuenta SMTP para envío de correos (opcional — Ethereal para desarrollo)"),
      bullet("Git (para clonar el repositorio)"),
      h2("6.2 Instalación del backend"),
      p("Paso 1 — Clonar e instalar dependencias:"),
      code("cd access-control/backend"),
      code("npm install"),
      p("Paso 2 — Crear el archivo .env a partir del ejemplo:"),
      code("copy .env.example .env"),
      p("Paso 3 — Editar las variables en .env:"),
      code("PORT=4000"),
      code("FRONTEND_URL=http://localhost:3000"),
      code("JWT_SECRET=tu_clave_secreta_larga_y_segura"),
      code(""),
      code("# Base de datos MySQL (omitir si no se usa)"),
      code("DB_ENABLED=true"),
      code("DB_HOST=127.0.0.1"),
      code("DB_PORT=3306"),
      code("DB_NAME=kronos"),
      code("DB_USER=root"),
      code("DB_PASSWORD=tu_contraseña"),
      code(""),
      code("# Correo SMTP (omitir para usar Ethereal en desarrollo)"),
      code("APP_URL=http://tu-dominio.com"),
      code("SMTP_HOST=smtp.gmail.com"),
      code("SMTP_PORT=587"),
      code("SMTP_USER=tu@gmail.com"),
      code("SMTP_PASS=tu_app_password"),
      code("SMTP_FROM=noreply@tuempresa.com"),
      p("Paso 4 — Iniciar el servidor:"),
      code("npm run dev      # Modo desarrollo con nodemon"),
      code("npm start        # Modo producción"),
      note("En desarrollo, si no se configura SMTP_HOST, el sistema usa Ethereal (correos de prueba capturados). La URL de vista previa aparece en la consola."),
      h2("6.3 Instalación del frontend"),
      p("Paso 1 — Instalar dependencias:"),
      code("cd access-control/frontend"),
      code("npm install"),
      p("Paso 2 — Si el backend corre en un host/puerto diferente, editar la URL base en:"),
      code("frontend/src/utils/api.js  →  const BASE_URL = 'http://tu-servidor:4000/api'"),
      p("Paso 3 — Iniciar en desarrollo:"),
      code("npm run dev      # Dev server en http://localhost:3000"),
      p("Paso 4 — Compilar para producción:"),
      code("npm run build    # Genera dist/ con los archivos estáticos"),
      code("npm run preview  # Vista previa del build"),
      note("El build de producción genera archivos estáticos en frontend/dist/ que pueden ser servidos por Nginx, Apache o cualquier servidor de archivos estáticos."),
      h2("6.4 Configuración de MySQL"),
      p("Si se habilita MySQL (DB_ENABLED=true), el sistema crea y sincroniza las tablas automáticamente al iniciar. No se requiere script SQL adicional — el store.js detecta tablas existentes y las popula o crea según sea necesario."),
      note("El sistema tiene un mecanismo de fallback: si MySQL no está disponible al arrancar, opera en modo memoria pura y reintenta la conexión automáticamente."),
      h2("6.5 Configuración de producción con Nginx"),
      code("# Frontend"),
      code("server {"),
      code("  listen 80;"),
      code("  server_name tu-dominio.com;"),
      code("  root /var/www/kronos/dist;"),
      code("  index index.html;"),
      code("  location / { try_files $uri $uri/ /index.html; }"),
      code("}"),
      code(""),
      code("# Backend (proxy inverso)"),
      code("location /api { proxy_pass http://localhost:4000; }"),
      code("location /socket.io { proxy_pass http://localhost:4000; }"),
      code("location /uploads { proxy_pass http://localhost:4000; }"),
      h2("6.6 Primer acceso"),
      p("Al iniciar el servidor por primera vez, se cargan 7 usuarios de demostración con contraseña 123456:"),
      makeTable(
        ["Rol", "Correo de acceso"],
        [
          ["Super Administrador", "ana.garcia@empresa.com"],
          ["Soporte TI", "luis.ramirez@empresa.com"],
          ["Supervisor", "carlos.mendoza@empresa.com"],
          ["Médico Titular", "sofia.torres@empresa.com"],
          ["Médico de Guardia", "maria.lopez@empresa.com"],
          ["Control Asistencia", "roberto.fuentes@empresa.com"],
          ["Visor Reportes", "patricia.morales@empresa.com"],
        ]
      ),
      note("Cambiar todas las contraseñas de los usuarios de demostración antes de pasar a producción. Usar la función de restablecimiento de contraseña o editarlas directamente desde el panel de Empleados."),
      divider(),

      // ── 7. SEGURIDAD ──────────────────────────────────────────────────────
      h1("7. Consideraciones de Seguridad"),
      h2("7.1 JWT y sesiones"),
      bullet("Los tokens tienen expiración de 8 horas y se deben rotar al reiniciar el servidor"),
      bullet("El JWT_SECRET debe ser una cadena aleatoria de al menos 32 caracteres"),
      bullet("Los tokens se almacenan en localStorage del cliente (considerar httpOnly cookies para mayor seguridad en producción)"),
      h2("7.2 Contraseñas"),
      bullet("Bcryptjs con cost factor 10 (configurable en auth.js → hashPassword)"),
      bullet("Nunca se almacenan en texto plano"),
      bullet("La API nunca retorna el campo password en ninguna respuesta"),
      h2("7.3 Restablecimiento de contraseña"),
      bullet("Tokens UUID de un solo uso almacenados en memoria con TTL de 1 hora"),
      bullet("El endpoint forgot-password nunca revela si el email existe (anti-enumeración)"),
      bullet("Los tokens expirados se limpian automáticamente cada 15 minutos"),
      h2("7.4 CORS y exposición de puertos"),
      bullet("CORS configurado solo para FRONTEND_URL (variable de entorno)"),
      bullet("En producción, el puerto 4000 del backend no debe ser público; usar proxy inverso"),
      h2("7.5 Uploads y archivos"),
      bullet("Validación de tipo MIME en todos los endpoints de subida (lista blanca)"),
      bullet("Tamaño máximo: 10 MB para evidencias de incidencias, 5 MB para fotos de perfil y logo"),
      bullet("Los archivos se sirven desde /uploads con Express static (no requieren autenticación para servirse)"),
      divider(),

      // ── 8. VARIABLES DE ENTORNO ───────────────────────────────────────────
      h1("8. Variables de Entorno"),
      makeTable(
        ["Variable", "Descripción", "Requerida"],
        [
          ["PORT", "Puerto del servidor (default: 4000)", "No"],
          ["FRONTEND_URL", "URL del frontend para CORS (default: http://localhost:3000)", "Producción"],
          ["JWT_SECRET", "Clave para firmar JWT (default inseguro incluido)", "Sí"],
          ["DB_ENABLED", "Habilitar MySQL: true | false (default: true)", "No"],
          ["DB_HOST", "Host de MySQL (default: 127.0.0.1)", "Si DB_ENABLED"],
          ["DB_PORT", "Puerto de MySQL (default: 3306)", "No"],
          ["DB_NAME", "Nombre de la base de datos (default: kronos)", "Si DB_ENABLED"],
          ["DB_USER", "Usuario MySQL", "Si DB_ENABLED"],
          ["DB_PASSWORD", "Contraseña MySQL", "Si DB_ENABLED"],
          ["DB_CONNECTION_LIMIT", "Pool de conexiones (default: 10)", "No"],
          ["APP_URL", "URL pública del frontend para enlaces en correos", "SMTP"],
          ["SMTP_HOST", "Host SMTP. Omitir para usar Ethereal en desarrollo", "Producción"],
          ["SMTP_PORT", "Puerto SMTP (default: 587)", "No"],
          ["SMTP_SECURE", "TLS directo: true | false (default: false, STARTTLS)", "No"],
          ["SMTP_USER", "Usuario SMTP (correo remitente)", "Si SMTP_HOST"],
          ["SMTP_PASS", "Contraseña SMTP o App Password", "Si SMTP_HOST"],
          ["SMTP_FROM", "Dirección de remitente (default: SMTP_USER)", "No"],
        ]
      ),
      divider(),

      // ── 9. MÓDULO DE LOGS ─────────────────────────────────────────────────
      h1("9. Módulo de Salud y Logs de Plataforma"),
      p("El servicio logs.service.js mantiene un buffer circular de hasta 200 entradas de error en memoria. Se alimenta automáticamente del middleware de errores de Express y puede recibir entradas desde cualquier parte del código con logsService.logError(message, location, stack, level)."),
      h2("9.1 Métricas disponibles"),
      makeTable(
        ["Métrica", "Descripción"],
        [
          ["status", "Estado global: healthy | degraded | critical"],
          ["uptime", "Tiempo activo desde el inicio del servidor (ms)"],
          ["uptimeFormatted", "Tiempo formateado: Xd Yh Zm o Xm Ys"],
          ["startedAt", "ISO 8601 del momento de inicio del servidor"],
          ["requestsTotal", "Total de peticiones HTTP recibidas desde el inicio"],
          ["errorsTotal", "Total de errores capturados desde el inicio"],
          ["errorsLastHour", "Errores en los últimos 60 minutos"],
          ["database.connected", "Si MySQL está activo y sincronizado"],
          ["memoryMB", "Memoria heap usada en MB"],
          ["totalMemoryMB", "Memoria RSS total del proceso en MB"],
          ["nodeVersion", "Versión de Node.js del servidor"],
        ]
      ),
      h2("9.2 Lógica de estado"),
      bullet("healthy: Sin errores recientes y base de datos conectada"),
      bullet("degraded: Más de 5 errores en la última hora, O base de datos desconectada"),
      bullet("critical: Más de 20 errores en la última hora"),
      divider(),

      // ── 10. MANTENIMIENTO ─────────────────────────────────────────────────
      h1("10. Mantenimiento y Buenas Prácticas"),
      h2("10.1 Backup"),
      bullet("Si se usa MySQL: configurar backups automáticos con mysqldump o herramienta de gestión"),
      bullet("El directorio /uploads/ contiene archivos binarios — incluirlo en respaldos"),
      bullet("El store en memoria se pierde al reiniciar si no hay MySQL configurado"),
      h2("10.2 Actualizaciones"),
      bullet("Actualizar dependencias periódicamente: npm audit y npm update"),
      bullet("Revisar los CHANGELOG de jsPDF, socket.io y mysql2 antes de actualizar versiones mayores"),
      h2("10.3 Monitoreo en producción"),
      bullet("Usar PM2 o similar para mantener el proceso Node.js activo y con auto-restart"),
      bullet("Revisar el módulo de Logs (/logs) regularmente para detectar errores en producción"),
      bullet("Configurar alertas en la base de datos para espacio en disco y conexiones activas"),
      h2("10.4 Escala horizontal"),
      bullet("El store en memoria NO es compatible con múltiples instancias del proceso backend"),
      bullet("Para escalar horizontalmente: migrar completamente a MySQL y usar un store de sesiones externo (Redis)"),
      bullet("Socket.io en modo multi-instancia requiere el adaptador @socket.io/redis-adapter"),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 800 },
        shading: { type: ShadingType.SOLID, color: "002847" },
        children: [new TextRun({ text: "Kronos – Documentación Técnica  |  Versión 1.0  |  2025", color: GREEN, size: 20, font: "Calibri" })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log("✅ Technical documentation saved:", OUT);
});
