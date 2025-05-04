import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles,
}: {
  path: string;
  component: () => React.JSX.Element;
  allowedRoles?: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Special case for direct URL access
  // If trying to access a role-specific URL, we'll allow it directly
  // This is for demo/testing purposes
  if (!user) {
    // Check if trying to access a role-specific route
    if (path.includes('/admin') || path.includes('/librarian') || path.includes('/student')) {
      // For direct role access, we'll just render the component
      // In a real app, you would redirect to login
      return <Route path={path} component={Component} />;
    }
    
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if user role is allowed to access this route
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Special case for direct URL access
    // If trying to access a role URL directly, use that role instead
    if (path === '/admin' || path === '/librarian' || path === '/student') {
      // For direct role access, we'll allow it
      return <Route path={path} component={Component} />;
    }
    
    return (
      <Route path={path}>
        <Redirect to="/unauthorized" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
