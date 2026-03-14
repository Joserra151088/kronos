/**
 * Login.jsx
 * Soporte para médico de guardia: si el backend responde requiresBranchSelection,
 * muestra un selector de sucursal y reenvía el login con sucursalIdLogin.
 * Incluye animación de bienvenida al iniciar sesión exitosamente.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEmpresa } from "../context/EmpresaContext";
import { forgotPassword } from "../utils/api";

const BASE = "http://localhost:4000";

const DEMO_USERS = [
  { label: "👑 Super Admin – Ana García",          email: "ana.garcia@empresa.com",       password: "123456" },
  { label: "🔧 Soporte TI – Luis Ramírez",         email: "luis.ramirez@empresa.com",     password: "123456" },
  { label: "🏢 Supervisor – Carlos Mendoza",       email: "carlos.mendoza@empresa.com",   password: "123456" },
  { label: "🩺 Médico Titular – Sofía Torres",     email: "sofia.torres@empresa.com",     password: "123456" },
  { label: "🩺 Médico Guardia – María López",      email: "maria.lopez@empresa.com",      password: "123456" },
  { label: "📊 Control Asist. – Roberto Fuentes", email: "roberto.fuentes@empresa.com",  password: "123456" },
  { label: "👁️ Visor Reportes – Patricia Morales", email: "patricia.morales@empresa.com", password: "123456" },
];

const Login = () => {
  const { login } = useAuth();
  const { empresa } = useEmpresa();
  const navigate = useNavigate();
  const [email, setEmail]       = useState("ana.garcia@empresa.com");
  const [password, setPassword] = useState("123456");
  const [error, setError]       = useState("");
  const [cargando, setCargando] = useState(false);
  const [bienvenido, setBienvenido] = useState(null); // { nombre }

  // Para médico de guardia
  const [requiresBranch, setRequiresBranch] = useState(false);
  const [sucursales, setSucursales]         = useState([]);
  const [sucursalIdLogin, setSucursalIdLogin] = useState("");

  // Olvidé mi contraseña
  const [mostrarOlvide, setMostrarOlvide]   = useState(false);
  const [emailReset, setEmailReset]         = useState("");
  const [enviandoReset, setEnviandoReset]   = useState(false);
  const [resetEnviado, setResetEnviado]     = useState(false);
  const [errorReset, setErrorReset]         = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const data = await login(email, password, requiresBranch ? sucursalIdLogin : null);

      if (data.requiresBranchSelection) {
        setRequiresBranch(true);
        setSucursales(data.sucursales || []);
        setCargando(false);
        return;
      }

      // Pantalla de bienvenida antes de navegar
      const nombre = data.usuario?.nombre || "Usuario";
      setBienvenido({ nombre });
      setTimeout(() => navigate("/dashboard"), 1900);
    } catch (err) {
      setError(err.message || "Credenciales incorrectas");
      setCargando(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorReset("");
    setEnviandoReset(true);
    try {
      await forgotPassword(emailReset);
      setResetEnviado(true);
    } catch (err) {
      setErrorReset(err.message || "Error al enviar la solicitud");
    } finally {
      setEnviandoReset(false);
    }
  };

  // ── Overlay de bienvenida ────────────────────────────────────────────────
  if (bienvenido) {
    return (
      <div className="login-welcome-overlay">
        <div className="login-welcome-check">✔</div>
        <div className="login-welcome-text">¡Bienvenido, {bienvenido.nombre}!</div>
        <div className="login-welcome-sub">
          {empresa?.nombre || "Kronos"} — Cargando tu espacio…
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            {empresa?.logoUrl
              ? <img
                  src={`${BASE}${empresa.logoUrl}`}
                  alt={empresa.nombre || "Empresa"}
                  className="login-logo-image"
                />
              : <span style={{ fontSize: "4rem" }}>🏢</span>
            }
          </div>
          <h1>{empresa?.nombre || "Kronos"}</h1>
          <p>Sistema de control de acceso y asistencia</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert alert-danger">{error}</div>}

          {!requiresBranch ? (
            <>
              <div className="form-group">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com" required autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password" type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                />
              </div>
            </>
          ) : (
            <div className="branch-selection">
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                🩺 Como <strong>Médico de Guardia</strong>, selecciona la sucursal en la que te encuentras hoy:
              </div>
              <div className="form-group">
                <label>Sucursal de hoy *</label>
                <select
                  className="form-control"
                  value={sucursalIdLogin}
                  onChange={(e) => setSucursalIdLogin(e.target.value)}
                  required
                >
                  <option value="">Selecciona sucursal...</option>
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre} — {s.ciudad}</option>
                  ))}
                </select>
              </div>
              <button
                type="button" className="btn-link"
                onClick={() => setRequiresBranch(false)}
                style={{ marginBottom: 8 }}
              >
                ← Cambiar usuario
              </button>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={cargando || (requiresBranch && !sucursalIdLogin)}
          >
            {cargando
              ? <><span className="login-spinner" />Iniciando sesión...</>
              : requiresBranch ? "Confirmar sucursal" : "Iniciar sesión"
            }
          </button>

          {!requiresBranch && (
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: "0.85rem", color: "var(--text2)" }}
                onClick={() => { setMostrarOlvide(!mostrarOlvide); setResetEnviado(false); setErrorReset(""); }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}
        </form>

        {/* Panel: olvidé mi contraseña */}
        {mostrarOlvide && !requiresBranch && (
          <div style={{ borderTop: "1px solid var(--border)", padding: "16px 0 0" }}>
            {resetEnviado ? (
              <div className="alert alert-success" style={{ margin: 0 }}>
                ✅ Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada (y la carpeta de spam).
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <p style={{ fontSize: "0.875rem", color: "var(--text2)", marginBottom: 12 }}>
                  Ingresa tu correo electrónico y te enviaremos un enlace para crear una nueva contraseña.
                </p>
                {errorReset && <div className="alert alert-danger" style={{ marginBottom: 10 }}>{errorReset}</div>}
                <div className="form-group">
                  <label htmlFor="email-reset">Correo electrónico</label>
                  <input
                    id="email-reset"
                    type="email"
                    value={emailReset}
                    onChange={(e) => setEmailReset(e.target.value)}
                    placeholder="correo@empresa.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-secondary btn-full"
                  disabled={enviandoReset}
                >
                  {enviandoReset ? "Enviando…" : "Enviar solicitud"}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="demo-users">
          <p className="demo-title">Usuarios de prueba:</p>
          <div className="demo-grid">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email} className="demo-btn"
                onClick={() => { setEmail(u.email); setPassword(u.password); setRequiresBranch(false); }}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
