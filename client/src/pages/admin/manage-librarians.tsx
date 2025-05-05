import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardLayout from "../../components/layouts/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { User } from "../../shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, PlusCircle, AlertCircle } from "lucide-react";

const API_BASE_URL = "http://localhost:8080";

const createLibrarianSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
});

type CreateLibrarianValues = z.infer<typeof createLibrarianSchema>;

const ManageLibrarians = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: librarians, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/librarian"],
  });

  const form = useForm<CreateLibrarianValues>({
    resolver: zodResolver(createLibrarianSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
    },
  });

  const createLibrarianMutation = useMutation({
    mutationFn: async (data: CreateLibrarianValues) => {
      const res = await apiRequest("POST", "/api/register", {
        ...data,
        role: "librarian",
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Librarian created",
        description: "The librarian account has been created successfully.",
      });
      form.reset();
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users/librarian"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create librarian",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/users/${id}/toggle-status`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: `Librarian ${data.active ? "activated" : "deactivated"}`,
        description: `${data.name}'s account has been ${
          data.active ? "activated" : "deactivated"
        }.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/librarian"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateLibrarianValues) => {
    createLibrarianMutation.mutate(data);
  };

  // Filter librarians
  let filteredLibrarians = librarians?.filter(
    (librarian) =>
      librarian.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      librarian.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      librarian.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Inject dummy librarian if none exist
  if (!filteredLibrarians || filteredLibrarians.length === 0) {
    filteredLibrarians = [
      {
        id: 0,
        name: "Jane Doe",
        username: "janedoe",
        email: "jane.doe@example.com",
        active: true,
        role: "librarian",
      },
    ];
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Manage Librarians
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Add, view, and manage librarian accounts
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search librarians..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Librarian
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Librarian</DialogTitle>
                <DialogDescription>
                  Create a new librarian account. They will have permissions to manage books and User borrowings.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter password"
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createLibrarianMutation.isPending}
                    >
                      {createLibrarianMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Librarian
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Librarians</CardTitle>
            <CardDescription>
              Manage access and permissions for library staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredLibrarians?.map((librarian) => (
                        <motion.tr
                          key={librarian.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="border-b"
                        >
                          <TableCell className="font-medium">
                            {librarian.name}
                          </TableCell>
                          <TableCell>{librarian.username}</TableCell>
                          <TableCell>{librarian.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={librarian.active ? "outline" : "destructive"}
                            >
                              {librarian.active ? "Active" : "Deactivated"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleStatusMutation.mutate(librarian.id)}
                              disabled={toggleStatusMutation.isPending || librarian.id === 0}
                            >
                              {toggleStatusMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : librarian.active ? (
                                "Deactivate"
                              ) : (
                                "Activate"
                              )}
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManageLibrarians;
