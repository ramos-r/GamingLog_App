import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Globe, Lock, Users, type LucideIcon } from "lucide-react";
import type { Visibility } from "shared";
import { VISIBILITY_OPTIONS } from "../lib/visibility";
import { useModalPortalContainer } from "../lib/modal-portal";

const ICONS: Record<Visibility, LucideIcon> = {
  PUBLIC: Globe,
  FRIENDS: Users,
  PRIVATE: Lock,
};

interface VisibilitySelectProps {
  id: string;
  value: Visibility;
  onChange: (value: Visibility) => void;
}

// Same styled Radix Select as SocialPlatformSelect, with a description under
// each option and repeated under the trigger for the selected one.
export function VisibilitySelect({ id, value, onChange }: VisibilitySelectProps) {
  const portalContainer = useModalPortalContainer();
  const selected = VISIBILITY_OPTIONS.find((option) => option.value === value) ?? VISIBILITY_OPTIONS[0];
  const SelectedIcon = ICONS[selected.value];
  const descriptionId = `${id}-description`;

  return (
    <div className="flex flex-col gap-1.5">
      <Select.Root value={value} onValueChange={(next) => onChange(next as Visibility)}>
        <Select.Trigger
          id={id}
          aria-describedby={descriptionId}
          className="input-surface flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="flex items-center gap-2">
            <SelectedIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
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
              {VISIBILITY_OPTIONS.map((option) => {
                const Icon = ICONS[option.value];
                return (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm text-text outline-none data-[highlighted]:bg-surface-raised"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <Select.ItemText>{option.label}</Select.ItemText>
                      <span className="text-xs text-muted">{option.description}</span>
                    </span>
                    <Select.ItemIndicator className="ml-auto mt-0.5">
                      <Check className="h-4 w-4" />
                    </Select.ItemIndicator>
                  </Select.Item>
                );
              })}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      <p id={descriptionId} className="text-xs text-muted">
        {selected.description}
      </p>
    </div>
  );
}
