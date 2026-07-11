# AI Usage Log — 10X CRM Project

This log documents my use of AI tools throughout the development of the 10X CRM project.
Format: Goal → Prompt → Result → What I learned.

---

## Entry 1 — Project Structure Planning

**Goal:** Understand how to split a multi-page Vanilla JS app into reusable modules without a build tool.

**Prompt (Claude):**
> "I'm building a 5-page Vanilla JS CRM app without any frameworks. Each page needs auth guard, theme toggle, and logout. What's the best way to share this logic without repeating it 5 times?"

**Result:** Used — AI suggested a `guard.js` module with `requireAuth()` and `requireGuest()` functions, and a `nav.js` module loaded via `<script>` tags on every protected page. I implemented this exactly, but I also added `applyTheme()` inside `initNav()` so theme is always applied on load.

**What I learned:** Modular JS without bundlers relies on script load order — `storage.js` must load before `guard.js` because guard calls `getSession()`. This ordering is critical and easy to get wrong.

---

## Entry 2 — Vague Prompt vs. Refined Prompt (Prompt Iteration)

**Goal:** Get help writing the `getVisibleClients()` function that combines filter + search + sort without mutating the original array.

**First (vague) prompt:**
> "Write a function that filters and sorts my clients array."

**Result of vague prompt:** AI returned a generic example that mutated the original array with `.sort()` directly — which would have broken my state.

**Refined prompt:**
> "Write a `getVisibleClients()` function in Vanilla JS. It takes no arguments, reads from a module-level `clientsState` array, and applies three operations in this order: (1) filter by `activeFilter` string matching `client.status`, (2) filter by `searchQuery` using case-insensitive `includes()` on `name` and `company`, (3) sort by `sortBy` variable ('newest'|'name'|'deal'). The original `clientsState` array must NOT be mutated — use a spread copy."

**Result:** Excellent, exactly correct function. I added it directly to `clients.js`.

**What I learned:** Specificity is everything with AI. Vague prompts give generic, often wrong code. The more I described the exact data structure, variable names, and constraints, the better the output. Always specify "do not mutate the original array" explicitly.

---

## Entry 3 — Debugging an AI-Generated Solution (Critical Evaluation)

**Goal:** AI helped me write the toast notification system, but there was a problem.

**Prompt:**
> "Write a toast notification function in Vanilla JS. It should appear bottom-right, animate in and out with CSS transitions, and auto-dismiss after 3 seconds."

**AI's first output problem:** The AI used `setTimeout` then immediately added the CSS class in the same tick:
```javascript
container.appendChild(toast);
toast.classList.add('toast-show'); // WRONG - no transition fires
setTimeout(() => toast.remove(), 3000);
```

**What I noticed:** The animation wasn't playing because the browser hadn't painted the element before the class was added. The CSS transition needs at least one frame to recognize the initial state.

**My fix:**
```javascript
container.appendChild(toast);
requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-show')));
```

Using two nested `requestAnimationFrame` calls guarantees the element is in the DOM and painted before the transition class is applied.

**What I learned:** AI doesn't always know browser rendering quirks. I had to debug, understand *why* it didn't work (CSS transition needs a computed start state), and fix it myself. This is why you can't blindly copy AI output.

---

## Entry 4 — Understanding async/await for API Calls

**Goal:** Write the `loadClients()` function with proper loading state, try/catch error handling, and a Retry button.

**Prompt:**
> "Write an async function `loadClients()` for a Vanilla JS CRM. It should: show a loading indicator in a div#clients-list, fetch from 'https://dummyjson.com/users?limit=30' using async/await, handle errors with try/catch showing 'Could not load clients. Check your connection and try again.' with a Retry button, and on success map the data.users array to Client objects and call renderClients()."

**Result:** Used directly — well-structured. I added `response.ok` check that AI initially omitted (AI used `fetch()` but didn't check if the HTTP status was 2xx).

**What I learned:** `fetch()` only rejects on network failure, not on HTTP errors like 404 or 500. Always check `response.ok` after `await fetch(...)`. This is a common mistake that AI sometimes makes.

---

## Entry 5 — Password Validation Regex

**Goal:** Understand and implement the password validation logic (min 8 chars, at least 1 letter, at least 1 digit).

**Prompt:**
> "Explain two ways to check if a string contains at least one letter and at least one digit in JavaScript. Show both a loop approach and a regex approach."

**Result:** Used — AI explained both:
- Regex: `/[a-zA-Z]/.test(password)` and `/[0-9]/.test(password)`
- Loop: iterate characters and track flags

I chose regex because it's concise and readable. I can explain exactly what `/[a-zA-Z]/` means: character class `[]` matching any letter a-z or A-Z, `.test()` returns true if the pattern is found anywhere in the string.

**What I learned:** Regex is powerful but must be explainable. I made sure I could explain every part of the patterns used before adding them to my code. The PRD even mentioned this approach as valid — knowing why it works matters more than just copying it.

---

*All AI interactions in this project were used as a learning tool, not a copy-paste machine. Every piece of AI-generated code was reviewed, tested, and understood before being committed.*
