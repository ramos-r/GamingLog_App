// The login page accepts a ?redirect= param so people land back where they
// were. Only same-site relative paths are allowed through, otherwise the login
// page could be used as an open redirect.
export function safeRedirect(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/";
  // Browsers strip tabs/newlines from URLs, so "/\t/evil.com" would become
  // "//evil.com". Backslashes and control characters have no business here.
  for (const char of value) {
    if (char === "\\" || char.charCodeAt(0) < 0x20) return "/";
  }
  return value;
}

// Builds the login URL for a page the visitor wanted. "/" is the default
// destination, so it doesn't need to be spelled out in the URL.
export function loginUrlFor(path: string, mode: "login" | "register" = "login"): string {
  const base = mode === "login" ? "/login" : "/register";
  return path === "/" ? base : `${base}?redirect=${encodeURIComponent(path)}`;
}
