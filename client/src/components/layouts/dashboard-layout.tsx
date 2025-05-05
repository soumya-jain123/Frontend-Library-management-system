import { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { motion } from "framer-motion";
import LibraryLogo from "@/assets/svg/library-logo";
import {
  Menu,
  Search,
  Bell,
  Home,
  BookOpen,
  Users,
  BarChart3,
  CircleHelp,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  BookPlus,
  RotateCcw,
  UserCheck,
  Clock,
  PlusCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [location] = useLocation();
  const isMobile = useMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Close mobile sidebar when navigating
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  // Nav items based on user role
  const getNavItems = () => {
    // Determine the dashboard URL based on user role
    const dashboardUrl = user?.role === "admin" 
      ? "/admin" 
      : user?.role === "librarian" 
        ? "/librarian" 
        : "/student";
    
    const commonItems = [
      { label: "Dashboard", icon: <Home className="h-4 w-4 mr-3" />, href: dashboardUrl },
      { label: "Profile", icon: <User className="h-4 w-4 mr-3" />, href: "/profile" },
      { label: "Settings", icon: <Settings className="h-4 w-4 mr-3" />, href: "/settings" },
    ];

    if (user?.role === "admin") {
      return [
        ...commonItems,
        { label: "Manage Librarians", icon: <Users className="h-4 w-4 mr-3" />, href: "/admin/librarians" },
        { label: "Manage Users", icon: <UserCheck className="h-4 w-4 mr-3" />, href: "/librarian/manage-users" },
        { label: "Reports", icon: <BarChart3 className="h-4 w-4 mr-3" />, href: "/admin/reports" },
      ];
    } else if (user?.role === "librarian") {
      return [
        ...commonItems,
        { label: "Manage Books", icon: <BookOpen className="h-4 w-4 mr-3" />, href: "/librarian/books" },
        { label: "Issue Books", icon: <BookPlus className="h-4 w-4 mr-3" />, href: "/librarian/issue" },
        { label: "Return Books", icon: <RotateCcw className="h-4 w-4 mr-3" />, href: "/librarian/return" },
        { label: "Manage Users", icon: <UserCheck className="h-4 w-4 mr-3" />, href: "/librarian/manage-users" },
      ];
    } else {
      return [
        ...commonItems,
        { label: "Borrow Books", icon: <BookOpen className="h-4 w-4 mr-3" />, href: "/student/borrow" },
        { label: "Return Books", icon: <RotateCcw className="h-4 w-4 mr-3" />, href: "/student/return" },
        { label: "Borrowing and Renewal", icon: <Clock className="h-4 w-4 mr-3" />, href: "/student/status" },
        { label: "Request Books", icon: <PlusCircle className="h-4 w-4 mr-3" />, href: "/student/request" },
      ];
    }
  };

  // Get mobile navigation items
  const getMobileNavItems = () => {
    // Determine the dashboard URL based on user role
    const dashboardUrl = user?.role === "admin" 
      ? "/admin" 
      : user?.role === "librarian" 
        ? "/librarian" 
        : "/student";
        
    if (user?.role === "admin") {
      return [
        { label: "Home", icon: <Home className="h-5 w-5" />, href: dashboardUrl },
        { label: "Librarians", icon: <Users className="h-5 w-5" />, href: "/admin/librarians" },
        { label: "Reports", icon: <BarChart3 className="h-5 w-5" />, href: "/admin/reports" },
        { label: "Profile", icon: <User className="h-5 w-5" />, href: "/profile" },
      ];
    } else if (user?.role === "librarian") {
      return [
        { label: "Home", icon: <Home className="h-5 w-5" />, href: dashboardUrl },
        { label: "Books", icon: <BookOpen className="h-5 w-5" />, href: "/librarian/books" },
        { label: "Issue", icon: <BookPlus className="h-5 w-5" />, href: "/librarian/issue" },
        { label: "Return", icon: <RotateCcw className="h-5 w-5" />, href: "/librarian/return" },
        { label: "Profile", icon: <User className="h-5 w-5" />, href: "/profile" },
      ];
    } else {
      return [
        { label: "Home", icon: <Home className="h-5 w-5" />, href: dashboardUrl },
        { label: "Borrow", icon: <BookOpen className="h-5 w-5" />, href: "/student/borrow" },
        { label: "Return", icon: <RotateCcw className="h-5 w-5" />, href: "/student/return" },
        { label: "Status", icon: <Clock className="h-5 w-5" />, href: "/student/status" },
        { label: "Profile", icon: <User className="h-5 w-5" />, href: "/profile" },
      ];
    }
  };

  const navItems = getNavItems();
  const mobileNavItems = getMobileNavItems();

  return (
    <div className="min-h-screen flex bg-white text-slate-900 dark:bg-gray-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-primary-50 dark:bg-gray-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center">
          <Button variant="ghost" size="icon" className="mr-2">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <span className="bg-primary-500 dark:bg-primary-500 text-white font-bold px-2 py-1 rounded text-xs">LOGO</span>
            <h1 className="text-md font-bold">Dashboard</h1>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-6">
            {/* Main Navigation */}
            <div>
              <div className="mt-2 space-y-1">
                {navItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      location === item.href 
                        ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400" 
                        : "text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Help & Support */}
            <div>
              <p className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Support
              </p>
              <div className="mt-2 space-y-1">
                <a 
                  href="#" 
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                >
                  <CircleHelp className="h-4 w-4 mr-3" />
                  Help & Documentation
                </a>
                <button 
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-gray-700 w-full text-left"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary-500 dark:bg-primary-800 text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
      
      <div className="flex-1 overflow-auto">
        {/* Top Navigation Bar */}
        <header className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center md:hidden">
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 bg-primary-50 dark:bg-gray-800">
                  <div className="flex items-center space-x-2 mb-8">
                    <span className="bg-primary-500 dark:bg-primary-500 text-white font-bold px-2 py-1 rounded text-xs">LOGO</span>
                    <h1 className="text-md font-bold">Dashboard</h1>
                  </div>
                  
                  <nav className="space-y-6">
                    {navItems.map(item => (
                      <Link 
                        key={item.href} 
                        href={item.href}
                        className={cn(
                          "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                          location === item.href 
                            ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400" 
                            : "text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-gray-700"
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    ))}
                    
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-gray-700 w-full text-left"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
              <div className="flex items-center space-x-2 ml-3">
                <span className="bg-primary-500 dark:bg-primary-500 text-white font-bold px-2 py-1 rounded text-xs">LOGO</span>
                <h1 className="text-md font-bold">Dashboard</h1>
              </div>
            </div>
            
            <div className="flex-1 max-w-md mx-auto px-4 md:px-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="block w-full pl-10 pr-3 py-2 rounded-full bg-slate-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-gray-500 dark:text-gray-400"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              
              <Button variant="ghost" size="icon" className="relative text-gray-500 dark:text-gray-400">
                <Bell className="h-5 w-5" />
              </Button>
              
              <div className="hidden md:block">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary-500 dark:bg-primary-800 text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="px-4 py-6 sm:px-6 lg:px-8 pb-16 md:pb-6 bg-white dark:bg-gray-900">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-around">
            {mobileNavItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex flex-col items-center p-3",
                  location === item.href 
                    ? "text-primary-600 dark:text-primary-400" 
                    : "text-slate-600 dark:text-slate-400"
                )}
              >
                <div className="relative">
                  {item.icon}
                </div>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
