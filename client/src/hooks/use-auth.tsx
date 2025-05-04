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
  try {
    // Make an API call to the backend for authentication
    const response = await fetch('http://localhost:8080/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.username, // Using username as email for the API
        password: data.password
      }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const result = await response.json();
    
    // Check if successful login
    if (result.statusCode === 200) {
      // Store tokens in localStorage
      localStorage.setItem("authToken", result.token);
      localStorage.setItem("refreshToken", result.refreshToken);
      
      // Determine role from API response
      const role = result.role?.toLowerCase() || 'student';
      
      // Return user data
      return {
        id: 1, // This would come from the API in a real implementation
        username: data.username,
        role: role, // This should come from the backend
        name: result.name || "User", // This should come from the backend
        email: data.username,
        active: true
      };
    } else {
      throw new Error(result.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    
    // For testing/demo purposes, we'll still handle direct URL access
    // Remove this in production when backend is fully integrated
    const path = window.location.pathname;
    let role = "student";
    
    if (path.includes('/admin')) {
      role = "admin";
    } else if (path.includes('/librarian')) {
      role = "librarian";
    } else if (path.includes('/student')) {
      role = "student";
    } else if (data.username.includes("admin")) {
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
  }
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