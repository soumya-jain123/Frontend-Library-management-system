import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { 
  Search, MoreHorizontal, UserCheck, UserX, 
  BookOpen, AlertTriangle, CheckCircle2, Loader2 
} from "lucide-react";
import { User, Borrowing } from "@shared/schema";

const ManageStudents = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

  // Fetch students
  const { data: students, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/student"],
  });

  // Fetch borrowings for selected student
  const { data: studentBorrowings, isLoading: isLoadingBorrowings } = useQuery<Borrowing[]>({
    queryKey: [`/api/borrowings/user/${selectedStudent?.id}`],
    enabled: !!selectedStudent,
  });

  // Fetch fine report for selected student
  const { data: fineReport } = useQuery<{ userId: number; totalFines: number }>({
    queryKey: [`/api/reports/fines/user/${selectedStudent?.id}`],
    enabled: !!selectedStudent,
  });

  // Toggle student status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/users/${id}/toggle-status`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: `Student ${data.active ? "activated" : "deactivated"}`,
        description: `${data.name}'s account has been ${
          data.active ? "activated" : "deactivated"
        }.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/student"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter students based on search term
  const filteredStudents = students?.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle view student details
  const handleViewDetails = (student: User) => {
    setSelectedStudent(student);
    setViewDetailsOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Manage Students
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            View and manage student accounts and their borrowing activities
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search students..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400">
            {filteredStudents?.length || 0} students
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Student Accounts</CardTitle>
              <CardDescription>
                Manage student accounts and view their borrowing history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !students || students.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                  <UserX className="h-12 w-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold mb-1">No students found</h3>
                  <p className="text-sm text-slate-500 max-w-md">
                    There are no student accounts in the system yet.
                  </p>
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents?.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.name}
                          </TableCell>
                          <TableCell>{student.username}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={student.active ? "outline" : "destructive"}
                            >
                              {student.active ? "Active" : "Deactivated"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewDetails(student)}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => toggleStatusMutation.mutate(student.id)}
                                  className={student.active ? "text-destructive" : "text-primary"}
                                >
                                  {student.active ? (
                                    <>
                                      <UserX className="h-4 w-4 mr-2" />
                                      Deactivate Account
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Activate Account
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Student Details Dialog */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Student Details</DialogTitle>
              <DialogDescription>
                View student information and borrowing history
              </DialogDescription>
            </DialogHeader>

            {selectedStudent && (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <span className="text-xl font-semibold">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{selectedStudent.name}</h3>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <p>Username: {selectedStudent.username}</p>
                      <p>Email: {selectedStudent.email}</p>
                      <div className="mt-2">
                        <Badge
                          variant={selectedStudent.active ? "outline" : "destructive"}
                        >
                          {selectedStudent.active ? "Active Account" : "Deactivated Account"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          Books Borrowed
                        </h4>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {isLoadingBorrowings ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            studentBorrowings?.filter(b => !b.returnDate).length || 0
                          )}
                        </p>
                      </div>
                      <div className="rounded-full bg-blue-100 dark:bg-blue-800 p-2">
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          Outstanding Fines
                        </h4>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          ${fineReport?.totalFines || 0}
                        </p>
                      </div>
                      <div className="rounded-full bg-amber-100 dark:bg-amber-800 p-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-medium mb-3">Borrowing History</h4>
                  {isLoadingBorrowings ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !studentBorrowings || studentBorrowings.length === 0 ? (
                    <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
                      No borrowing history found for this student.
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Book</TableHead>
                            <TableHead>Borrowed</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentBorrowings.map((borrowing) => (
                            <TableRow key={borrowing.id}>
                              <TableCell className="font-medium">
                                {borrowing.book?.title}
                              </TableCell>
                              <TableCell>
                                {new Date(borrowing.borrowDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {new Date(borrowing.dueDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {borrowing.returnDate ? (
                                  <div className="flex items-center">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                                    <span>Returned</span>
                                  </div>
                                ) : new Date(borrowing.dueDate) < new Date() ? (
                                  <div className="flex items-center">
                                    <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                                    <span>Overdue</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <BookOpen className="h-4 w-4 text-blue-500 mr-1" />
                                    <span>Borrowed</span>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setViewDetailsOpen(false);
                  setSelectedStudent(null);
                }}
              >
                Close
              </Button>

              {selectedStudent && (
                <Button
                  variant={selectedStudent.active ? "destructive" : "default"}
                  onClick={() => {
                    toggleStatusMutation.mutate(selectedStudent.id);
                    setViewDetailsOpen(false);
                  }}
                  disabled={toggleStatusMutation.isPending}
                >
                  {toggleStatusMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : selectedStudent.active ? (
                    <UserX className="h-4 w-4 mr-2" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  {selectedStudent.active ? "Deactivate Account" : "Activate Account"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ManageStudents;
