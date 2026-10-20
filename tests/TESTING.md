# WIP 3 checks — 20 October 2026

## Latest pass: Chinese / English interface

Six native-button language groups now appear on the cover, stage-one HUD, capacity notice, physical-stage HUD, reveal HUD and ending page. Static text, page title, accessibility labels, dynamic physics hints/charge/progress/error messages, reveal descriptions, fate labels and both ending summaries use the local dictionaries in `src/i18n.js`. Existing Chinese copy is preserved. The animal artwork, English Adopted stamp, physical forces/geometry, breeding cadence, finishing lock, capacity timing, reveal timing, fate indices and simulation weights are unchanged. Header wrapping is measured by the existing viewport/ResizeObserver path, so translated text does not leave a stale physics/input transform.

The default is Chinese. Only `live-stock-language` is persisted in this browser's localStorage; no game score, nickname, snapshot or external credential is stored. Storage errors are caught: switching still works within the page, but cannot persist when storage is blocked. Switching updates existing text/nodes rather than restarting gameplay, re-creating a world, rerolling outcomes or resetting a clock. If a lever is currently held, switching cancels that pull safely as resizing already does, without spending an animal or firing it.

All **52** automated tests passed. Eight new i18n cases check complete matching dictionaries/placeholders, every HTML translation/aria key, six switch groups, unchanged numeric interpolation, stable four-outlet label ordering, English translations of existing physical errors, preference persistence/defaults, blocked storage and DOM text/pressed-state updates.

```powershell
node --test tests/i18n.test.mjs tests/breeding.test.mjs tests/capacity-notice.test.mjs tests/physics-stage.test.mjs tests/physics-renderer.test.mjs tests/physics-viewport.test.mjs tests/reveal.test.mjs
```

Chrome exercised actual language-button clicks on all six screens, including an in-flight first-stage ending window, physical flight and the reveal. Between English/Chinese clicks with the controlled clock held still, animal/adoption counts, world count, every body ID/position/velocity, exit records and final numeric results matched exactly; language changes did not advance the controlled clock. All six selected-button groups updated together. Apart from the deliberately bilingual Chinese language-selector label, visible English text contained no unlocalized Chinese. Native clicks confirmed preference retention after reload; a deliberately blocked localStorage getter still allowed switching. Switching with a live lever drag cancelled it without a launch, replacement body or spent animal.

The cover, capacity notice and ending were checked in both languages at 1440×900, 390×844, 320×568 and 844×390. The translated physical header was checked across the existing ten-size matrix, with native dragging, uniform apparatus fit, decoration clearances and DPR-2 alignment retained. English desktop/narrow cover, physical stage, notice, first-stage HUD and ending captures were visually inspected. The 320px cover and long ending remain vertically scrollable; the full ending prose and restart are reachable, with no horizontal overflow. Missing-vendor feedback was also checked in both languages.

The complete regression included the 45-animal development sample and a real 459-animal saturated snapshot, four actual animal outcomes with a natural returned-ball relaunch, the 2.5-second fate hold, full reveal, ending and native restart. Capacity pause/continue/reset and finishing-stage click lock were rerun. No uncaught JavaScript exceptions occurred. These are controlled-clock Chrome checks, not human usability tests, device FPS measurements or a physical phone trial; Firefox/Safari and public deployment remain unverified. No commit, push, publication or leaderboard service was added in this pass.

Manual check: Ctrl+F5 the local page, use 中文 / EN on each screen, adopt an animal before switching, and verify its counter stays unchanged by the language choice. During physical flight switch languages and continue playing; if switching while pulling, expect a cancelled pull rather than a shot. At the ending, check all four counts and percentages remain identical across languages. Reload to check the saved choice, then select Chinese again if desired.

## Latest pass: finish the final wave before the existing capacity notice

The first stage now latches a `finishing` state on the unchanged visual-density threshold or existing geometry-based population limit. No threshold values, animal caps, litter counts, breeding cadence, offspring movement or packing parameters changed in this pass. Native Canvas input becomes inert immediately; the existing active-only pointer/adoption guard also rejects synthetic input. The breeding entry point rejects new waves outside `active`, while the already scheduled final wave is still advanced. Redistribution cannot cancel the latched ending or restore adoption.

The Canvas continues rendering in `finishing`. Entry to the existing capacity notice requires an empty parent queue, no pending source timestamp, and every delayed/in-flight child's actual `birth.complete` flag. The previous fixed saturation delay, estimated busy-until time and packing timeout no longer decide this transition. Existing particles may finish fading, but no new adoption particles are emitted. The capacity page, text, design, 4.4-second continuation, Matter.js physics, outlets and subsequent reveal/ending remain unchanged. Restart clears the waiting mode and queues. The earlier optional leaderboard plan has been cancelled; no leaderboard code or data service was added.

All **44** automated tests passed. Six additional cases cover the exact existing threshold boundaries, irreversible click/new-wave locking, completion of the queued wave without cutting off litters, delayed/unfinished newborns blocking transition regardless of elapsed time, immediate eligibility when animation is already complete, and restart restoring normal adoption/breeding. Repeated transitions are rejected. One regression sets the estimated busy-until time far into the future and proves that real animation completion, rather than that timer, is decisive.

Chrome also observed a natural in-flight ending window with the first-stage HUD still visible, the existing notice still hidden, and the Canvas still drawing animals. Twelve native clicks plus one synthetic pointer event during that window caused no additional adoptions or particle emissions. The notice appeared only after the tracked births completed, without a physical world being created early. Manual continuation created exactly one Matter world; duplicate continuation did not create another. A separate full regression completed four actual physics animals (including a returned-ball relaunch) and both 45-animal and 490-animal reveals/endings, then restarted normally; no uncaught exceptions occurred. Final-page checks at desktop and narrow sizes and missing-library recovery also passed. These use a controlled browser clock, not a human trial or real-time FPS benchmark. Physical phones and other browsers were not tested.

Manual checks for this pass:

1. Run the existing local server, open the normal root URL and refresh with Ctrl+F5. Below the threshold, confirm adoption counts/particles and breeding still work.
2. Stop adopting near capacity. Watch the last moving/delayed offspring finish, without an early notice or blank Canvas. If no offspring remain when the threshold is reached, the notice may appear immediately; this is intentional, not a fixed wait.
3. During a final in-flight split, repeatedly click visible animals: the adoption counter must remain unchanged and no fresh adoption particles should appear. Already queued litters may still add animals; this is the same wave, not a new wave.
4. Confirm the existing capacity explanation appears once, then its normal continue/automatic flow reaches physics once. Play through the four animals normally.
5. Restart and confirm 45 initial animals, zero adoptions and normal clickable animals, with no stale ending transition.

## Latest pass: fate hold, accelerated breeding, smaller stamp and ending legend

The reveal now adds a separate 2,500ms `fates` hold after the animal-to-symbol crossfade has fully completed. Every symbol stays fully visible, with no skull yet visible; the original skull crossfade follows. Hidden-tab pause uses the same existing clock. Total reveal duration is approximately 10.7 seconds.

Wave-start intervals now decrease from 4,800ms, through 4,032ms and about 3,387ms, to a 3,200ms floor. Later staggered parent windows are bounded by that cadence, replacing the old fixed eight-second target; the actual 1,400ms offspring movement, per-child offsets, sparse-source selection, litter counts, packing and population protections remain intact. Recovery gaps also have a floor. The 72×36 CSS-pixel Adopted stamp is 25% smaller than the previous 96×48 version, with an independently adjusted bold label and centered 36,18 hotspot.

Ending cards reuse `drawExitIcon` for their four inline Canvas icons; no second icon vocabulary was introduced. Added prose distinguishes this work's lack of suitable longitudinal data from an unsupported claim that nobody has ever collected data. Actual physical outcomes and creative whole-screen outcomes remain separate. No online or browser-local leaderboard has been implemented, and no external data service, account or publication setting was changed.

All **38** automated tests passed: the previous regressions, five new breeding tests, and one new full-opacity fate-hold test. Reveal continuity tests include both boundaries of the new hold. The new breeding checks cover monotonic bounded intervals, the original early-wave parent ranges, staggered waves four through six with at least 30 sources when space permits, completed offspring movement before the next wave, adopted-source skipping and restart reset.

```powershell
node --test tests/breeding.test.mjs tests/capacity-notice.test.mjs tests/physics-stage.test.mjs tests/physics-renderer.test.mjs tests/physics-viewport.test.mjs tests/reveal.test.mjs
```

Chrome, driven with native pointer events and a controlled animation clock, completed both the 45-animal development sample and a normally saturated 479-animal snapshot. The latter was reached after one native adoption in 1,580 controlled frames from restart to physics (including the capacity notice); this is not a real-time FPS measurement or a guaranteed completion time. Both samples completed the real four-animal physics stage, all reveal phases, the final page and native restart. Actual returning-ball relaunch and once-only outlet results were retained.

Browser draw traces confirmed that all fate icons were unchanged at full opacity for more than two controlled seconds, and that hiding the document also paused this hold. The 2,500ms exact boundary is additionally tested in the unit suite. All four ending legend canvases and the new data note were present. Final pages were checked at 1440×900, 390×844, 320×568 and 844×390 for horizontal overflow and scrollable access to restart; desktop/mobile and the full-symbol hold screenshots were visually inspected. Counts summed to the saved snapshot and rounded percentages to 100.0%; no uncaught JavaScript exceptions were observed. Missing-library recovery also passed. A separate capacity check passed all four notice viewports and manual/automatic/pause/reset checks; its subsequent longer browser session encountered a CDP evaluation timeout. The full gameplay check succeeded on a fresh browser run. Physical phones, other browsers, public hosting updates and shared leaderboard behavior remain unverified.

Manual check: refresh the local page with Ctrl+F5, inspect the smaller Adopted stamp on a real mouse, compare early/late breeding cadence, finish four real animal exits, count roughly 2.5 seconds once only fate symbols are visible, then inspect the final icon labels, explanatory prose and restart. The headless captures do not prove operating-system cursor text readability; please check its physical display size on your screen. Publishing still requires committing and pushing this local update.

## Latest pass: capacity explanation between stages one and two

The saturated, settled first stage now enters a separate `capacity` mode before creating the physical world. It freezes the animals and population counters, hides the first-stage HUD, and displays the requested capacity/adoption-speed explanation over the existing animals. After 4,400ms of visible app time it enters physics; a button can continue immediately, and restart cancels the notice. There are no independent timeout callbacks. A new `?stage=capacity` preview uses the same explicitly documented initial 45-animal sample as the existing physics preview; normal visits still begin at START.

All **32** automated tests passed, including three new capacity-state regressions: frozen population/no early physical world; clamped/paused countdown; reset without a stale automatic transition. The renderer adds only a frozen capacity branch, and the physical simulation, breeding, adoption, particles and ending logic are otherwise retained.

Chrome checked the notice at 1440×900, 390×844, 320×568 and 844×390. Both controls remain reachable without horizontal clipping. A hidden-document wait longer than the full notice duration did not advance the countdown or move the animals. Manual continuation creates exactly one world, duplicate continuation cannot create another, automatic continuation works after the configured hold, and native restart removes the notice without a later accidental transition. Screenshots were visually inspected. Publishing has not been performed; README contains GitHub Pages instructions only.

The normal START path also reached a real saturated population of 454 animals, displayed the notice before any new physical animal was loaded, then automatically continued into the four-animal apparatus. The rerun covered real spring launches, returned-ball relaunch, once-only exit pulses, the 45-animal preview's complete ending, the real full-population reveal entry and mid-reveal restart, and missing-library recovery with no uncaught exceptions. This browser harness uses a controlled animation clock, not measured FPS or a human user trial.

Run the current suite:

```powershell
node --test tests/capacity-notice.test.mjs tests/physics-stage.test.mjs tests/physics-renderer.test.mjs tests/physics-viewport.test.mjs tests/reveal.test.mjs
```

## Previous pass: stage-two fixes, then the simplified ending

Implementation followed the requested order: the top-panel removal, additional decoration sizing and momentary exit feedback were implemented and browser-checked before adding stage three. The physics module, forces, configuration and stage-one animal/breeding/packing/particle modules were not changed.

Run all current tests from the project root:

```powershell
node --test tests/physics-stage.test.mjs tests/physics-renderer.test.mjs tests/physics-viewport.test.mjs tests/reveal.test.mjs
```

All **29** tests passed. The existing tests now expect a 360ms exit flash, not a permanently closed/lit face, and a 1.35 sizing target (another 12.5% over the previous 1.2 version). The 3,608 decoration constraints still pass; tight screens cap motif size without moving the machine. Seven new tests cover immutable snapshot-to-simulation mapping, exclusion of adopted animals, independent real records, configurable weights/zero categories, percentage rounding to 100.0%, continuous reveal phases, staggered per-item disappearance, empty/single-item edge cases, reset in both new modes, and one short pulse per collection.

Stage-two Chrome checks were completed before stage-three implementation: ten viewports, actual native lever drags, four unique animals including one returned-ball relaunch, full-ball outlet timing, one pulse per result, intermediate flash intensities, no continued flash drawing after expiry, and no upper acrylic-panel rectangle drawing. First-stage adoption, breeding, direct transition, reset and missing-library recovery also passed. Canvas captures were visually inspected for the clean upper baffles and larger motifs. These use a controlled animation clock, not measured real-time FPS or a human user trial.

The ending was then checked in actual Chrome through four real animals. Its 45-animal development sample completed every reveal phase, kept animal positions still, paused while the document was hidden, displayed the exact four requested sentences, and reached a final page whose simulated counts total 45 and displayed percentages total 100.0%. Four actual physical records are labelled separately. The Matter world is empty at the reveal, and native final-page restart clears the cards and returns to 45 animals / 0 adoptions. The final page was checked at 1440×900, 390×844, 320×568 and 844×390, with no horizontal overflow and a reachable restart via vertical scrolling.

A separate normal run adopted one animal, bred to a real saturated snapshot of 482 remaining animals, completed another four real physical animals, and reproduced all 482 static animals at the reveal. Native mid-reveal restart cleared the scene; the old ending did not reappear while the restarted game continued. No uncaught JavaScript exceptions were observed. The development shortcut intentionally retains only its real 45-animal sample, not an artificially inflated full-screen population.

A further normal run with 474 remaining animals completed **the entire** reveal and final-page sequence, not just entry. All 474 positions stayed static; hiding the document paused the reveal; all fade/symbol/skull/disappearance phases rendered; displayed counts totalled 474 and percentages totalled 100.0%. The four real outlet records stayed separate. Desktop/portrait/short-landscape final pages and native ending restart passed. Screenshots in `screenshots/wip3-*.png` show this full-population run. All browser runs use a controlled clock and are not human usability trials or device frame-rate measurements.

Current changed production files: `src/physics-materials.js` (remove upper acrylic and persistent outlet face), `src/physics-feedback.js` (360ms flash), `src/physics-viewport.js` (additional motif growth), `src/physics-renderer.js` (use flash; export the shared exit-symbol drawing), `src/reveal.js` (new simulation, timing and cached symbol rendering), `src/state.js` (new resettable fields), `src/canvas-renderer.js` (reveal branch), `src/main.js` (phase transitions, ending DOM and restart), `index.html` and `src/styles.css` (isolated reveal/ending UI). Tests, README, credits and screenshots were updated. `src/physics-stage.js` and stage-one animal/breeding/packing/particle code retain their pre-edit hashes.

Manual check: start the server as documented in README and refresh with Ctrl+F5. Inspect the top baffles, side-motif clearances and momentary outlet pulse using `?stage=physics`; finish four unique animals and allow any returned animal to be relaunched. After the last pulse, watch the approximately eight-second reveal and check all four final counts/percentages, the simulation disclaimer, separate real records, vertical scrolling and restart. Use normal START rather than the 45-animal shortcut to inspect the crowded reveal. Restart once during the reveal as well.

Known limits: basic crossfades rather than final motion polish; no sound; simulation weights are illustrative equal weights, not data; physical phones, other browsers and device FPS remain unverified. The final page explicitly says that continuing breeding is not death and that skulls are a visual metaphor.

## Earlier WIP 2 records (historical)

The entries below record earlier implementation passes. Their persistent shutter, 20%-growth-only and no-ending descriptions have been superseded by the current behavior above.

## Automated physics checks

From the project root, with Node.js installed:

```powershell
node --test tests/physics-stage.test.mjs tests/physics-renderer.test.mjs tests/physics-viewport.test.mjs
```

The tests import the actual local Matter.js 0.20.0 build and production physics module. They do not replace collision calculations with scripted paths. The eight sensor fixtures deliberately position bodies in known lanes to test detection, not to demonstrate a production route. Each pair of adjacent lanes maps to one of four outcomes.

The twenty-two test cases cover:

1. Taps, pulls below the threshold, clamped maximum travel and cancelled pulls.
2. Every half-unit pull distance from 120 to 240 (241 samples): increasing first-launch speed, gravity before piston contact, actual piston/obstacle collisions and a real exit. When a ball naturally returns, the test user operates the lever again, cycling 180 / 240 / 156 / 210 pull depths, up to eight attempts; production never auto-relaunches. The sweep must reach all four outlets, without assigning an outlet in advance.
3. Four unique animals, including extra lever releases after returns: unique records, zero-count outlets, no fifth animal and no remaining animal body after completion.
4. Detection of all eight lanes only after the entire rendered circle and physical bounds clear the existing line. Centre-only crossings produce no record or shutter; full crossings produce exactly one of each. Duplicate events do not add records.
5. Completion at simulated 30, 60 and 144 Hz render update rates, using the same fixed physics step.
6. Out-of-bounds and stalled-shot errors without fabricated outcomes.
7. Snapshot isolation, exclusion of an adopted animal, physics retry, and full restart clearing bodies, event listeners and records.
8. A readable error when the physics library is missing.
9. The enlarged 48-unit animal has at least its full diameter plus six units of gap between each pin and baffle. Control travel and actual spring compression use separate, bounded scales.
10. A portrait board with six rows of 27 staggered pins, approximately 68.6-unit clear lane widths, and clearance between pins and between pins and side walls.
11. Six decorative cover sprites drawn at half opacity, outside the board, without creating bodies; small vertical floating movement and no floating with reduced motion enabled. The draw-call trace is not a pixel-level rendering test.
12. The fixed metal surface cache is reused between frames, and is regenerated when the raster scale changes. Rendering does not mutate physical positions, velocities, shapes, materials or filters.
13. Uniform 774:932 scaling, complete apparatus/handle containment, and pointer coordinate round trips across eight representative sizes, from 320×568 to 2560×1440.
14. A grid of 902 intermediate window sizes (320–1920 wide, 360–1200 high) keeps all six decorative motifs and their floating amplitude outside the machine and header. Borderline aspect ratios reserve small motif rows instead of overlapping controls.
15. The main field is 613 units wide and the entire launch well is 58 units wide, bounded directly by the moved partition and outer casing. There are no inner launch rails or side clamps. The 54-unit piston fits within the casing; a rear travel stop retains the y=904 stop plane and is collision-filtered to the piston only. Pins, baffles and outlet geometry expand with the main field.
16. Four controlled visits to the same outlet produce four results and four shutter events without extra colliders or forced diversity. Closure is monotonic over 280ms, remains closed, retains its backing during repeated visits, and resets on disposal. These sensor fixtures do not demonstrate natural trajectories.

17. No gate body exists. A controlled above-partition fixture travels through the real entrance in both directions while retaining the permanent partition and roof deflector.
18. A 156-unit pull naturally returns with the open entrance. The same dynamic body can wait over 30 simulated seconds, then relaunch via another piston collision without changing its position, velocity, angle, identity or unique-animal count at release. No outcome or closure is recorded merely for returning.
19. Cancelling a returned-ball pull parks the piston at its current position instead of snapping it through the ball; the ball remains dynamic and a later valid release works.
20. The fourth animal can return and relaunch even when the unique-animal launch counter is already 4; only its actual outlet crossing completes the round.
21. At spacious desktop sizes, motifs grow by exactly 20%, have staggered horizontal positions and unequal vertical gaps, and are not mirrored. Repeated layout calls produce identical positions, not random jumps.
22. Across 3,608 combinations of window dimensions (320–1920 by 360–1200) and header heights (80 / 100 / 140 / 180), all six full floating envelopes, including the 1.3px outline, retain at least 12px pair clearance and avoid the header, viewport margins and full machine/handle bounds.

## Larger, staggered decorative animals (latest visual change)

Only production file `src/physics-viewport.js` changed for this pass. The existing apparatus fit, presentation scale, pointer transform, renderer, physics, lever, exits, header, SVG artwork, opacity and floating animation are unchanged. A SHA-256 comparison of all non-decoration viewport fields across the existing 902-size grid matches the pre-edit baseline (`fb1fb22e49a2cf26ae53c27c2fae1c04925504b0473d4313864d345004794c33`). The physics/config/main/materials/feedback/styles/HTML file hashes also match their pre-edit values.

The target diameter is the old diameter multiplied by 1.2. Each side has its own safe rectangle and stable variation seed. Free space is divided into unequal end margins and unequal gaps, with alternating small lateral offsets; both groups retain the same circle diameter. Floating envelopes and a 12px minimum gap are reserved before adding offsets. On tight screens only the decoration diameter is capped, and the existing upper/lower motif bands are reused; the central apparatus is never resized or repositioned to accommodate the enlarged motifs.

All 22 automated tests passed. Actual Chrome layout checks passed at 1440×900, 1920×1080, 1024×768 (DPR 2), 768×1024, 390×844, 320×568, 844×390, 768×880, 640×768 and 390×480. Native Canvas draw tracing confirmed motif diameter, separation and clearance from the actual header, viewport and machine/handle at two different floating phases per size. Each size still accepted a native 75% pull cancelled without firing, with the ball/renderer aligned. Desktop and portrait screenshots were visually inspected and refreshed. This pass did not repeat the earlier full browser four-animal/relaunch session; the unchanged physics is covered by the rerun automated regressions and file-hash comparison. Physical phones and other browsers remain unverified.

## Open entrance and same-ball relaunch (previous functional change)

All twenty then-existing tests passed on Node.js 24 after the open-entrance change. The stage-one animal/breeding/packing/particle modules were not edited in that change. Gravity, spring force, masses, restitution, pull range and four-animal limit are unchanged. Outlet category mapping, full-ball clearance rules and outlet shutters are preserved. The 241-sample force sweep passes with user relaunches when needed and still reaches all four outlets. These fixed-input results test reachability, not real-world probabilities or a promise of four different outcomes per round.

The upper gate body and its dedicated drawing function have both been removed. The lower partition, outer casing, roof deflector, piston and piston-only stop remain. A returning ball stays dynamic; once it settles on the piston, only the piston is parked and the handle is rearmed. While waiting or pulling again, Matter.js still integrates the ball. A valid release un-parks the piston; no ball position/velocity reset or new body is used. Returning/cancelled-pull waiting does not consume the 30-second flight timeout.

The standalone 241-input sweep observed 34 natural first-flight returns. With explicit test-user lever inputs after a return, all samples reached a real outlet, with at most two relaunches and no boundary or timeout errors. Final outlet counts were 50 / 49 / 53 / 89. First-launch speed still spans approximately 26.44–53.05. These counts include the documented repeat inputs and are not first-launch outcome frequencies.

The updated headless Chrome check used native pointer drag/release on the actual page. The second animal naturally returned after its 156-unit first pull. It waited over 30 simulated seconds with no result or closure recorded; the next lever release relaunched the same Matter body (ID 54) with progress unchanged at 2/4. Four unique animals completed with five releases in total, actual outlet indices 1 / 1 / 1 / 2, one closure each, and no fifth animal. Ten viewport sizes, in-motion resize, 390px portrait firing, retry/reset, stage-one adoption/breeding/direct transition and missing-library recovery passed with no uncaught JavaScript exceptions. The controlled animation clock is not a human trial or a performance benchmark. Screenshots `wip2-returned.png` and `wip2-relaunched.png` record the returned/relaunched states.

Earlier results below describe their corresponding previous implementation; in particular, the old automatic entrance gate and four-total-release assumption have been superseded. The current limit is four unique animals, not four total lever releases.

## Actual browser checks performed

Chrome headless was exercised through the DevTools protocol with native browser mouse events. A controlled `requestAnimationFrame` clock accelerated the experience; this is **not** a human user trial or a real-time performance benchmark.

Verified:

- The actual page loads, draws a 48-unit animal and accepts pointer-captured handle dragging/release. The control now uses a light grey-beige bed and small dark-gold markings rather than a large yellow area; 50%–100% remains the valid firing interval.
- The portrait board, 27 pins, eight bottom lanes and six large side animals were visually inspected in the captured page. Browser draw tracing confirms the decorations have 50% opacity, move gently, and stop floating with the reduced-motion preference.
- A below-threshold pull spends no shot. Four native pointer drag/release sequences complete; repeated input while a shot is in motion and after the fourth shot does not create a fifth animal.
- Outlet results are observed, not hard-coded force-to-outlet mappings; fractional pointer conversion and the revised geometry can change a collision sequence, and repeated outcomes remain valid.
- Resizing during a drag cancels it without firing.
- Drawn animal center and radius agree with the actual Matter body after viewport changes, including device pixel ratio 2 and a 390×844 portrait viewport.
- Physics retry clears the old world and starts at 0/4; full restart clears old worlds and returns to 45 animals and zero adoptions.
- First-stage adoption changes 45 to 44 with one adoption; reproduction continues; a normally filled first stage directly enters physics, without an explanatory placeholder.
- Blocking the local Matter.js request produces a readable error and still allows restarting the first stage.
- No uncaught JavaScript exceptions occurred in this browser check.

## Whole-device left/right repartition

The outside frame stays 774×932. The partition moves right by 53 units, expanding the main field from 560 to 613 while narrowing the entire launcher from 111 to 58. The old extra guide rails are removed, not merely hidden. The main-field share of the two clear regions grows from about 83.5% to 91.4%.

The production pin and baffle coordinates are expanded across the actual main-field width, and all eight outlet sensors/dividers are regenerated across that width. The launch centre moves to x=1298 and the roof deflector is derived from the revised field edge and right casing. A 54-unit piston fits the 58-unit well; a single flush rear-plane carriage stop maintains the original impulse timing without adding side clamps. Its collision filter accepts the piston and excludes the animal; the animal continues to collide with the real partition, outer casing, piston and main-field obstacles.

A standalone sweep of 241 half-unit pull depths reached the four outlets 46 / 45 / 60 / 90 times, with no stalls or boundary errors. Minimum and maximum pre-field launch speeds remained approximately 26.44 and 53.05, matching the prior spring setup. This is a finite input test, not equal-probability balancing.

The updated Chrome run completed four native-pointer shots with actual outlet indices 1 / 2 / 1 / 2 (lanes 3 / 4 / 2 / 5), with no fifth shot or duplicate result. Ten window sizes, in-motion resize, full-clearance/closing timing, retry, stage-one adoption/breeding/direct transition and missing-library recovery also passed. The repeated browser outcomes were retained as real results; the wider force sweep separately establishes four-outlet reachability.

Files changed for this repartition: `src/config.js`, `src/physics-stage.js`, `src/physics-materials.js`, the geometry regression in `tests/physics-stage.test.mjs`, `README.md`, this record and preview/keyframe screenshots. The responsive transform, stage-one logic, outlet feedback module and final-page scope are unchanged.

## Previous local palette / shutter pass

The six stage-two palette references are isolated in `PHYSICS_PALETTE`; the stage-one palette is unchanged. Metal highlight contrast was reduced. The subsequent whole-device repartition above replaces the interim inner-rail design. No shutter body is added to the physical world.

The browser harness observes actual result/closure events and real Canvas draw calls without selecting routes. For each of four native-pointer shots it checks that the trailing edge is below the unchanged outlet line when recorded and that the ball has already been removed from the world when a closure event is queued. The first closure is stepped frame by frame, captures start/middle/closed screenshots, checks multiple intermediate sliding positions, then confirms that the closed face stays put. Repeated visits to the same outlet are additionally checked in the controlled unit fixture; the already-closed backing is not instantly reopened.

The plate is a visual front-face collection indicator, not a gate that blocks future balls. Its timing uses the existing stage clock, so hidden-tab pause and retry/reset do not leave independent timers behind.

Files for this local pass: `src/config.js`, `src/physics-stage.js`, `src/physics-feedback.js` (new), `src/physics-renderer.js`, `src/physics-materials.js`, stage-two hints in `src/main.js` / `index.html` / `src/styles.css`, `tests/physics-stage.test.mjs`, the Canvas trace stub in `tests/physics-renderer.test.mjs`, this record, `README.md`, and refreshed preview/keyframe screenshots. Responsive layout, first-stage behavior and final-page scope are unchanged.

## Responsive/material pass

The actual Chrome page was checked at 1440×900, 1920×1080, 1024×768 (DPR 2), 768×1024, 390×844, 320×568 and 844×390. Additional borderline layouts were checked at 768×880, 640×768 and 390×480. Each layout preserves the board ratio, keeps its bottom outlets and full handle travel inside the viewport below the header, and accepts a 75% native mouse drag without spending a shot when cancelled. At 1440×900 the board measures approximately 636×766 CSS pixels; at 1920×1080 it measures 780×939. Narrow portrait windows are width-limited rather than stretched.

Captured desktop and portrait pages were visually inspected for subdued warm-grey metal, graphite faces, silver pin/ball rims, transparent acrylic edges, recessed outlets and unchanged flat side animals. The materials are Canvas shading, not a new 3D or physics system. Static surface caching is unit-tested, not claimed as a measured frame-rate improvement.

An extra native-pointer shot at simulated 390×844 completed after resizing its moving ball to 320×568 at DPR 2. The resize did not alter the body's world position before the next physics step, and rendered alignment held throughout the remaining flight. This is not a physical touchscreen trial.

The local PowerShell server was given an EOF/receive-timeout guard because cancelled browser connections could otherwise block module loading. Connection-close and idle-preconnection recovery were checked with real local sockets, and the full browser check was repeated using this server. This does not change the game. No additional library or installation is required.

### Files changed by this visual pass

- `src/physics-viewport.js` (new): presentation-only uniform fit, safe bounds, background layout and pointer mapping.
- `src/physics-materials.js` (new): cached static metal/acrylic surface and dynamic ball, spring, handle and outlet materials.
- `src/canvas-renderer.js`: separate stage-two presentation transform, header measurement and matching input inverse.
- `src/physics-renderer.js`: material integration and independently placed flat background sprites.
- `src/styles.css`: responsive header spacing; no whole-game CSS transform.
- `src/main.js`: passes the existing header into the renderer; physics input/launch rules are untouched.
- `serve.ps1`: recover from disconnected or idle local browser connections.
- `tests/physics-renderer.test.mjs`, `tests/physics-viewport.test.mjs` (new), this test record, `README.md` and preview screenshots.

## Manual verification steps

1. Run `powershell -ExecutionPolicy Bypass -File .\serve.ps1` and open `http://localhost:8000`.
2. Try adoption and wait for the screen to fill. Check that the transition goes directly to the apparatus.
3. Alternatively use `http://localhost:8000/?stage=physics` for a documented test sample without waiting.
   Check the upright central board, six pin rows, eight physical lanes and four abstract group icons. Side motifs should float quietly and should not react to adoption clicks.
4. Pull in the upper half and release: no shot. Pull past the middle gold mark and release anywhere in the lower half: the handle rebounds and one animal launches through the narrow well formed by the partition and casing, with no inner track. Compare different valid pull depths rather than always dragging to the bottom stop.
5. While it moves, try another drag: no second animal should appear. If it naturally returns down the open entrance, wait for the returned-ball hint, pull again and check that the same animal launches while progress stays unchanged. Waiting more than 30 seconds at the ready piston must not produce an error. The entire ball must pass the outlet line before the front plate slides closed. Repeat until all four animals have passed real outlets. Repeated outlet results are valid; no collider closes the physical path.
6. Check that the fourth completion disables further launches and shows only a neutral completion message, not fate names or final statistics.
7. Start dragging, resize the window and release: no accidental launch. Resize while an animal moves: it should remain aligned with the apparatus.
8. Use “重新体验”, then “重新开始”: old animals/results must not persist. Temporarily blocking the vendor file in browser devtools should show a recoverable initialization error; restore it and reload before continuing.

## Not verified

Physical touchscreen ergonomics, Safari/Firefox behavior, prolonged sessions and frame rates on other machines have not been tested. The portrait layout is geometrically aligned but width-limited and small; it deliberately retains spare vertical space instead of stretching the board or cropping the launcher. The finite force sweep does not prove that all possible fractional inputs or browser conditions are stall-free; a 30-second in-flight timeout or boundary failure is reported honestly and offers a retry. Returned-ball waiting is excluded from that timeout.
