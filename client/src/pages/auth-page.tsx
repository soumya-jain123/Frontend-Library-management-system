import { useState, useEffect } from "react";
import { useAuth, LoginData, RegisterData, loginSchema, registerSchema } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect, Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LibraryLogo from "@/assets/svg/library-logo";
import { BookOpen, Sun, Moon, User, Key, UserPlus, Mail } from "lucide-react";

const API_BASE_URL = "http://localhost:8080";

const AuthPage = () => {
  const { user, loginMutation, registerMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Create separate forms for login and registration
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "student",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "student",
      name: "",
      email: "",
    },
  });

  // Handle form submissions
  const handleLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  // const handleLogin = async (data: LoginData) => {

  // //   try {
  // //     const response = await fetch(`${API_BASE_URL}/auth/login`, {
  // //       method: "POST", // Changed to POST
  // //       headers: {
  // //         "Content-Type": "application/json",
  // //       },
  // //       body: JSON.stringify({
  // //         email: data.username,
  // //         password: data.password,
  // //       }),
  // //     });
  
  // //     const result = await response.json();
  
  // //     if (result.statusCode == 200) {
  // //       // Save token or handle authentication success (e.g., save token to localStorage)
  // //       localStorage.setItem("authToken", result.token); // Store the auth token
  // //       localStorage.setItem("refreshToken", result.refreshToken); // Store the refresh token
  // //       localStorage.setItem("userRole", result.role); // Store the user role
  // //       localStorage.setItem("enabled", JSON.stringify(result.enabled));
  // //       // // TODO: WTF is this
  // //       loginMutation.mutate(data);

  // //       // Redirect based on the role returned from backend
  // //       const role = result.role;
  // //       // if (role === "admin") {
  // //       //   window.location.href = "/admin";
  // //       // } else if (role === "librarian") {
  // //       //   window.location.href = "/librarian";
  // //       // } else {
  // //       //   window.location.href = "/student";
  // //       // }

  // //     } else {
  // //       alert(result.message || "Login failed");
  // //     }
  // //   } catch (error) {
  // //     console.error("Login error:", error);
  // //     alert("An error occurred while connecting to the server.");
  // //   }
  // };

  const handleRegister = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  // const handleRegister = async (data: RegisterData) => {
  //   // try {
  //   //   const response = await fetch(`${API_BASE_URL}/auth/register`, {
  //   //     method: "POST", // POST request for registration
  //   //     headers: {
  //   //       "Content-Type": "application/json",
  //   //     },
  //   //     body: JSON.stringify({
  //   //       email: data.email,
  //   //       displayName: data.username,
  //   //       password: data.password,
  //   //       role: data.role,
  //   //     }),
  //   //   });
  
  //   //   const result = await response.json();
  
  //   //   if (result.statusCode == 200) {
  //   //     alert("Registration successful! You can now log in.");
  //   //     setActiveTab("login");
  //   //   } else {
  //   //     alert(result.message || "Registration failed");
  //   //   } 
  //   // } catch (error) {
  //   //   console.error("Registration error:", error);
  //   //   alert("An error occurred while connecting to the server.");
  //   // }
  // };
  

  // If user is already logged in, redirect to home
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900">
      {/* Left side - Auth form */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-2">
              <LibraryLogo className="text-primary-600 dark:text-primary-400" size={48} />
            </div>
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              Smart Library
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Access your library account
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>

            <Tabs
              defaultValue="login"
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "login" | "register")}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: activeTab === "login" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: activeTab === "login" ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <TabsContent value="login" className="space-y-4">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                        {/* <FormField
                          control={loginForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="student">Student</SelectItem>
                                  <SelectItem value="librarian">Librarian</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        /> */}

                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email-ID</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                  <Input className="pl-10" placeholder="Enter your username" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                  <Input
                                    className="pl-10"
                                    type="password"
                                    placeholder="Enter your password"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              id="remember_me"
                              name="remember_me"
                              type="checkbox"
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                            />
                            <label
                              htmlFor="remember_me"
                              className="ml-2 block text-sm text-slate-700 dark:text-slate-300"
                            >
                              Remember me
                            </label>
                          </div>

                          <div className="text-sm">
                            <a
                              href="#"
                              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                            >
                              Forgot password?
                            </a>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Signing in..." : "Sign in"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-4">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="student">Student</SelectItem>
                                  <SelectItem value="librarian">Librarian</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <UserPlus className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                  <Input className="pl-10" placeholder="Enter your full name" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                  <Input className="pl-10" placeholder="Enter your email" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                  <Input className="pl-10" placeholder="Choose a username" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                  <Input
                                    className="pl-10"
                                    type="password"
                                    placeholder="Choose a password"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Creating account..." : "Create account"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black to-red-900 dark:from-black dark:to-red-950 opacity-70 z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')"
          }}
        ></div>
        <div className="relative z-20 flex flex-col justify-center text-white p-12">
          <div className="mb-8">
            <BookOpen className="h-16 w-16 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Smart Library Management System</h2>
          <p className="text-lg text-white/80 mb-6">
            Your complete solution for managing library resources, book borrowing, and student
            interactions efficiently.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Extensive Book Management</h3>
                <p className="text-sm text-white/70">
                  Add, update, and track all your library resources
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Role-Based Access</h3>
                <p className="text-sm text-white/70">
                  Specific features for students, librarians, and administrators
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Smart Notifications</h3>
                <p className="text-sm text-white/70">
                  Stay updated with due dates, fines, and book status
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
