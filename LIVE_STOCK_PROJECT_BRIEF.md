# LIVE STOCK

## Project brief and Codex development guide

**Document status:** This is the original planning brief, translated into English on 31 October 2026. It preserves early requirements, including ideas and parameters subsequently revised or omitted. Refer to [README.md](README.md) for current behaviour and [PROCESS.md](PROCESS.md) for actual decisions and changes. The WIP instructions below document the original development plan; they do not restart development or override later approved requirements.

**Purpose:** Place this file in the VS Code project root so Codex can understand the work before developing it through successive WIP (Work in Progress) prototypes.

**Development principles:** Work on one stage at a time. Validate the core interaction before refining the visuals. Do not ask Codex to generate the entire work in one pass.

---

# 1. What is the project?

## 1.1 Project name

**LIVE STOCK**

## 1.2 Core concept

This is a narrative interactive website about excessive pet breeding, limited adoption capacity, and the possible fates of animals not chosen by the market.

The user first receives a simple task: **clear the screen**. Initially, clicking small animals to "adopt" them is easy. However, they continue breeding until their numbers exceed the user's capacity to respond and eventually fill the screen.

Once the screen is saturated, the work moves directly to a pinball-style sorting apparatus. The user operates a lever to activate the physical mechanism. Four animals collide and rebound in a real two-dimensional physics simulation before entering four abstract outlets. Specific outcome names are not shown at this stage.

Finally, the screen fills with animals again. They stop moving, gradually fade, turn into their corresponding outlet symbols, then become skulls and disappear one by one. The final page reveals four possible destinations and poses an open question.

The work should neither lecture the user at the beginning nor depict graphic harm. It invites participation first, discovery next, and reflection afterward.

## 1.3 Central question

When breeding continues but adoption capacity and market demand are limited, where do the lives not chosen by the market eventually go?

## 1.4 Format

- A single-page interactive website / creative coding artwork.
- Desktop-first, supporting different browser window sizes.
- HTML, CSS, JavaScript, Canvas API and Matter.js.
- No backend, paid API or online AI service required.

---

# 2. User experience

## Stage 0: opening — Clear the screen

- Keep the opening simple, with a large **Clear the screen** title.
- Provide a clear start button.
- Enter the interactive scene when the user selects it.
- Do not explain the theme through a long opening passage.

## Stage 1: clear the screen — reproduction and adoption

### Six animals

1. Cat
2. Dog
3. Rabbit
4. Hamster
5. Bird
6. Goldfish

### Animal graphics

- The user does not need to draw the animals manually.
- Generate or author reusable SVG vector graphics in code.
- Use simplified head silhouettes for cats, dogs, rabbits, hamsters and birds.
- Show goldfish in a complete side profile, including body, tail and fins.
- Place each species inside an equally sized circular frame.
- Keep frames, visual centres and line styles consistent, while distinguishing species through silhouette rather than colour alone.
- Do not use emoji as production graphics.
- Graphics must remain recognisable at small sizes.

### Size and canvas

- Use **1920 × 1080** as the logical design canvas and fit it proportionally to the browser window.
- Initially test stage-one outer-circle diameters of **24–28 logical pixels**.
- Animals should be small and numerous. The impact should come from quantity, density, overlap and continuing reproduction, rather than oversized individuals.
- Keep rendering and click detection aligned after resizing.

### Reproduction

- An adult produces **four to six same-species offspring** through a slight bounce, compression and release animation.
- Offspring grow for a period before becoming eligible to reproduce.
- Centralise breeding intervals, growth duration, litter size, population limits and saturation thresholds in configuration.
- Animals reproduce continuously as the user clicks to clear them.
- Set reasonable population and performance safeguards to prevent unlimited generation from freezing the page.
- Move directly to stage two on saturation, without an additional explanatory dialog.

### Click to adopt

- Clicking removes an animal from the active population and breeding logic.
- Play a brief disappearance animation: several small black dots scatter outward and fade.
- Increase the adoption count once per animal.
- A short species-specific sound may play; visual interaction must remain functional if audio fails to load.
- Provide a mute control.
- Record sound sources and licences in `CREDITS.md`.
- Exclude adopted animals from subsequent outcome statistics.

### The role of Canvas

Use Canvas API to draw many animals and particles rather than creating a separate HTML element for each animal.

Canvas is a surface continuously drawn by code; it does not automatically provide reproduction, clicking or physics. The program must still manage:

- Animal state and position.
- Drawing every frame.
- Click hit detection.
- Reproduction and growth.
- Adoption and particle disappearance.
- Density and saturation detection.

Actually test performance and hit accuracy instead of estimating capacity from theory alone.

## Stage 2: real physical pinball with four animals

**Only four animals need to enter the apparatus. Do not put the entire stage-one population into the physics engine.**

### Physics and controls

- Use **Matter.js** for real two-dimensional physics.
- Include gravity, circular rigid bodies, collisions, rebounds, static baffles and four bottom outlets.
- Place a draggable mechanical lever at the lower right. Pulling and releasing it activates sorting.
- Animals may enter at reasonable intervals so their motion remains readable.
- Initially test stage-two animal diameters of **28–36 logical pixels**: slightly larger than stage one, but not so large that the apparatus looks empty.
- Keep the circular frame and animal drawing. Their positions and movement must stay synchronised with the actual Matter.js bodies.
- Do not present predetermined paths as real physics.

### Four abstract outlets

Show symbols only during the physical stage, without outcome labels:

1. A discontinuous path.
2. A broken ring.
3. A merchandise tag or barcode.
4. Circular arrows.

### Physical rules

- Actual motion and outlet detection must determine the outlet entered.
- Do not assign an exit before an animal enters the apparatus.
- Reasonable initial parameters, such as position and velocity, may vary between rounds to permit different results.
- A round need not populate every outlet. Do not rewrite collision results to force all four categories to appear.
- Record each animal only once after entry, then safely remove its rigid body.
- Provide understandable error feedback and a retry action if physics fails.

## Stage 3: final reveal animation

After the four physical animals finish sorting:

1. Briefly recreate the full-screen stage-one population.
2. Stop all animal movement.
3. Gradually fade the animals while retaining differences in species and individual silhouettes.
4. Transform each animal into its corresponding outlet symbol.
5. Transform the symbols into skulls.
6. Make the skulls disappear individually until they leave the screen.

### Important constraints

- Do not replace animals with numbers or anonymous data points.
- There is no need to gather them into four groups.
- Do not depict graphic harm.
- Preserve visual differences between individual lives, then create an emotional shift through transformation and disappearance.

### Keep two outcome datasets separate

Only four animals actually pass through the physical apparatus. Do not imply that the entire stage-one population received real physical simulation.

Manage these separately:

- `physicalOutcomes`: the actual exits entered by the four physical animals.
- `simulatedFates`: the simulated assignments for the final full-screen population.

A separate simulation generates the population's outcomes. They may differ between rounds, and weights should be adjustable. Until supported by reliable research, those weights are creative parameters, not real-world occurrence rates. The final page must label them **Simulated results for this round**.

## Stage 4: final results

Reveal the four destinations only at the end:

1. **Stray life:** conditions including hunger, lack of ownership and inadequate care.
2. **Accidental death:** for example, road traffic incidents.
3. **Commodification:** for example, use for meat or fur.
4. **Continued breeding:** use as breeding males or females.

Requirements:

- Show simulated counts and proportions for each category.
- Keep totals, percentages and individual assignments consistent.
- Do not describe continued breeding as death.
- Do not pass simulated results off as real statistics.
- Provide a restart button.
- Restart must clear animals, particles, timers, physics bodies, outlet records, simulated assignments and statistical state from the previous round.

### Original ending text

The original brief requested the following complete ending without unauthorised rewriting:

> The screen is finally clear.
>
> But those lives have not simply disappeared.
>
> As breeding continues,
>
> where do the lives not chosen by the market eventually go?

---

# 3. Visual language

- Minimal, restrained and conceptual.
- Warm white: `#F1EFE8`.
- Industrial charcoal: `#282A27`.
- Grey: `#BDBDB4`.
- Warning amber: `#D6A34F`.
- Dark red: `#B84940`.

Visual requirements:

- Simple, consistent animal graphics suitable for repeated drawing.
- Slightly lively stage-one bouncing, without an infantile style.
- Increasing crowding and pressure as the population grows.
- A stage-two machine that resembles a real mechanical sorter rather than a colourful cartoon arcade.
- Abstract outlet symbols only during the physical stage.
- Contrast through fading, symbol transformation, skull disappearance and written revelation.
- No unrelated menus, excessive decoration or lengthy tutorial.

---

# 4. Technical requirements and suggested structure

HTML, CSS, JavaScript, Canvas API and Matter.js are recommended. If the project already has a stack, inspect it before deciding whether to change it.

Suggested structure:

```text
live-stock/
├── index.html
├── package.json
├── README.md
├── PROCESS.md
├── CREDITS.md
├── src/
│   ├── main.js
│   ├── styles.css
│   ├── config.js
│   ├── state.js
│   ├── animals.js
│   ├── canvas-renderer.js
│   ├── particles.js
│   ├── breeding.js
│   ├── physics-stage.js
│   ├── reveal.js
│   └── audio.js
├── assets/
│   ├── animals/
│   └── audio/
└── screenshots/
```

Combine files where appropriate for the existing project. Do not split unnecessarily just to match this list, or put all logic into one enormous file.

### Required edge-case handling

- Rapid repeated clicks must not count the same adoption twice.
- Rendering and click positions must remain aligned after browser resizing.
- Reaching the population cap must not cause unlimited generation or freezing.
- Visual interaction must work if audio fails or autoplay is restricted.
- Stop previous-stage timers and input handlers when changing stages.
- Each physical animal may enter and count toward only one outlet.
- Results must display correctly when a category has zero animals.
- Restart must not retain previous-round state.
- Canvas and physics must not become misaligned when the window changes size.
- Provide clear feedback and retry when the physical stage fails.

---

# 5. Phased Codex development plan

## WIP 0: inspect and plan

Inspect the project directory and existing code first, then explain:

1. Its current technologies and available files.
2. The recommended implementation and file structure.
3. How Canvas and Matter.js work together.
4. How stage one supports many animals with controlled performance.
5. How to separate four physical records from the full-population simulation.
6. Main risks and testing methods.

**At this stage, do not write the complete implementation or overwrite existing files.**

## WIP 1: stage-one visual prototype

Implement only:

- The Clear the screen opening.
- SVG visuals for six animals.
- Canvas drawing and resizing.
- Reproduction and growth.
- Click-triggered particle disappearance.
- Adoption count.
- Increasing density.
- A temporary stage-two placeholder on saturation.

Do not implement Matter.js, final statistics or skull animation yet. After completion, let the author review animal size, recognition, density, style and reproduction speed.

## WIP 2: separate physics prototype

Build a Matter.js scene with four animals:

- Gravity, collisions, rebounds and baffles.
- Four abstract outlets.
- A draggable lower-right lever.
- Actual outlet detection.
- One record per animal.
- Restart.

Prioritise validating physics rather than immediately integrating stage one.

## WIP 3: stage integration and ending

- Connect WIP 1 and WIP 2.
- Handle the transition after saturation.
- Preserve the four actual physical outcomes.
- Generate independent simulated outcomes for the full-screen population.
- Implement fading, symbol transformation and skull disappearance.
- Display simulated statistics and the specified ending text.
- Complete reset logic.

## WIP 4: testing and delivery

- Test clicking, resizing, breeding, audio failure, physical exits and restart.
- Ask at least one other person to try before explaining the interaction.
- Record observations and improve at least one aspect.
- Complete README.md, PROCESS.md and CREDITS.md.
- Prepare screenshots or a short screen recording.
- Commit throughout development.
- Publish a public GitHub repository.

---

# 6. Assignment 3 deliverables

## README.md

Include at least:

- The concept.
- Intended audience.
- Main interaction.
- Local run instructions.
- Known limitations.
- At least one screenshot.
- A live link and short recording if available.

## PROCESS.md

Record the actual development process:

- The starting idea.
- An implemented design or code change.
- Observations from a user trial.
- Decisions made in response.
- AI tools used and their purposes.
- One AI suggestion actually retained.
- One AI suggestion actually changed or rejected, with the reason.

AI disclosure must reflect the real process. Do not invent tests, trials or design decisions.

## CREDITS.md

Record:

- Open-source libraries.
- Borrowed code.
- External SVGs, images, sounds and other assets.
- Sources and licences.

Also:

- Handle at least one ordinary mistake or interruption.
- Complete at least one trial with another person.
- Preserve an incremental Git history.
- Provide an accessible public GitHub repository.
- Do not upload API keys, private information or material without permission.

---

# 7. Original first instruction to Codex: WIP 0 only

Read `LIVE_STOCK_PROJECT_BRIEF.md` in the project root completely. Understand the work's goals, interaction flow, visual requirements, technical constraints and assignment deliverables.

Execute WIP 0 only: inspect the current directory, understand existing code and prepare an implementation plan.

Focus on:

1. Drawing large numbers of six animal types using Canvas.
2. Managing breeding, growth, click particles and screen saturation.
3. Using Matter.js for real sorting physics with four animals.
4. Separating actual exits of those four animals from the full-population simulation.
5. Recommended structure, development order and tests.
6. The exact scope of a minimal runnable WIP 1.

For that initial planning round, output the plan and risks only. **Do not write code, modify or overwrite files.** Wait for the author's approval before starting WIP 1.
