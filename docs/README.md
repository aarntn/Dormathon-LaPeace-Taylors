# BUCKL documentation

| Read this | To learn |
|---|---|
| [Root README](../README.md) | What BUCKL is, what is built, how to run and test it |
| [UX case study](UX-CASE-STUDY.md) | The problem, the design thinking, key decisions, the Figma prototype, and what we would test next |
| [Architecture and system design](ARCHITECTURE.md) | System, container, data and sequence diagrams. Eye-watch and emergency design. Security. Trade-offs |
| [Design system](DESIGN-SYSTEM.md) | Tokens, type, components, motion, and the Figma-to-code workflow |
| [Web app guide](../apps/web/README.md) | Folder map, scripts, routes, browser checks, troubleshooting |
| [API guide](../backend/README.md) | Routes, database setup, emergency behaviour, verification |
| [Readiness model](../ml/readiness/README.md) | How the pre-drive model was trained, and its honest limits |
| [Deploy a demo](DEPLOY_DEMO.md) | Render and Supabase steps for the hackathon demo |
| [Demo script and checklist](DEMO_SCRIPT.md) | The 4 to 5 minute run-of-show, setup, backups, likely questions, and what is real or scripted |
| [`AGENTS.md`](../AGENTS.md) | The shared project brief for people and coding agents |

## Design evidence

- [`assets/figma-vs-build`](assets/figma-vs-build): 20 side-by-side images, Figma on the left and the built app on the right. Built panels use test data, so numbers can differ where a screen is data-driven.
- [`review/latest-figma-drivesafe-audit.md`](review/latest-figma-drivesafe-audit.md): the screen-by-screen audit of the latest Figma against the build (65 frames, with status for each).
- [`review/drivesafe-visual-findings.md`](review/drivesafe-visual-findings.md): the first side-by-side comparison, which found the build had drifted from Figma.
- `review/*.png` and `review/*.json`: screenshots and results saved by the browser checks.
- `superpowers/plans`: the implementation plan for the latest Figma update.

## Keeping these current

When a screen changes in Figma, update the build, then the matching image in `assets/figma-vs-build`, then any numbers in these pages. Numbers in the docs (tests, screens, thresholds) come from the code. If you change a threshold, change it in `eyeConfig` and in [ARCHITECTURE.md](ARCHITECTURE.md#5-eye-watch-pipeline).
