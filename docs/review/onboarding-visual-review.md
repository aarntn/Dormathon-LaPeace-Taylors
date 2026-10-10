# Onboarding visual review

Source: Figma file YQotwkLvWP68ht9GzTbpf0, section 42:957. Each O1–O13 frame was retrieved with design context and screenshot. All illustrations, logos, wordmarks and icons come from the original assets. References are in apps/web/design/onboarding; browser captures and geometry are in docs/review.

The comparison page presents each source next to its rendered page. The app omits the fake iOS status bar. Browser font rasterisation can differ slightly from Figma.

| Frame | Differences corrected |
|---|---|
| O1 Splash | Original wordmark export positioned using its glyph baseline; logo y340 and tagline y506. |
| O2 Loading | Original 72px brand mark and wordmark baseline; progress y520, 65% default. |
| O3 Welcome | Hero y70, heading y434; original halo and 342 × 133px car. Footer actions align to the source. |
| O4 Sign up | Form y206 and focused email state; consent/action spacing corrected. |
| O5 What’s your car | Search y253; result y329; popular y452; manual row y767. Row line heights corrected. |
| O6 Perodua Myvi sheet | Sheet y289, height615, bottom28. Original 288 × 112px car. Versions y524 and action y814. Scrim45%. Initial modal focus does not paint a spurious option ring. |
| O7 Car details | Filled plate/year/mileage defaults restored. Original swatches and specification-card spacing. |
| O8 Service and condition | Form y253, height551. Source defaults retained for stock/modified and existing marks. |
| O9 How you drive | Options y275, height340; 12px gaps and source multi-selection defaults. |
| O10 Which maps app | Original source step bars; options y309, height291; tip y620, height113. |
| O11 Face scan intro | Original face/eye artwork. Tip padding corrected to y532, height156. |
| O12 Face scan | Track y220, percentage y540, checks y600. Original track SVG masks the arc so its prop stays consistent with displayed progress. Footer apostrophe preserved in UTF-8. |
| O13 All set | Success y126; heading y238; summary y348, height301. Current draft values appear in the summary. |

Browser checks cover 430 × 932 and 390 × 844, scrolling to all content, 34px bottom actions, top/bottom safe areas, prototype timers, editable draft persistence, exclusive and multiple selections, native Escape, direct-entry back, and the complete flow to Home. Regression checks include the existing component gallery and Drive watch.

Fresh review findings resolved: engine edits for 1.3 G now use the draft consistently; repeated sheet dismissal cannot skip screens; exiting sheets are inert; scan progress and its ring use the same clamped value.

Authentication and live camera processing are outside this screen-building step. Popular/manual car rows have no Figma prototype destinations. The typed OnboardingProvider initialDraft prop accepts supplied data and defaults to the Figma values. Preview query links pause timed navigation for comparison.
