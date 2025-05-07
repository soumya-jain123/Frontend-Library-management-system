import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, RotateCcw, Clock, Search,
  AlertTriangle, CheckCircle, PlusCircle, BookOpenCheck 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import StatsCard from "@/components/stats/stats-card";
import BookCard from "@/components/book/book-card";
import NotificationList from "@/components/notification/notification-list";

const UserDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch User's borrowings

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No auth token found");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const { data: borrowings } = useQuery({
    queryKey: [`/user/get-borrowed-books`],
    // enabled: !!user
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No token found in localStorage");
      }
  
      const response = await fetch('http://127.0.0.1:8080/user/get-borrowed-books', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });


      const data = await response.json();
      return data; // Assuming the response contains the list of books
    },
  });

  console.log("Borrowings:", borrowings);

  // Fetch book requests
  const { data: bookRequests } = useQuery({
    queryKey: ["/api/book-requests/user"],
    enabled: !!user
  });

  // Fetch hold requests
  const { data: holdRequests } = useQuery({
    queryKey: ["/api/hold-requests/user"],
    enabled: !!user
  });

  // Fetch popular books
  const { data: books } = useQuery({
    queryKey: ["/api/books"],
    enabled: !!user
  });

  // Fetch fines

  async function fetchTotalFine(): Promise<number> {
    const res = await fetch(
      "http://127.0.0.1:8080/user/total-fine",
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }
    // Spring serializes BigDecimal to a JSON number
    return res.json();
  }

  const {
    data: totalFine,
    isLoading: isLoadingFine,
    error: fineError,
  } = useQuery<number>({
    queryKey: ["/user/total-fine"],
    queryFn: fetchTotalFine,
    enabled: Boolean(localStorage.getItem("authToken")),
    retry: 1,
  });

  const { data: fines } = useQuery({
    queryKey: [`/api/reports/fines/user/${user?.id}`],
    enabled: !!user
  });

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user
  });

  // Calculate number of overdue books
  const overdueBooks = borrowings?.filter(
    borrowing => new Date(borrowing.dueDate) < new Date() && !borrowing.returnDate
  ).length || 0;

  // Get popular books (just a subset for display)
  const popularBooks = books?.slice(0, 4) || [];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Welcome Back !!!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        <StatsCard 
          title="Books Borrowed"
          value={borrowings?.filter(b => !b.returnDate).length || 0}
          icon={<BookOpen className="h-5 w-5" />}
          description="Currently borrowed"
          className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
       
        <StatsCard 
          title="Outstanding Fines"
          value={`Rs. ${totalFine || 0}`}
          icon={totalFine === 0 ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          description={totalFine === 0 ? "No pending fines" : "Please pay soon"}
          className={totalFine === 0
            ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          }
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="overview">Quick Actions</TabsTrigger>
          <TabsTrigger value="books">My Books</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/student/borrow" className="w-full">
                    <div className="h-24 flex flex-col items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 w-full">
                      <BookOpen className="h-5 w-5" />
                      <span>Borrow Books</span>
                    </div>
                  </Link>
                  <Link href="/student/return" className="w-full">
                    <div className="h-24 flex flex-col items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 w-full">
                      <RotateCcw className="h-5 w-5" />
                      <span>Return Books</span>
                    </div>
                  </Link>
                  <Link href="/student/status" className="w-full col-span-2">
                    <div className="h-24 flex flex-col items-center justify-center gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 w-full">
                      <BookOpenCheck className="h-5 w-10" />
                      <span>Borrowing & Renewal</span>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Current Borrowings</h3>
                  <Link href="/student/status" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3">
                    View All
                  </Link>
                </div>
                <div className="space-y-4">
                  {borrowings?.filter(b => !b.returnDate).slice(0, 3).map(
                    (borrowing) => (
                    <div key={borrowing.isbn} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                      <BookOpen className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-medium">{borrowing.isbn}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Due: {new Date(borrowing.dueDate).toLocaleDateString()} • 
                          {new Date(borrowing.dueDate) < new Date() 
                            ? <span className="text-red-500 ml-1">Overdue</span> 
                            : ""
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {(!borrowings || borrowings.filter(b => !b.returnDate).length === 0) && (
                    <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
                      You haven't borrowed any books yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Popular Books</h3>
                <Link href="/student/borrow" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3">
                  Browse All
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {popularBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
                
                {popularBooks.length === 0 && (
                  <div className="col-span-4 text-center py-6 text-sm text-slate-500 dark:text-slate-400">
                    No books available at the moment
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="books">
          <Card>
            <CardContent className="pt-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search your borrowed books..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold mb-3">Currently Borrowed</h3>
                {borrowings?.filter(b => !b.returnDate).map((borrowing) => (
                  <div key={borrowing.id} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
                    <div className="h-12 w-12 bg-primary/10 rounded-md flex items-center justify-center text-primary">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{borrowing.isbn}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{borrowing.issueDate}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs">
                          Due: {new Date(borrowing.dueDate).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          {/* <Button size="sm" variant="outline" className="h-7 text-xs">Renew</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs">Return</Button> */}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!borrowings || borrowings.filter(b => !b.returnDate).length === 0) && (
                  <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
                    You haven't borrowed any books yet
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

export default UserDashboard;
