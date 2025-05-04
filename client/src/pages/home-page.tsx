import React, { useEffect } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import AdminDashboard from "@/components/dashboard/admin-dashboard";
import LibrarianDashboard from "@/components/dashboard/librarian-dashboard";
import StudentDashboard from "@/components/dashboard/student-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

const HomePage = () => {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to role-specific dashboard URL if user is at root page
    if (user && location === "/") {
      switch (user.role) {
        case "admin":
          setLocation("/admin");
          break;
        case "librarian":
          setLocation("/librarian");
          break;
        case "student":
          setLocation("/student");
          break;
        default:
          // Stay on homepage if role is not recognized
          break;
      }
    }
  }, [user, location, setLocation]);

  // This will render briefly before the redirect happens
  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case "admin":
        return <AdminDashboard />;
      case "librarian":
        return <LibrarianDashboard />;
      case "student":
        return <StudentDashboard />;
      default:
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="flex mb-4 gap-2">
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Role Not Recognized</h1>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Your user role is not recognized by the system. Please contact the administrator for help.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return <DashboardLayout>{renderDashboard()}</DashboardLayout>;
};

export default HomePage;
