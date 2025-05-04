import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Book } from "@shared/schema";
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
import { PlusCircle, Trash2, Loader2 } from "lucide-react";

const ManageBooks = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all books
  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

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

        <div className="flex justify-between items-center">
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Books</TabsTrigger>
                <TabsTrigger value="available">Available</TabsTrigger>
                <TabsTrigger value="borrowed">Borrowed</TabsTrigger>
              </TabsList>
            
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full mt-4"
              >
                <TabsContent value="all" className="mt-0">
                  <BookTable
                    books={displayedBooks.map((book) => ({
                      ...book,
                    }))}
                    type="all"
                    onEdit={(book) => setBookToEdit(book as Book)}
                    onDelete={(id) => setBookToDelete(id)}
                    isLoading={isLoading || isSearching}
                  />
                </TabsContent>

                <TabsContent value="available" className="mt-0">
                  <BookTable
                    books={displayedBooks
                      .filter((book) => book.available > 0)
                      .map((book) => ({
                        ...book,
                      }))}
                    type="all"
                    onEdit={(book) => setBookToEdit(book as Book)}
                    onDelete={(id) => setBookToDelete(id)}
                    isLoading={isLoading || isSearching}
                  />
                </TabsContent>

                <TabsContent value="borrowed" className="mt-0">
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
                </TabsContent>
              </motion.div>
            </Tabs>
          </div>

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
