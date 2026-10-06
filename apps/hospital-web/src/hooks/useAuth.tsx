import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { PublicUser } from "../../../../shared/types/user";
import { RegisterHospitalInput } from "../../../../shared/validation/auth.schema";
import * as authService from "../services/auth";
import { getToken, setToken, clearToken } from "../services/apiClient";

interface AuthContextValue {
  user: PublicUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerHospital: (input: RegisterHospitalInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setIsLoading(false);
      return;
    }
    authService
      .fetchMe()
      .then((res) => setUser(res.user))
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    setToken(res.token);
    setUser(res.user);
  }, []);

  const registerHospital = useCallback(async (input: RegisterHospitalInput) => {
    const res = await authService.registerHospital(input);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, registerHospital, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
