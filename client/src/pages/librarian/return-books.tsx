import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Book } from "@/lib/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import BookTable from "@/components/book/book-table";
import BookForm, { BookFormValues } from "@/components/book/book-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, Loader2, Search, BookOpen, CheckCircle2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

const ManageBooks = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isbnInput, setIsbnInput] = useState("");
  const [isbnResult, setIsbnResult] = useState<Book | null | "notfound">();
  const [isbnError, setIsbnError] = useState("");
  const [bookToReturn, setBookToReturn] = useState<Book | null>(null);

  // Fetch all books
  // const { data: books, isLoading } = useQuery<Book[]>({
  //   queryKey: ["/api/books"],
  // });
  interface Borrow {
    borrowId: number;
    email: string;
    // plus any other fields your endpoint might return…
  }
  
  /**
   * Calls the librarian return-book API with Bearer token auth.
   */
  async function returnBookLibrarian(
    borrowId: number,
    userEmail: string
  ): Promise<Borrow> {
    // 1. Get the token
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("No auth token found – please log in first");
    }
  
    // 2. Call the API
    const response = await fetch(
      "http://127.0.0.1:8080/librarian/return-book",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,    // <-- Bearer token here
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({ borrowId : borrowId, email: userEmail }),
      }
    );
  
    // 3. Error handling
    console.log("Response:", borrowId, userEmail, response);
    if (!response.ok) {
      const text = await response.text();
      // throw new Error(`Server error ${response.status}: ${text}`);
    }
  
    // 4. Parse and return the updated Borrow object
    // return Text;
  }



  // Fetching books using useQuery
  const { data: books, isLoading } = useQuery({
    queryKey: ['librarian/get-issued-books'], // Query key
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No token found in localStorage");
      }
  
      const response = await fetch('http://127.0.0.1:8080/librarian/get-issued-books', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      const data = await response.json();
      console.log('Fetched books:', data); // Log the fetched books
      return data; // Assuming the response contains the list of books
    },
  });

  console.log(books); // Log the fetched books to the console

  // Search books when query changes
  const { data: searchResults, isLoading: isSearching } = useQuery<Book[]>({
    queryKey: ["/api/books/search", searchQuery],
    enabled: searchQuery.length > 0,
  });

  // Books to display based on search or all books
  const displayedBooks = useMemo(() => {
    let list = books || [];
    // Add a dummy borrowed book for testing
    if (searchQuery && searchResults) {
      return searchResults;
    }
    return list;
  }, [books, searchQuery, searchResults]);

  // Create book mutation
  const createBookMutation = useMutation({
    mutationFn: async (bookData: BookFormValues) => {
      const res = await apiRequest("POST", "/api/books", {
        ...bookData,
        addedBy: user?.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Book added",
        description: "The book has been added successfully.",
      });
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add book",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update book mutation
  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: BookFormValues }) => {
      const res = await apiRequest("PUT", `/api/books/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Book updated",
        description: "The book has been updated successfully.",
      });
      setBookToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update book",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete book mutation
  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/books/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Book deleted",
        description: "The book has been deleted successfully.",
      });
      setBookToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete book",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle adding a new book
  const handleAddBook = (data: BookFormValues) => {
    createBookMutation.mutate(data);
  };

  // Handle updating a book
  const handleUpdateBook = (data: BookFormValues) => {
    if (bookToEdit) {
      updateBookMutation.mutate({ id: bookToEdit.id, data });
    }
  };

  // Handle deleting a book
  const handleDeleteBook = () => {
    if (bookToDelete !== null) {
      deleteBookMutation.mutate(bookToDelete);
    }
  };

  function handleCheckIsbn() {
    if (!isbnInput.trim() || isbnError) {
      return;
    }
    const found = (books || []).find(b => b.isbn && b.isbn === isbnInput.trim());
    setIsbnResult(found || "notfound");
  }

  const handleReturn = (id: number) => {
    const book = displayedBooks.find(b => b.id === id);
    setBookToReturn(book || null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Return Books
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Return books for the user if they are not returned
          </p>
        </div>

          {/* Add Book Button at the top
          <div className="flex justify-end mb-4">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Book</DialogTitle>
                  <DialogDescription>
                    Add a new book to the library collection. Fill in the details
                    below.
                  </DialogDescription>
                </DialogHeader>
                <BookForm
                  onSubmit={handleAddBook}
                  isSubmitting={createBookMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div> */}

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-md bg-background text-foreground"
          />
        </div>

        {/* Tabs and Book Table */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Books</TabsTrigger>
              {/* <TabsTrigger value="available">Check-Availability</TabsTrigger> */}
              {/* <TabsTrigger value="borrowed">Borrowed</TabsTrigger> */}
            </TabsList>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full mt-4"
            >
              <TabsContent value="all" className="mt-0">
              <BookTable
                  books={displayedBooks.map((book) => ({ ...book }))}
                  type="all"
                  onReturn={handleReturn}
                  isLoading={isLoading || isSearching}
                />
              </TabsContent>

              {/* <TabsContent value="available" className="mt-0">
                <div className="max-w-md mx-auto p-6 bg-background rounded-lg shadow">
                  <div className="mb-4 flex items-center gap-2">
                    <Input
                      placeholder="Enter ISBN number..."
                      value={isbnInput}
                      onChange={e => {
                        const value = e.target.value;
                        if (/\D/.test(value)) {
                          setIsbnError("Sorry, only integers accepted.");
                        } else {
                          setIsbnError("");
                        }
                        setIsbnInput(value);
                      }}
                      className="flex-1"
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleCheckIsbn();
                      }}
                    />
                    {isbnError && (
                      <div className="text-red-500 text-sm mt-1">{isbnError}</div>
                    )}
                    <Button onClick={handleCheckIsbn} variant="outline">
                      <Search className="h-4 w-4 mr-1" /> Check
                    </Button>
                  </div>
                  {isbnResult === undefined && (
                    <div className="text-slate-500 text-center">Enter an ISBN to check availability.</div>
                  )}
                  {isbnResult === "notfound" && (
                    <div className="flex flex-col items-center text-slate-500 py-8">
                      <AlertTriangle className="h-8 w-8 mb-2 text-yellow-500" />
                      Book not found for ISBN: <span className="font-mono">{isbnInput}</span>
                    </div>
                  )}
                  {isbnResult && isbnResult !== "notfound" && (
                    <div className="flex flex-col items-center gap-4 py-6">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-8 w-8 text-primary-600" />
                        <div>
                          <div className="font-bold text-lg">{isbnResult.title}</div>
                          <div className="text-slate-500">{isbnResult.author}</div>
                          <div className="text-xs mt-1">ISBN: <span className="font-mono">{isbnResult.isbn}</span></div>
                          <div className="text-xs mt-1">Category: {isbnResult.category}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {isbnResult.available && isbnResult.available > 0 ? (
                          <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-5 w-5" /> Available ({isbnResult.available} of {isbnResult.quantity})</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600"><AlertTriangle className="h-5 w-5" /> Not Available</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent> */}

              {/* <TabsContent value="borrowed" className="mt-0">
                <BookTable
                  books={displayedBooks
                    .filter((book) => book.available < book.quantity)
                    .map((book) => ({
                      ...book,
                    }))}
                  type="all"
                  onEdit={(book) => setBookToEdit(book as Book)}
                  onDelete={(id) => setBookToDelete(id)}
                  isLoading={isLoading || isSearching}
                />
              </TabsContent> */}
            </motion.div>
          </Tabs>
        </div>

        {/* Edit Book Dialog */}
        {bookToEdit && (
          <Dialog
            open={Boolean(bookToEdit)}
            onOpenChange={(open) => !open && setBookToEdit(null)}
          >
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Book</DialogTitle>
                <DialogDescription>
                  Update the book details. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <BookForm
                onSubmit={handleUpdateBook}
                defaultValues={bookToEdit}
                isSubmitting={updateBookMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={bookToDelete !== null}
          onOpenChange={(open) => !open && setBookToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this book? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteBook}
                disabled={deleteBookMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteBookMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={!!bookToReturn} onOpenChange={open => !open && setBookToReturn(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Return Book</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to return <b>{bookToReturn?.isbn}</b>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBookToReturn(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  // Call your API here, e.g. returnBookMutation.mutate(bookToReturn.id)
                    if (bookToReturn) {
                      try {
                        returnBookLibrarian(bookToReturn.borrowId, bookToReturn.email);
                        // await apiRequest("POST", `/api/books/return/${bookToReturn.id}`);
                        toast({
                          title: "Book returned",
                          description: `The book '${bookToReturn.isbn}' has been returned successfully.`,
                        });
                        queryClient.invalidateQueries({ queryKey: ["/api/books"] });
                      } catch (error: any) {
                        toast({
                          title: "Failed to return book",
                          description: error.message || "An error occurred.",
                          variant: "destructive",
                        });
                      }
                    }
                  setBookToReturn(null);
                }}
              >
                Return
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default ManageBooks;
