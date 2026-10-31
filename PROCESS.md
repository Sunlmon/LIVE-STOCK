# Process — LIVE STOCK

Initially compiled on 29 October 2026; reviewed and translated into English on 31 October 2026. ChatGPT / Codex helped organise this first-person account from the author's decisions, reported trial feedback, development conversations and code. Compilation dates are not trial dates. Participant identities, quotations and detailed session dates have not been invented. The author remains responsible for checking this account.

## Current state

- **Stage one:** approximately 45 initial animals. Click to adopt; black dots disperse. Unadopted animals reproduce, with offspring moving continuously out from the parent's centre. A round samples its stopping population between 550 and 580. Reaching it locks adoption and new breeding, waits for all current birth animations, then shows capacity confirmation.
- **Stage two:** four representative animals enter Matter.js. Lever depth controls spring compression; actual gravity, collisions and rebounds determine their paths and exits. The entrance stays open, and a returning animal can be relaunched without consuming another animal.
- **Outlet processing:** whole-ball clearance records the actual outcome once and removes the body. A separate approximately 1.3-second sequence handles arrival, transformation into the existing symbol, opening, falling and closing. The next animal loads afterward. Gate animation adds no collider and does not select an exit.
- **Completion and reveal:** after the fourth gate resets, the machine fades out. Sorting complete and View results remain until the player confirms. The original reveal then stops and fades the population, forms outcome symbols, holds them for 2.5 seconds, and proceeds through skulls, disappearance and the ending. Both languages are supported.
- **Visuals and data:** five B icons plus the A parrot, warm white, dark lines and restrained metal materials. Four actual physical records and the full-population creative simulation are separate. Equal weights are not real probabilities; continued breeding is not death.

Current code defines the behaviour above. Historical parameters and the former eight-second transition below describe previous versions only.

## 31 October: pre-submission review

I confirmed that at least one previous participant started independently before I explained the interaction. The feedback below still refers to the actual earlier trials. This confirmation date is not presented as a trial date or as evidence of a new participant or retest.

The existing automated suite was rerun: 72 passes, no failures. All 24 relative links in the four main documents resolved locally. Anonymous checks confirmed a public repository and accessible live homepage; the online AI disclosure matched the local version before review. This pass did not repeat a complete browser playthrough or human trial, or submit to Canvas for me.

The main documents were subsequently translated into English in the complete project directory. Game code and the bilingual interface were not changed by that translation.

## 29 October: documentation review

README, the process account, AI disclosure and credits were reviewed without changing the game. The local remote pointed to `Sunlmon/LIVE-STOCK.git`, and links were updated accordingly. At that time, online/local consistency could not be confirmed, and no commit or push was performed by the assistant.

All 72 Node tests passed. Earlier browser evidence remained in the test record; this was not a new browser session or human trial. [AI_USAGE.md](AI_USAGE.md) records the scope of assistance and retained/modified suggestions.

<details>
<summary>26–27 October iteration history, including superseded versions</summary>

### 27 October: manual View results

I replaced the eight-second automatic transition with a persistent Sorting complete page and View results button. Machine fade-out and page fade-in remained; the button becomes available only afterward, accepts native keyboard activation, and rejects duplicate confirmation. It reuses the small grey capsule style. Once invisible, the machine is no longer redrawn unnecessarily. Outlet processing, four-animal physics and stage-three content were preserved.

This was my requested flow change, not new participant feedback. AI assisted implementation and automated/browser checking. The earlier timed design remains below as history.

### 27 October: complete outlet sequence and timed completion (historical)

I requested a readable sequence rather than immediate disappearance: actual entry, transformation into the existing outlet symbol, bottom gate opening, falling and reset. The fourth animal also had to finish. The original requirement then faded the machine, showed Sorting complete for eight complete seconds, and entered the existing reveal.

The implementation retained eight sensor lanes grouped into four categories, whole-ball clearance, spring settings and same-ball relaunch. Metal rims, graphite inner walls and shading added visual depth. Once an outcome was recorded and its body removed, a visual event stored the final pose, species and actual exit. No gate collider or predetermined flight was introduced. The approximately 1.3-second sequence used converging motion and a feathered directional transformation rather than a simple whole-image crossfade. The symbol formed before opening and accelerated downward before closing. Only then did the next animal load.

The former completion state used the animation clock: 450 milliseconds of machine fade, 350 of text fade, then 8,000 fully visible milliseconds. Hidden pages paused it; restart cleared events and clocks without independent timers. Stage three was not redesigned. This timing was later superseded by manual confirmation.

AI assisted code, diagnostics and tests. Automated checks, browser actions and sensor-position fixtures were recorded separately. Diagnostic positioning did not represent natural trajectories or select production exits. No new human feedback was recorded in this pass.

### 27 October: approved animal icons

I requested previews before replacing production assets: conservative A and more distinctive B, with 48- and 28-pixel comparisons. I chose B for cat, dog, rabbit, hamster and goldfish, but A for the parrot. Approved SVG paths were then integrated into the shared `SPECIES` definition used by the cover, Canvas animals and side decorations.

Pointed ears and whiskers, a broad muzzle and drooping ears, long ears with a narrow face, small ears and full cheeks, a hooked parrot profile, and a horizontal fish body with fan tail distinguish species structurally. Warm-white/dark-grey line work and the approved 4.6-unit stroke were retained; game circle sizes and behaviour were unchanged. AI helped draw and verify the SVGs; I made the mixed selection. This was not a new trial.

### 27 October: story clarity and lever metaphor

After further play, I felt that audiences still did not understand the story. This records my summary, not invented participant counts, quotations or dates. I wanted to connect demand for pets, breeding that continues when purchasing power falls, and lives left unchosen. The lever represents human intervention in those lives.

The ending became a question about unseen, unsold animals, followed by five short passages connecting screen clearance, ongoing breeding, possible outcomes, the lever and the case against overbreeding. English was updated too. Outcome explanations, the distinction between actual and simulated records, the data limitation and the statement that continued breeding is not death remained. Earlier repetitive text was shortened without changing gameplay or reveal timing.

I supplied the question title and later the current paragraph beginning with a gentle pull of the lever; AI helped organise and translate the text. They should not be attributed to AI as original ideas. The ending does not assert that nobody has ever collected relevant data or that all unsold animals die. A later human retest is still needed to establish whether this wording improves understanding.

### 26 October: smaller buttons and a single confirmation

The previous buttons felt too large. I reduced START, Confirm and ending restart to about half their previous dimensions: 210 pixels wide and 54–56 high on desktop. Glows were reduced too. Tool/language buttons became more compact while retaining readable 10–11-pixel labels. Capacity confirmation lost its restart button; apparatus restart and error retry remained. Breeding, the 550–580 range, physics and the ending were unchanged. This was my revision, not new trial feedback.

### Earlier that day: random population and grey capsules (historical)

I replaced the fixed 550 threshold with one integer sampled between 550 and 580 at round start. It stayed fixed across frames, clicks and language changes. The last births still finished before confirmation. The label became simply Confirm and the extra continuation hint was removed.

I also replaced the rectangular experimental key with a grey gradient capsule, warm-white text, an edge highlight and a restrained grey glow. Buttons shared that material, with smaller tool controls. Main buttons were then approximately 420 pixels wide, before the later halving. Arrows and extra icons were removed without changing the warm-white cover. AI assisted styling, state logic and checks; this was my direction, not a new trial.

### Earlier that day: fixed 550 and an experimental key (historical)

I initially slowed the opening and moved the ending condition to a fixed 550 animals instead of an earlier density trigger. Base intervals shortened from 4.4 to 2.2 seconds with bounded variation. Final partial litters filled remaining places, and queued sources were not stopped prematurely while the player adopted animals. Capacity still limited actual births.

I changed the capacity page from a 4.4-second automatic advance to explicit confirmation. Three START directions were considered: a mechanical switch, a calibration window and a contact plate. The selected earlier design used a broken-ring contact motif, square frame, inner border and shallow thickness, with restrained hover/press movement. Physics, animal graphics and outcome assignment were unchanged. Both the fixed threshold and this button design were subsequently replaced.

</details>

## 1. Starting idea

I wanted an experience that audiences operate first, discover through, and reflect on afterward, rather than a pet-management game. Clear the screen initially appears achievable through clicking. Continuing breeding eventually exceeds individual adoption capacity. Stage two turns animals into balls moving through a mechanical sorter; stage three reveals what the abstract symbols stand for.

I chose cats, dogs, rabbits, hamsters, parrots and goldfish, using circular frames and simple vectors. Warm white, graphite and small amber accents establish a restrained industrial language. I supplied black-and-white animal line-art references and revision directions, and Codex helped draw and adjust the icons. The work avoids graphic violence, numbering animals, or gathering them into four groups.

## 2. Input, response and feedback

Stage one accepts a click, removes the hit animal, disperses black dots and adds one adoption. Reproduction sends four to six same-species offspring continuously out from the parent's centre. Population, density and movement let players judge whether they can keep clearing the screen.

Stage two accepts lever depth, which determines spring compression. Releasing it drives a piston into the body, after which Matter.js computes gravity, rebounds and exits. A returned animal can be launched again. Only whole-ball clearance records its result and removes its body.

The separate visual processing event explains mechanical classification after the physical outcome is known. It must never choose the outcome itself. After every gate has reset, View results lets audiences choose when to continue.

## 3. Design and code revisions

- **Birth continuity:** early offspring appeared abruptly, or parents became black dots and froze. I requested unchanged parent size, colour and drawing, with offspring moving continuously from its real centre instead of treating reproduction as disappearance.
- **Crowding and performance:** Canvas, reusable SVG sprites, spacing and a population limit let new animals push neighbours into free space without creating unlimited physical bodies.
- **Ending stage one:** reaching capacity locks clicks and new waves, but waits for every current birth animation before the explanation.
- **Apparatus:** a portrait frame, staggered pins and bottom channels replaced earlier layouts. The entire launcher narrowed while the main field widened, rather than nesting a narrow track inside a wide empty chamber. Removing the return gate allowed same-animal relaunch.
- **Delayed explanation:** outcome symbols remain complete for 2.5 seconds before skulls. The ending combines each symbol, name, simulated count and explanation, while separating four actual ball records from the population simulation.
- **Recognition:** A/B previews and small-size comparisons preceded the approved five-B/one-A replacement; structural differences, not expressions alone, identify species.
- **Mechanical feedback:** recessed outlets process an animal only after actual entry. The next animal waits for closing, and the final gate completes before the persistent results prompt.

These are real development revisions, not a claim that each received a separate human trial.

## 4. User trials

I invited two or three other people to try the work. The following paraphrases my reported feedback and observations; they are not direct quotations. No names or recordings are published.

| Feedback or observation | Decision and response |
| --- | --- |
| The four stage-two symbols were unclear. | I kept them abstract during sorting, but added corresponding names and short explanations at the final reveal so the uncertainty would eventually be resolved. |
| Growth needed to become faster and less predictable; otherwise clicking could keep pace for too long. | I shortened successive intervals and added bounded timing variation, retaining continuous births, staggering, population limits and the final animation wait. |
| Similar pulls repeatedly sent balls into the third outlet from the left. | I examined repeated initial conditions, added a small loading tolerance, and displayed the previous pull percentage to encourage shallower/deeper inputs. I did not impose quotas or rewrite recorded exits. |
| After further play, I still felt that the full story was unclear. | I connected demand, ongoing breeding, limited purchasing/care capacity, possible outcomes and the lever metaphor in the ending. I kept the question and data limitations. I cannot claim a new human trial has validated that rewrite. |

The two-or-three estimate comes from my earlier account. Later story feedback did not have a separately recorded participant count, so the descriptions are not added together. On 31 October, I confirmed that at least one person tried independently before hearing my explanation. Exact trial dates and participant count were not recorded separately and are not invented; 31 October is the confirmation date.

## 5. First feedback-driven pass, 26 October (historical)

### Breeding cadence

An earlier interval had shortened from 4.8 seconds to a fixed 3.2. This pass used approximately 4.0, 3.12, 2.43 and 2.2 seconds, with 14% bounded variation and no interval below 2.2 seconds. Later intervals generally lay between 2.2 and 2.51 seconds; waves after six retained the shortened schedule.

Offspring still moved continuously for 1.4 seconds with staggered starts and no overlapping wave queues. Animal appearance, size, adoption feedback and the final animation wait were retained. Faster growth did not mean unlimited generation or a guaranteed fixed duration for every player. Later revisions changed the starting interval to 4.4 seconds, as documented above and in README.

### Repeated exits

Identical starting conditions and pulls can replay a route in fixed-step physics. Changing only the animal drawing cannot address this.

At loading only, each new animal receives up to 3.5 logical pixels of horizontal tolerance within the well's safe clearance. Nothing randomly pushes it during flight or chooses an outlet from previous outcomes. Relaunching the same animal does not resample tolerance or duplicate the body. Records retain `seatOffsetX` for inspection.

The next loading also shows the preceding pull percentage to encourage varied depth. Spring energy and real crossings still determine the outcome. This reduces exact replay, rather than guaranteeing equal categories. Repetitions and apparatus bias remain possible. Further concentration should be investigated through recorded inputs and real geometry, not secretly assigned endings.

## 6. AI tools and my judgment

See [AI_USAGE.md](AI_USAGE.md) for the full disclosure. ChatGPT / Codex made a substantial contribution to code and documents, not just spelling. Exact underlying model versions and invocation times were not fully recorded and are not reconstructed.

Assistance included interaction/file structure, HTML/CSS/JavaScript, SVG/Canvas drawing, Matter.js integration, responsive layout, breeding, bilingual text, automated checks and documentation. My work was defining the subject, visual and narrative direction, observing results, requesting concrete changes and supplying real trial feedback. AI is not a runtime service and receives no player input.

**Retained:** AI recommended the more distinctive B icon direction; I kept its cat, dog, rabbit, hamster and goldfish. Shared SVG definitions and separation of rendering/physics and actual/simulated records also remained implementation principles, without claiming AI invented course techniques or my original brief.

**Modified:** I selected the A parrot instead of the complete B set. I repeatedly rejected abrupt or stuck birth effects until parents remained unchanged and offspring dispersed continuously. The former eight-second transition was my own earlier requirement, later changed to manual results; it is not presented as an AI-originated suggestion I rejected.

Reasonable explanations do not prove correctness. Automated physics checks, browser actions and human trials are distinguished in the records. Earlier feedback does not prove every later version was human-tested.

## 7. Simulation, metaphor and evidence limits

`physicalOutcomes` records four actual ball exits. `simulatedFates` uses separate, equally weighted creative parameters for the unadopted snapshot, not real statistics or probabilities inferred from those balls. Adopted animals are excluded. Skulls represent disappearance and invisibility; continued breeding is not death.

The project does not use a reliable cross-species dataset following unadopted individuals. It therefore makes no claim about actual outcome frequencies or that no related research exists anywhere.

## 8. Next steps

Invite another complete START-to-ending trial without explaining first. Observe whether players understand the imbalance, vary pull depth, read outlet processing and understand the final story. Record actual hesitation, actions and decisions rather than assuming everyone understood.

Before submission, I should check this account and the credits, then run the full experience from a fresh terminal following README. Anonymous repository/homepage access was checked on 31 October, but is not a complete online playthrough. Unrecorded testing evidence should not be invented.

See [tests/TESTING.md](tests/TESTING.md) for technical checks and unverified areas, and [CREDITS.md](CREDITS.md) for acknowledgements.
