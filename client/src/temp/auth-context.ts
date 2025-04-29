import { createContext, useContext } from "react";

export interface User {
  id: number;
  username: string;
  role: "student" | "admin" | "superadmin";
  school?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, school?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isError: boolean;
}

// Create context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: async () => {},
  isLoading: false,
  isError: false
});

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};