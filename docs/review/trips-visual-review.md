# Trips visual review

Figma file `YQotwkLvWP68ht9GzTbpf0`, section `105:1365`. Source screenshots and app captures were compared side by side at 430 × 932. Browser checks also cover 390 × 844, safe areas, scrolling and footer clearance.

| Frame | Source node | Review |
| --- | --- | --- |
| T1 Trips | 105:1366 | Header y66, pattern y142/h176, weekly lists y371/h213 and y637/h145. Corrected a 1px pattern title line-height difference. Original 356 × 44 chart and status SVGs. |
| T2 When you get tired | 105:1479 | Heading y115.28, chart y193.28/h196, facts y405.28/h128, reminders y549.28/h93. Original 356 × 131 chart scales as a complete scene on narrow phones. |
| T3 Late drive heads-up | 105:1545 | Icon y115.28/h72, heading y203.28, reasons y281.28/h159 and plan y456.28/h93. Original moon and bullet SVGs; Back verified visible and unobscured. |

Body layout geometry matches the source within 2px. Shared controls retain the component-library dimensions: 40px IconButton, 56px Button and 260 × 66 TabBar. These source screen instances were scaled down in Figma; the app consistently reuses the established components. Footer controls remain 34px above the viewport bottom, adjusted for larger safe areas. The fake status bar is omitted and the T2 Demo link is available only through the existing hidden triple-tap-logo panel. Font antialiasing varies between Figma and browser captures.

All five history rows open the source Trip summary frame. Pattern opens T2; Back and Turn on night reminders return through history to T1 with a rightward push. T3 Back returns to T2; Not tonight opens Home using route tab metadata; Start with the plan opens Mount your phone. The user-specified global transition rules take precedence over the source's 0.4s dismissal dissolve.

Trips, patterns and risk reasons remain typed Figma sample defaults. The night-reminder choice is stored only in the current app session. Notification scheduling, prediction and actual sensitive-alarm/voice behaviour belong to later phases.

Verification: production build; five existing unit tests; Trips browser checks; source/app comparison with live toggle; Drive and Car browser regressions; independent code review. Vite HTTPS is listening on port 5173 and both Trips and its comparison page return HTTP 200 when verified using the local development certificate as the trusted CA. Physical phone review remains a user-device check.

Phone links on the same Wi-Fi/hotspot:
- https://172.20.10.4:5173/trips/trips
- https://172.20.10.4:5173/review/trips.html

Stop here before Profile.
