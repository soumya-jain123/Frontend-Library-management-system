import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Notification } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  DollarSign,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NotificationListProps {
  notifications: Notification[];
}

const NotificationList: React.FC<NotificationListProps> = ({ notifications }) => {
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return notification.type === activeTab;
  });

  // Get unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PUT", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "borrow":
        return <BookOpen className="h-5 w-5 text-primary" />;
      case "return":
        return <RotateCcw className="h-5 w-5 text-green-500" />;
      case "due_date":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "fine":
        return <DollarSign className="h-5 w-5 text-red-500" />;
      case "request_update":
      case "hold_update":
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  // Format notification date
  const formatDate = (dateValue: string | Date) => {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(
          (now.getTime() - date.getTime()) / (1000 * 60)
        );
        return diffInMinutes === 0
          ? "Just now"
          : `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
      }
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>

        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="borrow">Borrow</TabsTrigger>
          <TabsTrigger value="due_date">Due Date</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center text-center">
                    <Bell className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">No notifications to display</p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    layout
                  >
                    <Card
                      className={`${
                        !notification.read
                          ? "border-l-4 border-l-primary bg-slate-50 dark:bg-slate-800/50"
                          : ""
                      }`}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <div className="rounded-full p-2 bg-slate-100 dark:bg-slate-700">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div>
                              <CardTitle className="text-base">
                                {notification.type.charAt(0).toUpperCase() +
                                  notification.type.slice(1).replace("_", " ")}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {formatDate(notification.createdAt)}
                              </CardDescription>
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary-500" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-sm">{notification.message}</p>
                      </CardContent>
                      {!notification.read && (
                        <CardFooter className="p-4 pt-0 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              markAsReadMutation.mutate(notification.id)
                            }
                          >
                            Mark as read
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationList;
