import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
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

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected routes */}
      <ProtectedRoute path="/" component={HomePage} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin/librarians" component={ManageLibrarians} />
      <ProtectedRoute path="/admin/reports" component={Reports} />
      
      {/* Librarian routes */}
      <ProtectedRoute path="/librarian/books" component={ManageBooks} />
      <ProtectedRoute path="/librarian/issue" component={IssueBooks} />
      <ProtectedRoute path="/librarian/return" component={ReturnBooks} />
      <ProtectedRoute path="/librarian/students" component={ManageStudents} />
      
      {/* Student routes */}
      <ProtectedRoute path="/student/borrow" component={BorrowBooks} />
      <ProtectedRoute path="/student/return" component={StudentReturn} />
      <ProtectedRoute path="/student/status" component={ViewStatus} />
      <ProtectedRoute path="/student/request" component={RequestBooks} />
      
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
