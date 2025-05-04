import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import UnauthorizedPage from "@/pages/unauthorized";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import ManageLibrarians from "@/pages/admin/manage-librarians";
import Reports from "@/pages/admin/reports";
import ManageBooks from "@/pages/librarian/manage-books";
import IssueBooks from "@/pages/librarian/issue-books";
import ReturnBooks from "@/pages/librarian/return-books";
import ManageStudents from "@/pages/librarian/manage-students";
import BorrowBooks from "@/pages/student/borrow-books";
import StudentReturn from "@/pages/student/return-books";
import ViewStatus from "@/pages/student/view-status";
import RequestBooks from "@/pages/student/request-books";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import { ThemeProvider } from "./hooks/use-theme";
import { type PropsWithChildren } from "react";

import DashboardLayout from "@/components/layouts/dashboard-layout";
import AdminDashboard from "@/components/dashboard/admin-dashboard";
import LibrarianDashboard from "@/components/dashboard/librarian-dashboard";
import StudentDashboard from "@/components/dashboard/student-dashboard";

// Create wrapped dashboard components with layout
const WrappedAdminDashboard = () => (
  <DashboardLayout>
    <AdminDashboard />
  </DashboardLayout>
);

const WrappedLibrarianDashboard = () => (
  <DashboardLayout>
    <LibrarianDashboard />
  </DashboardLayout>
);

const WrappedStudentDashboard = () => (
  <DashboardLayout>
    <StudentDashboard />
  </DashboardLayout>
);

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/unauthorized" component={UnauthorizedPage} />
      
      {/* Redirect from root to role-specific dashboard */}
      <ProtectedRoute path="/" component={HomePage} />
      
      {/* Role-specific dashboards */}
      <ProtectedRoute 
        path="/admin" 
        component={WrappedAdminDashboard} 
        allowedRoles={["admin"]} 
      />
      <ProtectedRoute 
        path="/librarian" 
        component={WrappedLibrarianDashboard} 
        allowedRoles={["librarian"]} 
      />
      <ProtectedRoute 
        path="/student" 
        component={WrappedStudentDashboard} 
        allowedRoles={["student"]} 
      />
      
      {/* Admin routes */}
      <ProtectedRoute 
        path="/admin/librarians" 
        component={ManageLibrarians} 
        allowedRoles={["admin"]} 
      />
      <ProtectedRoute 
        path="/admin/reports" 
        component={Reports} 
        allowedRoles={["admin"]} 
      />
      
      {/* Librarian routes */}
      <ProtectedRoute 
        path="/librarian/books" 
        component={ManageBooks} 
        allowedRoles={["admin", "librarian"]} 
      />
      <ProtectedRoute 
        path="/librarian/issue" 
        component={IssueBooks} 
        allowedRoles={["admin", "librarian"]} 
      />
      <ProtectedRoute 
        path="/librarian/return" 
        component={ReturnBooks} 
        allowedRoles={["admin", "librarian"]} 
      />
      <ProtectedRoute 
        path="/librarian/students" 
        component={ManageStudents} 
        allowedRoles={["admin", "librarian"]} 
      />
      
      {/* Student routes */}
      <ProtectedRoute 
        path="/student/borrow" 
        component={BorrowBooks} 
        allowedRoles={["student"]} 
      />
      <ProtectedRoute 
        path="/student/return" 
        component={StudentReturn} 
        allowedRoles={["student"]} 
      />
      <ProtectedRoute 
        path="/student/status" 
        component={ViewStatus} 
        allowedRoles={["student"]} 
      />
      <ProtectedRoute 
        path="/student/request" 
        component={RequestBooks} 
        allowedRoles={["student"]} 
      />
      
      {/* Common routes */}
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/settings" component={Settings} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

const Providers: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="library-theme">
        <AuthProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

function App() {
  return (
    <Providers>
      <Toaster />
      <Router />
    </Providers>
  );
}

export default App;
