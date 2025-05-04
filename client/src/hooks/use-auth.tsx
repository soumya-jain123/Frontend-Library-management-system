import { createContext, useContext, useState, useEffect } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["student", "librarian", "admin"])
});

export const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "librarian", "admin"]),
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required")
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

type User = {
  id: number;
  username: string;
  role: string;
  name: string;
  email: string;
  active: boolean;
};

type AuthContextType = {
  user: User | null;
  loginMutation: ReturnType<typeof useLoginMutation>;
  registerMutation: ReturnType<typeof useRegisterMutation>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Mock API functions
const loginApi = async (data: LoginData): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    id: 1,
    username: data.username,
    role: data.role,
    name: "Test User",
    email: "test@example.com",
    active: true
  };
};

const registerApi = async (data: RegisterData): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    id: 1,
    username: data.username,
    role: data.role,
    name: data.name,
    email: data.email,
    active: true
  };
};

// Custom hooks for mutations
const useLoginMutation = (setUser: (user: User | null) => void) => {
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (user) => {
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    }
  });
};

const useRegisterMutation = (setUser: (user: User | null) => void) => {
  return useMutation({
    mutationFn: registerApi,
    onSuccess: (user) => {
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    }
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loginMutation = useLoginMutation(setUser);
  const registerMutation = useRegisterMutation(setUser);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginMutation, registerMutation, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};