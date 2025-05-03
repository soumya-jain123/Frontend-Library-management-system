import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Search, Calendar, BookPlus, UsersRound, Badge, QrCode, Loader2 } from "lucide-react";
import { Book, User } from "@shared/schema";
import QRScanner from "@/components/ui/qr-scanner";

// Schema for issuing a book
const issueBookSchema = z.object({
  bookId: z.number({
    required_error: "Book ID is required",
    invalid_type_error: "Book ID must be a number",
  }),
  userId: z.number({
    required_error: "User ID is required",
    invalid_type_error: "User ID must be a number",
  }),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in format YYYY-MM-DD",
  }),
});

type IssueBookFormValues = z.infer<typeof issueBookSchema>;

const IssueBooks = () => {
  const { toast } = useToast();
  const [bookSearchTerm, setBookSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<"book" | "user">("book");

  // Calculate default due date (14 days from now)
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 14);
  const defaultDueDateStr = defaultDueDate.toISOString().split("T")[0];

  // Form setup
  const form = useForm<IssueBookFormValues>({
    resolver: zodResolver(issueBookSchema),
    defaultValues: {
      bookId: undefined,
      userId: undefined,
      dueDate: defaultDueDateStr,
    },
  });

  // Fetch books based on search term
  const { data: books, isLoading: isLoadingBooks } = useQuery<Book[]>({
    queryKey: ["/api/books/search", bookSearchTerm],
    enabled: bookSearchTerm.length > 0,
  });

  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery<User[]>({
    queryKey: ["/api/users/student"],
    enabled: userSearchTerm.length > 0,
  });

  // Filtered students based on search term
  const filteredStudents = students?.filter(
    (student) =>
      student.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Issue book mutation
  const issueBookMutation = useMutation({
    mutationFn: async (data: IssueBookFormValues) => {
      const res = await apiRequest("POST", "/api/borrowings", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Book issued successfully",
        description: `${selectedBook?.title} has been issued to ${selectedUser?.name} until ${new Date(
          form.getValues().dueDate
        ).toLocaleDateString()}`,
      });
      // Reset form and selected items
      form.reset({
        bookId: undefined,
        userId: undefined,
        dueDate: defaultDueDateStr,
      });
      setSelectedBook(null);
      setSelectedUser(null);
      setBookSearchTerm("");
      setUserSearchTerm("");
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings/active"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to issue book",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: IssueBookFormValues) => {
    issueBookMutation.mutate(data);
  };

  // Handle book selection
  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    form.setValue("bookId", book.id);
    setBookSearchTerm("");
  };

  // Handle user selection
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    form.setValue("userId", user.id);
    setUserSearchTerm("");
  };

  // Handle QR code scanning
  const handleQrScan = (data: string) => {
    try {
      const scannedData = JSON.parse(data);
      
      if (scanTarget === "book" && scannedData.type === "book") {
        const bookId = parseInt(scannedData.id);
        // Fetch the book details
        apiRequest("GET", `/api/books/${bookId}`)
          .then(res => res.json())
          .then(book => {
            setSelectedBook(book);
            form.setValue("bookId", book.id);
          })
          .catch(err => {
            toast({
              title: "Error scanning book",
              description: err.message,
              variant: "destructive",
            });
          });
      } else if (scanTarget === "user" && scannedData.type === "user") {
        const userId = parseInt(scannedData.id);
        // Fetch the user details
        apiRequest("GET", `/api/users/${userId}`)
          .then(res => res.json())
          .then(user => {
            setSelectedUser(user);
            form.setValue("userId", user.id);
          })
          .catch(err => {
            toast({
              title: "Error scanning user ID",
              description: err.message,
              variant: "destructive",
            });
          });
      } else {
        toast({
          title: "Invalid QR code",
          description: "The scanned QR code is not valid for this operation",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Invalid QR code",
        description: "The scanned QR code could not be parsed",
        variant: "destructive",
      });
    }
    
    setIsQrScannerOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Issue Books
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Issue books to students and set return dates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Book Selection Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Select Book</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setScanTarget("book");
                      setIsQrScannerOpen(true);
                    }}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Scan
                  </Button>
                </CardTitle>
                <CardDescription>
                  Search for a book to issue by title, author, or ISBN
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-10"
                      placeholder="Search books..."
                      value={bookSearchTerm}
                      onChange={(e) => setBookSearchTerm(e.target.value)}
                    />
                  </div>

                  {selectedBook ? (
                    <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/30 rounded-md">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 bg-primary-100 dark:bg-primary-800 rounded-md flex items-center justify-center text-primary-600 dark:text-primary-400">
                          <BookPlus className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {selectedBook.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {selectedBook.author}
                          </p>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                              ISBN: {selectedBook.isbn}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              {selectedBook.available} of {selectedBook.quantity} available
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : bookSearchTerm && !isLoadingBooks && books?.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      No books found for "{bookSearchTerm}"
                    </div>
                  ) : null}

                  {bookSearchTerm && !selectedBook && (
                    <div className="mt-2 max-h-64 overflow-y-auto border rounded-md">
                      {isLoadingBooks ? (
                        <div className="flex justify-center items-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Author</TableHead>
                              <TableHead>Available</TableHead>
                              <TableHead className="w-[100px]">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {books?.map((book) => (
                              <TableRow key={book.id}>
                                <TableCell className="font-medium">
                                  {book.title}
                                </TableCell>
                                <TableCell>{book.author}</TableCell>
                                <TableCell>
                                  {book.available} / {book.quantity}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={book.available === 0}
                                    onClick={() => handleBookSelect(book)}
                                  >
                                    Select
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Student Selection Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Select Student</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setScanTarget("user");
                      setIsQrScannerOpen(true);
                    }}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Scan
                  </Button>
                </CardTitle>
                <CardDescription>
                  Search for a student by name or ID
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      className="pl-10"
                      placeholder="Search students..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                    />
                  </div>

                  {selectedUser ? (
                    <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/30 rounded-md">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 bg-primary-100 dark:bg-primary-800 rounded-md flex items-center justify-center text-primary-600 dark:text-primary-400">
                          <UsersRound className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {selectedUser.name}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {selectedUser.email}
                          </p>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                              Username: {selectedUser.username}
                            </span>
                            <span className="text-xs">
                              <Badge variant={selectedUser.active ? "outline" : "destructive"}>
                                {selectedUser.active ? "Active" : "Inactive"}
                              </Badge>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : userSearchTerm && !isLoadingStudents && filteredStudents?.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      No students found for "{userSearchTerm}"
                    </div>
                  ) : null}

                  {userSearchTerm && !selectedUser && (
                    <div className="mt-2 max-h-64 overflow-y-auto border rounded-md">
                      {isLoadingStudents ? (
                        <div className="flex justify-center items-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Username</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="w-[100px]">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredStudents?.map((student) => (
                              <TableRow key={student.id}>
                                <TableCell className="font-medium">
                                  {student.name}
                                </TableCell>
                                <TableCell>{student.username}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={student.active ? "outline" : "destructive"}
                                  >
                                    {student.active ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!student.active}
                                    onClick={() => handleUserSelect(student)}
                                  >
                                    Select
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Issue Book</CardTitle>
              <CardDescription>
                Set the due date and issue the book to the student
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="bookId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Book</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Select a book above"
                              value={selectedBook?.title || ""}
                              readOnly
                              className="bg-slate-50 dark:bg-slate-800"
                            />
                          </FormControl>
                          <FormDescription>
                            The book to be issued
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Select a student above"
                              value={selectedUser?.name || ""}
                              readOnly
                              className="bg-slate-50 dark:bg-slate-800"
                            />
                          </FormControl>
                          <FormDescription>
                            The student borrowing the book
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="date"
                              className="pl-10"
                              min={new Date().toISOString().split("T")[0]}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          The date by which the book should be returned
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={
                        issueBookMutation.isPending ||
                        !selectedBook ||
                        !selectedUser ||
                        (selectedBook && selectedBook.available === 0)
                      }
                    >
                      {issueBookMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Issuing Book...
                        </>
                      ) : (
                        <>
                          <BookPlus className="mr-2 h-4 w-4" />
                          Issue Book
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="bg-slate-50 dark:bg-slate-800/50 border-t flex justify-between text-sm text-slate-500 dark:text-slate-400">
              <div>
                {selectedBook && selectedUser ? (
                  <>Ready to issue book to student</>
                ) : (
                  <>Please select both a book and a student to proceed</>
                )}
              </div>
              {selectedBook && selectedBook.available === 0 && (
                <div className="text-destructive font-medium">
                  This book is currently unavailable
                </div>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      {/* QR Scanner */}
      <QRScanner
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScan={handleQrScan}
      />
    </DashboardLayout>
  );
};

export default IssueBooks;
