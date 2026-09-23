import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { Category } from "shared";
import { CATEGORY_OPTIONS } from "../lib/categories";
import { useModalPortalContainer } from "../lib/modal-portal";

interface CategorySelectProps {
  value: Category;
  onChange: (value: Category) => void;
}

// Same fix as PlatformSelect/SocialPlatformSelect: the native <select>'s open
// option list ignores our theme and renders white/illegible.
export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const portalContainer = useModalPortalContainer();

  return (
    <Select.Root value={value} onValueChange={(next) => onChange(next as Category)}>
      <Select.Trigger className="input-surface flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-accent">
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal container={portalContainer}>
        <Select.Content
          position="popper"
          sideOffset={4}
          className="input-surface z-50 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-subtle shadow-xl"
        >
          <Select.Viewport className="p-1">
            {CATEGORY_OPTIONS.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-text outline-none data-[highlighted]:bg-surface-raised"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="ml-auto">
                  <Check className="h-4 w-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
