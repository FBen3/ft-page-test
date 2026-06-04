#!/usr/bin/env python3
"""Generate and validate precomputed FT reading-level variant JSON.

This is intentionally a local/server-side tool. It may call the OpenAI API,
but the browser prototype only ever reads the JSON files it writes.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


ARTICLE_SELECTOR_ID = "article-body"
EXPECTED_LEVELS = [1, 2, 3, 4, 5]
GENERATED_LEVEL_KEYS = [f"level{level}Html" for level in EXPECTED_LEVELS if level != 5]
DEFAULT_MODEL = "gpt-5-mini"
DEFAULT_ARTICLE = Path("phase1-prototype.html")
DEFAULT_OUTPUT_DIR = Path("language_variants")
VOID_TAGS = {
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
}


@dataclass
class ElementNode:
    tag: str
    attrs: list[tuple[str, str | None]]
    start_tag: str
    children: list[str | ElementNode] = field(default_factory=list)
    parent: ElementNode | None = None

    def attr(self, name: str) -> str | None:
        for key, value in self.attrs:
            if key == name:
                return value
        return None

    def has_class(self, class_name: str) -> bool:
        classes = self.attr("class") or ""
        return class_name in classes.split()

    def inner_html(self) -> str:
        return "".join(child.outer_html() if isinstance(child, ElementNode) else child for child in self.children)

    def outer_html(self) -> str:
        if self.tag in VOID_TAGS:
            return self.start_tag
        return f"{self.start_tag}{self.inner_html()}</{self.tag}>"

    def text_content(self) -> str:
        parts: list[str] = []
        for child in self.children:
            if isinstance(child, ElementNode):
                parts.append(child.text_content())
            else:
                parts.append(html.unescape(child))
        return "".join(parts)

    def descendants(self, tag: str) -> list[ElementNode]:
        matches: list[ElementNode] = []
        for child in self.children:
            if not isinstance(child, ElementNode):
                continue
            if child.tag == tag:
                matches.append(child)
            matches.extend(child.descendants(tag))
        return matches

    def closest(self, predicate: Any) -> ElementNode | None:
        node: ElementNode | None = self
        while node:
            if predicate(node):
                return node
            node = node.parent
        return None


class TreeBuilder(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.root = ElementNode("document", [], "")
        self.stack: list[ElementNode] = [self.root]

    @property
    def current(self) -> ElementNode:
        return self.stack[-1]

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        start_tag = self.get_starttag_text() or self._render_start_tag(tag, attrs)
        node = ElementNode(tag.lower(), attrs, start_tag, parent=self.current)
        self.current.children.append(node)
        if node.tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        start_tag = self.get_starttag_text() or self._render_start_tag(tag, attrs)
        node = ElementNode(tag.lower(), attrs, start_tag, parent=self.current)
        self.current.children.append(node)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return

    def handle_data(self, data: str) -> None:
        self.current.children.append(data)

    def handle_entityref(self, name: str) -> None:
        self.current.children.append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        self.current.children.append(f"&#{name};")

    def handle_comment(self, data: str) -> None:
        self.current.children.append(f"<!--{data}-->")

    def _render_start_tag(self, tag: str, attrs: list[tuple[str, str | None]]) -> str:
        rendered_attrs = []
        for key, value in attrs:
            if value is None:
                rendered_attrs.append(key)
            else:
                rendered_attrs.append(f'{key}="{html.escape(value, quote=True)}"')
        suffix = " " + " ".join(rendered_attrs) if rendered_attrs else ""
        return f"<{tag}{suffix}>"


@dataclass
class ArticleSegment:
    id: str
    kind: str
    html: str
    text: str


@dataclass
class ArticleData:
    article_id: str
    title: str
    segments: list[ArticleSegment]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    extract_parser = subparsers.add_parser("extract", help="Extract article segments and write a skeleton JSON asset.")
    add_article_args(extract_parser)
    extract_parser.add_argument("--out", type=Path, help="Output JSON path. Defaults to language_variants/<article-id>.json.")
    extract_parser.add_argument("--preserve-existing", action="store_true", help="Carry existing levelHtml fields forward if --out already exists.")

    validate_parser = subparsers.add_parser("validate", help="Validate a variant JSON asset against the article HTML.")
    add_article_args(validate_parser)
    validate_parser.add_argument("--variants", type=Path, required=True, help="Variant JSON file to validate.")
    validate_parser.add_argument("--strict", action="store_true", help="Exit non-zero if validation warnings are found.")

    generate_parser = subparsers.add_parser("generate", help="Generate level1-level4 variants with the OpenAI API.")
    add_article_args(generate_parser)
    generate_parser.add_argument("--out", type=Path, help="Output JSON path. Defaults to language_variants/<article-id>.json.")
    generate_parser.add_argument("--model", default=os.environ.get("OPENAI_MODEL", DEFAULT_MODEL), help=f"OpenAI model. Defaults to {DEFAULT_MODEL} or OPENAI_MODEL.")
    generate_parser.add_argument("--max-segments", type=int, help="Generate only the first N eligible segments for a cheap smoke test.")
    generate_parser.add_argument("--force", action="store_true", help="Regenerate segments even when level fields already exist.")

    args = parser.parse_args()

    if args.command == "extract":
        return extract_command(args)
    if args.command == "validate":
        return validate_command(args)
    if args.command == "generate":
        return generate_command(args)

    parser.error(f"Unknown command: {args.command}")
    return 2


def add_article_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--article", type=Path, default=DEFAULT_ARTICLE, help=f"Article HTML path. Defaults to {DEFAULT_ARTICLE}.")
    parser.add_argument("--include-captions", action="store_true", help="Include figure captions in extraction/generation. By default captions stay original.")


def extract_command(args: argparse.Namespace) -> int:
    article = load_article(args.article, include_captions=args.include_captions)
    output_path = args.out or default_output_path(article.article_id)
    existing = read_json(output_path) if args.preserve_existing and output_path.exists() else None
    payload = build_payload(article, existing=existing, source="extracted-skeleton")
    write_json(output_path, payload)
    print(f"Wrote {output_path} with {len(article.segments)} extracted segments.")
    return 0


def validate_command(args: argparse.Namespace) -> int:
    article = load_article(args.article, include_captions=args.include_captions)
    payload = read_json(args.variants)
    errors, warnings = validate_payload(article, payload)
    print_validation_report(errors, warnings)
    if errors or (warnings and args.strict):
        return 1
    return 0


def generate_command(args: argparse.Namespace) -> int:
    ensure_openai_ready()

    from openai import OpenAI

    article = load_article(args.article, include_captions=args.include_captions)
    output_path = args.out or default_output_path(article.article_id)
    existing = read_json(output_path) if output_path.exists() else None
    payload = build_payload(article, existing=existing, source=f"openai:{args.model}")
    segments_by_id = {segment.id: segment for segment in article.segments}
    client = OpenAI()
    target_segments = article.segments[: args.max_segments] if args.max_segments else article.segments

    for index, segment in enumerate(target_segments, start=1):
        payload_segment = find_payload_segment(payload, segment.id)
        if not args.force and all(payload_segment.get(key) for key in GENERATED_LEVEL_KEYS):
            print(f"[{index}/{len(target_segments)}] {segment.id}: cached, skipping.")
            continue

        print(f"[{index}/{len(target_segments)}] {segment.id}: generating with {args.model}...")
        generated = generate_segment_variants(client, args.model, article, segment)
        payload_segment.update(generated)
        payload_segment["warnings"] = generated.get("warnings", [])
        write_json(output_path, payload)

        errors, warnings = validate_segment_payload(segments_by_id[segment.id], payload_segment)
        if errors:
            print(f"  validation errors: {'; '.join(errors)}")
        if warnings:
            print(f"  validation warnings: {'; '.join(warnings)}")

    errors, warnings = validate_payload(article, payload)
    print_validation_report(errors, warnings)
    if errors:
        return 1

    print(f"Wrote {output_path}.")
    return 0


def ensure_openai_ready() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        raise SystemExit(
            "OPENAI_API_KEY is not set. Create an OpenAI API key, then run:\n"
            '  export OPENAI_API_KEY="your_api_key_here"\n'
            "The key is read from your shell environment and should not be committed."
        )

    try:
        import openai  # noqa: F401
    except ImportError as error:
        raise SystemExit(
            "The OpenAI Python SDK is not installed. Install it before generation, for example:\n"
            "  uv sync --extra generation\n"
            "Then rerun the generate command."
        ) from error


def generate_segment_variants(client: Any, model: str, article: ArticleData, segment: ArticleSegment) -> dict[str, Any]:
    response = client.responses.create(
        model=model,
        input=[
            {
                "role": "system",
                "content": (
                    "You rewrite Financial Times article segments into multiple reading levels. "
                    "Preserve meaning, tone, stance, humour, named entities, dates, numbers, direct quotes, "
                    "and all inline HTML tags. Do not add facts. Return only schema-valid JSON."
                ),
            },
            {
                "role": "user",
                "content": build_generation_prompt(article, segment),
            },
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "ft_reading_level_segment",
                "strict": True,
                "schema": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "level1Html": {"type": "string"},
                        "level2Html": {"type": "string"},
                        "level3Html": {"type": "string"},
                        "level4Html": {"type": "string"},
                        "warnings": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["level1Html", "level2Html", "level3Html", "level4Html", "warnings"],
                },
            }
        },
    )
    return json.loads(response.output_text)


def build_generation_prompt(article: ArticleData, segment: ArticleSegment) -> str:
    return f"""Article title: {article.title}
Article id: {article.article_id}
Segment id: {segment.id}
Segment kind: {segment.kind}

Original segment HTML:
{segment.html}

Produce four HTML strings for these levels:
- level1Html: Essential. Core facts only. Short, direct, high-school friendly.
- level2Html: Basic. Plain language with minimal abstraction.
- level3Html: Plain. Everyday vocabulary while retaining more nuance.
- level4Html: Simple. Shorter sentences and slightly clearer phrasing, closest to the original.

Rules:
- Preserve the author's argument, tone, stance, and style as far as possible at each level.
- Preserve all names, institutions, places, dates, numbers, and quoted phrases.
- Preserve inline tags from the source, such as <em>...</em>, around the relevant text.
- Do not include level 5. Level 5 is the original published HTML in the browser.
- If a segment cannot be simplified safely, keep it closer to the original and add a warning.
"""


def build_payload(article: ArticleData, existing: dict[str, Any] | None, source: str) -> dict[str, Any]:
    existing_segments = {segment.get("id"): segment for segment in (existing or {}).get("segments", [])}
    segments = []

    for segment in article.segments:
        previous = existing_segments.get(segment.id, {})
        segment_payload = {
            "id": segment.id,
            "kind": segment.kind,
            "warnings": previous.get("warnings", []),
        }
        for key in GENERATED_LEVEL_KEYS:
            if previous.get(key):
                segment_payload[key] = previous[key]
        segments.append(segment_payload)

    return {
        "articleId": article.article_id,
        "title": article.title,
        "generatedAt": now_iso(),
        "source": source,
        "levels": EXPECTED_LEVELS,
        "segments": segments,
    }


def load_article(path: Path, include_captions: bool = False) -> ArticleData:
    document = parse_html(path)
    article_node = find_by_id(document, ARTICLE_SELECTOR_ID)
    if article_node is None:
        raise SystemExit(f"Could not find #{ARTICLE_SELECTOR_ID} in {path}.")

    return ArticleData(
        article_id=find_article_id(document),
        title=find_title(document),
        segments=collect_segments(article_node, include_captions=include_captions),
    )


def parse_html(path: Path) -> ElementNode:
    parser = TreeBuilder()
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    return parser.root


def find_by_id(node: ElementNode, element_id: str) -> ElementNode | None:
    if node.attr("id") == element_id:
        return node
    for child in node.children:
        if isinstance(child, ElementNode):
            match = find_by_id(child, element_id)
            if match:
                return match
    return None


def first_descendant(node: ElementNode, tag: str) -> ElementNode | None:
    for child in node.children:
        if not isinstance(child, ElementNode):
            continue
        if child.tag == tag:
            return child
        match = first_descendant(child, tag)
        if match:
            return match
    return None


def find_article_id(document: ElementNode) -> str:
    html_node = first_descendant(document, "html")
    if html_node:
        match = re.search(r"/content/([^/?#]+)", html_node.attr("data-underlying-url") or "")
        if match:
            return match.group(1)

    app_context = find_by_id(document, "page-kit-app-context")
    if app_context:
        try:
            return json.loads(app_context.text_content()).get("contentId", "")
        except json.JSONDecodeError:
            pass

    return "unknown-article"


def find_title(document: ElementNode) -> str:
    title = first_descendant(document, "title")
    return normalize_text(title.text_content()) if title else "Untitled article"


def collect_segments(article_node: ElementNode, include_captions: bool = False) -> list[ArticleSegment]:
    counts_by_kind: dict[str, int] = {}
    segments: list[ArticleSegment] = []

    for child in article_node.children:
        if not isinstance(child, ElementNode):
            continue

        candidates: list[tuple[str, ElementNode]] = []
        if child.tag == "p":
            candidates.append(("p", child))
        elif child.tag == "blockquote":
            candidates.append(("blockquote", child))
        elif child.tag == "figure" and include_captions:
            candidates.extend(("caption", figcaption) for figcaption in child.descendants("figcaption"))

        for kind, element in candidates:
            segment_id = next_segment_id(kind, counts_by_kind)
            if not is_eligible_segment(element, kind):
                continue
            segments.append(
                ArticleSegment(
                    id=segment_id,
                    kind=kind,
                    html=element.inner_html(),
                    text=normalize_text(element.text_content()),
                )
            )

    return segments


def next_segment_id(kind: str, counts_by_kind: dict[str, int]) -> str:
    counts_by_kind[kind] = counts_by_kind.get(kind, 0) + 1
    return f"{kind}-{counts_by_kind[kind]:03d}"


def is_eligible_segment(element: ElementNode, kind: str) -> bool:
    text = normalize_text(element.text_content())
    if not text:
        return False
    if element.closest(lambda node: node.attr("data-component") == "flourish" or node.has_class("o-message")):
        return False
    if kind == "blockquote" and element.attr("aria-hidden") == "true":
        return False
    if kind == "p" and is_utility_paragraph(element, text):
        return False
    return True


def is_utility_paragraph(element: ElementNode, text: str) -> bool:
    return "__cf_email__" in element.inner_html() or bool(re.search(r"\[email\s*protected\]", text, re.I)) or text.startswith(
        "Find out about our latest stories first"
    )


def validate_payload(article: ArticleData, payload: dict[str, Any]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if payload.get("articleId") != article.article_id:
        errors.append(f"articleId mismatch: expected {article.article_id}, got {payload.get('articleId')}")
    if payload.get("levels") != EXPECTED_LEVELS:
        errors.append(f"levels must be {EXPECTED_LEVELS}")

    payload_segments = payload.get("segments")
    if not isinstance(payload_segments, list):
        return errors + ["segments must be a list"], warnings

    article_by_id = {segment.id: segment for segment in article.segments}
    payload_by_id = {segment.get("id"): segment for segment in payload_segments if isinstance(segment, dict)}

    missing_ids = sorted(set(article_by_id) - set(payload_by_id))
    extra_ids = sorted(set(payload_by_id) - set(article_by_id))
    if missing_ids:
        errors.append(f"missing segment ids: {', '.join(missing_ids)}")
    if extra_ids:
        errors.append(f"unknown segment ids: {', '.join(extra_ids)}")

    for segment_id, article_segment in article_by_id.items():
        if segment_id not in payload_by_id:
            continue
        segment_errors, segment_warnings = validate_segment_payload(article_segment, payload_by_id[segment_id])
        errors.extend(f"{segment_id}: {message}" for message in segment_errors)
        warnings.extend(f"{segment_id}: {message}" for message in segment_warnings)

    return errors, warnings


def validate_segment_payload(article_segment: ArticleSegment, payload_segment: dict[str, Any]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if payload_segment.get("kind") != article_segment.kind:
        errors.append(f"kind mismatch: expected {article_segment.kind}, got {payload_segment.get('kind')}")

    original_tags = inline_tags(article_segment.html)
    original_numbers = protected_numbers(article_segment.text)
    original_quotes = quoted_strings(article_segment.text)

    for key in GENERATED_LEVEL_KEYS:
        value = payload_segment.get(key)
        if not isinstance(value, str) or not value.strip():
            errors.append(f"{key} is missing or empty")
            continue

        variant_text = normalize_text(strip_html(value))
        if len(variant_text) < max(24, len(article_segment.text) * 0.2):
            warnings.append(f"{key} is much shorter than the original")
        for number in original_numbers:
            if number not in variant_text:
                warnings.append(f"{key} may have dropped number/date token {number!r}")
        for quote in original_quotes:
            if quote not in variant_text:
                warnings.append(f"{key} may have changed quoted phrase {quote!r}")
        missing_tags = sorted(original_tags - inline_tags(value))
        if missing_tags:
            warnings.append(f"{key} may have dropped inline tag(s): {', '.join(missing_tags)}")

    return errors, warnings


def print_validation_report(errors: list[str], warnings: list[str]) -> None:
    if not errors and not warnings:
        print("Validation passed with no warnings.")
        return
    if errors:
        print("Validation errors:")
        for error in errors:
            print(f"- {error}")
    if warnings:
        print("Validation warnings:")
        for warning in warnings:
            print(f"- {warning}")


def find_payload_segment(payload: dict[str, Any], segment_id: str) -> dict[str, Any]:
    for segment in payload["segments"]:
        if segment["id"] == segment_id:
            return segment
    raise KeyError(segment_id)


def default_output_path(article_id: str) -> Path:
    return DEFAULT_OUTPUT_DIR / f"{article_id}.json"


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def strip_html(value: str) -> str:
    parser = TreeBuilder()
    parser.feed(f"<div>{value}</div>")
    parser.close()
    wrapper = first_descendant(parser.root, "div")
    return wrapper.text_content() if wrapper else value


def inline_tags(value: str) -> set[str]:
    parser = TreeBuilder()
    parser.feed(f"<div>{value}</div>")
    parser.close()
    tags = {node.tag for node in all_elements(parser.root)}
    tags.discard("document")
    tags.discard("div")
    return tags


def all_elements(node: ElementNode) -> list[ElementNode]:
    elements = [node]
    for child in node.children:
        if isinstance(child, ElementNode):
            elements.extend(all_elements(child))
    return elements


def protected_numbers(text: str) -> set[str]:
    return set(re.findall(r"\b\d[\d,]*(?:\.\d+)?(?:st|nd|rd|th)?\b", text))


def quoted_strings(text: str) -> set[str]:
    quoted = set(re.findall(r"“([^”]+)”", text))
    quoted.update(re.findall(r'"([^"]+)"', text))
    return quoted


if __name__ == "__main__":
    raise SystemExit(main())
