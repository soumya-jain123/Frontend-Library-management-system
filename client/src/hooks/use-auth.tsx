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

// API functions
const loginApi = async (data: LoginData): Promise<User> => {
  const response = await fetch('http://localhost:8080/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: data.username,
      password: data.password,
    }),
  });

  const result = await response.json();

  if (!response.ok || result.statusCode !== 200) {
    throw new Error(result.message || 'Login failed');
  }

  // Save tokens
  localStorage.setItem("authToken", result.token);
  localStorage.setItem("refreshToken", result.refreshToken);

  return {
    id: result.user?.id || 1,
    username: result.user?.username || data.username,
    role: result.role?.toLowerCase() == "user" ? "student" : result.role?.toLowerCase(),
    name: result.user?.displayName || "User",
    email: result.user?.email || data.username,
    active: result.user?.enabled ?? true,
  };
};

const registerApi = async (data: RegisterData): Promise<User> => {
  const res = await fetch("http://127.0.0.1:8080/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: data.email,
      displayName: data.name,
      password: data.password,
      role: data.role.toLowerCase() === "student" ? "USER" : data.role.toUpperCase(),
    }),
  });

  const result = await res.json();

  if (!res.ok || result.statusCode !== 200) {
    throw new Error(result.message || "Registration failed");
  }

  return {
    id: result.user.id,
    username: result.user.username,
    role: result.user.role.toLowerCase() === "user" ? "student" : result.user.role.toLowerCase(),
    name: result.user.displayName,
    email: result.user.email,
    active: result.user.enabled,
  };
};

// Mock logout API function
const logoutApi = async () => {
  // Simulate API delay
  // await new Promise(resolve => setTimeout(resolve, 500));
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  return true;
};

// Custom hooks for mutations
const useLoginMutation = (setUser: (user: User | null) => void) => {
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (user) => {
      // Save user data to localStorage
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
    },
    onError: (error) => {
      // Handle login error
      console.error("Login failed:", error);
      // You could add toast notification here
    }
  });
};

// const useRegisterMutation = (setUser: (user: User | null) => void) => {
//   return useMutation({
//     mutationFn: registerApi,
//     onSuccess: (user) => {
//       localStorage.setItem('user', JSON.stringify(user));
//       setUser(user);
//     }
//   });
// };

const useRegisterMutation = (setUser: (user: User | null) => void) => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: registerApi,
    onSuccess: (_user) => {
      toast({
        title: "Registration Successful",
        description: "Please log in to access your dashboard.",
      });

      setUser(null); // Prevent automatic login
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};


const useLogoutMutation = (setUser: (user: User | null) => void) => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      // Clear user data and tokens
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      // Set user to null in state
      setUser(null);
      
      // Show a toast notification
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      
      // Redirect to login page
      window.location.href = "/auth";
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