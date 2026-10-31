# Credits

## Third-party code

- **Matter.js 0.20.0**, by Liam Brummitt and contributors, under the MIT licence. [Official tagged source](https://github.com/liabru/matter-js/tree/0.20.0). The unchanged browser build is in `vendor/matter-0.20.0.min.js`; the full licence is in `vendor/MATTER-LICENSE.txt`. See [vendor/README.md](vendor/README.md) for provenance and checksum. Matter.js computes the spring, piston, gravity and collisions; it does not set simulated outcome probabilities.
- Other runtime features use native browser HTML, CSS, JavaScript, Canvas 2D, Pointer Events and `localStorage`. Tests use Node.js's built-in runner, without additional npm dependencies.

## Animal graphics and visual work

- Six SVG line-art animals are defined in `src/animals.js`: cat, dog, rabbit, round-cheeked hamster, parrot and goldfish. The author directed their forms and revisions; Codex assisted with implementation. They are not emoji or crops from reference screenshots.
- The 27 October recognition pass produced two code-based vector previews, A and B. After approval, five B animals and the A parrot were integrated. No icon library, external image asset or online generation dependency was introduced.
- The author supplied black-and-white animal line-art references during development. Codex helped draw and revise the icons according to those references and the author's feedback. Reference images supported visual discussion and are not bundled as website assets.
- Side decorations reuse the project SVGs. Metal, acrylic and shadow effects are drawn in Canvas/CSS, without external textures, font files or 3D models.
- The four outlet symbols and skull are vector drawings within the project. The ending reuses the outlet symbols. Repository screenshots record the project itself and do not show trial participants.

## Data, course and tools

- This is an individual project for Assignment 3, **An interactive experience**. The course brief informed interaction, user trials and process documentation. An unchanged course example was not submitted as the work. Any course code subsequently identified as borrowed should receive a specific file and source credit here.
- Equal weighting across four outcomes is a creative simulation parameter, not a real animal-outcome dataset. Only the four actual ball exits are physical records from the round.
- ChatGPT / Codex assisted development, tests and documentation. See [AI_USAGE.md](AI_USAGE.md) and [PROCESS.md](PROCESS.md) for scope, author decisions and retained/modified suggestions. AI contributed substantially to implementation but is not a runtime dependency.
- No audio or video assets, online image service, account system or paid API are used. Trial participants' names, photographs and recordings are not uploaded.

Matter.js retains its MIT licence. This document does not assign an additional open-source licence to the project as a whole.
