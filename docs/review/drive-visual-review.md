# Drive watch visual review

The eleven requested frames were read individually with Figma design context and screenshots. Original vectors and raster guide assets are local. Compare each source/render pair in [drive-comparison.html](drive-comparison.html); the running Vite server also serves `/review/drive-watch.html`, with optional live pages.

## Differences corrected

| Screen | Correction |
| --- | --- |
| 01 Home | Preserved the original exported `app name` wordmark. Disabled variable-font optical sizing within DriveFrame to match static Figma Inter heading widths. |
| 02 Mount your phone | Kept dashboard SVG at 390×280 with separately positioned Figma tags and original tip icons. |
| 03 Line up your face | Preserved the intentionally clipped face and eye landmarks. Matched the original grey waiting control and its prototype destination. |
| 04 Quick eye check | Used the cropped 239.763×260 progress SVG at its original offset; matched the 280px gauge container and 132px check card. |
| 05 Driving | Corrected the stats divider to Figma’s flex layout with padding on the second column. Corrected Waze card’s left padding to 14px. Restored exact gauge caption. |
| 06 Can’t see your eyes | Restored the complete two-line description and changed the footer note to Body/Small. |
| 07 Getting tired | Implemented the existing hidden Content node 39:973, including original warning gauge, break card and spoken prompt. The user explicitly approved showing this content. |
| 08 Microsleep alarm | Matched the red frame, 96px warning circle, original icon and 191px rest card. |
| 09 Trip summary | Reproduced the individual bar heights and state colours, event rows and original event icons. |
| 05a Waze open | Restored “Tap to go back to Dormathon”, correcting the callout width and position. |
| 05b Tired while Waze is open | Reused Button with shared compact typography and sizing, original warning icon and map vector. |

## Intentional differences from screenshot exports

- Fake iOS status bars are omitted as requested; the content retains its design baseline and respects native safe areas.
- All visible Demo shortcuts and the fake map simulation hotspot are moved into the triple-tap logo panel. Views 05c and 05d are skipped.
- Getting tired shows its existing Content layers with user approval; the exported source screenshot has those layers hidden.
- Windows browser font rasterisation and fractional text metrics differ from Figma’s rendering; the spoken prompt can wrap one word earlier. Font family, weight, size, tracking and layout use the shared Figma text styles.

## Behaviour and checkpoint scope

Prototype reactions are preserved in `apps/web/design/drive-prototype-links.json`. The grey “Waiting for both eyes” control and rest-stop destinations deliberately follow those reactions. UI Back returns through the recorded browser history, with a direct-entry fallback. Trips, Car and Profile are explicitly pending until their requested sections are built.

The browser checks capture each screen at 430×932, verify 390px layouts, local assets, pinned actions, scroll clearance, setup/trip flow, warnings, maps return, keyboard/tap demo access, and history navigation. Chrome safe-area overrides test 47px and 59px top insets. Live camera, audio, model data and real maps hand-off belong to later guide steps and have not been implemented at this UI checkpoint.
