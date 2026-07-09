import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthState {
  isAuthenticated: boolean;
  userName: string;
  userRole: string;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = "parkai-demo-authenticated";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === "true",
  );

  const value: AuthState = {
    isAuthenticated,
    userName: "Dana Whitfield",
    userRole: "Director of Parking Operations",
    login: () => {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setIsAuthenticated(true);
    },
    logout: () => {
      sessionStorage.removeItem(STORAGE_KEY);
      setIsAuthenticated(false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
