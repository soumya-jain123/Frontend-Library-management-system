import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-900 p-4">
      <AlertTriangle className="h-20 w-20 text-red-500 mb-6" />
      
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Unauthorized Access
      </h1>
      
      <p className="text-slate-600 dark:text-slate-400 mb-6 text-center max-w-md">
        You do not have permission to access this page. Please contact an administrator if you believe this is an error.
      </p>
      
      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link href="/">Go to Home</Link>
        </Button>
        <Button asChild>
          <Link href="/auth">Return to Login</Link>
        </Button>
      </div>
    </div>
  );
};

export default UnauthorizedPage; 