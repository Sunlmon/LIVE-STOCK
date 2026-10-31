# LIVE STOCK

A narrative browser experience about excessive pet breeding, limited adoption capacity, and the lives left unchosen. It begins with an apparently simple instruction: clear the screen. As adoption gives way to mechanical sorting, the work asks where those lives go after they leave our view.

- [Play online](https://sunlmon.github.io/LIVE-STOCK/)
- [Source repository](https://github.com/Sunlmon/LIVE-STOCK)
- [Process and user trials](PROCESS.md)
- [AI usage disclosure](AI_USAGE.md)
- [Credits](CREDITS.md)

Documentation reviewed on **31 October 2026**. The sorting-completion screen now waits for the player to select **View results**. The previous eight-second automatic transition has been removed. The process record is named `PROCESS.md`, as required by the assignment.

## Intended audience

The work is for general audiences willing to spend a few minutes exploring an interaction about pet breeding and consumption. No programming knowledge is required. It is designed primarily for a desktop mouse, supports resizing, and provides Chinese and English interfaces.

## Main interaction

1. **Adoption and reproduction.** Select START and click cats, dogs, rabbits, hamsters, parrots and goldfish. Each adoption removes one animal, disperses small black particles, and increases the adoption counter. Remaining animals reproduce: new animals move continuously out from their parent's centre. Five animal icons use the approved feature-emphasising B direction; the parrot uses direction A.
2. **Capacity exceeded.** Each round samples one integer between **550 and 580** as its stopping population. On reaching it, adoption and new breeding stop immediately. Birth animations already underway finish before the capacity explanation appears. Density alone does not end the stage early. Select **Confirm** to continue; there is no countdown or automatic advance.
3. **Physical sorting.** Pull the lower-right lever down past its gold mark and release. A spring drives a piston into an animal; Matter.js computes gravity, collisions and rebounds. Pull depth affects launch strength. There are **four distinct animals**, rather than a limit of four lever releases: an animal returning to the open launch well can be launched again without consuming another animal. A result is recorded only after the whole ball crosses a real outlet line. An independent visual sequence then shows arrival, transformation into the existing outlet symbol, opening, falling and closing, over approximately **1.3 seconds**. The next animal loads after this finishes. After the fourth sequence, the machine fades out and **Sorting complete** appears. **View results** becomes available after the fade-in; the page waits indefinitely for that action.
4. **The reveal.** The unadopted population snapshot stops, fades, and becomes outcome symbols. Completed symbols remain visible for **2.5 seconds**, then become skulls and disappear individually. The ending asks where unseen, unsold animals go, explains the lever metaphor and the imbalance between continued breeding and limited demand, and argues against overbreeding. Each outcome symbol receives a written explanation. Figures are explicitly labelled as simulated results, and the player can restart. The skull is a metaphor, not a claim that every animal dies.

![Grey capsule START button](screenshots/capsule-cover-desktop.png)

![Approved B animal icons and A parrot](screenshots/selected-icons-stage-one.png)

![Capacity confirmation](screenshots/capsule-confirmation.png)

![Physical sorting apparatus](screenshots/capsule-physics-desktop.png)

![Animal-to-symbol transformation inside an outlet](screenshots/outlet-processing-transform.png)

![Symbol falling through the open outlet](screenshots/outlet-processing-drop.png)

![Sorting-completion page with View results](screenshots/physics-completion.png)

![Ending with outcome explanations](screenshots/capsule-ending-desktop.png)

## Run locally

This is a native HTML, CSS, JavaScript and Canvas 2D project. **No npm installation, build step, paid account or API key is required.** Matter.js **0.20.0**, the only third-party runtime library, is included in `vendor/` with its full MIT licence. No runtime CDN access is needed. Keep `src/` and `vendor/`; downloading only `index.html` is insufficient.

On Windows, open PowerShell in the project root and run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\serve.ps1
```

Open <http://localhost:8000/> and select START. Leave the terminal running; press `Ctrl+C` to stop the server. This command sets the execution policy for that server process only. If the script is not found, check that the terminal is in the folder containing `serve.ps1`. If port 8000 is occupied, check whether this project's server is already running.

On other systems, use a static HTTP server rooted in this directory that serves `.js` as JavaScript. For example, if Python 3 is already installed:

```bash
python3 -m http.server 8000
```

Python is an optional way to serve files, not a game dependency. Do not open the project through `file://`; the browser needs HTTP to load ES modules.

Optional development shortcuts, which do not replace the full experience:

- `/?stage=physics`: open the apparatus with a snapshot of the 45 initial animals.
- `/?stage=capacity`: open capacity confirmation with the same initial sample.

## Feedback and interruption handling

- Stage one displays population, adoption count and density. Adoption removes its target immediately and cannot count it twice.
- Breeding intervals shorten approximately from 4.4 to 3.61, 2.96, 2.43 and 2.2 seconds, with bounded variation of 14% and a 2.2-second minimum. Birth movement lasts 1.4 seconds, with staggered starts and no overlapping wave queues. A final partial litter fills remaining places without skipping its animation. Play duration depends on input, rather than a promised fixed time.
- The population limit is sampled once per round. Adoption, language changes and physics retry do not resample it; a full restart does. Two rounds may coincidentally have the same limit.
- Grey gradient capsule buttons use warm-white centred labels, restrained highlights and shadows, and subtle hover/press feedback. START is approximately 210 by 56 CSS pixels; Confirm and ending restart are approximately 210 by 54, with a 44-pixel minimum height on narrow screens. Tool controls remain compact. Reduced-motion preferences shorten transitions. Capacity confirmation has only Confirm; apparatus restart and error retry remain available.
- A below-threshold pull, cancelled drag, lost focus or resize while pulling does not accidentally consume an animal. The previous pull percentage encourages trying another depth.
- Each animal loads with a bounded horizontal tolerance of up to 3.5 logical pixels inside the real well. No random force is applied during flight, no outlet is rewritten, and no quota forces four different outcomes. Repeated exits remain possible.
- Whole-ball clearance records an outcome once and removes its body. The outlet rim flashes for about 360 milliseconds, then returns to normal. Subsequent transformation and gate movement are visual only. The next animal waits for gate reset, and the fourth sequence finishes before the machine freezes. A fifth animal cannot be launched.
- Missing physics code, boundary failures and flight timeouts produce recoverable errors rather than invented results. Waiting for the player after a natural return is not counted as flight timeout.
- Language switching does not reset play. Only the language preference is stored in local `localStorage`; switching still works temporarily if storage is unavailable. There is no account, leaderboard, remote database or analytics tracking.

## Simulation is not real-world statistics

`physicalOutcomes` contains the actual outlet records of the four representative animals. `simulatedFates` independently assigns creative outcomes to the unadopted population snapshot, using equal weights for four categories. **These are not measured probabilities, survey results, or proportions inferred from four balls.** Adopted animals are excluded. A category may receive zero animals; none is forcibly populated. Continued breeding is not equivalent to death.

The work does not use a reliable dataset tracing the outcomes of unadopted individuals across all these species. It poses a question rather than claiming real-world frequencies.

## Code map

- `src/main.js`, `src/state.js`: input, stage changes, snapshots and restart.
- `src/animals.js`, `src/breeding.js`, `src/packing.js`, `src/particles.js`: SVG animals, reproduction, spacing and adoption feedback.
- `src/physics-stage.js`: Matter.js world, spring, four animals and actual outlet records.
- `src/physics-renderer.js`, `src/physics-materials.js`, `src/physics-viewport.js`: apparatus rendering, materials, responsive fit and pointer mapping.
- `src/outlet-processing.js`: the 1.3-second visual sequence. `src/physics-completion.js`: machine fade, completion page and guarded manual confirmation. Neither determines physical outcomes.
- `src/reveal.js`, `src/i18n.js`, `src/styles.css`: reveal, bilingual text and styling.
- `src/config.js`: adjustable sizes, timing, population limits and physics parameters.

## Verification

Node.js is only needed for developer tests, not for playing. Tests were run with Node.js 24:

```powershell
node --test tests/*.test.mjs
```

On **31 October 2026**, **72 tests passed, with no failures**. Earlier Chrome checks covered real launches, returns and relaunches, outlet processing, a 20-second wait without automatic advance, mouse and Enter confirmation, both languages, four viewport sizes and the original reveal/restart flow. See [tests/TESTING.md](tests/TESTING.md) for dated evidence and limitations. This documentation pass did not repeat a full browser playthrough or a human trial.

## AI usage and authorship

ChatGPT / Codex contributed substantially to implementation, debugging, SVGs, translation, tests and documentation. Its role was not limited to spelling checks. The author supplied and approved the theme, story, visual references and revisions, including selecting five B icons with the A parrot and correcting the reproduction animation. See [PROCESS.md](PROCESS.md) and [AI_USAGE.md](AI_USAGE.md).

The author supplied black-and-white animal line-art references during development; Codex assisted with drawing and revisions. AI is not used at runtime, and player input is not sent to AI services. Automated checks are not human trials. Exact model versions, invocation times and contribution percentages were not fully recorded and are not invented here.

## Known limitations

- Desktop-first interaction; responsive geometry does not establish comfortable physical-phone touch use. There is no audio or keyboard alternative to the lever.
- Four balls are a small sample, not an evenly balanced lottery. The apparatus may favour some exits; repeated outcomes are valid.
- Neither a few human trials nor automated physics samples establish general user behaviour or real animal outcomes.
- Refreshing clears game progress. Only language preference persists.
- Safari, Firefox, physical phones, long sessions and performance on other machines require further checking. Controlled animation clocks are not frame-rate benchmarks.

## Submission and sharing

Keep code, assets, README, PROCESS, AI disclosure and credits in the author's public repository with its real development history. Submit the **repository URL** on Canvas; the live link is supplementary. Updates require a commit, push and successful Pages deployment.

An anonymous check on 31 October confirmed that the repository was public and the live homepage accessible, and that the online AI disclosure matched the local version before the documentation review. This does not establish a complete online playthrough or mean the present English documents have already been pushed.
