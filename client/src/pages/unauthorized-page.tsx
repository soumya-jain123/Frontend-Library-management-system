import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const UnauthorizedPage = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (user) {
      const roleSpecificUrl = user.role === "admin"
        ? "/admin"
        : user.role === "librarian"
          ? "/librarian"
          : "/student";
      setLocation(roleSpecificUrl);
    } else {
      setLocation("/");
    }
  };

  const handleGoLogin = () => {
    setLocation("/auth");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
              Unauthorized Access
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You do not have permission to access this page. Please contact an administrator if you believe this is an error.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleGoHome}>
                Go to Home
              </Button>
              <Button onClick={handleGoLogin}>
                Return to Login
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnauthorizedPage; 