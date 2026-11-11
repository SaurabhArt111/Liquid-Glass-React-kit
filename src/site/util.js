/** `code` spans → <code>, everything else escaped. For trusted, in-repo strings only. */
export const inline = (s) => ({
  __html: s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/`([^`]+)`/g, "<code>$1</code>"),
});
