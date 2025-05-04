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

const ReturnBooks = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBorrowing, setSelectedBorrowing] = useState<Borrowing | null>(null);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [fineAmount, setFineAmount] = useState("0");
  const [activeTab, setActiveTab] = useState("borrowed");
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

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

  // Return book mutation
  const returnBookMutation = useMutation({
    mutationFn: async ({ id, fine }: { id: number; fine: number }) => {
      const res = await apiRequest("POST", `/api/borrowings/${id}/return`, { fine });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Book returned successfully",
        description: "The book has been marked as returned in the system.",
      });
      setReturnDialogOpen(false);
      setSelectedBorrowing(null);
      setFineAmount("0");
      
      // Invalidate relevant queries
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Return Books
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Process book returns and handle fines
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1">
              <TabsList>
                <TabsTrigger value="borrowed">All Borrowed</TabsTrigger>
                <TabsTrigger value="overdue">Overdue</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-10"
                  placeholder="Search borrowings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Button variant="outline" onClick={() => setIsQrScannerOpen(true)}>
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "borrowed" ? "Currently Borrowed Books" : "Overdue Books"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "borrowed"
                    ? "All books currently checked out by students"
                    : "Books that are past their due date and may incur fines"}
                </CardDescription>
              </CardHeader>
              
              <TabsContent value="borrowed">
                <CardContent>
                  <BookTable
                    books={formatBorrowingsForTable(filteredBorrowings)}
                    type="borrowed"
                    onRenew={handleRenew}
                    onReturn={(id) => {
                      const borrowing = activeBorrowings?.find(b => b.id === id);
                      if (borrowing) handleReturn(borrowing);
                    }}
                    isLoading={isLoading}
                  />
                </CardContent>
                <CardFooter className="bg-slate-50 dark:bg-slate-800/50 border-t">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {filteredBorrowings?.length || 0} of {activeBorrowings?.length || 0} borrowed books
                  </div>
                </CardFooter>
              </TabsContent>
              
              <TabsContent value="overdue">
                <CardContent>
                  <BookTable
                    books={formatBorrowingsForTable(filteredBorrowings)}
                    type="overdue"
                    onRenew={handleRenew}
                    onReturn={(id) => {
                      const borrowing = overdueBorrowings?.find(b => b.id === id);
                      if (borrowing) handleReturn(borrowing);
                    }}
                    isLoading={isLoading}
                  />
                </CardContent>
                <CardFooter className="bg-slate-50 dark:bg-slate-800/50 border-t">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {filteredBorrowings?.length || 0} of {overdueBorrowings?.length || 0} overdue books
                  </div>
                </CardFooter>
              </TabsContent>
            </Card>
          </motion.div>
        </Tabs>

        {/* Return Dialog */}
        <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Return Book</DialogTitle>
              <DialogDescription>
                Process the return of the book and calculate any applicable fines.
              </DialogDescription>
            </DialogHeader>

            {selectedBorrowing && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 bg-primary-100 dark:bg-primary-800 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                      <RotateCcw className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{selectedBorrowing.book.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedBorrowing.book.author}
                      </p>
                      <div className="mt-1 text-xs">
                        <span className="font-medium">Borrowed by:</span>{" "}
                        {selectedBorrowing.user.name}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Borrow Date
                    </div>
                    <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1 text-blue-500" />
                      <span className="font-medium">
                        {new Date(selectedBorrowing.borrowDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Due Date
                    </div>
                    <div className="flex items-center mt-1">
                      {new Date(selectedBorrowing.dueDate) < new Date() ? (
                        <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      )}
                      <span className="font-medium">
                        {new Date(selectedBorrowing.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-2">
                    Fine Amount ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-10"
                      value={fineAmount}
                      onChange={(e) => setFineAmount(e.target.value)}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {Number(fineAmount) > 0
                      ? "Fine will be recorded and the student will be notified."
                      : "No fine will be charged for this return."}
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReturnDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedBorrowing) {
                    returnBookMutation.mutate({
                      id: selectedBorrowing.id,
                      fine: Number(fineAmount),
                    });
                  }
                }}
                disabled={returnBookMutation.isPending}
              >
                {returnBookMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Confirm Return
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Scanner */}
        <QRScanner
          isOpen={isQrScannerOpen}
          onClose={() => setIsQrScannerOpen(false)}
          onScan={handleQrScan}
        />
      </div>
    </DashboardLayout>
  );
};

export default ReturnBooks;
