# Project Memory

Last updated: 2026-06-03

## Project Purpose

This repo is being used for an FT hackathon prototype and as a learning project for agentic coding with Codex.

The product goal is a desktop FT article-page widget that lets readers switch article language complexity across five levels. The feature should reduce comprehension barriers for younger or less expert readers while preserving FT meaning, tone, and style.

## Current Files

- `example_page.html`: static captured FT article page, title `The return of Londonophobia`.
- `widgets.png`: screenshot showing target left-rail area under the existing vertical share/save widgets.
- `main.py`: placeholder Python script.
- `pyproject.toml`: minimal Python project, currently no dependencies.
- `PLAN.md`: implementation plan created for this feature.
- `phase1-prototype.html`: static FT article prototype that loads the Phase 1 widget assets.
- `phase1-widget.css`: widget styling for the left-rail prototype and five visual design slots.
- `phase1-widget.js`: widget injection, level switching, and demo text replacement logic.
- `language_variants/ba3b3ed8-4f6f-486e-aa8c-fbec8a87ffd6.json`: first precomputed variant-data asset for the Londonophobia article.

## Important DOM Findings

- Article body selector: `#article-body`.
- Article body classes include `.n-content-body`, `.js-article__content-body`, and `.o3-type-body-content-base`.
- Existing left-side vertical share rail selector: `.share-nav__vertical`.
- The widget should likely be inserted under `.share-nav__vertical` for the hackathon prototype.

## Product Decisions So Far

- Use user-facing labels that avoid `Hard`, `Medium`, and `Easy`, because those can feel patronising.
- Canonical five-level model: `1 Essential`, `2 Basic`, `3 Plain`, `4 Simple`, `5 Original`.
- Keep level 5 / `Original` as the default.
- The original classic widget remains a compact three-button design: `Original` maps to level 5, `Simple` maps to level 3, and `Basic` maps to level 1.
- Alternate article versions should be precomputed so clicks feel instant.
- Do not call OpenAI from browser code.
- Treat editorial trust as the main product risk.
- Segment-level replacement is preferred over whole-article replacement.
- For the first prototype, simplify article paragraphs and leave embeds/images intact.
- The hackathon demo should feel like a seamless FT website feature, not a CLI/tool demo.
- Preferred finished demo shape: a static hosted landing page linking to 2 to 4 selected FT-style article pages, each with the widget and precomputed variants.
- The user has access to internal AWS accounts, so internal static hosting is a plausible sharing path for Slack. Prefer static hosting before EC2/load balancers unless internal constraints require a server.

## OpenAI Planning Notes

- Use the OpenAI API only in a precompute script or backend job.
- Current plan favours the Responses API with Structured Outputs for schema-constrained rewrites.
- Batch API is relevant once generating variants for many articles.
- Prompt caching may help repeated generation jobs with long shared instructions.
- Keep the model configurable by environment variable.
- Official docs checked on 2026-06-04:
- Responses/text generation: https://platform.openai.com/docs/guides/text
- Structured Outputs: https://platform.openai.com/docs/guides/structured-outputs
- Batch API: https://platform.openai.com/docs/guides/batch/
- Prompt Caching: https://platform.openai.com/docs/guides/prompt-caching
- Models: https://developers.openai.com/api/docs/models

## Suggested Next Work

- Continue Phase 3: keep precomputed five-level variant JSON assets as the default data contract.
- Use `scripts/generate_variants.py` to extract, validate, and eventually generate `language_variants/<article-id>.json` files using fields like `level1Html` through `level4Html`.
- Add a real OpenAI generation run only after the user creates an OpenAI developer account and exports `OPENAI_API_KEY`.
- Keep any local script as behind-the-scenes generation plumbing, not the user-facing demo.
- Add the editorial strike-through/replacement animation after the switching model is stable.

## Phase 1 Status

Phase 1 is complete as a static DOM prototype.

- `phase1-prototype.html` now exists as a readable prototype copy of the FT capture.
- `phase1-widget.css` styles a left-rail `Reading level` widget intended to sit under the share rail.
- `phase1-widget.js` mounts the widget into `.share-nav__vertical`; Phase 1 started with the first four paragraphs, and Phase 2 now expands this into segment-based article switching.
- The current transition is intentionally minimal: instant replacement plus a brief highlight flash, not the final editorial animation.
- The widget is now mounted directly after `#article-progress` and wrapped with 1-5 design-slot controls for internal visual testing.
- Design slot 1 is the original compact `Original`/`Simple`/`Basic` widget. It now maps onto the canonical five-level model using levels 5, 3, and 1.
- Design slots 2-5 are five-level visual controls adapted from `ft_reading_level_widgets.html`: ink density, pilcrow fill bar, concentric rings, and type weight sampler.
- Until the project has real distinct five-level generated text, the JSON data duplicates available handcrafted variants: levels 1-2 use the old `Basic` text, levels 3-4 use the old `Simple` text, and level 5 uses the original DOM.
- The five design slots were visually polished one at a time:
- Slot 2 ink density: grey ink stays clipped inside circular controls.
- Slot 3 thermometer/pilcrow: compact vertical bars ordered `5 4 3 2 1`, with level 5 as full editorial prose.
- Slot 4 reach rings: bottom note is centered and the selected ring uses solid FT red.
- Slot 5 type sampler: vertical `A` controls ordered top-to-bottom `1 2 3 4 5`.
- Slot 1 should be left untouched unless the user explicitly asks; it is the baseline three-level control.

## Phase 2 Status

Phase 2 is complete for the static browser prototype.

- `phase1-widget.js` no longer hardcodes the first four paragraph selectors. It now collects eligible article segments from `#article-body`.
- Segment ids are stable by segment type, for example `p-001`, `caption-001`, and `blockquote-001`.
- Browser-eligible segments include direct article paragraphs, non-hidden blockquotes, and figure captions. The current page skips the email line, social-follow promo paragraph, hidden pullquote duplicate, and Flourish/error-message content.
- Phase 3 generation excludes captions by default, so captions stay original unless `--include-captions` is explicitly passed.
- Original HTML is stored in memory per segment so toggling back to `Original` restores clean published markup instead of accumulating nested spans or replacement markup.
- Demo variants now cover the 11 main editorial paragraphs in the captured article.
- Images, embeds, email links, and social/newsletter utility text are preserved rather than rewritten.
- Phase 3 now has a generation helper/pipeline, but still needs a real OpenAI API run so future articles can produce distinct generated variants without handcrafted text.

## Phase 3 Direction

Phase 3 has been renamed mentally from "Precompute Script" to "Precomputed Variant Data" because the finished product should not be a CLI.

- The first Phase 3 step is implemented: hardcoded `demoVariants` were moved out of `phase1-widget.js` and into JSON under `language_variants/`.
- The browser article page now fetches the JSON on load and keeps the same widget behavior when the file is available.
- Five complexity levels are now the default browser/data model. The JSON uses `levels: [1, 2, 3, 4, 5]`, with per-segment `level1Html` through `level4Html`; level 5 restores original published HTML already captured from the DOM.
- The classic three-button widget is no longer the source of truth. It is only a compact UI variant mapped to levels 5, 3, and 1.
- Current handcrafted data temporarily duplicates variants across adjacent levels until an OpenAI generation helper can produce distinct five-level text.
- `scripts/generate_variants.py` now provides `extract`, `validate`, and `generate` commands.
- The generator uses the OpenAI Responses API with Structured Outputs when `OPENAI_API_KEY` and the optional `generation` dependency are available.
- `pyproject.toml` has an optional `generation` dependency group for the OpenAI Python SDK.
- Current checked-in validation is paragraph/body-only by default and excludes captions.
- If variant JSON cannot load, non-Original changes are skipped and the widget reports that variant data is unavailable.
- Serve the prototype over HTTP, for example via static hosting or a local dev server, so browser `fetch()` can load JSON reliably.
- The first implementation should use existing handcrafted variants, not OpenAI, to stabilize the data contract.
- After the JSON loading path works, add a local/server-side generator that can call OpenAI and write the same JSON shape.
- Demo users should only see a hosted article page with the widget. They should not run scripts or know a generator exists.
- Recommended final hackathon demo: static website with a small landing page plus 2 to 4 selected article pages, shareable through internal Slack.

## Codex Collaboration Notes

- The user wants to learn agentic coding, so future sessions should explain material workflow decisions briefly.
- Point out when a task would benefit from a `SKILL.md`, subagents, a more precise goal statement, or a different Codex workflow.
- This task is not yet a good subagent task because the repo is small and the first prototype is tightly coupled.
- A future `SKILL.md` may be worthwhile once selectors, commands, and project conventions stabilise.
- This `MEMORY.md` file should be treated as a "living" document and Codex should update it accordingly as the project progresses and as conversations shed light on new insights or plans of direction. Avoid updating all time; only update when necessary.
