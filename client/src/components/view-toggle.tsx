import { useLayoutEffect, useRef, useState } from "react";

type ViewMode = "category" | "all";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

const OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "category", label: "By category" },
  { value: "all", label: "All games" },
];

interface PillRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillRect, setPillRect] = useState<PillRect | null>(null);

  useLayoutEffect(() => {
    const index = OPTIONS.findIndex((option) => option.value === value);
    const button = buttonRefs.current[index];
    if (!button) return;
    setPillRect({ left: button.offsetLeft, top: button.offsetTop, width: button.offsetWidth, height: button.offsetHeight });
  }, [value]);

  return (
    <div className="relative inline-flex w-fit rounded-full border border-subtle p-1">
      {pillRect && (
        <div
          aria-hidden="true"
          className="absolute rounded-full bg-accent-gradient transition-all duration-300 ease-out"
          style={{ left: pillRect.left, top: pillRect.top, width: pillRect.width, height: pillRect.height }}
        />
      )}
      {OPTIONS.map((option, index) => (
        <button
          key={option.value}
          ref={(el) => {
            buttonRefs.current[index] = el;
          }}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`relative z-10 rounded-full px-4 py-1.5 font-baloo text-xs font-bold transition-colors duration-300 ${
            value === option.value ? "text-accent-foreground" : "text-muted hover:text-text"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
