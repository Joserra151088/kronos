/**
 * email.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Servicio de envío de correos con nodemailer.
 *
 * Variables de entorno requeridas en producción:
 *   SMTP_HOST   - Ej: "smtp.gmail.com"
 *   SMTP_PORT   - Ej: 587
 *   SMTP_SECURE - "true" para TLS (puerto 465), omitir para STARTTLS
 *   SMTP_USER   - Correo remitente
 *   SMTP_PASS   - Contraseña o App Password
 *   SMTP_FROM   - Nombre+dirección (opcional, usa SMTP_USER por defecto)
 *   APP_URL     - URL pública del frontend (Ej: "https://kronos.miempresa.com")
 *
 * En desarrollo (sin SMTP_HOST), se usa Ethereal para capturar los correos
 * sin enviarlos; la URL de vista previa se imprime en la consola.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const nodemailer = require("nodemailer");

const APP_URL = process.env.APP_URL || "http://localhost:3000";

let _transporter = null;

async function getTransporter() {
  if (_transporter) return _transporter;

  if (process.env.SMTP_HOST) {
    // ── Configuración de producción ────────────────────────────────────────
    _transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // ── Modo desarrollo: Ethereal (no envía correos reales) ────────────────
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host:   "smtp.ethereal.email",
      port:   587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[email] Usando Ethereal (desarrollo). Usuario: ${testAccount.user}`);
  }

  return _transporter;
}

/**
 * Envía el correo de restablecimiento de contraseña.
 *
 * @param {string} destinatario - Email del usuario
 * @param {string} nombre       - Nombre para el saludo
 * @param {string} token        - Token único de restablecimiento
 */
const enviarCorreoReset = async (destinatario, nombre, token) => {
  const t        = await getTransporter();
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const remitente = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@kronos.local";

  const info = await t.sendMail({
    from:    `"Kronos – Control de Acceso" <${remitente}>`,
    to:      destinatario,
    subject: "Restablecimiento de contraseña – Kronos",
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:#004269;padding:24px 32px;">
            <span style="font-size:22px;font-weight:bold;color:#77B328;letter-spacing:2px;">KRONOS</span>
            <span style="display:block;font-size:12px;color:#b0cee0;margin-top:4px;">
              Sistema de Control de Acceso y Asistencia
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;color:#1e2832;font-size:16px;">
              Hola, <strong>${nombre}</strong>
            </p>
            <p style="margin:0 0 24px;color:#445566;font-size:14px;line-height:1.7;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta en
              <strong>Kronos</strong>. Haz clic en el botón para crear una nueva contraseña:
            </p>
            <a href="${resetUrl}"
               style="display:inline-block;background:#004269;color:#fff;text-decoration:none;
                      padding:13px 30px;border-radius:6px;font-size:15px;font-weight:bold;">
              Restablecer contraseña
            </a>
            <p style="margin:28px 0 0;color:#778899;font-size:12px;line-height:1.6;">
              Este enlace es válido por <strong>1 hora</strong>.<br>
              Si no solicitaste este cambio, puedes ignorar este correo con seguridad.<br><br>
              O copia esta URL en tu navegador:<br>
              <span style="word-break:break-all;color:#004269;">${resetUrl}</span>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f0f4f8;padding:14px 32px;text-align:center;">
            <span style="font-size:11px;color:#99aabb;">
              Kronos © ${new Date().getFullYear()} – No respondas a este correo
            </span>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Hola ${nombre},\n\nRestablece tu contraseña en:\n${resetUrl}\n\nEste enlace expira en 1 hora.\n\nKronos – Control de Acceso`,
  });

  // En desarrollo, imprimir la URL de vista previa de Ethereal
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[email] Vista previa del correo: ${previewUrl}`);
  }

  return info;
};

module.exports = { enviarCorreoReset };
