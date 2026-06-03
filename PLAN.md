# FT Article Language Complexity Widget Plan

## Goal

Build a desktop-only FT article-page widget that lets readers switch between three language complexity levels:

- `Original`: the published article, default state.
- `Simple`: slightly simpler language while preserving the author's meaning, tone, argument, structure, and style.
- `Basic`: substantially simpler language for a high-school-level reader, still preserving meaning, tone, and key FT style.

The reader interaction should feel instant. Alternate versions should be precomputed before the reader clicks, and switching levels 
should trigger an editorial-feeling text transformation animation rather than a plain text swap.

## Current Repo Context

- `example_page.html` is a static captured FT article page.
- `widgets.png` shows the target location on the left rail, under the existing vertical share/save widgets.
- `main.py` is currently only a placeholder.
- `pyproject.toml` defines a minimal Python project with no dependencies yet.
- The captured FT article body lives in `#article-body` with classes including `.n-content-body` and `.js-article__content-body`.
- The existing left rail is `.share-nav__vertical` inside `.share-nav`.

## Product Framing

Avoid labels like "Hard", "Medium", and "Easy" in the UI. They are clear internally, but user-facing copy can feel patronising. 
A better first pass:

- `Original`
- `Simple`
- `Basic`

Widget name options:

- `Reading level`
- `Clarity`
- `Article language`

Recommended hackathon UI:

- A narrow vertical segmented control under the share/save rail.
- Use FT-like paper tones, black borders, and one accent colour for the active level.
- Include a compact `Aa` or pencil/markup icon so it reads as an article-text control, not another share button.
- Keep button copy visible. Icons alone would make the feature harder to understand in a demo.
- Use `aria-pressed`, keyboard focus styles, and a visually hidden status message such as `Article language changed to Simple`.

## Architecture

Use a two-layer approach:

- Front-end layer: reads precomputed language variants, renders the widget, swaps article segments, and plays animation.
- Variant-data layer: stores already-generated article rewrites as JSON assets that the front end can load instantly.
- Precompute/generation layer: extracts article text, calls an LLM, validates output, and writes those JSON assets before the reader sees the page.

Do not put an OpenAI API key in browser code. The API belongs in a local/server-side precompute script or backend job.

For the hackathon demo, the user-facing product should not feel like a CLI or tool. The most practical target is a static hosted demo:

- A small landing page with links to 2 to 4 selected article pages.
- Each article page looks like an FT article and includes the reading-level widget.
- Each article has a precomputed `language_variants/<article-id>.json` file.
- The browser loads those JSON variants and swaps text instantly when the widget is clicked.
- The OpenAI/script portion is demo plumbing that runs before deployment, not something demo users see.

The user has access to internal AWS accounts, so a simple static site on internal AWS is a plausible deployment target. Prefer static hosting such as S3 plus CloudFront, or an equivalent internal static hosting option, before reaching for EC2/load balancers. EC2 is only necessary if internal constraints require a running server.

Suggested precomputed asset shape:

```json
{
  "articleId": "ba3b3ed8-4f6f-486e-aa8c-fbec8a87ffd6",
  "generatedAt": "2026-05-10T00:00:00Z",
  "levels": ["original", "simple", "basic"],
  "segments": [
    {
      "id": "p-001",
      "selector": "#article-body > p:nth-of-type(1)",
      "originalHtml": "Does another city on Earth...",
      "simpleHtml": "Does any other city on Earth...",
      "basicHtml": "Is there another city that annoys people this much?",
      "lockedTerms": ["London", "American", "Russian"],
      "warnings": []
    }
  ]
}
```

Segment-level storage is better than storing one whole rewritten article because it lets the front end preserve figures, captions, i
pull quotes, links, emphasis tags, and article layout.

## OpenAI API Plan

Use the OpenAI API only during precomputation.

- Use the Responses API for new text-generation work.
- Use Structured Outputs so each LLM response conforms to a JSON schema instead of asking for loose prose.
- Keep the model configurable through an environment variable rather than hardcoding it.
- Start with a cost-conscious model for hackathon iteration, then compare against a stronger model on a small evaluation set.
- Use the Batch API if generating variants for many articles, because generation can happen asynchronously before publication or page render.
- Use prompt caching where repeated prompts are large and share the same static instructions.

Useful official docs:

- OpenAI Responses API and text generation: https://platform.openai.com/docs/guides/text
- Structured Outputs: https://platform.openai.com/docs/guides/structured-outputs
- Batch API: https://platform.openai.com/docs/guides/batch/
- Prompt Caching: https://platform.openai.com/docs/guides/prompt-caching
- Current model catalogue: https://developers.openai.com/api/docs/models

Prompt requirements:

- Preserve the author's argument, tone, stance, structure, humour, and implied meaning.
- Preserve names, dates, numbers, places, institutions, quoted phrases, and article-specific terminology.
- Do not add new facts, remove caveats, or make the article more neutral than the original.
- Do not rewrite direct quotes unless the output explicitly marks them as paraphrases. For an FT feature, the safer default is to leave direct quotations unchanged.
- Return per-segment rewrites plus warnings for any segment that could not be simplified without risking meaning.

Validation requirements:

- Compare named entities, numbers, dates, and quoted strings between original and rewritten text.
- Flag major length changes, missing paragraphs, changed links, or missing inline tags.
- Run a second LLM or deterministic checklist as an editorial QA pass.
- Keep an audit trail of prompt version, model, generation time, and warnings.

## Animation Plan

The animation should look like editorial revision, not sci-fi transformation.

Recommended MVP animation:

- On click, split each changing paragraph into words.
- Compute a word-level diff between current and target text.
- Strike deleted words with a quick pencil-like line.
- Fade or slide replacement words into place as if an editor marked them in.
- Remove the temporary markup after the transition and leave clean final text.

Implementation approach:

- For the first demo, use CSS transitions plus the Web Animations API. This avoids a dependency and keeps the effect easier to control.
- If word-level diffing becomes complex, add a small diff library after comparing bundle size and API simplicity.
- Avoid GSAP for the first prototype unless the animation requires timeline orchestration that native browser APIs cannot handle quickly.
- Respect `prefers-reduced-motion` by swapping text without animated strike-through.
- Prevent layout jank by preserving paragraph min-heights during animation.
- Keep screen-reader output simple: update the DOM once per chosen level, not word by word.

## Implementation Phases

### Phase 1: Static DOM Prototype

Status: COMPLETED as of 2026-05-20.

- Preserved `example_page.html` as the source capture and created `phase1-prototype.html` for experimentation.
- Added `phase1-widget.js`, which finds `.share-nav__vertical`, inserts the prototype below `#article-progress`, and mounts the `Reading level` controls.
- Added `phase1-widget.css` for the left-rail widget visuals.
- Added static mock variants for the first four article paragraphs, later expanded in Phase 2.
- Implemented instant switching with a brief highlight flash and `console.info` interaction logs.
- Added five internal visual design slots:
- Slot 1: classic three-level `Original` / `Simple` / `Basic`.
- Slot 2: ink density circular controls.
- Slot 3: compact thermometer bars ordered `5 4 3 2 1`.
- Slot 4: reach rings with solid active fill.
- Slot 5: vertical type sampler ordered `1 2 3 4 5`.
- Current bridge for slots 2-5: levels 1-2 map to `Basic`, levels 3-4 map to `Simple`, and level 5 maps to `Original`.

### Phase 2: Full Article Segment Handling

Status: COMPLETED for the static prototype as of 2026-05-21.

- Extracts eligible article text segments from `#article-body` instead of using a hardcoded first-four-paragraph selector list.
- Handles direct article paragraphs, non-hidden blockquotes, and figure captions as segment candidates.
- Preserves non-text and utility elements such as images, Flourish embeds, email links, hidden pullquote duplicates, and social/newsletter promo text.
- Stores original segment HTML in memory on page load so `Original` can always restore the published version.
- Ensures repeated toggling between levels does not accumulate nested spans or replacement markup.
- Expands handcrafted `Simple` and `Basic` demo variants to the 11 main editorial paragraphs in the captured article.
- Keeps real generated segment assets as Phase 3 work.

### Phase 3: Precomputed Variant Data

Status: IN PROGRESS as of 2026-06-03.

Goal: move hardcoded demo variants out of `phase1-widget.js` and into JSON assets that make the browser prototype look like a real precomputed feature.

- Created a `language_variants/` folder.
- Define the JSON contract for one article's segment variants.
- Moved the current handcrafted `Simple` and `Basic` variants out of `phase1-widget.js` into `language_variants/ba3b3ed8-4f6f-486e-aa8c-fbec8a87ffd6.json`.
- Updated `phase1-widget.js` to load the JSON file and fall back safely if variants are unavailable.
- The page should be served over HTTP, for example through static hosting or a local dev server, so browser `fetch()` can load JSON reliably.
- Keep a small local script or helper workflow for extracting/writing variant JSON, but treat it as behind-the-scenes generation plumbing, not the user-facing demo.
- Add OpenAI generation only after the JSON shape and browser loading path are stable.
- Call OpenAI only from a local/server-side generation script or backend environment, never browser code.
- Load `OPENAI_API_KEY` from the environment when generation is added.
- Cache generated JSON locally so hackathon demos do not depend on live API calls.

### Phase 4: Animation Engine

- Add paragraph-level transition first.
- Add word-level diff animation second.
- Use an editorial visual style: strike-through, pencil underline, ink replacement, or newsroom mark-up.
- Test switching while scrolled mid-article and while clicking rapidly between levels.

### Phase 5: Quality And Demo Polish

- Create 5 to 10 before/after examples and manually score preservation of meaning, tone, and readability.
- Add a lightweight "generated by AI, reviewed by FT" style disclosure if needed for demo trust.
- Add analytics event names, for example `article_language_level_selected` with `level`, `articleId`, and `previousLevel`.
- Prepare a fallback state if variants are unavailable: widget is hidden or disabled with `Original only`.

## Technical Risks

- Editorial trust is the main risk. A simplification that changes nuance is worse than no feature.
- Direct quotes and opinion columns need special handling because small wording changes can alter tone or attribution.
- Whole-article replacement can break embedded components. Segment-level replacement reduces that risk.
- Animation can hurt readability if it is too long, too clever, or runs on every paragraph simultaneously.
- Article height changes can move the reader's scroll position. Preserve the active paragraph position during swaps.
- Browser-only generation is not acceptable because it exposes API keys and creates latency.

## Open Questions

- Is the hackathon demo expected to modify the static `example_page.html`, or should we create a separate prototype page that imports it?
- Should captions and pull quotes be simplified, or only article body paragraphs?
- Should `Basic` preserve FT house style closely, or is clarity more important than style at that level?
- Is the target future integration the FT article app, a browser extension, or a standalone demo?
- Do we want one generated rewrite per paragraph, or should the model rewrite with full article context and output segment-aligned results?

## Recommended Next Step

Build Phase 3 as a data-contract step before adding OpenAI generation:

- Add a local/server-side helper that can extract segments and write the same JSON shape.
- Add OpenAI generation after the helper can produce valid JSON deterministically.
- Keep the UI behavior unchanged while improving the generation pipeline.

This keeps the architecture aligned with the desired finished demo: a static article page that seamlessly loads precomputed language variants.

## Good To Do Later

- Rename remaining internal `pilcrow` identifiers in `phase1-widget.js` and `phase1-widget.css` to `thermometer`. The actual pilcrow symbol has been removed from the UI, so the current naming is only historical and could confuse future sessions.

## Codex Workflow Notes

- This task is currently best handled by one agent because the repo is tiny and the first work is tightly coupled.
- Subagents become useful later when tasks split cleanly, for example one agent on the OpenAI generation pipeline and another on front-end animation polish.
- A project-specific `SKILL.md` could be useful after the first prototype stabilises, especially to capture FT DOM selectors, naming conventions, and demo commands for future Codex sessions.
- Keeping `MEMORY.md` in the repo is reasonable for this hackathon because it is visible, versionable, and easy for future sessions to read.
