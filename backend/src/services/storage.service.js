/**
 * storage.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Servicio de almacenamiento de archivos.
 * ACTUALMENTE: guarda en disco local en /uploads/
 * MIGRACIÓN A S3: reemplazar solo la función saveFile() con el SDK de AWS.
 * El resto del sistema (incidencias.routes.js) no cambia.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Para migrar a S3:
 *   1. npm install @aws-sdk/client-s3
 *   2. Reemplazar el body de saveFile:
 *      const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
 *      const s3 = new S3Client({ region: process.env.AWS_REGION });
 *      await s3.send(new PutObjectCommand({
 *        Bucket: process.env.S3_BUCKET,
 *        Key: filename,
 *        Body: file.buffer,
 *        ContentType: file.mimetype,
 *      }));
 *      return { url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${filename}`, ... };
 */

const path = require("path");
const fs = require("fs");

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

// Asegurar que el directorio exista
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * saveFile
 * Guarda un archivo (de multer memoryStorage) en disco.
 * Interfaz idéntica a la que usaría S3: recibe el objeto de multer y devuelve { url, nombre, mime }.
 *
 * @param {object} file - Objeto de multer: { originalname, buffer, mimetype }
 * @returns {Promise<{ url: string, nombre: string, mime: string }>}
 */
const saveFile = async (file) => {
  const ext = path.extname(file.originalname);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const dest = path.join(UPLOADS_DIR, filename);

  // LOCAL: escribir buffer a disco
  fs.writeFileSync(dest, file.buffer);

  return {
    url: `/uploads/${filename}`,
    nombre: file.originalname,
    mime: file.mimetype,
  };
};

/**
 * deleteFile
 * Elimina un archivo local. En S3: s3.send(new DeleteObjectCommand(...))
 *
 * @param {string} url - URL relativa como /uploads/filename.pdf
 */
const deleteFile = (url) => {
  try {
    const filename = path.basename(url);
    const filepath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  } catch (err) {
    console.error("Error al eliminar archivo:", err.message);
  }
};

module.exports = { saveFile, deleteFile };
