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
  email: z.string().email({ message: "Valid email is required" }),
  isbn: z.string().min(1, { message: "ISBN is required" }),
});

type IssueBookFormValues = z.infer<typeof issueBookSchema>;

const IssueBooks = () => {
  const { toast } = useToast();
  const form = useForm<IssueBookFormValues>({
    resolver: zodResolver(issueBookSchema),
    defaultValues: {
      email: "",
      isbn: "",
    },
  });

  // Issue book mutation
  // 1. Auth‐header helper (reuse from before)
  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No auth token found");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // 2. Issue‐book mutation
  const issueBookMutation = useMutation({
    mutationFn: async (data: IssueBookFormValues) => {
      // data must include: { isbn: number; email: string }
      const response = await fetch(
        "http://127.0.0.1:8080/librarian/issue-book",
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            isbn: data.isbn,
            email: data.email,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
      }

      // Returns the created Borrow record (with issueDate & dueDate)
      return response.json() as Promise<Borrow>;
    },
    onSuccess: () => {
      toast({
        title: "Book issued successfully",
        description: "The book has been issued to the student.",
      });
      form.reset();
      // Refresh your list of active borrowings
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Issue Books
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Issue books to students using Email and ISBN
          </p>
        </div>
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Issue Book</CardTitle>
            <CardDescription>Enter the student's email and the book's ISBN to issue a book.</CardDescription>
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
                <Button type="submit" className="w-full" loading={issueBookMutation.isPending}>
                  Issue Book
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default IssueBooks;
