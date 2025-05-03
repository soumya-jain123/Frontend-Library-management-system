import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { 
  BookPlus, ListPlus, Clock, CheckCircle2, 
  X, Loader2, FileText, Search 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Schema for book request
const bookRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().optional(),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  urgency: z.enum(["low", "medium", "high"]),
});

type BookRequestValues = z.infer<typeof bookRequestSchema>;

// Mock interface for book requests from the API
interface BookRequest {
  id: number;
  userId: number;
  title: string;
  author: string;
  isbn?: string;
  reason: string;
  urgency: string;
  status: string;
  requestDate: string;
  approvedBy?: number;
  approver?: {
    name: string;
  };
}

const RequestBooks = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("new");
  
  // Form setup
  const form = useForm<BookRequestValues>({
    resolver: zodResolver(bookRequestSchema),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      reason: "",
      urgency: "medium",
    },
  });

  // Fetch user's book requests
  const { data: bookRequests, isLoading } = useQuery<BookRequest[]>({
    queryKey: ["/api/book-requests/user"],
    enabled: !!user,
  });

  // Book request mutation
  const requestBookMutation = useMutation({
    mutationFn: async (data: BookRequestValues) => {
      const res = await apiRequest("POST", "/api/book-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request submitted",
        description: "Your book request has been submitted for review.",
      });
      form.reset();
      setActiveTab("active");
      queryClient.invalidateQueries({ queryKey: ["/api/book-requests/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: BookRequestValues) => {
    requestBookMutation.mutate(data);
  };

  // Filter requests based on status
  const pendingRequests = bookRequests?.filter(req => req.status === "pending") || [];
  const approvedRequests = bookRequests?.filter(req => req.status === "approved") || [];
  const rejectedRequests = bookRequests?.filter(req => req.status === "rejected") || [];

  // Render status badge based on request status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-600 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-600 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 border-red-200 text-red-600 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400">
            <X className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Book Requests
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Request new books to be added to the library collection
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="new">New Request</TabsTrigger>
            <TabsTrigger value="active">
              Active Requests
              {pendingRequests.length > 0 && (
                <span className="ml-1.5 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 px-2 py-0.5 rounded-full text-xs">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">Request History</TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Request a New Book</CardTitle>
                    <CardDescription>
                      Fill out the form below to request a book to be added to the library
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Book Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter the title of the book" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="author"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Author</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter the author's name" {...field} />
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
                              <FormLabel>ISBN (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter ISBN if known" {...field} />
                              </FormControl>
                              <FormDescription>
                                Providing an ISBN helps us locate the exact book
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="urgency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Urgency</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select urgency level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Low - No rush</SelectItem>
                                  <SelectItem value="medium">Medium - Need within a month</SelectItem>
                                  <SelectItem value="high">High - Needed urgently</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason for Request</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Explain why you're requesting this book and how it will benefit the library" 
                                  className="min-h-[100px]" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="mt-2" 
                          disabled={requestBookMutation.isPending}
                        >
                          {requestBookMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <BookPlus className="mr-2 h-4 w-4" />
                              Submit Request
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Request Guidelines</CardTitle>
                    <CardDescription>
                      How to make an effective book request
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border p-3 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Search className="h-4 w-4" />
                        </div>
                        <h3 className="font-medium">Check Availability</h3>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Before requesting, search the library to ensure the book isn't already available.
                      </p>
                    </div>

                    <div className="rounded-lg border p-3 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <h3 className="font-medium">Be Specific</h3>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Provide complete and accurate information about the book you're requesting.
                      </p>
                    </div>

                    <div className="rounded-lg border p-3 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                          <Clock className="h-4 w-4" />
                        </div>
                        <h3 className="font-medium">Processing Time</h3>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Requests typically take 1-2 weeks to process, depending on availability and urgency.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="active">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Pending Requests</CardTitle>
                  <CardDescription>
                    Book requests awaiting librarian approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !pendingRequests.length ? (
                    <div className="text-center py-8">
                      <ListPlus className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">No pending requests</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        You don't have any active book requests at the moment
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActiveTab("new")}
                      >
                        <BookPlus className="h-4 w-4 mr-2" />
                        Make a New Request
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.map((request) => (
                        <div key={request.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-semibold">{request.title}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                by {request.author}
                              </p>
                            </div>
                            {renderStatusBadge(request.status)}
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <div>
                              <span className="font-medium">Requested:</span>{" "}
                              {new Date(request.requestDate).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Urgency:</span>{" "}
                              <span className="capitalize">{request.urgency}</span>
                            </div>
                          </div>
                          <div className="mt-3 text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                            <p className="font-medium mb-1">Reason for request:</p>
                            <p className="text-slate-600 dark:text-slate-400">{request.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="history">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Request History</CardTitle>
                  <CardDescription>
                    Past book requests that have been approved or rejected
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : approvedRequests.length === 0 && rejectedRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">No request history</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        You don't have any completed book requests yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {approvedRequests.length > 0 && (
                        <div>
                          <h3 className="text-md font-medium mb-3">Approved Requests</h3>
                          <div className="space-y-3">
                            {approvedRequests.map((request) => (
                              <div key={request.id} className="p-4 border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="flex justify-between">
                                  <div>
                                    <h3 className="font-semibold">{request.title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      by {request.author}
                                    </p>
                                  </div>
                                  {renderStatusBadge(request.status)}
                                </div>
                                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
                                  <div>
                                    <span className="font-medium">Requested:</span>{" "}
                                    {new Date(request.requestDate).toLocaleDateString()}
                                  </div>
                                  <div>
                                    <span className="font-medium">Approved by:</span>{" "}
                                    {request.approver?.name || "Admin"}
                                  </div>
                                  <div>
                                    <span className="font-medium">ISBN:</span>{" "}
                                    {request.isbn || "Not provided"}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {rejectedRequests.length > 0 && (
                        <div>
                          <h3 className="text-md font-medium mb-3">Rejected Requests</h3>
                          <div className="space-y-3">
                            {rejectedRequests.map((request) => (
                              <div key={request.id} className="p-4 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <div className="flex justify-between">
                                  <div>
                                    <h3 className="font-semibold">{request.title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      by {request.author}
                                    </p>
                                  </div>
                                  {renderStatusBadge(request.status)}
                                </div>
                                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                                  <div>
                                    <span className="font-medium">Requested:</span>{" "}
                                    {new Date(request.requestDate).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      form.setValue("title", request.title);
                                      form.setValue("author", request.author);
                                      if (request.isbn) form.setValue("isbn", request.isbn);
                                      form.setValue("reason", request.reason);
                                      form.setValue("urgency", request.urgency as "low" | "medium" | "high");
                                      setActiveTab("new");
                                    }}
                                  >
                                    <ListPlus className="h-3 w-3 mr-2" />
                                    Request Again
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Need a book urgently? Contact a librarian directly for expedited processing.
                  </p>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RequestBooks;