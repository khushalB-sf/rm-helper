# Inline comment style guide

The chat summary uses `[Category] CRITICAL/MAJOR/MINOR/GOVERNANCE` labels because it's a structured
report for the human reading it in-app. **The comments actually posted to GitHub must not look like
that.** They should read like a colleague left a note while reading the diff — specific, brief,
occasionally soft, sometimes with a suggested fix, never templated.

## Before → after

| Templated (chat-summary style, do NOT post this) | Natural (post this instead) |
| --- | --- |
| `[Hooks] useEffect missing cleanup for subscription — file.tsx:42` | "This subscription never gets torn down — worth returning a cleanup function here so it doesn't leak when the component unmounts." |
| `[TypeScript] any used on API response type — file.ts:18` | "Mind typing this response instead of `any`? Even a quick `interface UserResponse { ... }` would catch a shape mismatch here at compile time." |
| `[Next.js] Sync params access, deprecated in Next 15` | "Since we're on Next 15, `params` is a Promise now — this needs an `await` or it'll warn (and may hard-error in a future version)." |
| `[Tailwind] Hardcoded hex color instead of theme token` | "Could this pull from the theme token instead of the hardcoded hex? Keeps it in sync if the palette ever changes." |
| `[Performance] Inline arrow fn passed to memoized child` | "Since `Row` is memoized, this inline arrow recreates on every render and defeats it — worth wrapping in `useCallback` (or hoisting if it doesn't need the closure)." |
| `[Accessibility] Missing alt text on decorative-looking image` | "This image is missing `alt` — if it's purely decorative an empty `alt=\"\"` is fine, otherwise it needs a real description for screen readers." |
| `[Architecture] Raw fetch call in component instead of service layer` | "Might be worth pulling this fetch into the service layer alongside the other API calls, rather than calling it straight from the component — see how `userService.ts` does it." |

## Rules

1. **No brackets, no severity words.** Never write `[Category]`, `CRITICAL`, `MAJOR`, `MINOR`,
   `GOVERNANCE`, or similar labels inside a posted comment body. Those exist only in the chat summary
   for the human operator.
2. **One idea per comment.** If a single line has two unrelated issues, post two comments rather
   than bullet-pointing both into one.
3. **State the concrete fix when it's obvious.** "Wrap this in `useMemo`" beats "this causes
   unnecessary re-renders."
4. **Vary the phrasing.** Don't reuse the exact same sentence template for every finding of the same
   category — a real reviewer doesn't write identically-worded comments twenty times in a row.
   Reference the specific file/variable/value involved.
5. **Match tone to severity, but stay collegial.** A Critical-level issue can still be phrased as a
   direct statement ("This needs a null check — `user` can be undefined on first render") without
   being harsh. A Minor-level issue can be phrased as a light suggestion ("Might be worth extracting
   this into its own component, though it's not urgent at this size").
6. **Reference existing code in the repo when it strengthens the point** ("...see how
   `useFetchOrders` handles this") rather than inventing a hypothetical example.
7. **Version-gate naturally, don't cite the rulebook.** Say "since we're on Next 15" or "in React 19
   this works differently now," not "per Phase 4 of the review methodology."
8. **Keep it short.** Most inline comments should be 1–3 sentences. Save longer explanations for the
   rare case where the reasoning genuinely isn't obvious from the rule itself.
9. **Never mention that this is an automated/AI review inside the comment body.** The whole point of
   per-line comments is that they read as a normal review — the "who reviewed this" context belongs
   in the chat with the user, not in the GitHub comment thread.
10. **Governance findings get the same natural treatment.** A dependency or architecture note reads
    just as collegially as a bug note — e.g. "date-fns and moment are both in package.json now — might
    be worth consolidating on one" rather than "[Governance] Duplicate-purpose dependency detected."
