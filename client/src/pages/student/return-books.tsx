import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Borrowing } from "@shared/schema";
import { 
  RotateCcw, AlertTriangle, Clock, BookOpen, 
  DollarSign, QrCode, Loader2, Search, CheckCircle
} from "lucide-react";
import QRScanner from "@/components/ui/qr-scanner";

interface FormattedBorrowing extends Borrowing {
  book: {
    id: number;
    title: string;
    author: string;
    isbn: string;
    coverImage?: string;
    category: string;
  };
  isOverdue: boolean;
  daysOverdue: number;
  estimatedFine: number;
}

const UserReturnBooks = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBorrowing, setSelectedBorrowing] = useState<FormattedBorrowing | null>(null);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  // Fetch user's borrowings
  const { data: borrowings, isLoading } = useQuery<Borrowing[]>({
    queryKey: [`/api/borrowings/user/${user?.id}`],
    enabled: !!user,
  });

  // Return book mutation (this would actually be handled by a librarian in the real system)
  const returnBookMutation = useMutation({
    mutationFn: async ({ id, fine }: { id: number; fine: number }) => {
      // Note: In a real system, Users wouldn't be able to return books directly
      // This would be a request for the librarian to process the return
      const res = await apiRequest("POST", `/api/book-returns/request`, { 
        borrowingId: id,
        userId: user?.id 
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Return request submitted",
        description: "Your return request has been submitted. Please return the physical book to the library.",
      });
      setReturnDialogOpen(false);
      setSelectedBorrowing(null);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/borrowings/user/${user?.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to request return",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Process borrowings to add additional info
  const processedBorrowings: FormattedBorrowing[] = borrowings
    ? borrowings
        .filter(b => !b.returnDate) // Only show active borrowings
        .map(borrowing => {
          const dueDate = new Date(borrowing.dueDate);
          const now = new Date();
          const isOverdue = dueDate < now;
          
          // Calculate days overdue
          const diffTime = isOverdue ? Math.abs(now.getTime() - dueDate.getTime()) : 0;
          const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Calculate estimated fine ($0.50 per day)
          const estimatedFine = isOverdue ? daysOverdue * 0.5 : 0;
          
          return {
            ...borrowing,
            isOverdue,
            daysOverdue,
            estimatedFine
          };
        })
    : [];

  // Filter borrowings based on search term
  const filteredBorrowings = processedBorrowings.filter(
    borrowing =>
      borrowing.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrowing.book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrowing.book.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle return book action
  const handleReturnBook = (borrowing: FormattedBorrowing) => {
    setSelectedBorrowing(borrowing);
    setReturnDialogOpen(true);
  };

  // Handle QR code scanning
  const handleQrScan = (data: string) => {
    try {
      const scannedData = JSON.parse(data);
      
      if (scannedData.type === "borrowing") {
        const borrowingId = parseInt(scannedData.id);
        
        // Find the borrowing in our list
        const borrowing = processedBorrowings.find(b => b.id === borrowingId);
        
        if (borrowing) {
          handleReturnBook(borrowing);
        } else {
          toast({
            title: "Borrowing not found",
            description: "This QR code doesn't match any of your active borrowings",
            variant: "destructive",
          });
        }
      } else if (scannedData.type === "book") {
        const bookId = parseInt(scannedData.id);
        
        // Find borrowing for this book
        const borrowing = processedBorrowings.find(b => b.bookId === bookId);
        
        if (borrowing) {
          handleReturnBook(borrowing);
        } else {
          toast({
            title: "Book not borrowed",
            description: "You don't have an active borrowing for this book",
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Return Books
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            View your borrowed books and return them to the library
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search your borrowed books..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button variant="outline" onClick={() => setIsQrScannerOpen(true)}>
            <QrCode className="h-4 w-4 mr-2" />
            Scan QR
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Your Borrowed Books</CardTitle>
              <CardDescription>
                Books you have checked out from the library
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredBorrowings.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">
                    {searchTerm 
                      ? `No results for "${searchTerm}"` 
                      : "No borrowed books"}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {searchTerm 
                      ? "Try a different search term" 
                      : "You don't have any books to return at the moment"}
                  </p>
                  {!searchTerm && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => window.location.href = "/User/borrow"}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Borrow Books
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBorrowings.map((borrowing) => (
                    <motion.div
                      key={borrowing.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 border rounded-lg flex items-start gap-4"
                    >
                      <div className="h-16 w-12 bg-primary-50 dark:bg-primary-900/30 rounded flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-semibold">{borrowing.book.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {borrowing.book.author}
                            </p>
                          </div>
                          {borrowing.isOverdue && (
                            <Badge variant="destructive" className="h-fit">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                          <span className="flex items-center text-slate-600 dark:text-slate-400">
                            <Clock className="h-3 w-3 mr-1" />
                            Due: {new Date(borrowing.dueDate).toLocaleDateString()}
                          </span>
                          {borrowing.isOverdue && (
                            <span className="flex items-center text-red-500">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Est. Fine: ${borrowing.estimatedFine.toFixed(2)}
                            </span>
                          )}
                          <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                            {borrowing.book.category}
                          </span>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReturnBook(borrowing)}
                          >
                            <RotateCcw className="h-3 w-3 mr-2" />
                            Return Book
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-slate-50 dark:bg-slate-800/50 border-t">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Remember to return your books on time to avoid late fees
              </p>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Return Book Dialog */}
        <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Return Book</DialogTitle>
              <DialogDescription>
                Confirm you want to return this book to the library
              </DialogDescription>
            </DialogHeader>

            {selectedBorrowing && (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                  <div className="h-16 w-12 bg-primary-50 dark:bg-primary-900/30 rounded flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedBorrowing.book.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedBorrowing.book.author}
                    </p>
                    <div className="mt-2 text-xs flex gap-2">
                      <span className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                        {selectedBorrowing.book.category}
                      </span>
                      <span className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                        ISBN: {selectedBorrowing.book.isbn.substring(0, 6)}...
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-md space-y-3">
                  <div>
                    <p className="text-sm font-medium">Return Details</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Borrowed On
                      </div>
                      <div className="text-sm font-medium mt-1">
                        {new Date(selectedBorrowing.borrowDate).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Due Date
                      </div>
                      <div className="text-sm font-medium mt-1 flex items-center">
                        {new Date(selectedBorrowing.dueDate).toLocaleDateString()}
                        {selectedBorrowing.isOverdue ? (
                          <AlertTriangle className="h-4 w-4 ml-2 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {selectedBorrowing.isOverdue && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-red-800 dark:text-red-300">
                            Overdue by {selectedBorrowing.daysOverdue} {selectedBorrowing.daysOverdue === 1 ? "day" : "days"}
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Late fee: $0.50 per day
                          </p>
                        </div>
                        <div className="text-lg font-bold text-red-700 dark:text-red-400">
                          ${selectedBorrowing.estimatedFine.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <p>
                      Please return the physical book to the library. A librarian will process
                      your return and calculate any applicable fines.
                    </p>
                  </div>
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
                      fine: selectedBorrowing.estimatedFine
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

export default UserReturnBooks;
