# Profile visual review

Figma file `YQotwkLvWP68ht9GzTbpf0`, section `46:1056`. All five frames were read with design context and screenshots, then compared side by side against the browser at 430 × 932. Narrow-phone checks use 390 × 844.

| Frame | Source node | Matched geometry |
| --- | --- | --- |
| P1 Profile | 44:934 | Header y66/h60; stats y142/h177; My cars y335/h109; settings y460/h321. |
| P2 Driving stats | 44:1084 | Heading y119.28/h70; alert chart y209.28/h248; hours y477.28/h156; insights y653.28/h172. |
| P3 My cars | 45:986 | Heading y119.28/h86; selected car y225.28/h156; second car y401.28/h154. |
| P4 Add a car | 45:1066 | Heading y119.28/h64; search y203.28/h56; scan row y279.28/h91; popular group y390.28/h349. |
| P5 Privacy and legal | 45:1152 | Heading y119.28/h34; notice y173.28/h115; Your data y308.28/h209; Legal y537.28/h207; version y764.28. |

Body layout matches source geometry within 2px. Original exported SVGs are local, unchanged, and rendered at their intrinsic dimensions. The two charts scale as complete scenes on narrow screens. Exports round the source's fractional brand/car artwork to 51px and 94 × 37px, respectively; both remain centred in their source slots.

Intentional shared-shell differences: no fake status bar; shared 40px IconButton, 56px Button and 260 × 66 TabBar instead of the scaled-down screen instances. Footer controls sit 34px above the viewport bottom and respect larger safe-area insets. Font weights were inspected in the browser and match the source tokens; raster antialiasing differs between Figma and Chromium.

Prototype links match Figma: stats, My cars, Add a car, maps selection, face-scan introduction, Privacy and legal, tab navigation, and all Back links. Popular model selection returns to My cars with a rightward push. Search filters the five source models. The source defines no action for account edits, alarm settings, car switching/details, plate scanning, legal/data rows or period selection; these remain static. No data deletion or remote writes are performed.

Verification: production build; five existing unit tests; `--profile` browser review covering all frames, original assets, search, route transitions, direct-entry and history Back, safe areas, narrow layouts and footer clearance; `--profile-comparison` with five pairs and live toggle; Drive and Trips browser regressions; independent code review with no actionable findings. HTTPS Profile and comparison endpoints return HTTP 200 using the development certificate as the trusted CA. Physical phone review remains a user-device check.

Phone links on the same Wi-Fi/hotspot:
- https://172.20.10.4:5173/profile/profile
- https://172.20.10.4:5173/review/profile.html

All five Prompt 2 sections now have their screen implementations and visual checkpoints. Stop here. Next is Prompt 3: Live eye tracking and the alarm.
