const STAR_PATH =
  "M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z";

interface StarRatingProps {
  rating: number | null;
  className?: string;
}

export function StarRating({ rating, className }: StarRatingProps) {
  const value = rating ?? 0;

  return (
    <div className={className} role="img" aria-label={rating ? `${rating} out of 5 stars` : "Not rated"}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((position) => (
          <svg key={position} viewBox="0 0 24 24" className="h-3.5 w-3.5">
            <path d={STAR_PATH} fill={position <= value ? "url(#star-filled)" : "url(#star-empty)"} />
          </svg>
        ))}
      </div>
    </div>
  );
}
