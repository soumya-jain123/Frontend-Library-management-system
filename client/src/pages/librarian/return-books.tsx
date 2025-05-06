import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { 
  Search, QrCode, RotateCcw, Clock, AlertTriangle, 
  CheckCircle, DollarSign, Loader2 
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import QRScanner from "@/components/ui/qr-scanner";
import BookTable from "@/components/book/book-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface Borrowing {
  id: number;
  bookId: number;
  userId: number;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  fine: number;
  status: string;
  book: {
    id: number;
    title: string;
    author: string;
    isbn: string;
  };
  user: {
    id: number;
    name: string;
    username: string;
  };
}

const returnBookSchema = z.object({
  email: z.string().email({ message: "Valid email is required" }),
  isbn: z.string().min(1, { message: "ISBN is required" }),
});

type ReturnBookFormValues = z.infer<typeof returnBookSchema>;

const ReturnBooks = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBorrowing, setSelectedBorrowing] = useState<Borrowing | null>(null);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [fineAmount, setFineAmount] = useState("0");
  const [activeTab, setActiveTab] = useState("borrowed");
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  const form = useForm<ReturnBookFormValues>({
    resolver: zodResolver(returnBookSchema),
    defaultValues: {
      email: "",
      isbn: "",
    },
  });

  // Fetch active borrowings
  const { data: activeBorrowings, isLoading: isLoadingActive } = useQuery<Borrowing[]>({
    queryKey: ["/api/borrowings/active"],
  });

  // Fetch overdue borrowings
  const { data: overdueBorrowings, isLoading: isLoadingOverdue } = useQuery<Borrowing[]>({
    queryKey: ["/api/borrowings/overdue"],
  });

  // Filter borrowings based on search term and active tab
  const filteredBorrowings = (activeTab === "borrowed" ? activeBorrowings : overdueBorrowings)?.filter(
    borrowing =>
      borrowing.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrowing.book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrowing.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrowing.book.isbn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No auth token found");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };
  // Return book mutation
  const returnBookMutation = useMutation({
    mutationFn: async (data: ReturnBookFormValues) => {
        // data must include: { borrowId: number }
        const response = await fetch(
          "http://127.0.0.1:8080/librarian/return-book",
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ email: data.email, isbn: data.isbn }),
          }
        );
    
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error ${response.status}: ${text}`);
        }
    
        // Returns the updated Borrow record with returnDate set
        return response.json() as Promise<Borrow>;
    },
    onSuccess: () => {
      toast({
        title: "Book returned successfully",
        description: `The book has been marked as returned in the system.`,
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/borrowings/overdue"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to return book",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  console.log("activeBorrowings", activeBorrowings);

  // Calculate fine based on days overdue
  const calculateFine = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    
    // If not overdue, no fine
    if (due >= today) return 0;
    
    // Calculate days overdue
    const diffTime = Math.abs(today.getTime() - due.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // $0.50 per day
    return diffDays * 0.5;
  };

  // Handle return action
  const handleReturn = (borrowing: Borrowing) => {
    const calculatedFine = calculateFine(borrowing.dueDate);
    setSelectedBorrowing(borrowing);
    setFineAmount(calculatedFine.toString());
    setReturnDialogOpen(true);
  };

  // Handle renew action (extend due date by 7 days)
  const handleRenew = (borrowingId: number) => {
    // This would be implemented in a real application to extend the due date
    toast({
      title: "Renew functionality",
      description: "Renew functionality would be implemented here to extend the due date.",
    });
  };

  // Handle QR code scanning
  const handleQrScan = (data: string) => {
    try {
      const scannedData = JSON.parse(data);
      
      if (scannedData.type === "borrowing") {
        const borrowingId = parseInt(scannedData.id);
        
        // Find the borrowing in our active or overdue lists
        const borrowing = [...(activeBorrowings || []), ...(overdueBorrowings || [])]
          .find(b => b.id === borrowingId);
          
        if (borrowing) {
          handleReturn(borrowing);
        } else {
          toast({
            title: "Borrowing not found",
            description: "Could not find an active borrowing with this ID",
            variant: "destructive",
          });
        }
      } else if (scannedData.type === "book") {
        const bookId = parseInt(scannedData.id);
        
        // Find borrowings for this book
        const borrowing = [...(activeBorrowings || []), ...(overdueBorrowings || [])]
          .find(b => b.bookId === bookId);
          
        if (borrowing) {
          handleReturn(borrowing);
        } else {
          toast({
            title: "Active borrowing not found",
            description: "Could not find an active borrowing for this book",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Invalid QR code",
          description: "The scanned QR code is not valid for returning books",
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

  // Format borrowings for table display
  const formatBorrowingsForTable = (borrowings: Borrowing[] | undefined) => {
    if (!borrowings) return [];
    
    return borrowings.map(borrowing => ({
      id: borrowing.id,
      title: borrowing.book.title,
      author: borrowing.book.author,
      borrower: borrowing.user.name,
      dueDate: new Date(borrowing.dueDate),
      isOverdue: new Date(borrowing.dueDate) < new Date()
    }));
  };

  const isLoading = isLoadingActive || isLoadingOverdue;

  // Handle form submission
  const onSubmit = (data: ReturnBookFormValues) => {
    returnBookMutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Return Books
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Return books using Email and ISBN
          </p>
        </div>
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Return Book</CardTitle>
            <CardDescription>Enter the student's email and the book's ISBN to return a book.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter student email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isbn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Book ISBN</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter book ISBN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" loading={returnBookMutation.isPending}>
                  Return Book
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReturnBooks;
