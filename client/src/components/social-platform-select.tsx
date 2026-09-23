import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { SOCIAL_PLATFORM_OPTIONS } from "../lib/social-platforms";
import { SocialPlatformIcon } from "./social-platform-icon";
import { useModalPortalContainer } from "../lib/modal-portal";

interface SocialPlatformSelectProps {
  value: string;
  onChange: (value: string) => void;
}

// Radix's Select is unstyled/headless — this is a styling pass over it
// (input-surface background, text/placeholder tokens) to fix a bug in the
// native <select> it replaces: the OS's own light dropdown rendered platform
// names almost invisible until hovered. See PLAN.md Phase 13 §14.5.
export function SocialPlatformSelect({ value, onChange }: SocialPlatformSelectProps) {
  const portalContainer = useModalPortalContainer();

  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="input-surface flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-accent">
        <span className="flex items-center gap-2 truncate">
          <SocialPlatformIcon platform={value} className="h-4 w-4 shrink-0" />
          <Select.Value />
        </span>
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
            {SOCIAL_PLATFORM_OPTIONS.map((option) => (
              <Select.Item
                key={option}
                value={option}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-text outline-none data-[highlighted]:bg-surface-raised"
              >
                <SocialPlatformIcon platform={option} className="h-4 w-4 shrink-0" />
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
