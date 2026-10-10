# Onboarding implementation

Build only Figma section 42:957, screens O1–O13. Read AGENTS.md and reuse the established tokens, Button, IconButton, Input, Option and AppFrame.

1. Retrieve each frame's context, screenshot, vector assets and prototype destinations.
2. Implement named screen routes and a session-local form draft with Figma defaults. O6 is a modal sheet over O5; retain the background and restore it when dismissed.
3. Match source layouts, copy, original artwork and prototype timers. Do not implement authentication or camera processing in this UI section.
4. Capture each route at 430 × 932, compare with its source, correct differences, and test 390px layouts, navigation, editing, sheet dismissal and timed scan completion.
5. Run build and existing regression checks, request a fresh review, and publish a local comparison page for the section checkpoint.

Completed: all 13 routes, the O6 modal, editable draft, prototype timers, original artwork and per-frame comparisons. Build and five unit checks pass. Browser verification passes for Onboarding, Drive watch and the component gallery. Fresh review findings were fixed and confirmed. The side-by-side page is /review/onboarding.html; the full flow begins at /onboarding/splash. Stop here before Car check.
