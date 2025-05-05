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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "../../shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, PlusCircle, AlertCircle, Trash2 } from "lucide-react";


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
  const [librarianToDelete, setLibrarianToDelete] = useState<number | null>(null);

  const deleteLibrarian = async (librarianId: number) => {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No authorization token found");
  
    const response = await fetch(`http://127.0.0.1:8080/admin/delete-user/${librarianId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete librarian");
    }
  };

  const { data: librarians, isLoading, error } = useQuery({
    queryKey: ["/admin/get-user-by-role/LIBRARIAN"],
    // enabled: !!user && user.role.toLowerCase() === "admin",
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authorization token found");
  
      const response = await fetch("http://127.0.0.1:8080/admin/get-user-by-role/LIBRARIAN", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
  
      if (!response.ok || data.statusCode !== 200) {
        throw new Error(data.message || "Failed to fetch librarians");
      }
  
      return data.userList;
    },
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
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authorization token found");
      console.log("Creating librarian with data:", data); // Debugging line
      const payload = {
        email: data.email,
        password: data.password,
        displayName: data.name,
      };
  
      const response = await fetch("http://127.0.0.1:8080/admin/add-librarian", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      const result = await response.json();
  
      if (!response.ok || result.statusCode !== 200) {
        throw new Error(result.message || "Failed to create librarian");
      }
  
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Librarian created",
        description: "The librarian account has been created successfully.",
      });
      form.reset();
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/admin/get-user-by-role/LIBRARIAN"] });
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
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authorization token found");
  
      const res = await fetch(`http://127.0.0.1:8080/admin/enable-disable/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await res.json();
      if (!res.ok || data.statusCode !== 200) {
        throw new Error(data.message || "Failed to toggle user status");
      }
      
      // console.log("Toggle status response:", data); // Debugging line
      return data; // contains `enabled` and `user`
    },

    onSuccess: (data) => {
      toast({
        title: `${data.user.displayName}`,
        description: `${data.message}.`,
      });
  
      queryClient.invalidateQueries({ queryKey: ["/admin/get-user-by-role/LIBRARIAN"] });
    },
  
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  

  const deleteLibrarianMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authorization token found");
    
      const res = await fetch(`http://127.0.0.1:8080/admin/delete-user/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete librarian");
      }
    },    
    onSuccess: () => {
      toast({
        title: "Librarian deleted",
        description: "The librarian has been deleted successfully.",
      });
      setLibrarianToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/admin/get-user-by-role/LIBRARIAN"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete librarian",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateLibrarianValues) => {
    createLibrarianMutation.mutate(data);
  };

  const handleDeleteLibrarian = () => {
    if (librarianToDelete !== null) {
      deleteLibrarianMutation.mutate(librarianToDelete);
    }
  };

  let filteredLibrarians = librarians?.filter((librarian) => {
    const displayName = librarian.displayName?.toLowerCase() || ''; // Default to empty string if null or undefined
    const username = librarian.username?.toLowerCase() || ''; // Default to empty string if null or undefined
    const query = searchQuery?.toLowerCase() || ''; // Default to empty string if null or undefined
  
    return (
      displayName.includes(query) ||
      username.includes(query) ||
      librarian.email.toLowerCase().includes(query)
    );
  });

  // Filter librarians
  // let filteredLibrarians = librarians?.filter(
  //   (librarian) =>
  //     librarian.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     librarian.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     librarian.email.toLowerCase().includes(searchQuery.toLowerCase())
  // );

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
                            {librarian.displayName}
                          </TableCell>
                          <TableCell>{librarian.username}</TableCell>
                          <TableCell>{librarian.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={librarian.enabled ? "outline" : "destructive"}
                            >
                              {librarian.enabled ? "Active" : "Deactivated"}
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
                              ) : librarian.enabled ? (
                                "Deactivate"
                              ) : (
                                "Activate"
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setLibrarianToDelete(librarian.id)}
                              disabled={librarian.id === 0 || deleteLibrarianMutation.isPending}
                            >
                              {deleteLibrarianMutation.isPending && librarianToDelete === librarian.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Delete
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

        <Dialog open={librarianToDelete !== null} onOpenChange={open => !open && setLibrarianToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this librarian? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLibrarianToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteLibrarian}
                disabled={deleteLibrarianMutation.isPending}
              >
                {deleteLibrarianMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ManageLibrarians;
