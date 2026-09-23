import { createContext, useContext } from "react";

// showModal() promotes a <dialog> to the browser's top layer, which always
// paints above regular DOM content regardless of z-index. Radix's Select/
// DropdownMenu portal into document.body by default, so popped-over content
// they render would end up hidden behind the dialog (and its backdrop) —
// invisible and unclickable. Components that pop over content from inside a
// Modal should read this context and pass the node as their own Portal's
// `container`, so they mount inside the dialog's top-layer subtree instead.
export const ModalPortalContext = createContext<HTMLElement | null>(null);

export function useModalPortalContainer() {
  return useContext(ModalPortalContext);
}
