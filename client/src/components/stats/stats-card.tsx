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
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
              )}
            </div>
            <div className={cn("rounded-full p-3", className)}>
              {icon}
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            {change !== undefined && (
              <span className={cn(
                "font-medium flex items-center",
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
            <span className="text-slate-600 dark:text-slate-400 ml-1">{changeLabel || description}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatsCard;
