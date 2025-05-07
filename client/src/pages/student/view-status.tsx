import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  BookOpen, Clock, RotateCcw, CheckCircle, AlertTriangle, 
  DollarSign, History, Loader2, CalendarClock 
} from "lucide-react";
import { Borrowing, BookRequest, HoldRequest } from "@shared/schema";

const ViewStatus = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("current");

  // Fetch user's borrowings
// 1. Helper to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No auth token found");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // 2. Fetch function for borrow history
  const fetchBorrowHistory = async (): Promise<Borrowing[]> => {
    const res = await fetch(
      "http://127.0.0.1:8080/user/get-borrow-history",
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }
    return res.json();
  };

  // 3. React Query hook
  const {
    data: borrowings,
    isLoading: isLoadingBorrowings,
    error: borrowError,
  } = useQuery<Borrowing[]>({
    queryKey: ["/user/get-borrow-history"],   // unique cache key
    queryFn: fetchBorrowHistory,        // fetch function
    enabled: Boolean(localStorage.getItem("authToken")), // only run if authed
    retry: 1,                           // optional: retry once on failure
  });

  // Fetch user's book requests
  const { data: bookRequests, isLoading: isLoadingRequests } = useQuery<BookRequest[]>({
    queryKey: ["/api/book-requests/user"],
    enabled: !!user,
  });

  // Fetch user's hold requests
  const { data: holdRequests, isLoading: isLoadingHolds } = useQuery<HoldRequest[]>({
    queryKey: ["/api/hold-requests/user"],
    enabled: !!user,
  });

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

  console.log("Total fine:", totalFine);
  
  // Fetch fine report
  const { data: fineReport } = useQuery<{ userId: number; totalFines: number }>({
    queryKey: [`/api/reports/fines/user/${user?.id}`],
    enabled: !!user,
  });

  // Process borrowings
  const currentBorrowings = borrowings?.filter(b => !b.returnDate) || [];
  const pastBorrowings = borrowings?.filter(b => b.returnDate) || [];
  
  // Check for overdue items
  const overdueBorrowings = currentBorrowings.filter(b => new Date(b.dueDate) < new Date());
  
  // Get the nearest due date
  const getDaysUntilDue = (dueDate: string): number => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const upcomingDue = currentBorrowings
    .filter(b => new Date(b.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  
  const daysUntilDue = upcomingDue ? getDaysUntilDue(upcomingDue.dueDate) : 0;

  // Processing Requests
  const pendingRequests = [
    ...(bookRequests?.filter(r => r.status === "pending") || []), 
    ...(holdRequests?.filter(r => r.status === "pending") || [])
  ];

  const approvedRequests = [
    ...(bookRequests?.filter(r => r.status === "approved") || []), 
    ...(holdRequests?.filter(r => r.status === "approved") || [])
  ];

  // Check loading state
  const isLoading = isLoadingBorrowings || isLoadingRequests || isLoadingHolds;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Borrowing & Renewal
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Track your current borrowings, requests, and library account status
          </p>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Books Borrowed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">{currentBorrowings.length}</div>
                      <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {currentBorrowings.length === 0 
                        ? "You don't have any books borrowed" 
                        : `You have ${currentBorrowings.length} ${currentBorrowings.length === 1 ? "book" : "books"} currently checked out`}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    {currentBorrowings.length > 0 && (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href="/User/return">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Return Books
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>

              {/* <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Upcoming Due Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingDue ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="text-3xl font-bold">{daysUntilDue} days</div>
                          <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                            <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Today</span>
                            <span>Due: {new Date(upcomingDue.dueDate).toLocaleDateString()}</span>
                          </div>
                          <Progress 
                            value={100 - (daysUntilDue / 14) * 100} 
                            className="h-2" 
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="text-xl font-medium">No upcoming due dates</div>
                          <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                      </>
                    )}
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {upcomingDue
                        ? `"${upcomingDue.book?.title}" is due soon`
                        : "You don't have any books due soon"}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    {upcomingDue && (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href="/User/return">
                          <CalendarClock className="h-4 w-4 mr-2" />
                          Manage Due Dates
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div> */}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Fines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">Rs. {totalFine || "0.00"}</div>
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        totalFine > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30"
                      }`}>
                        {fineReport?.totalFines ? (
                          <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
                        ) : (
                          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {totalFine > 0
                        ? "You have outstanding fines to pay"
                        : "You don't have any outstanding fines"}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    {totalFine > 0 && (
                      <Button variant="outline" size="sm" className="w-full">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Pay Fines
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="current">Current Borrowings</TabsTrigger>
                <TabsTrigger value="history">Borrowing History</TabsTrigger>
                <TabsTrigger value="requests">Renew Books</TabsTrigger>
              </TabsList>

              <TabsContent value="current">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Currently Borrowed Books</CardTitle>
                      <CardDescription>
                        Books you currently have checked out from the library
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentBorrowings.length === 0 ? (
                        <div className="text-center py-6">
                          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold">No books currently borrowed</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            You don't have any books checked out at the moment
                          </p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            asChild
                          >
                            <Link href="/Student/borrow">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Browse Books
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {currentBorrowings.map((borrowing) => (
                            <div 
                              key={borrowing.isbn} 
                              className={`p-4 border rounded-lg ${
                                new Date(borrowing.dueDate) < new Date()
                                  ? "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20"
                                  : "border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                                  <BookOpen className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <div>
                                      <h3 className="font-semibold">{borrowing.isbn}</h3>
                                      <p className="text-sm text-slate-600 dark:text-slate-400">
                                        {borrowing.issueDate}
                                      </p>
                                    </div>
                                    {new Date(borrowing.dueDate) < new Date() ? (
                                      <Badge variant="destructive">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Overdue
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Due Soon
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span>Borrowed: {new Date(borrowing.issueDate).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className={new Date(borrowing.dueDate) < new Date() ? "text-red-500 font-medium" : ""}>
                                      Due: {new Date(borrowing.dueDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="mt-3 flex justify-end gap-2">
                                    <Button size="sm" variant="outline">
                                      <History className="h-3 w-3 mr-2" />
                                      Renew
                                    </Button>
                                    <Button size="sm" variant="outline" asChild>
                                      <Link href="/User/return">
                                        <RotateCcw className="h-3 w-3 mr-2" />
                                        Return
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="border-t bg-slate-50 dark:bg-slate-800/50">
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {overdueBorrowings.length > 0 ? (
                          <div className="flex items-center text-red-500">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            You have {overdueBorrowings.length} overdue {overdueBorrowings.length === 1 ? "book" : "books"}
                          </div>
                        ) : currentBorrowings.length > 0 ? (
                          <div className="flex items-center text-slate-600 dark:text-slate-400">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            All books are within their due dates
                          </div>
                        ) : null}
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>Borrowing History</CardTitle>
                    <CardDescription>
                      Books you have previously borrowed and returned
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pastBorrowings.length === 0 ? (
                      <div className="text-center py-6">
                        <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">No borrowing history</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          You haven't borrowed any books in the past
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pastBorrowings.map((borrowing) => (
                          <div 
                            key={borrowing.isbn} 
                            className="p-4 border rounded-lg border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400">
                                <BookOpen className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <div>
                                    <h3 className="font-semibold">{borrowing.isbn}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      {borrowing.returnDate ? "Returned" : "Borrowed"}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Returned
                                  </Badge>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                                  <span>Borrowed: {new Date(borrowing.borrowDate).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>Returned: {borrowing.returnDate ? new Date(borrowing.returnDate).toLocaleDateString() : "N/A"}</span>
                                  {borrowing.fine > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-red-500">Fine: ${borrowing.fine.toFixed(2)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requests">
                <Card>
                  <CardHeader>
                    <CardTitle>Renew Books</CardTitle>
                    <CardDescription>
                      Renew your books before they expire
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingRequests.length === 0 && approvedRequests.length === 0 ? (
                      <div className="text-center py-6">
                        <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold">No active requests</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          You don't have any pending or approved book requests
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          asChild
                        >
                          <Link href="/User/request">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Request Books
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {pendingRequests.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-3">Pending Requests</h3>
                            <div className="space-y-3">
                              {pendingRequests.map((request, index) => (
                                <div 
                                  key={index} 
                                  className="p-3 border rounded-lg border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium">
                                        {"title" in request ? request.title : request.book?.title}
                                      </div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {"author" in request ? `By: ${request.author || "Unknown"}` : ""}
                                        <div className="mt-1">
                                          Requested: {new Date(request.requestDate).toLocaleDateString()}
                                        </div>
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Pending
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {approvedRequests.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-3">Approved Requests</h3>
                            <div className="space-y-3">
                              {approvedRequests.map((request, index) => (
                                <div 
                                  key={index} 
                                  className="p-3 border rounded-lg border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium">
                                        {"title" in request ? request.title : request.book?.title}
                                      </div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {"author" in request ? `By: ${request.author || "Unknown"}` : ""}
                                        <div className="mt-1">
                                          Approved: {request.approvedBy ? "Yes" : "No"}
                                        </div>
                                        {"expiryDate" in request && (
                                          <div>
                                            Hold until: {new Date(request.expiryDate).toLocaleDateString()}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Approved
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewStatus;
