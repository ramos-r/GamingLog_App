import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { PLATFORM_OPTIONS } from "../lib/platforms";
import { useModalPortalContainer } from "../lib/modal-portal";

interface PlatformSelectProps {
  value: string;
  onChange: (value: string) => void;
}

// Same fix as SocialPlatformSelect (PLAN.md Phase 13 §14.5): the native
// <select> rendered white/illegible on some systems regardless of the
// input-surface class, since browsers style the closed control and the open
// option list separately. Radix Select lets us style both consistently.
export function PlatformSelect({ value, onChange }: PlatformSelectProps) {
  const portalContainer = useModalPortalContainer();

  return (
    <Select.Root value={value} onValueChange={onChange}>
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
            {PLATFORM_OPTIONS.map((option) => (
              <Select.Item
                key={option}
                value={option}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-text outline-none data-[highlighted]:bg-surface-raised"
              >
                <Select.ItemText>{option}</Select.ItemText>
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
