// Mounted once at the app root — StarRating instances reference these
// gradients by id instead of redefining them per star.
export function StarDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <linearGradient id="star-filled" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD079" />
          <stop offset="100%" stopColor="#FFAD15" />
        </linearGradient>
        <linearGradient id="star-empty" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C7C7C7" />
          <stop offset="100%" stopColor="#5C5C5C" />
        </linearGradient>
      </defs>
    </svg>
  );
}
