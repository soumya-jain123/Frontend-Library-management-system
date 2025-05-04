import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  className?: string;
  change?: number;
  changeLabel?: string;
  isLoading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  className,
  change,
  changeLabel,
  isLoading = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col">
            {/* Top section with title */}
            <div className="p-4 pb-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
            </div>
            
            {/* Main content */}
            <div className="px-4 pb-4 flex justify-between items-center">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
              )}
              <div className={cn("rounded-full p-2 flex items-center justify-center h-8 w-8", className)}>
                {icon}
              </div>
            </div>
            
            {/* Bottom section with description - styled like the reference image */}
            <div className="bg-slate-50 dark:bg-gray-800 p-2 text-xs border-t border-slate-200 dark:border-gray-700 px-4">
              {change !== undefined && (
                <span className={cn(
                  "font-medium inline-flex items-center mr-1",
                  change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-slate-500"
                )}>
                  {change > 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : change < 0 ? (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  ) : null}
                  {Math.abs(change)}
                </span>
              )}
              <span className="text-slate-600 dark:text-slate-400">{changeLabel || description}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatsCard;
