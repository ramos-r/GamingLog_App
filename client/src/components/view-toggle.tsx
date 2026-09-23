type ViewMode = "category" | "all";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex w-fit rounded-full border border-subtle p-1">
      {(
        [
          { value: "category" as const, label: "By category" },
          { value: "all" as const, label: "All games" },
        ]
      ).map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`rounded-full px-4 py-1.5 font-baloo text-xs font-bold transition-colors ${
            value === option.value ? "bg-accent-gradient text-accent-foreground" : "text-muted hover:text-text"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
