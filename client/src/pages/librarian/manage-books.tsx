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
import { PlusCircle, Trash2, Loader2, Search, BookOpen, CheckCircle2, AlertTriangle, BookKey } from "lucide-react";
import { Input } from "@/components/ui/input";

const ManageBooks = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isbnInput, setIsbnInput] = useState("");
  const [isbnError, setIsbnError] = useState("");
  const [isbnResult, setIsbnResult] = useState<Book | null | "notfound">();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all books
  // const { data: books, isLoading } = useQuery<Book[]>({
  //   queryKey: ["/api/books"],
  // });

  // Fetching books using useQuery
  const { data: books, isLoading } = useQuery({
    queryKey: ['/alluser/get-books'], // Query key
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No token found in localStorage");
      }
  
      const response = await fetch('http://127.0.0.1:8080/alluser/get-all-books/70687', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });


      const data = await response.json();
      return data.content; // Assuming the response contains the list of books
    },
  });

  // console.log(books); // Log the fetched books to the console

  // Search books when query changes
  const { data: searchResults, isLoading: isSearching } = useQuery<Book[]>({
    queryKey: ["/api/books/search", searchQuery],
    enabled: searchQuery.length > 0,
  });

  // Books to display based on search or all books
  const displayedBooks = useMemo(() => {
    if (searchQuery && searchResults) {
      return searchResults;
    }
    return books || [];
  }, [books, searchQuery, searchResults]);

  // Create book mutation
  const createBookMutation = useMutation({
    mutationFn: async (bookData: BookFormValues) => {
      const token = localStorage.getItem("authToken");
      // console.log("Token:", token);
      if (!token) throw new Error("No auth token found");
      console.log("Adding book with data:", bookData);
      const payload = {
        isbn: bookData.isbn,
        title: bookData.title,
        author: bookData.author,
        bookFormat: bookData.bookFormat,
        description: bookData.description || null,
        imageLink: bookData.imageLink,
        rating: parseFloat(bookData.rating),
        numRatings: parseInt(bookData.numRatings),
        genres: bookData.genres, // if this is a comma-separated string, leave as-is
        numBooks: bookData.numBooks, // assuming this maps to quantity in the form
      };

      // console.log("Payload:", payload); // Log the payload for debugging
  
      const res = await fetch("http://127.0.0.1:8080/librarian/add-book", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // console.log("Response:", res); // Log the response for debugging
  
      if (res.status !== 200) {
        const error = await res.text();
        throw new Error(`Failed to add book: ${error}`);
      }
  
      return await res.json();
    },
  
    onSuccess: () => {
      toast({
        title: "Book added",
        description: "The book has been added successfully.",
      });
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/alluser/get-books"] }); // adjust query key to match your fetch
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
    mutationFn: async ({ id, data }: { id: string; data: BookFormValues }) => {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No auth token found");
      console.log("Adding book with data:", data);
      const payload = {
        isbn: data.isbn,
        title: data.title,
        author: data.author,
        bookFormat: data.bookFormat,
        description: data.description || null,
        imageLink: data.imageLink,
        rating: parseFloat(data.rating),
        numRatings: parseInt(data.numRatings),
        genres: data.genres, // if this is a comma-separated string, leave as-is
        numBooks: data.numBooks, // assuming this maps to quantity in the form
      };

      let url = `http://localhost:8080/librarian/update-book/${data.isbn}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.status !== 200) {
        const errorText = await res.text();
        throw new Error(`Update failed: ${errorText}`);
      }
  
      return await res.json(); // This returns the updated book object
    },
    onSuccess: () => {
      toast({
        title: "Book updated",
        description: "The book has been updated successfully.",
      });
      setBookToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["/api/books"] }); // Consider updating to match new route if needed
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update book",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  
  // const updateBookMutation = useMutation({
  //   mutationFn: async ({ id, data }: { id: number; data: BookFormValues }) => {
  //     const res = await apiRequest("PUT", `/api/books/${id}`, data);
  //     return await res.json();
  //   },
  //   onSuccess: () => {
  //     toast({
  //       title: "Book updated",
  //       description: "The book has been updated successfully.",
  //     });
  //     setBookToEdit(null);
  //     queryClient.invalidateQueries({ queryKey: ["/api/books"] });
  //   },
  //   onError: (error: Error) => {
  //     toast({
  //       title: "Failed to update book",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   },
  // });

  // Delete book mutation
  // const deleteBookMutation = useMutation({
  //   mutationFn: async (id: number) => {
  //     await apiRequest("DELETE", `/api/books/${id}`);
  //   },
  //   onSuccess: () => {
  //     toast({
  //       title: "Book deleted",
  //       description: "The book has been deleted successfully.",
  //     });
  //     setBookToDelete(null);
  //     queryClient.invalidateQueries({ queryKey: ["/api/books"] });
  //   },
  //   onError: (error: Error) => {
  //     toast({
  //       title: "Failed to delete book",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   },
  // });

  // const deleteBookMutation = useMutation({
  //   mutationFn: async (id: number) => {
  //     await apiRequest("DELETE", `/api/books/${id}`);
  //   },
  //   onSuccess: () => {
  //     toast({
  //       title: "Book deleted",
  //       description: "The book has been deleted successfully.",
  //     });
  //     setBookToDelete(null);
  //     queryClient.invalidateQueries({ queryKey: ["/api/books"] });
  //   },
  //   onError: (error: Error) => {
  //     toast({
  //       title: "Failed to delete book",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   },
  // });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("User not authenticated");
      console.log("Deleting book with ID:", id);
      await fetch(`http://127.0.0.1:8080/librarian/delete-book/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Book deleted",
        description: "The book has been deleted successfully.",
      });
      setBookToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/alluser/get-books"] }); // Use the key you're using for books query
      // queryClient.invalidateQueries({ queryKey: ["/alluser/get-books"] }); // Use the key you're using for books query
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
    // console.log("Adding book with data:", data);
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
    if (!isbnInput.trim()) {
      setIsbnResult(undefined);
      return;
    }
    const found = (books || []).find(b => b.isbn && b.isbn.toLowerCase() === isbnInput.trim().toLowerCase());
    setIsbnResult(found || "notfound");
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Manage Books
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Add, edit, and remove books from the library collection
          </p>
        </div>

        {/* Add Book Button at the top */}
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
        </div>

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
              <TabsTrigger value="available">Check-Availability</TabsTrigger>
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
                  books={displayedBooks.map((book) => {
                    // console.log("Book being mapped:", book); // 🔍 Debug log
                    return {
                      ...book,
                      id: book.isbn, // <-- Add id for compatibility
                    };
                  })}
                  type="all"
                  onEdit={(book) => setBookToEdit(book as Book)}
                  onDelete={(isbn) => {
                    // console.log("Deleting book:", isbn); // Debug: log the book object
                    setBookToDelete(isbn);
                  }}
                  isLoading={isLoading || isSearching}
                />
              </TabsContent>

              <TabsContent value="available" className="mt-0">
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
              </TabsContent>

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
      </div>
    </DashboardLayout>
  );
};

export default ManageBooks;
