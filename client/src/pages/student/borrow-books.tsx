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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Book } from "@shared/schema";
import { Search, BookPlus, QrCode, Loader2 } from "lucide-react";
import QRScanner from "@/components/ui/qr-scanner";
import BookCard from "@/components/book/book-card";

const calculateDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 14); // 14 days from now
  return date.toISOString().split("T")[0];
};

const BorrowBooks = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isBorrowDialogOpen, setIsBorrowDialogOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  
  // Fetch all books
  const { data: books, isLoading: isLoadingBooks } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  // Fetch books based on search term
  const { data: searchResults, isLoading: isSearching } = useQuery<Book[]>({
    queryKey: ["/api/books/search", searchTerm],
    enabled: searchTerm.length > 0,
  });

  // Borrow book mutation
  const borrowBookMutation = useMutation({
    mutationFn: async (bookId: number) => {
      const dueDate = calculateDueDate();
      const res = await apiRequest("POST", "/api/borrowings", {
        bookId,
        userId: user?.id,
        dueDate,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Book borrowed successfully",
        description: `You have borrowed "${selectedBook?.title}" and it is due back in 14 days.`,
      });
      setIsBorrowDialogOpen(false);
      setSelectedBook(null);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: [`/api/borrowings/user/${user?.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to borrow book",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle book selection for borrowing
  const handleBorrowBook = (book: Book) => {
    setSelectedBook(book);
    setIsBorrowDialogOpen(true);
  };

  // Handle QR code scanning
  const handleQrScan = (data: string) => {
    try {
      const scannedData = JSON.parse(data);
      
      if (scannedData.type === "book") {
        const bookId = parseInt(scannedData.id);
        
        // Find the book in our books list
        const book = books?.find(b => b.id === bookId);
          
        if (book) {
          handleBorrowBook(book);
        } else {
          // Fetch the book details if not in our current list
          apiRequest("GET", `/api/books/${bookId}`)
            .then(res => res.json())
            .then(book => {
              handleBorrowBook(book);
            })
            .catch(err => {
              toast({
                title: "Book not found",
                description: "Could not find this book in the library",
                variant: "destructive",
              });
            });
        }
      } else {
        toast({
          title: "Invalid QR code",
          description: "The scanned QR code is not valid for borrowing books",
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

  // Filter books based on active tab and search term
  const getFilteredBooks = () => {
    const booksToFilter = searchTerm && searchResults ? searchResults : books || [];
    
    if (activeTab === "all") {
      return booksToFilter;
    } else if (activeTab === "available") {
      return booksToFilter.filter(book => book.available > 0);
    } else {
      // Filter by category (we use the activeTab as category name)
      return booksToFilter.filter(book => 
        book.category.toLowerCase() === activeTab.toLowerCase()
      );
    }
  };

  // Get unique categories for tab filtering
  const getCategories = () => {
    if (!books) return [];
    
    const categoriesSet = new Set(books.map(book => book.category));
    return Array.from(categoriesSet).slice(0, 5); // Limit to 5 categories for UI
  };

  const filteredBooks = getFilteredBooks();
  const categories = getCategories();
  const isLoading = isLoadingBooks || isSearching;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Borrow Books
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Browse and borrow books from the library collection
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 w-full sm:max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                className="pl-10"
                placeholder="Search by title, author, or ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsQrScannerOpen(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              Scan Book
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 overflow-x-auto flex w-full">
            <TabsTrigger value="all">All Books</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category.toLowerCase()}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>
                    {activeTab === "all" 
                      ? "Library Collection" 
                      : activeTab === "available" 
                        ? "Available Books" 
                        : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Books`}
                  </CardTitle>
                  <CardDescription>
                    {activeTab === "all" 
                      ? "Browse all books in our library" 
                      : activeTab === "available" 
                        ? "Books currently available for borrowing" 
                        : `Books in the ${activeTab} category`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredBooks?.length === 0 ? (
                    <div className="text-center py-8">
                      <BookPlus className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">No books found</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {searchTerm 
                          ? `No results for "${searchTerm}"` 
                          : "No books are available in this category"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredBooks?.map(book => (
                        <BookCard 
                          key={book.id} 
                          book={book} 
                          onAction={handleBorrowBook} 
                          actionLabel="Borrow"
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between items-center border-t bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {filteredBooks?.length || 0} {filteredBooks?.length === 1 ? "book" : "books"}
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Borrow Confirmation Dialog */}
        <Dialog open={isBorrowDialogOpen} onOpenChange={setIsBorrowDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Borrow Book</DialogTitle>
              <DialogDescription>
                Confirm that you want to borrow this book. It will be due back in 14 days.
              </DialogDescription>
            </DialogHeader>

            {selectedBook && (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-md">
                  {selectedBook.coverImage ? (
                    <img 
                      src={selectedBook.coverImage} 
                      alt={selectedBook.title}
                      className="h-20 w-16 object-cover rounded"
                    />
                  ) : (
                    <div className="h-20 w-16 bg-primary-100 dark:bg-primary-900/50 rounded flex items-center justify-center">
                      <BookPlus className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold">{selectedBook.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedBook.author}
                    </p>
                    <div className="mt-2 text-xs">
                      <span className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                        {selectedBook.category}
                      </span>
                      <span className="ml-2">
                        ISBN: {selectedBook.isbn}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Borrowing Details</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Borrow Date:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Due Date:</span>
                      <span className="font-medium">{new Date(calculateDueDate()).toLocaleDateString()}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Late Fee:</span>
                      <span className="font-medium">$0.50 per day</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsBorrowDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedBook) {
                    borrowBookMutation.mutate(selectedBook.id);
                  }
                }}
                disabled={borrowBookMutation.isPending}
              >
                {borrowBookMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <BookPlus className="mr-2 h-4 w-4" />
                    Confirm Borrowing
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

export default BorrowBooks;
