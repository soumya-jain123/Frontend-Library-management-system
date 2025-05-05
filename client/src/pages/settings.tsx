import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  Moon, Sun, BellRing, Bell, BellOff, Eye, EyeOff, 
  Laptop, LogOut, Settings as SettingsIcon
} from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === "admin" ? "appearance" : "appearance");

  // Settings states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [dueDateReminders, setDueDateReminders] = useState(true);
  const [newArrivalsNotifications, setNewArrivalsNotifications] = useState(false);
  const [hideOverdueWarnings, setHideOverdueWarnings] = useState(false);

  // Handle theme change
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    toast({
      title: "Theme updated",
      description: `Theme has been set to ${newTheme}`,
    });
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Ensure admin users don't see notifications tab
  useEffect(() => {
    if (user?.role === "admin" && activeTab === "notifications") {
      setActiveTab("appearance");
    }
  }, [activeTab, user?.role]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Settings
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Customize your application experience
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            {user?.role !== "admin" && (
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            )}
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize how the application looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        className="flex flex-col items-center justify-center gap-2 h-24"
                        onClick={() => handleThemeChange("light")}
                      >
                        <Sun className="h-6 w-6" />
                        <span>Light</span>
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        className="flex flex-col items-center justify-center gap-2 h-24"
                        onClick={() => handleThemeChange("dark")}
                      >
                        <Moon className="h-6 w-6" />
                        <span>Dark</span>
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        className="flex flex-col items-center justify-center gap-2 h-24"
                        onClick={() => handleThemeChange("system")}
                      >
                        <Laptop className="h-6 w-6" />
                        <span>System</span>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue placeholder="Select font size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      This setting will change the font size across the application
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Theme preferences are automatically saved as you change them
                  </p>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            {user?.role !== "admin" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>
                      Control how and when you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-notifications">Email Notifications</Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Receive email notifications for important updates
                          </p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="push-notifications">Push Notifications</Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Receive browser notifications when you're using the app
                          </p>
                        </div>
                        <Switch
                          id="push-notifications"
                          checked={pushNotifications}
                          onCheckedChange={setPushNotifications}
                        />
                      </div>
                      
                      <div className="pt-2 border-t">
                        <h3 className="text-sm font-medium mb-3">Notification Types</h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                <BellRing className="h-4 w-4" />
                              </div>
                              <div>
                                <Label htmlFor="due-date-reminders">Due Date Reminders</Label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Get reminders when your books are about to be due
                                </p>
                              </div>
                            </div>
                            <Switch
                              id="due-date-reminders"
                              checked={dueDateReminders}
                              onCheckedChange={setDueDateReminders}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                <Bell className="h-4 w-4" />
                              </div>
                              <div>
                                <Label htmlFor="new-arrivals">New Book Arrivals</Label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Get notified when new books are added to the library
                                </p>
                              </div>
                            </div>
                            <Switch
                              id="new-arrivals"
                              checked={newArrivalsNotifications}
                              onCheckedChange={setNewArrivalsNotifications}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>Save Notification Settings</Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="privacy">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Control your privacy and data sharing preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                          <EyeOff className="h-4 w-4" />
                        </div>
                        <div>
                          <Label htmlFor="hide-overdue">Hide Overdue Warnings</Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Hide overdue warnings on your dashboard
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="hide-overdue"
                        checked={hideOverdueWarnings}
                        onCheckedChange={setHideOverdueWarnings}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                          <Eye className="h-4 w-4" />
                        </div>
                        <div>
                          <Label>Borrowing History Privacy</Label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Control who can see your borrowing history
                          </p>
                        </div>
                      </div>
                      <Select defaultValue="librarians">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">All Users</SelectItem>
                          <SelectItem value="librarians">Librarians Only</SelectItem>
                          <SelectItem value="private">Only Me</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2">Data Management</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm mb-2">Export your library data</p>
                        <Button variant="outline" size="sm">
                          Export Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Privacy Settings</Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="account">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-1">
                    <Label>Account Status</Label>
                    <div className="flex items-center gap-2 p-2 rounded-md border">
                      {user?.active ? (
                        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-600 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 border-red-200 text-red-600 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400">
                          Inactive
                        </Badge>
                      )}
                      {user?.role && (
                        <Badge variant="outline" className="ml-2">
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Linked Email</Label>
                    <div className="p-2 rounded-md border">
                      <p className="text-sm">{user?.email}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium mb-2">Account Actions</h3>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        asChild
                      >
                        <a href="/profile">
                          <SettingsIcon className="h-4 w-4 mr-2" />
                          Edit Profile
                        </a>
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {logoutMutation.isPending ? "Logging out..." : "Log Out"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-slate-50 dark:bg-slate-800/50 flex flex-col items-start">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <BellOff className="h-4 w-4" />
                    <p>Account Settings are applied immediately</p>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;