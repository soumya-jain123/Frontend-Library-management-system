import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, BookPlus, RotateCcw, UserCheck,
  Clock, AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import StatsCard from "@/components/stats/stats-card";
import BookTable from "@/components/book/book-table";
import NotificationList from "@/components/notification/notification-list";

const LibrarianDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch all books
  const { data: books } = useQuery({
    queryKey: ["/api/books"],
    enabled: !!user && user.role === "librarian"
  });

  // Fetch active borrowings
  const { data: activeBorrowings } = useQuery({
    queryKey: ["/api/borrowings/active"],
    enabled: !!user && user.role === "librarian"
  });

  // Fetch overdue borrowings
  const { data: overdueBorrowings } = useQuery({
    queryKey: ["/api/borrowings/overdue"],
    enabled: !!user && user.role === "librarian"
  });

  // Fetch book requests
  const { data: bookRequests } = useQuery({
    queryKey: ["/api/book-requests"],
    enabled: !!user && user.role === "librarian"
  });

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Librarian Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Welcome back, {user?.name}! Here's an overview of library activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Books"
          value={books?.length || 0}
          icon={<BookOpen className="h-5 w-5" />}
          description="In the library collection"
          className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        
        <StatsCard 
          title="Books Borrowed"
          value={activeBorrowings?.length || 0}
          icon={<BookPlus className="h-5 w-5" />}
          description="Currently checked out"
          className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
        />
        
        <StatsCard 
          title="Overdue Books"
          value={overdueBorrowings?.length || 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          description="Past the due date"
          className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        />
        
        <StatsCard 
          title="Book Requests"
          value={bookRequests?.filter(r => r.status === "pending").length || 0}
          icon={<Clock className="h-5 w-5" />}
          description="Pending approvals"
          className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="overview">Quick Actions</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/librarian/books" className="w-full">
                    <div className="h-24 flex flex-col items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 w-full">
                      <BookOpen className="h-5 w-5" />
                      <span>Manage Books</span>
                    </div>
                  </Link>
                  <Link href="/librarian/issue" className="w-full">
                    <div className="h-24 flex flex-col items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 w-full">
                      <BookPlus className="h-5 w-5" />
                      <span>Issue Books</span>
                    </div>
                  </Link>
                  <Link href="/librarian/return" className="w-full">
                    <div className="h-24 flex flex-col items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 w-full">
                      <RotateCcw className="h-5 w-5" />
                      <span>Return Books</span>
                    </div>
                  </Link>
                  <Link href="/librarian/manage-users" className="w-full">
                    <div className="h-24 flex flex-col items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 w-full">
                      <UserCheck className="h-5 w-5" />
                      <span>Manage Users</span>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Overdue Books</h3>
                  <Link href="/librarian/return" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3">
                    View All
                  </Link>
                </div>
                <div className="space-y-4">
                  {overdueBorrowings?.slice(0, 3).map((borrowing) => (
                    <div key={borrowing.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-medium">{borrowing.book?.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Borrowed by: {borrowing.user?.name} • 
                          Due: {new Date(borrowing.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {(!overdueBorrowings || overdueBorrowings.length === 0) && (
                    <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
                      No overdue books at the moment
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Book Requests</h3>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="space-y-4">
                {bookRequests?.filter(r => r.status === "pending").slice(0, 3).map((request) => (
                  <div key={request.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                    <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{request.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Requested by: {request.user?.name} •
                        Date: {new Date(request.requestDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-8 text-xs px-2">Approve</Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs px-2 text-destructive">Reject</Button>
                    </div>
                  </div>
                ))}
                
                {(!bookRequests || bookRequests.filter(r => r.status === "pending").length === 0) && (
                  <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
                    No pending book requests
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardContent className="pt-6">
              <NotificationList notifications={notifications || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default LibrarianDashboard;
