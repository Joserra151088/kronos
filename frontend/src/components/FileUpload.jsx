/**
 * FileUpload.jsx
 * Componente reutilizable para subir archivos (imágenes/PDF).
 * Preparado para S3: usa FormData estándar.
 */

import { useRef, useState } from "react";

const TIPOS_ACEPTADOS = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_SIZE_MB = 10;

const FileUpload = ({ onChange, archivoActual, label = "Adjuntar evidencia (imagen o PDF)" }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`El archivo no debe superar ${MAX_SIZE_MB} MB`);
      return;
    }

    setError("");
    setNombre(file.name);
    onChange(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const limpiar = (e) => {
    e.stopPropagation();
    setPreview(null);
    setNombre("");
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="file-upload-container">
      <label className="file-upload-label">{label}</label>

      {!nombre ? (
        <div className="file-upload-area" onClick={() => inputRef.current?.click()}>
          <span className="file-upload-icon">📎</span>
          <span>Haz clic o arrastra un archivo</span>
          <span className="file-upload-hint">JPG, PNG, WebP o PDF · máx {MAX_SIZE_MB}MB</span>
          <input
            ref={inputRef}
            type="file"
            accept={TIPOS_ACEPTADOS}
            onChange={handleChange}
            style={{ display: "none" }}
          />
        </div>
      ) : (
        <div className="file-upload-preview">
          {preview ? (
            <img src={preview} alt="Vista previa" className="file-upload-img" />
          ) : (
            <div className="file-upload-pdf-icon">📄</div>
          )}
          <div className="file-upload-info">
            <span className="file-upload-nombre">{nombre}</span>
            <button className="btn-danger-sm" onClick={limpiar}>Quitar</button>
          </div>
        </div>
      )}

      {archivoActual && !nombre && (
        <div className="file-upload-existing">
          <a href={`http://localhost:4000${archivoActual}`} target="_blank" rel="noopener noreferrer">
            📎 Ver archivo adjunto actual
          </a>
        </div>
      )}

      {error && <div className="alert alert-danger" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
};

export default FileUpload;
