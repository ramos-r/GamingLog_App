import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { ModalPortalContext } from "../lib/modal-portal";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

// Native <dialog> + showModal() gives us focus trapping and Escape-to-close
// for free — no need to hand-roll either.
export function Modal({ open, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [dialogNode, setDialogNode] = useState<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === ref.current) {
      onClose();
    }
  }

  return (
    <dialog
      ref={(node) => {
        ref.current = node;
        setDialogNode(node);
      }}
      onClose={onClose}
      onCancel={onClose}
      onClick={handleBackdropClick}
      className="fixed inset-0 m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-subtle bg-surface p-6 text-text backdrop:bg-black/60"
    >
      <ModalPortalContext.Provider value={dialogNode}>{children}</ModalPortalContext.Provider>
    </dialog>
  );
}
