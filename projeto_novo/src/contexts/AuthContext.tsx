import React, { createContext, useContext, useState, ReactNode } from "react";
import type { User, AuthState, UserType } from "../types";
import { AuthService } from "../services/api";

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT
// Disponibiliza user, token e funções de auth para toda a árvore de componentes.
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ user: User; token: string }>;
  register: (data: Record<string, any>) => Promise<{ user: User; token: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lazy initializer — lê localStorage de forma síncrona no primeiro render,
  // eliminando o flash de isLoading:true/user:null que causava race na montagem.
  const [state, setState] = useState<AuthState>(() => {
    const user = AuthService.getCurrentUser();
    const token = AuthService.getToken();
    return {
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading: false,
    };
  });

  const login = async (email: string, password: string) => {
    const { token, user } = await AuthService.login(email, password);
    setState({ user, token, isAuthenticated: true, isLoading: false });
    return { user, token };
  };

  const register = async (data: Record<string, any>) => {
    const { token, user } = await AuthService.register(data);
    setState({ user, token, isAuthenticated: true, isLoading: false });
    return { user, token };
  };

  const logout = async () => {
    await AuthService.logout();
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook de conveniência
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
