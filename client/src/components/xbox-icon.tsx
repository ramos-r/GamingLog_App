interface XboxIconProps {
  className?: string;
}

// Simple-icons has no Xbox mark, so this stays a small original glyph
// (Phase 1's platform-badge set) reused wherever an Xbox icon is needed —
// see PLAN.md Phase 13 §14.5.
export function XboxIcon({ className = "h-3 w-3" }: XboxIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M5 5 L19 19" />
      <path d="M19 5 L5 19" />
    </svg>
  );
}
