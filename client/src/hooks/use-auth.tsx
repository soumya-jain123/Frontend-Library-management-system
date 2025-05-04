import { createContext, useContext, useState, useEffect } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
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
  logoutMutation: ReturnType<typeof useLogoutMutation>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Mock API functions
const loginApi = async (data: LoginData): Promise<User> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Determine role based on username for testing purposes
  let role = "student";
  if (data.username.includes("admin")) {
    role = "admin";
  } else if (data.username.includes("librarian")) {
    role = "librarian";
  }
  
  return {
    id: 1,
    username: data.username,
    role: role,
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

// Mock logout API function
const logoutApi = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};

// Custom hooks for mutations
const useLoginMutation = (setUser: (user: User | null) => void) => {
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (user) => {
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      // Redirect to role-specific dashboard
      if (user.role === "admin") {
        window.location.href = "/admin";
      } else if (user.role === "librarian") {
        window.location.href = "/librarian";
      } else if (user.role === "student") {
        window.location.href = "/student";
      } else {
        window.location.href = "/";
      }
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

const useLogoutMutation = (setUser: (user: User | null) => void) => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      localStorage.removeItem('user');
      setUser(null);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    }
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loginMutation = useLoginMutation(setUser);
  const registerMutation = useRegisterMutation(setUser);
  const logoutMutation = useLogoutMutation(setUser);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loginMutation, 
      registerMutation, 
      logoutMutation,
      isLoading 
    }}>
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