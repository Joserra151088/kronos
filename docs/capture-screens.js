/**
 * KronOS – Captura automática de pantallas para presentación ejecutiva
 */
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIwMDk4OTNmLTk4ZDAtNDJlOS1hYWZmLTQwYzY1NzA2OTk0YiIsImVtYWlsIjoibHVpcy5yYW1pcmV6QGVtcHJlc2EuY29tIiwicm9sIjoic3VwZXJfYWRtaW4iLCJzdWN1cnNhbElkIjoiNmRjYzUwZGMtNmI3Mi00YTM5LThiZmQtM2I2MDE2NmFkYWZlIiwibm9tYnJlIjoiTHVpcyBDYXNhcyIsImlhdCI6MTc3NDA0NTA3NiwiZXhwIjoxNzc0MDczODc2fQ.yHIWkZKlOvlTTJDMRNEBS_m-5y8zRA42eAYIuDZkv-A";
const BASE  = "http://localhost:3000";
const OUT   = path.join(__dirname, "screenshots");

const SCREENS = [
  { route: "/dashboard",     file: "01_dashboard",       wait: 1500, label: "Dashboard – Inicio" },
  { route: "/registros",     file: "02_registros",       wait: 1500, label: "Registros de Asistencia" },
  { route: "/reportes",      file: "03_reportes",        wait: 1200, label: "Reportes" },
  { route: "/calendario",    file: "04_calendario",      wait: 1200, label: "Calendario" },
  { route: "/grupos",        file: "05_grupos",          wait: 1200, label: "Grupos de Sucursales" },
  { route: "/mapa",          file: "06_mapa",            wait: 1800, label: "Mapa de Sucursales" },
  { route: "/organigrama",   file: "07_organigrama",     wait: 1500, label: "Organigrama" },
  { route: "/horarios",      file: "08_horarios",        wait: 1200, label: "Horarios" },
  { route: "/sucursales",    file: "09_sucursales",      wait: 1200, label: "Sucursales" },
  { route: "/empleados",     file: "10_empleados",       wait: 1500, label: "Empleados / Usuarios" },
  { route: "/puestos",       file: "11_puestos",         wait: 1200, label: "Puestos" },
  { route: "/areas",         file: "12_areas",           wait: 1200, label: "Áreas" },
  { route: "/empresa",       file: "13_empresa",         wait: 1200, label: "Empresa" },
  { route: "/anuncios-admin",file: "14_anuncios",        wait: 1500, label: "Anuncios / Comunicados" },
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Inject auth token before navigating
  await page.goto(BASE, { waitUntil: "networkidle2" });
  await page.evaluate((token) => {
    localStorage.setItem("token", token);
  }, TOKEN);

  const results = [];

  for (const screen of SCREENS) {
    try {
      console.log(`📸 Capturando: ${screen.label}...`);
      await page.goto(BASE + screen.route, { waitUntil: "networkidle2", timeout: 15000 });
      await sleep(screen.wait);

      // Expand Administración if needed
      if (["/horarios","/sucursales","/empleados","/puestos","/areas","/empresa","/anuncios-admin","/organigrama"].includes(screen.route)) {
        await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("ministraci"));
          if (btn) btn.click();
        });
        await sleep(400);
      }

      const filePath = path.join(OUT, screen.file + ".jpg");
      await page.screenshot({ path: filePath, type: "jpeg", quality: 92, fullPage: false });
      results.push({ ...screen, filePath, success: true });
      console.log(`   ✓ Guardado: ${filePath}`);
    } catch (err) {
      console.error(`   ✗ Error en ${screen.route}: ${err.message}`);
      results.push({ ...screen, success: false, error: err.message });
    }
  }

  await browser.close();

  // Write results JSON
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(results, null, 2));
  console.log("\n✅ Captura completa. Screenshots guardados en:", OUT);
  console.log("📋 Manifest:", path.join(OUT, "manifest.json"));
})();
