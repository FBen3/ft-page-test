# FT Reading Level Prototype

Desktop-only FT article-page prototype for switching article language complexity through a left-rail `Reading level` widget.

## Local Demo

Serve the repo over HTTP so `phase1-widget.js` can fetch JSON variant assets:

```sh
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/phase1-prototype.html
```

Opening `phase1-prototype.html` directly with `file://` is not reliable now that the widget loads `language_variants/*.json` with `fetch()`.

## Phase 3 Variant Data

The browser expects precomputed JSON files in `language_variants/<article-id>.json`.

Current contract:

- `levels` is `[1, 2, 3, 4, 5]`.
- `level1Html` through `level4Html` are generated per segment.
- Level 5 is the original published article HTML and is restored from the DOM, so `level5Html` is not required.
- Captions are excluded from generation by default and stay as original text in the browser. Pass `--include-captions` only if we later decide captions should also be rewritten.
- The browser never calls OpenAI and never sees an API key.

Validate the current article variant file:

```sh
python3 scripts/generate_variants.py validate \
  --article phase1-prototype.html \
  --variants language_variants/ba3b3ed8-4f6f-486e-aa8c-fbec8a87ffd6.json
```

Extract a skeleton JSON file from the article HTML:

```sh
python3 scripts/generate_variants.py extract \
  --article phase1-prototype.html \
  --out language_variants/ba3b3ed8-4f6f-486e-aa8c-fbec8a87ffd6.json \
  --preserve-existing
```

## OpenAI Generation

Install the optional generation dependency:

```sh
uv sync --extra generation
```

Create an OpenAI API key in the OpenAI dashboard, then export it in your shell:

```sh
export OPENAI_API_KEY="your_api_key_here"
```

For a cheap smoke test, generate only the first segment:

```sh
uv run --extra generation python scripts/generate_variants.py generate \
  --article phase1-prototype.html \
  --out language_variants/ba3b3ed8-4f6f-486e-aa8c-fbec8a87ffd6.json \
  --max-segments 1
```

Generate the full article:

```sh
uv run --extra generation python scripts/generate_variants.py generate \
  --article phase1-prototype.html \
  --out language_variants/ba3b3ed8-4f6f-486e-aa8c-fbec8a87ffd6.json
```

The default model is `gpt-5-mini`. Override it with either:

```sh
OPENAI_MODEL="gpt-5.4-mini" uv run --extra generation python scripts/generate_variants.py generate ...
```

or:

```sh
uv run --extra generation python scripts/generate_variants.py generate --model gpt-5.4-mini ...
```

Do not commit API keys, `.env` files, or generated secrets.
