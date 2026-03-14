/**
 * server.js - Express + Socket.io para notificaciones en tiempo real.
 */
require("dotenv").config();

const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { Server } = require("socket.io");

const authRoutes = require("./src/routes/auth.routes");
const sucursalesRoutes = require("./src/routes/sucursales.routes");
const usuariosRoutes = require("./src/routes/usuarios.routes");
const registrosRoutes = require("./src/routes/registros.routes");
const puestosRoutes = require("./src/routes/puestos.routes");
const horariosRoutes = require("./src/routes/horarios.routes");
const gruposRoutes = require("./src/routes/grupos.routes");
const incidenciasRoutes = require("./src/routes/incidencias.routes");
const notificacionesRoutes = require("./src/routes/notificaciones.routes");
const reportesRoutes = require("./src/routes/reportes.routes");
const configRoutes = require("./src/routes/config.routes");
const auditoriaRoutes = require("./src/routes/auditoria.routes");
const aclaracionesRoutes = require("./src/routes/aclaraciones.routes");
const { auditarAccion } = require("./src/middleware/auditoria.middleware");
const notifService = require("./src/services/notificaciones.service");
const store = require("./src/data/store");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || "http://localhost:3000", methods: ["GET", "POST"] },
});

notifService.setIo(io);

io.on("connection", (socket) => {
  socket.on("registrar_usuario", (userId) => {
    if (userId) socket.join(`user:${userId}`);
  });
});

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(morgan("dev"));
app.use(async (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (!req.path.startsWith("/api/")) return next();
  if (req.path === "/api/health") return next();

  try {
    await store.refreshFromDatabaseIfNeeded();
  } catch (error) {
    console.error("No se pudo refrescar el snapshot desde MySQL:", error.message);
  }

  next();
});
app.use(auditarAccion);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/sucursales", sucursalesRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/registros", registrosRoutes);
app.use("/api/puestos", puestosRoutes);
app.use("/api/horarios", horariosRoutes);
app.use("/api/grupos", gruposRoutes);
app.use("/api/incidencias", incidenciasRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/config", configRoutes);
app.use("/api/auditoria", auditoriaRoutes);
app.use("/api/aclaraciones", aclaracionesRoutes);
app.get("/api/health", (req, res) =>
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: store.getDatabaseStatus(),
  })
);

app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const startServer = async () => {
  await store.initializeFromDatabase();

  server.listen(PORT, () => {
    const dbStatus = store.getDatabaseStatus();
    console.log(`\nServidor en http://localhost:${PORT}`);
    console.log("Socket.io activo");
    console.log("Archivos en /uploads");

    if (dbStatus.enabled && dbStatus.connected) {
      console.log(`MySQL sincronizado con schema '${dbStatus.database}'\n`);
      return;
    }

    if (dbStatus.enabled) {
      console.log(`MySQL no disponible (${dbStatus.lastError || "sin detalle"}). Se usa store en memoria.\n`);
      return;
    }

    console.log("MySQL deshabilitado. Se usa store en memoria.\n");
  });
};

startServer().catch((error) => {
  console.error("No se pudo inicializar el servidor:", error);
  process.exit(1);
});

module.exports = { app, io };
