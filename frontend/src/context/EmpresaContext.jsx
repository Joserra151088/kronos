import { createContext, useContext, useEffect, useState } from "react";
import { getEmpresaConfig } from "../utils/api";

const EmpresaContext = createContext(null);

const DEFAULT_EMPRESA = {
  nombre: "Control de Acceso",
  razonSocial: "",
  rfc: "",
  domicilio: "",
  telefono: "",
  email: "",
  logoUrl: null,
};

export const EmpresaProvider = ({ children }) => {
  const [empresa, setEmpresa] = useState(DEFAULT_EMPRESA);

  const refreshEmpresa = async () => {
    try {
      const data = await getEmpresaConfig();
      setEmpresa((prev) => ({ ...prev, ...data }));
    } catch {
      // Mantener fallback local si el backend no responde.
    }
  };

  useEffect(() => {
    refreshEmpresa();
  }, []);

  return (
    <EmpresaContext.Provider value={{ empresa, setEmpresa, refreshEmpresa }}>
      {children}
    </EmpresaContext.Provider>
  );
};

export const useEmpresa = () => useContext(EmpresaContext);
