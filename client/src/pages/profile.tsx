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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { 
  User, Mail, Key, ShieldCheck, BookOpen, History, 
  Calendar, Loader2, CheckCircle2, Save, Clock
} from "lucide-react";
import { User as UserType, Borrowing, BookRating } from "@shared/schema";

// Profile update schema
const profileUpdateSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
});

// Password update schema
const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;
type PasswordUpdateValues = z.infer<typeof passwordUpdateSchema>;

const Profile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile update form
  const profileForm = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  // Password update form
  const passwordForm = useForm<PasswordUpdateValues>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Fetch user's borrowing history
  const { data: borrowingHistory, isLoading: isLoadingBorrowings } = useQuery<Borrowing[]>({
    queryKey: [`/api/borrowings/user/${user?.id}`],
    enabled: !!user,
  });

  // Fetch user's book ratings
  const { data: bookRatings, isLoading: isLoadingRatings } = useQuery<BookRating[]>({
    queryKey: [`/api/book-ratings/user/${user?.id}`],
    enabled: !!user,
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateValues) => {
      const res = await apiRequest("PUT", `/api/users/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedUser: UserType) => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      queryClient.setQueryData(["/api/user"], updatedUser);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordUpdateValues) => {
      const res = await apiRequest("PUT", `/api/users/${user?.id}/password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onProfileSubmit = (data: ProfileUpdateValues) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordUpdateValues) => {
    updatePasswordMutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              My Profile
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Manage your account settings and view your library activity
            </p>
          </div>
          
          {user && (
            <Badge variant="outline" className="px-3 py-1 text-sm">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-center">
                  <div className="h-24 w-24 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <span className="text-3xl font-semibold">
                      {user?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <CardTitle>{user?.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {user?.email}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-slate-500 dark:text-slate-400">Username</span>
                    <span className="font-medium">{user?.username}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-slate-500 dark:text-slate-400">Account Status</span>
                    <span>
                      {user?.active ? (
                        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-600 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 border-red-200 text-red-600 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400">
                          Inactive
                        </Badge>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-slate-500 dark:text-slate-400">Member Since</span>
                    <span className="font-medium">{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="profile">Profile Settings</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="activity">Library Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                          <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="pt-2">
                            <Button
                              type="submit"
                              disabled={updateProfileMutation.isPending}
                            >
                              {updateProfileMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="security">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>
                        Update your password to keep your account secure
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                          <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input 
                                      className="pl-10" 
                                      type="password" 
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input 
                                      className="pl-10" 
                                      type="password" 
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Password must be at least 6 characters
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input 
                                      className="pl-10" 
                                      type="password" 
                                      {...field} 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="pt-2">
                            <Button
                              type="submit"
                              disabled={updatePasswordMutation.isPending}
                            >
                              {updatePasswordMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                "Update Password"
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="activity">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <BookOpen className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                          Recent Borrowings
                        </CardTitle>
                        <CardDescription>
                          Your recent book borrowing activity
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingBorrowings ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : !borrowingHistory || borrowingHistory.length === 0 ? (
                          <div className="text-center py-6">
                            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-slate-400">
                              You haven't borrowed any books yet
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {borrowingHistory.slice(0, 5).map((borrowing) => (
                              <div key={borrowing.id} className="flex justify-between items-start p-3 border rounded-md">
                                <div>
                                  <h4 className="font-medium">{borrowing.book?.title}</h4>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {borrowing.book?.author}
                                  </p>
                                  <div className="flex items-center mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(borrowing.borrowDate).toLocaleDateString()}
                                    {borrowing.returnDate && (
                                      <>
                                        <span className="mx-1">-</span>
                                        <Clock className="h-3 w-3 mr-1" />
                                        {new Date(borrowing.returnDate).toLocaleDateString()}
                                      </>
                                    )}
                                  </div>
                                </div>
                                {borrowing.returnDate ? (
                                  <Badge variant="outline" className="bg-green-50 border-green-200 text-green-600 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400">
                                    Returned
                                  </Badge>
                                ) : new Date(borrowing.dueDate) < new Date() ? (
                                  <Badge variant="destructive">Overdue</Badge>
                                ) : (
                                  <Badge variant="outline">Active</Badge>
                                )}
                              </div>
                            ))}
                            {borrowingHistory.length > 5 && (
                              <div className="text-center pt-2">
                                <Button variant="outline" size="sm">
                                  <History className="h-4 w-4 mr-2" />
                                  View All History
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <History className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                          Book Ratings & Reviews
                        </CardTitle>
                        <CardDescription>
                          Books you've rated and reviewed
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingRatings ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : !bookRatings || bookRatings.length === 0 ? (
                          <div className="text-center py-6">
                            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-slate-400">
                              You haven't rated any books yet
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {bookRatings.slice(0, 3).map((rating) => (
                              <div key={rating.id} className="p-3 border rounded-md">
                                <div className="flex justify-between">
                                  <h4 className="font-medium">{rating.book?.title}</h4>
                                  <div className="flex">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <svg
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < rating.rating
                                            ? "text-yellow-400 fill-current"
                                            : "text-gray-300 dark:text-gray-600"
                                        }`}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                  </div>
                                </div>
                                {rating.comment && (
                                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                                    "{rating.comment}"
                                  </p>
                                )}
                                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(rating.ratingDate).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;