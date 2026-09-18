import type { KeyboardEvent } from "react";
import { STAR_PATH } from "./star-rating";

interface StarRatingInputProps {
  value: number | null;
  onChange: (value: number) => void;
  className?: string;
}

export function StarRatingInput({ value, onChange, className }: StarRatingInputProps) {
  const current = value ?? 0;

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(Math.min(5, current + 1));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(Math.max(1, current - 1));
    }
  }

  return (
    <div
      role="slider"
      aria-label="Rating"
      aria-valuemin={1}
      aria-valuemax={5}
      aria-valuenow={current || undefined}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`flex w-fit items-center gap-1 rounded outline-none focus-visible:ring-2 focus-visible:ring-accent ${className ?? ""}`}
    >
      {[1, 2, 3, 4, 5].map((position) => (
        <button
          key={position}
          type="button"
          tabIndex={-1}
          onClick={() => onChange(position)}
          aria-label={`${position} star${position > 1 ? "s" : ""}`}
          className="p-0.5"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path d={STAR_PATH} fill={position <= current ? "url(#star-filled)" : "url(#star-empty)"} />
          </svg>
        </button>
      ))}
    </div>
  );
}
