import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Eventos from "./pages/Eventos";
import Sucursales from "./pages/Sucursales";
import Usuarios from "./pages/Usuarios";
import Registros from "./pages/Registros";
import Incidencias from "./pages/Incidencias";
import Reportes from "./pages/Reportes";
import Notificaciones from "./pages/Notificaciones";
import Admin from "./pages/Admin";
import Grupos from "./pages/Grupos";
import Mapa from "./pages/Mapa";
import Perfil from "./pages/Perfil";
import Auditoria from "./pages/Auditoria";

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={
            <ProtectedRoute moduleKey="dashboard"><Dashboard /></ProtectedRoute>
          } />
          <Route path="eventos" element={
            <ProtectedRoute moduleKey="eventos"><Eventos /></ProtectedRoute>
          } />
          <Route path="registros" element={<Registros />} />
          <Route path="incidencias" element={
            <ProtectedRoute moduleKey="incidencias">
              <Incidencias />
            </ProtectedRoute>
          } />
          <Route path="reportes" element={
            <ProtectedRoute moduleKey="reportes"><Reportes /></ProtectedRoute>
          } />
          <Route path="notificaciones" element={
            <ProtectedRoute moduleKey="notificaciones"><Notificaciones /></ProtectedRoute>
          } />
          <Route path="sucursales" element={
            <ProtectedRoute moduleKey="sucursales"><Sucursales /></ProtectedRoute>
          } />
          <Route path="empleados" element={
            <ProtectedRoute moduleKey="empleados"><Usuarios /></ProtectedRoute>
          } />
          <Route path="grupos" element={
            <ProtectedRoute moduleKey="grupos"><Grupos /></ProtectedRoute>
          } />
          <Route path="admin" element={
            <ProtectedRoute moduleKey="administracion"><Admin /></ProtectedRoute>
          } />
          <Route path="mapa" element={
            <ProtectedRoute moduleKey="mapa"><Mapa /></ProtectedRoute>
          } />
          <Route path="perfil" element={<Perfil />} />
          <Route path="auditoria" element={
            <ProtectedRoute moduleKey="auditoria"><Auditoria /></ProtectedRoute>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
