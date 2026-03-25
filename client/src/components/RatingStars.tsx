import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md";
  onRatingChange?: (rating: number) => void;
}

export default function RatingStars({ 
  rating, 
  maxRating = 10, 
  size = "sm",
  onRatingChange 
}: RatingStarsProps) {
  const sizeClass = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const displayRating = Math.min(Math.max(0, rating), maxRating);
  const fullStars = Math.floor(displayRating / 2);
  const halfStar = displayRating % 2 >= 1;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  const handleClick = (starIndex: number) => {
    if (onRatingChange) {
      onRatingChange((starIndex + 1) * 2);
    }
  };

  return (
    <div 
      className="flex items-center gap-0.5" 
      data-testid="rating-stars"
      title={`${rating}/10`}
    >
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className={`${sizeClass} fill-secondary text-secondary ${onRatingChange ? 'cursor-pointer' : ''}`}
          onClick={() => handleClick(i)}
        />
      ))}
      {halfStar && (
        <div className="relative">
          <Star className={`${sizeClass} text-muted`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={`${sizeClass} fill-secondary text-secondary`} />
          </div>
        </div>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          className={`${sizeClass} text-muted ${onRatingChange ? 'cursor-pointer' : ''}`}
          onClick={() => handleClick(fullStars + (halfStar ? 1 : 0) + i)}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground tabular-nums">
        {rating}/10
      </span>
    </div>
  );
}
