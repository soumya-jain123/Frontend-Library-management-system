import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Users, BookOpen, BarChart3, Layers,
  AlertOctagon, CheckCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import StatsCard from "@/components/stats/stats-card";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch librarians count
  const { data: librarians } = useQuery({
    queryKey: ["/admin/get-user-by-role/LIBRARIAN"],
    // enabled: !!user && user.role.toLowerCase() === "admin",
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authorization token found");
  
      const response = await fetch("http://127.0.0.1:8080/admin/get-user-by-role/LIBRARIAN", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
  
      if (!response.ok || data.statusCode !== 200) {
        throw new Error(data.message || "Failed to fetch librarians");
      }
  
      return data.userList;
    },
  });

  // // Fetch students count
  // const { data: students } = useQuery({
  //   queryKey: ["/api/users/student"],
  //   enabled: !!user && user.role === "admin"
  // });

  const { data: students } = useQuery({
    queryKey: ["/admin/get-user-by-role/USER"],
    // enabled: !!user && user.role.toLowerCase() === "admin",
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authorization token found");
  
      const response = await fetch("http://127.0.0.1:8080/admin/get-user-by-role/USER", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
  
      if (!response.ok || data.statusCode !== 200) {
        throw new Error(data.message || "Failed to fetch librarians");
      }
  
      return data.userList;
    },
  });


  // Fetch total fines for current month
  // const currentDate = new Date();
  // const { data: fineData } = useQuery({
  //   queryKey: [`/api/reports/fines/month/${currentDate.getMonth()}/${currentDate.getFullYear()}`],
  //   enabled: !!user && user.role === "admin"
  // });

  const { data: fineData } = useQuery({
    queryKey: ["/admin/total-fine"],
    // enabled: !!user && user.role === "admin",
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authorization token found");
  
      const response = await fetch("http://127.0.0.1:8080/admin/total-fine", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      return data;
    },
  });

  // Fetch book requests
  const { data: bookRequests } = useQuery({
    queryKey: ["/api/book-requests"],
    enabled: !!user && user.role === "admin"
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Welcome back, {user?.name}! Here's an overview of the library system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard 
          title="Total Librarians"
          value={librarians?.length || 0}
          icon={<Users className="h-5 w-5" />}
          description="Active staff members"
          className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        
        <StatsCard 
          title="Total Users"
          value={students?.length || 0}
          icon={<Users className="h-5 w-5" />}
          description="Registered users"
          className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
        />
        
        <StatsCard 
          title="Monthly Fines"
          value={`Rs. ${fineData || 0}`}
          icon={<BarChart3 className="h-5 w-5" />}
          description="Revenue from fines"
          className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 mb-4">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/admin/librarians" className="w-full">
                    <div className="h-24 flex flex-col items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 w-full">
                      <Users className="h-5 w-5" />
                      <span>Manage Librarians</span>
                    </div>
                  </Link>
                  <Link href="/admin/reports" className="w-full">
                    <div className="h-24 flex flex-col items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 w-full">
                      <BarChart3 className="h-5 w-5" />
                      <span>View Reports</span>
                    </div>
                  </Link>
                  <Link href="/admin/reports?tab=fines" className="w-full">
                    <div className="h-24 flex flex-col items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 w-full">
                      <AlertOctagon className="h-5 w-5" />
                      <span>Fine Management</span>
                    </div>
                  </Link>
                  <Link href="/settings" className="w-full">
                    <div className="h-24 flex flex-col items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 w-full">
                      <CheckCircle className="h-5 w-5" />
                      <span>Approve Requests</span>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">System Health</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database Status</span>
                    <span className="text-sm flex items-center text-green-500">
                      <CheckCircle className="h-4 w-4 mr-1" /> Operational
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Users</span>
                    <span className="text-sm">{(students?.length || 0) + (librarians?.length || 0) + 1} Users</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Book Requests</span>
                    <span className="text-sm">{bookRequests?.filter(r => r.status === "pending").length || 0} Requests</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">System Uptime</span>
                    <span className="text-sm">24 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <Link href="/admin/activity" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">New book added: "Advanced Programming Techniques"</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Added by Librarian Jane - 2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">New student registered: Sarah Johnson</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Student ID: S12345 - Yesterday</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                  <AlertOctagon className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">Fine collected: Rs. 12.50</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">From Student Michael - 3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AdminDashboard;
