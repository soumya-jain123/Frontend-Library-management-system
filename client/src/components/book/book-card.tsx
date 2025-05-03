import { Book } from "@shared/schema";
import { motion } from "framer-motion";
import { BookOpen, Star, StarHalf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface BookCardProps {
  book: Book;
  onAction?: (book: Book) => void;
  actionLabel?: string;
  showRating?: boolean;
}

const BookCard = ({ 
  book, 
  onAction, 
  actionLabel = "Add to Reading List",
  showRating = true 
}: BookCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Fetch book ratings if showRating is true
  const { data: ratingData } = useQuery({
    queryKey: [`/api/book-ratings/${book.id}`],
    enabled: showRating
  });

  // Default cover image for books without one
  const defaultCover = `https://ui-avatars.com/api/?name=${encodeURIComponent(book.title)}&background=6366f1&color=fff&size=250`;
  
  // Format average rating to nearest 0.5
  const formatRating = (rating: number) => {
    return Math.round(rating * 2) / 2;
  };

  const averageRating = ratingData?.averageRating ? formatRating(ratingData.averageRating) : 0;
  const totalRatings = ratingData?.totalRatings || 0;

  // Generate stars based on rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-3 w-3 fill-amber-500 text-amber-500" />);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-3 w-3 fill-amber-500 text-amber-500" />);
    }
    
    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-3 w-3 text-amber-300" />);
    }
    
    return stars;
  };

  return (
    <motion.div 
      className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="h-48 overflow-hidden relative">
        {book.coverImage ? (
          <motion.img 
            className="w-full h-full object-cover"
            src={book.coverImage} 
            alt={`${book.title} cover`}
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <div className="w-full h-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-primary-600 dark:text-primary-400" />
          </div>
        )}
        
        {book.quantity > 0 && book.available === 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md">
            Unavailable
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 truncate" title={book.title}>
          {book.title}
        </h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 truncate" title={book.author}>
          {book.author}
        </p>
        
        {showRating && (
          <div className="flex items-center mb-3">
            <div className="flex text-amber-500">
              {renderStars(averageRating)}
            </div>
            <span className="text-xs text-slate-700 dark:text-slate-300 ml-1">
              {averageRating.toFixed(1)} ({totalRatings})
            </span>
          </div>
        )}
        
        {/* Category and availability */}
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
          <span>{book.category}</span>
          <span>{book.available} of {book.quantity} available</span>
        </div>
        
        {onAction && (
          <Button 
            variant="outline" 
            size="sm"
            className="w-full"
            disabled={book.available === 0}
            onClick={() => onAction(book)}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default BookCard;
