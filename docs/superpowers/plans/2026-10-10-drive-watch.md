# Drive watch implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement task by task in this session.

**Goal:** Build the eleven requested Drive watch screens from section 42:958, stopping for section review.

**Architecture:** Compose existing AppFrame, Button, IconButton, TabBar and original Figma assets. Small screen files share setup steps, gauges, cards and a hidden demo panel. Route metadata governs push, fade and tab transitions.

**Tech Stack:** Existing React, TypeScript, Vite, Tailwind and Framer Motion; no added dependencies.

**Spec:** User Prompt 2 and Figma file YQotwkLvWP68ht9GzTbpf0, section 42:958.

## Global constraints

- Reuse existing tokens and text styles; any unbound Figma colour belongs in a documented shared token.
- Preserve exact copy and original vectors. No fake status bar or visible Demo links.
- Skip 05c and 05d. Live values become typed props with Figma defaults.
- User approved displaying the existing hidden Content layers of 07 Getting tired.
- Stop before onboarding, car check, trips and profile; out-of-section links expose honest pending routes.

## Review focus

Phone widths 390 and 430 must have no horizontal overflow; bottom actions remain reachable. Direct entry and browser back must work. Hidden demo panel requires three logo taps and keyboard access. Every local asset loads at its natural dimensions. Non-drive sections must be clearly identified as pending.

### Task 1: Source and assets

- [x] Retrieve each frame's design context and screenshot, and inspect prototype links.
- [x] Save screenshots and all used vectors locally; retain a source manifest.

### Task 2: Screens and navigation

- [x] Add shared helpers, eleven named screens, typed default data, and drive CSS.
- [x] Add route metadata, explicit back navigation and a triple-tap demo panel.
- [x] Keep existing component gallery accessible.

### Task 3: Browser and visual review

- [x] Run typecheck/build and existing tests.
- [x] Capture every screen at 430×932 and create side-by-side comparisons.
- [x] Check image geometry, copy, navigation, hidden panel, back transitions and smaller phones; fix discrepancies.
- [x] Run a fresh code review and resolve substantive findings.
- [x] Keep HTTPS Vite running with phone link and stop at the section checkpoint.


