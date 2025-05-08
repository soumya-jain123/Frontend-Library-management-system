import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { motion } from "framer-motion";
import { CalendarDays, BookOpen, DollarSign, Library, Users, Loader2 } from "lucide-react";
import { User, Book, Borrowing } from "@shared/schema";
import { get } from "react-hook-form";


// Helper function to get month name
const getMonthName = (monthIndex: number) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex];
};

// Helper to get random color
const getRandomColor = (index: number) => {
  const colors = [
    "#4338ca", "#2563eb", "#0891b2", "#059669", "#65a30d",
    "#ca8a04", "#ea580c", "#dc2626", "#be185d", "#9333ea"
  ];
  return colors[index % colors.length];
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get current date info
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // Fetch users 

  // 2. Fetcher for all users
  async function fetchAllUsers(): Promise<User[]> {
    const res = await fetch(
      "http://127.0.0.1:8080/admin/get-all-users",
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Error ${res.status}: ${txt}`);
    }

    let data = await res.json();
    return data.userList;
  }

  // 3. React-Query hook
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<User[]>({
    queryKey: ["/admin/get-all-users"],
    queryFn: fetchAllUsers,
    retry: 1,
  });
  

  // Fetch books
  const {
    data: totalBooks,
    isLoading: isLoadingTotal,
    error: totalError,
  } = useQuery<number>({
    queryKey: ["/alluser/get-total-books"],
    queryFn: async () => {
      const res = await fetch(
        "http://127.0.0.1:8080/alluser/get-total-books",
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      // console.log("Response:", res);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error ${res.status}: ${text}`);
      }

      return res.json();
    },
    retry: 1,
  });

  // 2. Once you have the total, fetch that many books
  const {
    data: books,
    isLoading: isLoadingBooks,
    error: booksError,
  } = useQuery<Book[]>({
    queryKey: ["/alluser/get-total-books", totalBooks],
    queryFn: () =>
      // const url = `http://127.0.0.1:8080/alluser/get-all-books/${totalBooks}`;
      fetch(
        `http://127.0.0.1:8080/alluser/get-all-books/${totalBooks}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      ).then(res => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json().then((page: { content: Book[] }) => page.content);
      }),
    // enabled: typeof totalBooks === "number" && totalBooks > 0,
  });

  // Fetch active borrowings
  // 1. Auth header helper (re-use across hooks)
  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No auth token found");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // 2. Fetcher for admin’s issued books
  async function fetchAdminIssuedBooks(): Promise<Borrowing[]> {
    const res = await fetch(
      "http://127.0.0.1:8080/admin/get-issued-books",
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Error ${res.status}: ${txt}`);
    }
    return res.json();
  }

  // 3. React-Query hook
  const {
    data: activeBorrowings,
    isLoading: isLoadingBorrowings,
    error: borrowError,
  } = useQuery<Borrowing[]>({
    queryKey: ["/admin/get-issued-books"],  // your existing key
    queryFn: fetchAdminIssuedBooks,         // point it at the admin endpoint
    // no need for `enabled` unless you want to gate by role
    retry: 1,
  });

  // 2. Fetcher for total fines (returns a number)
  async function fetchAllTotalFines(): Promise<number> {
    const res = await fetch(
      "http://127.0.0.1:8080/admin/total-fine",
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Error ${res.status}: ${txt}`);
    }
    // BigDecimal serializes to JSON number
    return res.json();
  }
  
  // 3. React-Query hook
  const {
    data: allTotalFines,
    isLoading: isLoadingFines,
    error: finesError,
  } = useQuery<number>({
    queryKey: ["adminAllTotalFines"],
    queryFn: fetchAllTotalFines,
    retry: 1,
  });

  
  // Fetch monthly fines for the current year
  const { data: currentMonthFines } = useQuery<{ totalFines: number }>({
    queryKey: [`/api/reports/fines/month/${currentMonth}/${currentYear}`],
  });
  
  // Generate monthly fines data for chart
  const monthlyFinesData = Array.from({ length: 12 }, (_, i) => ({
    month: getMonthName(i),
    fines: Math.floor(Math.random() * 100) + 20, // Simulated data
  }));
  
  // Prepare user role data for pie chart
  const userRoleData = users ? [
    { name: "User", value: users.filter(user => user.role === "USER").length },
    { name: "Librarians", value: users.filter(user => user.role === "LIBRARIAN").length },
    { name: "Admins", value: users.filter(user => user.role === "ADMIN").length }
  ] : [];
  
  // Prepare book category data
// Assuming `books` is your array of book objects
const bookGenreData = books
  ? Array.from(
      books.reduce((acc, book) => {
        book.genres
          .split(",")
          .map(g => g.trim())
          .forEach(genre => {
            acc.set(genre, (acc.get(genre) || 0) + 1);
          });
        return acc;
      }, new Map<string, number>())
    ).map(([name, value]) => ({ name, value }))
  : [];

  // Now `bookGenreData` is an array like:
  // [ { name: "History", value: 5 }, { name: "Nonfiction", value: 8 }, … ]
  console.log(bookGenreData);

    // Book borrowing by month (simulated data)
    const borrowingByMonthData = Array.from({ length: 12 }, (_, i) => ({
      month: getMonthName(i),
      borrowings: Math.floor(Math.random() * 50) + 10,
      returns: Math.floor(Math.random() * 40) + 5,
    }));
  // Loading state
  const isLoading = isLoadingUsers || isLoadingBooks || isLoadingBorrowings;
  
  const calculateTotalFines = () => {
    return allTotalFines || 0;
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            View system reports and analytics
          </p>
        </div>
        
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Total Books
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {books?.length || 0}
                      </p>
                    </div>
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 text-blue-600 dark:text-blue-400">
                      <BookOpen className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Active Users
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {users?.filter(u => u.enabled).length || 0}
                      </p>
                    </div>
                    <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 text-green-600 dark:text-green-400">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Current Borrowings
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {activeBorrowings?.length || 0}
                      </p>
                    </div>
                    <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3 text-purple-600 dark:text-purple-400">
                      <Library className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Monthly Fines
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        Rs. {calculateTotalFines()}
                      </p>
                    </div>
                    <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-3 text-amber-600 dark:text-amber-400">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-1 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {/* <TabsTrigger value="fines">Fine Reports</TabsTrigger>
                <TabsTrigger value="activities">Activity Reports</TabsTrigger> */}
              </TabsList>
              
              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle>User Distribution</CardTitle>
                        <CardDescription>
                          Breakdown of users by role
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={userRoleData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {userRoleData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={getRandomColor(index)} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle>Book Categories</CardTitle>
                        <CardDescription>
                          Distribution of books by category
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bookGenreData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="value" name="Books" fill="#4338ca">
                                {bookGenreData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={getRandomColor(index)} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </TabsContent>
              
              {/* <TabsContent value="fines">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Fine Collection</CardTitle>
                      <CardDescription>
                        Fine collection trend over the past year
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyFinesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`$${value}`, 'Fines Collected']} />
                            <Legend />
                            <Bar dataKey="fines" name="Fines Collected ($)" fill="#4338ca" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Top Fine Payers</CardTitle>
                    <CardDescription>
                      Students with highest fines paid this month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Books Returned Late</TableHead>
                          <TableHead className="text-right">Fine Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Sarah Johnson</TableCell>
                          <TableCell>3</TableCell>
                          <TableCell className="text-right">$12.50</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Michael Brown</TableCell>
                          <TableCell>2</TableCell>
                          <TableCell className="text-right">$8.00</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Jessica Williams</TableCell>
                          <TableCell>1</TableCell>
                          <TableCell className="text-right">$5.00</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent> */}
              
              {/* <TabsContent value="activities">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Book Borrowing Activity</CardTitle>
                      <CardDescription>
                        Borrowing and return activity over the past year
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={borrowingByMonthData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="borrowings" 
                              name="Books Borrowed" 
                              stroke="#4338ca" 
                              activeDot={{ r: 8 }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="returns" 
                              name="Books Returned" 
                              stroke="#10b981" 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Most Popular Books</CardTitle>
                    <CardDescription>
                      Most frequently borrowed books
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Book Title</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Times Borrowed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {books?.slice(0, 5).map((book, index) => (
                          <TableRow key={book.id}>
                            <TableCell className="font-medium">{book.title}</TableCell>
                            <TableCell>{book.author}</TableCell>
                            <TableCell>{book.category}</TableCell>
                            <TableCell className="text-right">{20 - index * 3}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent> */}
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
