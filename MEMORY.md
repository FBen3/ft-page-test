# Project Memory

Last updated: 2026-05-20

## Project Purpose

This repo is being used for an FT hackathon prototype and as a learning project for agentic coding with Codex.

The product goal is a desktop FT article-page widget that lets readers switch article language complexity between `Original`, `Clearer`, and `Simple`. The feature should reduce comprehension barriers for younger or less expert readers while preserving FT meaning, tone, and style.

## Current Files

- `example_page.html`: static captured FT article page, title `The return of Londonophobia`.
- `widgets.png`: screenshot showing target left-rail area under the existing vertical share/save widgets.
- `main.py`: placeholder Python script.
- `pyproject.toml`: minimal Python project, currently no dependencies.
- `PLAN.md`: implementation plan created for this feature.
- `phase1-prototype.html`: static FT article prototype that loads the Phase 1 widget assets.
- `phase1-widget.css`: widget styling for the left-rail prototype and five visual design slots.
- `phase1-widget.js`: widget injection, level switching, and demo text replacement logic.

## Important DOM Findings

- Article body selector: `#article-body`.
- Article body classes include `.n-content-body`, `.js-article__content-body`, and `.o3-type-body-content-base`.
- Existing left-side vertical share rail selector: `.share-nav__vertical`.
- The widget should likely be inserted under `.share-nav__vertical` for the hackathon prototype.

## Product Decisions So Far

- Use user-facing labels `Original`, `Clearer`, and `Simple` instead of `Hard`, `Medium`, and `Easy`.
- Keep `Original` as the default.
- Alternate article versions should be precomputed so clicks feel instant.
- Do not call OpenAI from browser code.
- Treat editorial trust as the main product risk.
- Segment-level replacement is preferred over whole-article replacement.
- For the first prototype, simplify article paragraphs and leave embeds/images intact.

## OpenAI Planning Notes

- Use the OpenAI API only in a precompute script or backend job.
- Current plan favours the Responses API with Structured Outputs for schema-constrained rewrites.
- Batch API is relevant once generating variants for many articles.
- Prompt caching may help repeated generation jobs with long shared instructions.
- Keep the model configurable by environment variable.
- Official docs checked on 2026-05-10:
- Responses/text generation: https://platform.openai.com/docs/guides/text
- Structured Outputs: https://platform.openai.com/docs/guides/structured-outputs
- Batch API: https://platform.openai.com/docs/guides/batch/
- Prompt Caching: https://platform.openai.com/docs/guides/prompt-caching
- Models: https://developers.openai.com/api/docs/models

## Suggested Next Work

- Move to Phase 2: expand from the first four demo paragraphs to robust article segment handling.
- Preserve non-text article elements and ensure repeated toggling does not accumulate markup.
- After segment handling works, turn `main.py` into a precompute CLI that extracts article segments and generates `language_variants/<article-id>.json`.
- Add the editorial strike-through/replacement animation after the switching model is stable.

## Phase 1 Status

Phase 1 is complete as a static DOM prototype.

- `phase1-prototype.html` now exists as a readable prototype copy of the FT capture.
- `phase1-widget.css` styles a left-rail `Reading level` widget intended to sit under the share rail.
- `phase1-widget.js` mounts the widget into `.share-nav__vertical`, stores original paragraph HTML, and swaps the first four article paragraphs between `Original`, `Clearer`, and `Simple`.
- The current transition is intentionally minimal: instant replacement plus a brief highlight flash, not the final editorial animation.
- The widget is now mounted directly after `#article-progress` and wrapped with 1-5 design-slot controls for internal visual testing.
- Design slot 1 is the original three-level `Original`/`Clearer`/`Simple` widget. Design slots 2-5 are five-level visual controls adapted from `ft_reading_level_widgets.html`: ink density, pilcrow fill bar, concentric rings, and type weight sampler.
- Until the project has real five-level generated text, slots 2-5 bridge their levels onto existing demo text: levels 1-2 use `Simple`, levels 3-4 use `Clearer`, and level 5 uses `Original`.
- The five design slots were visually polished one at a time:
- Slot 2 ink density: grey ink stays clipped inside circular controls.
- Slot 3 thermometer/pilcrow: compact vertical bars ordered `5 4 3 2 1`, with level 5 as full editorial prose.
- Slot 4 reach rings: bottom note is centered and the selected ring uses solid FT red.
- Slot 5 type sampler: vertical `A` controls ordered top-to-bottom `1 2 3 4 5`.
- Slot 1 should be left untouched unless the user explicitly asks; it is the baseline three-level control.

## Codex Collaboration Notes

- The user wants to learn agentic coding, so future sessions should explain material workflow decisions briefly.
- Point out when a task would benefit from a `SKILL.md`, subagents, a clearer goal statement, or a different Codex workflow.
- This task is not yet a good subagent task because the repo is small and the first prototype is tightly coupled.
- A future `SKILL.md` may be worthwhile once selectors, commands, and project conventions stabilise.
- This `MEMORY.md` file should be treated as a "living" document and Codex should update it accordingly as the project progresses and as conversations shed light on new insights or plans of direction. Avoid updating all time; only update when necessary.
