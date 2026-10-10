# Car check visual review

Source: Figma file YQotwkLvWP68ht9GzTbpf0, section 42:959. All seven frames were read with individual design contexts and screenshots; prototype links were inspected separately. Source references are in apps/web/design/car; exact contexts and links are in car-source.json and car-prototype-links.json. Original SVG exports are local under public/assets/car. No reference screenshot is used as product artwork.

Each source appears beside its rendered page in `/review/car-check.html` and the local car-comparison.html. The app omits the fake status bar and reuses the existing 40px IconButton, 56px Button and 260px TabBar. Figma instances of those shared components have scaled dimensions; body spacing was adjusted without changing the shared components. Font antialiasing differs between Figma and the Windows browser.

| Frame | Differences corrected |
|---|---|
| C1 Car check | Original 275×107px car at y162. Checks at y289, 91px rows and 12px gap; last-report section at y503. Verified source group clipping so shadows stop at the same boundaries. |
| C2 First check | Original 107×201px car and eight stops in a 300px scene. Compensated for the shared Back button's size so the scene starts at y119 and heading at y439. Steps card at y545, 193px tall. |
| C3 Photo walk-around | Original car, four rotated corner assets, check icons and 78px shutter. Header y62, progress y124, hint y160, framing corners y230–690 and capture panel y720. Live video replaces artwork; sample scratch/quality ticks are limited to preview. Safe areas adjust controls and panel. |
| C4 Engine sound check | Heading wrap corrected; 220px original ring at y225; listening, time and duration use source offsets. Waveform exported directly as SVG. Findings at y545 with 74px rows; source clipping retained. |
| C5 Car report | 250px map at y203 with original car and warning/success layers. Findings at y473 with 74px rows; prices corrected to row centres. |
| C6 Scratch detail | Original 570×222px car cropped inside the 220px photo at y119. Details y443, 200px tall; success panel y663, 73px tall. Two pinned actions reserve enough scroll space. |
| C7 Belt squeal trend | Original trend, forecast, threshold and point SVGs; chart at y203, 231px card. Prediction y454, explanation y569. Narrow-phone chart scales as a group so labels are fully visible. |

Browser checks cover 430×932 and 390×844, original asset loading, footer clearance, chart labels, top/bottom safe areas, native modal Escape, direct routes and the prototype navigation. Regression checks cover the component gallery, Drive watch and Onboarding.

Camera checks use generated canvas video with native permission gating in an isolated Chromium profile, never a physical camera. They cover local JPEG capture and blob thumbnails, denial and retry, disconnection, stream cleanup on close/capture/skip, late permission resolution, capture failures inside the modal, and delayed capture during browser Back and rapid Back/Forward. Captures and existing-damage marks last for the session; replacement blob URLs are revoked.

Review fixes include canonical back navigation for `/car`, capture generation invalidation during exits, visible modal capture errors, destination focus restoration and narrow-chart clipping.

Reports, recorder readings and prediction graphics are Figma sample defaults. Actual audio recording and diagnosis are later phases. The Figma Share and workshop controls have no prototype destination: Share uses the native share API or clipboard, and workshop search opens Google Maps. Reminder downloads a local two-week calendar event. C3 Skip advances to C4. Physical phone camera behaviour and certificate trust still need device review.
