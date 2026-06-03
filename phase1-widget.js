(function () {
  var ARTICLE_SELECTOR = "#article-body";
  var RAIL_SELECTOR = ".share-nav__vertical";
  var PROGRESS_SELECTOR = "#article-progress";
  var SEGMENT_SELECTOR = ":scope > p, :scope > blockquote, :scope > figure figcaption";
  var VARIANT_BASE_PATH = "./language_variants/";

  var DESIGN_SLOTS = [1, 2, 3, 4, 5];
  var ARTICLE_LEVELS = ["original", "simple", "basic"];
  var FIVE_LEVELS = [
    { level: 1, label: "Essential", note: "Core facts only", articleLevel: "basic" },
    { level: 2, label: "Basic", note: "Plain language", articleLevel: "basic" },
    { level: 3, label: "Plain", note: "Everyday vocabulary", articleLevel: "simple" },
    { level: 4, label: "Simple", note: "Shorter sentences", articleLevel: "simple" },
    { level: 5, label: "Original", note: "Full editorial prose", articleLevel: "original" }
  ];
  var DEFAULT_ARTICLE_LEVEL = "original";
  var DEFAULT_COMPLEXITY_LEVEL = 5;
  var DEFAULT_DESIGN = "1";
  var UPDATED_CLASS = "reading-level-target--updated";
  var UPDATE_FLASH_MS = 520;
  var variantData = {
    articleId: "",
    loaded: false,
    path: "",
    variants: {}
  };

  document.addEventListener("DOMContentLoaded", function () {
    init();
  });

  function init() {
    var rail = document.querySelector(RAIL_SELECTOR);
    var article = document.querySelector(ARTICLE_SELECTOR);

    if (!rail || !article) {
      console.warn("[reading-level] Required FT DOM nodes were not found.");
      return;
    }

    var segments = collectSegments(article);

    if (!segments.length) {
      console.warn("[reading-level] No article text segments were found.");
      return;
    }

    loadVariantData(article).then(function (loadedVariantData) {
      variantData = loadedVariantData;
      registerSegments(segments);
      mountPrototypeControls(rail, buildWidgets(segments));
      console.info("[reading-level] Phase 3 widget mounted.", {
        articleId: variantData.articleId,
        segments: segments.length,
        variantCoverage: variantCoverage(segments),
        variantsLoaded: variantData.loaded,
        variantPath: variantData.path,
        designs: DESIGN_SLOTS.slice()
      });
    });
  }

  function loadVariantData(article) {
    var articleId = getArticleId(article);
    var path = articleId ? VARIANT_BASE_PATH + articleId + ".json" : "";

    if (!articleId || !window.fetch) {
      console.warn("[reading-level] Variant data could not be loaded because no article id or fetch support was found.");
      return Promise.resolve(emptyVariantData(articleId, path));
    }

    return window.fetch(path)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }

        return response.json();
      })
      .then(function (payload) {
        return normalizeVariantData(payload, path);
      })
      .catch(function (error) {
        console.warn("[reading-level] Variant data could not be loaded.", {
          path: path,
          error: error.message
        });

        return emptyVariantData(articleId, path);
      });
  }

  function getArticleId(article) {
    var appContext = document.getElementById("page-kit-app-context");
    var appContextId = readJsonScriptContentId(appContext);
    var pageUrl = document.documentElement.getAttribute("data-underlying-url") || "";
    var canonical = document.querySelector("link[rel='canonical']");
    var canonicalUrl = canonical ? canonical.href : "";

    return appContextId || contentIdFromUrl(pageUrl) || contentIdFromUrl(canonicalUrl) || article.dataset.articleId || "";
  }

  function readJsonScriptContentId(script) {
    if (!script) {
      return "";
    }

    try {
      return JSON.parse(script.textContent).contentId || "";
    } catch (error) {
      return "";
    }
  }

  function contentIdFromUrl(url) {
    var match = url.match(/\/content\/([^/?#]+)/);
    return match ? match[1] : "";
  }

  function normalizeVariantData(payload, path) {
    var variants = {};

    ARTICLE_LEVELS.forEach(function (level) {
      variants[level] = {};
    });

    (payload.segments || []).forEach(function (segment) {
      if (!segment.id) {
        return;
      }

      if (segment.simpleHtml) {
        variants.simple[segment.id] = segment.simpleHtml;
      }

      if (segment.basicHtml) {
        variants.basic[segment.id] = segment.basicHtml;
      }
    });

    return {
      articleId: payload.articleId || "",
      loaded: true,
      path: path,
      variants: variants
    };
  }

  function emptyVariantData(articleId, path) {
    return {
      articleId: articleId || "",
      loaded: false,
      path: path || "",
      variants: {}
    };
  }

  function collectSegments(article) {
    var countsByKind = {};

    return Array.prototype.slice.call(article.querySelectorAll(SEGMENT_SELECTOR)).reduce(function (segments, element) {
      var kind = segmentKind(element);
      var id = nextSegmentId(kind, countsByKind);

      if (!isEligibleSegment(element, kind)) {
        return segments;
      }

      segments.push({
        id: id,
        kind: kind,
        element: element,
        originalHtml: element.innerHTML
      });

      return segments;
    }, []);
  }

  function registerSegments(segments) {
    segments.forEach(function (segment) {
      segment.element.classList.add("reading-level-target");
      segment.element.dataset.readingLevelSegmentId = segment.id;
      segment.element.dataset.readingLevelSegmentKind = segment.kind;
    });
  }

  function segmentKind(element) {
    if (element.matches("figcaption")) {
      return "caption";
    }

    if (element.matches("blockquote")) {
      return "blockquote";
    }

    return "p";
  }

  function nextSegmentId(kind, countsByKind) {
    countsByKind[kind] = (countsByKind[kind] || 0) + 1;
    return kind + "-" + String(countsByKind[kind]).padStart(3, "0");
  }

  function isEligibleSegment(element, kind) {
    var text = element.textContent.replace(/\s+/g, " ").trim();

    if (!text || element.closest("[data-component='flourish'], .o-message")) {
      return false;
    }

    if (kind === "blockquote" && element.getAttribute("aria-hidden") === "true") {
      return false;
    }

    if (kind === "p" && isUtilityParagraph(element, text)) {
      return false;
    }

    return true;
  }

  function isUtilityParagraph(element, text) {
    return Boolean(
      element.querySelector(".__cf_email__") ||
      /\[email\s*protected\]/i.test(text) ||
      /^Find out about our latest stories first/i.test(text)
    );
  }

  function mountPrototypeControls(rail, widgets) {
    var prototype = document.createElement("div");
    var progress = rail.querySelector(PROGRESS_SELECTOR);

    prototype.className = "reading-level-prototype";
    prototype.dataset.design = DEFAULT_DESIGN;
    prototype.dataset.articleLevel = DEFAULT_ARTICLE_LEVEL;
    prototype.dataset.complexityLevel = String(DEFAULT_COMPLEXITY_LEVEL);
    prototype.appendChild(buildDesignSlots(prototype));
    prototype.appendChild(widgets);

    if (progress) {
      progress.insertAdjacentElement("afterend", prototype);
      return;
    }

    rail.appendChild(prototype);
  }

  function buildDesignSlots(prototype) {
    var slots = document.createElement("div");
    slots.className = "reading-level-design-slots";
    slots.setAttribute("aria-label", "Widget design options");

    DESIGN_SLOTS.forEach(function (slot) {
      var button = document.createElement("button");
      var design = String(slot);

      button.type = "button";
      button.className = "reading-level-design-slots__button";
      button.dataset.design = design;
      button.setAttribute("aria-pressed", design === DEFAULT_DESIGN ? "true" : "false");
      button.textContent = design;
      button.addEventListener("click", function () {
        prototype.dataset.design = design;
        syncDesignSlots(slots, design);
        console.info("[reading-level] Design slot selected.", { design: design });
      });
      slots.appendChild(button);
    });

    return slots;
  }

  function buildWidgets(segments) {
    var widgets = document.createElement("div");
    widgets.className = "reading-level-widgets";
    widgets.appendChild(buildClassicWidget(segments));
    widgets.appendChild(buildInkDialWidget(segments));
    widgets.appendChild(buildPilcrowWidget(segments));
    widgets.appendChild(buildRingsWidget(segments));
    widgets.appendChild(buildTypeSamplerWidget(segments));
    return widgets;
  }

  function createWidget(design, label, title) {
    var widget = document.createElement("section");
    widget.className = "reading-level-widget";
    widget.dataset.design = String(design);
    widget.setAttribute("aria-label", label);
    widget.appendChild(buildWidgetHeader(title));
    return widget;
  }

  function buildWidgetHeader(title) {
    var header = document.createElement("div");
    header.className = "reading-level-widget__header";
    header.innerHTML = '<span class="reading-level-widget__title">' + title + "</span>";
    return header;
  }

  function buildClassicWidget(segments) {
    var widget = createWidget(1, "Reading level", "Reading level");
    var body = document.createElement("div");
    body.className = "reading-level-widget__body";

    ARTICLE_LEVELS.forEach(function (level) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "reading-level-widget__button reading-level-control";
      button.dataset.articleLevel = level;
      button.setAttribute("aria-pressed", level === DEFAULT_ARTICLE_LEVEL ? "true" : "false");
      button.textContent = labelForArticleLevel(level);
      button.addEventListener("click", function () {
        applyArticleLevel(level, complexityForArticleLevel(level), segments, widget);
      });
      body.appendChild(button);
    });

    widget.appendChild(body);
    widget.appendChild(buildStatusNode());
    return widget;
  }

  function buildInkDialWidget(segments) {
    var widget = createWidget(2, "Ink density reading level", "Reading level");
    var body = document.createElement("div");
    var controls = document.createElement("div");

    body.className = "reading-level-widget__body";
    controls.className = "reading-level-ink-dials";

    FIVE_LEVELS.forEach(function (item) {
      var button = document.createElement("button");
      var size = 7 + item.level * 4;

      button.type = "button";
      button.className = "reading-level-ink-dial reading-level-control";
      button.dataset.level = String(item.level);
      button.dataset.articleLevel = item.articleLevel;
      button.setAttribute("aria-label", item.label);
      button.setAttribute("aria-pressed", item.level === DEFAULT_COMPLEXITY_LEVEL ? "true" : "false");
      button.title = item.label;
      button.innerHTML =
        '<span class="reading-level-ink-dial__fill" style="width:' +
        size +
        "px;height:" +
        size +
        'px"></span>';
      button.addEventListener("click", function () {
        applyArticleLevel(item.articleLevel, item.level, segments, widget);
      });
      controls.appendChild(button);
    });

    body.appendChild(controls);
    body.appendChild(buildLevelNote());
    widget.appendChild(body);
    widget.appendChild(buildStatusNode());
    return widget;
  }

  function buildPilcrowWidget(segments) {
    var widget = createWidget(3, "Pilcrow reading level", "Reading level");
    var body = document.createElement("div");
    var row = document.createElement("div");
    var bars = document.createElement("div");

    body.className = "reading-level-widget__body";
    row.className = "reading-level-pilcrow";
    bars.className = "reading-level-pilcrow__bars";

    FIVE_LEVELS.slice().reverse().forEach(function (item) {
      var button = document.createElement("button");
      var fillHeight = 15 + (item.level - 1) * 18;

      button.type = "button";
      button.className = "reading-level-pilcrow__bar reading-level-control";
      button.dataset.level = String(item.level);
      button.dataset.articleLevel = item.articleLevel;
      button.setAttribute("aria-label", item.label);
      button.setAttribute("aria-pressed", item.level === DEFAULT_COMPLEXITY_LEVEL ? "true" : "false");
      button.title = item.label;
      button.innerHTML =
        '<span class="reading-level-pilcrow__fill" style="height:' +
        fillHeight +
        '%"></span><span class="reading-level-pilcrow__number">' +
        item.level +
        "</span>";
      button.addEventListener("click", function () {
        applyArticleLevel(item.articleLevel, item.level, segments, widget);
      });
      bars.appendChild(button);
    });

    row.appendChild(bars);
    body.appendChild(row);
    body.appendChild(buildLevelNote());
    widget.appendChild(body);
    widget.appendChild(buildStatusNode());
    return widget;
  }

  function buildRingsWidget(segments) {
    var widget = createWidget(4, "Ripple reading level", "Reading level");
    var body = document.createElement("div");
    var rings = document.createElement("div");

    body.className = "reading-level-widget__body";
    rings.className = "reading-level-rings";

    FIVE_LEVELS.slice().reverse().forEach(function (item, index) {
      var button = document.createElement("button");
      var diameter = 84 - index * 14;

      button.type = "button";
      button.className = "reading-level-rings__ring reading-level-control";
      button.dataset.level = String(item.level);
      button.dataset.articleLevel = item.articleLevel;
      button.style.width = diameter + "px";
      button.style.height = diameter + "px";
      button.setAttribute("aria-label", item.label);
      button.setAttribute("aria-pressed", item.level === DEFAULT_COMPLEXITY_LEVEL ? "true" : "false");
      button.title = item.label;
      button.addEventListener("click", function () {
        applyArticleLevel(item.articleLevel, item.level, segments, widget);
      });
      rings.appendChild(button);
    });

    body.appendChild(rings);
    body.appendChild(buildLevelNote());
    widget.appendChild(body);
    widget.appendChild(buildStatusNode());
    return widget;
  }

  function buildTypeSamplerWidget(segments) {
    var widget = createWidget(5, "Typeface reading level", "Reading level");
    var body = document.createElement("div");
    var controls = document.createElement("div");

    body.className = "reading-level-widget__body";
    controls.className = "reading-level-type-sampler";

    FIVE_LEVELS.forEach(function (item) {
      var button = document.createElement("button");

      button.type = "button";
      button.className = "reading-level-type-sampler__glyph reading-level-control";
      button.dataset.level = String(item.level);
      button.dataset.articleLevel = item.articleLevel;
      button.style.fontSize = 10 + item.level * 4 + "px";
      button.style.fontWeight = 250 + item.level * 120;
      button.setAttribute("aria-label", item.label);
      button.setAttribute("aria-pressed", item.level === DEFAULT_COMPLEXITY_LEVEL ? "true" : "false");
      button.title = item.label;
      button.textContent = "A";
      button.addEventListener("click", function () {
        applyArticleLevel(item.articleLevel, item.level, segments, widget);
      });
      controls.appendChild(button);
    });

    body.appendChild(controls);
    body.appendChild(buildLevelNote());
    widget.appendChild(body);
    widget.appendChild(buildStatusNode());
    return widget;
  }

  function buildLevelNote() {
    var note = document.createElement("p");
    note.className = "reading-level-visual-note";
    note.dataset.readingLevelNote = "true";
    note.textContent = noteForComplexity(DEFAULT_COMPLEXITY_LEVEL);
    return note;
  }

  function buildStatusNode() {
    var status = document.createElement("p");
    status.className = "reading-level-widget__status";
    status.setAttribute("aria-live", "polite");
    status.textContent = variantData.loaded
      ? "Article language remains at Original."
      : "Variant data unavailable; article remains at Original.";
    return status;
  }

  function applyArticleLevel(articleLevel, complexityLevel, segments, widget) {
    var nextHtml = variantData.variants[articleLevel] || {};
    var prototype = widget.closest(".reading-level-prototype");
    var activeArticleLevel = prototype ? prototype.dataset.articleLevel : DEFAULT_ARTICLE_LEVEL;
    var activeComplexity = prototype ? prototype.dataset.complexityLevel : String(DEFAULT_COMPLEXITY_LEVEL);
    var changedCount = 0;
    var missingCount = 0;

    if (activeArticleLevel === articleLevel && activeComplexity === String(complexityLevel)) {
      return;
    }

    if (articleLevel !== DEFAULT_ARTICLE_LEVEL && !variantData.loaded) {
      if (prototype) {
        syncStatuses(prototype, articleLevel, complexityLevel, 0);
      }

      console.warn("[reading-level] Level change skipped because variant data is unavailable.", {
        articleLevel: articleLevel,
        complexityLevel: complexityLevel,
        variantPath: variantData.path
      });
      return;
    }

    segments.forEach(function (segment) {
      var html = articleLevel === DEFAULT_ARTICLE_LEVEL ? segment.originalHtml : nextHtml[segment.id];

      if (!html) {
        missingCount += articleLevel === DEFAULT_ARTICLE_LEVEL ? 0 : 1;
        return;
      }

      if (segment.element.innerHTML === html) {
        return;
      }

      segment.element.innerHTML = html;
      segment.element.classList.remove(UPDATED_CLASS);
      void segment.element.offsetWidth;
      segment.element.classList.add(UPDATED_CLASS);
      changedCount += 1;
      window.setTimeout(function () {
        segment.element.classList.remove(UPDATED_CLASS);
      }, UPDATE_FLASH_MS);
    });

    if (prototype) {
      prototype.dataset.articleLevel = articleLevel;
      prototype.dataset.complexityLevel = String(complexityLevel);
      syncControls(prototype, articleLevel, complexityLevel);
      syncLevelNotes(prototype, complexityLevel);
      syncStatuses(prototype, articleLevel, complexityLevel, changedCount);
    }

    console.info("[reading-level] Level changed.", {
      articleLevel: articleLevel,
      complexityLevel: complexityLevel,
      changedSegments: changedCount,
      missingVariantSegments: missingCount
    });
  }

  function syncControls(root, articleLevel, complexityLevel) {
    root.querySelectorAll(".reading-level-control").forEach(function (button) {
      var isPressed = button.dataset.level
        ? button.dataset.level === String(complexityLevel)
        : button.dataset.articleLevel === articleLevel;

      button.setAttribute("aria-pressed", String(isPressed));
    });
  }

  function syncLevelNotes(root, complexityLevel) {
    root.querySelectorAll("[data-reading-level-note]").forEach(function (note) {
      note.textContent = noteForComplexity(complexityLevel);
    });
  }

  function syncStatuses(root, articleLevel, complexityLevel, changedCount) {
    root.querySelectorAll(".reading-level-widget__status").forEach(function (status) {
      if (articleLevel !== DEFAULT_ARTICLE_LEVEL && !variantData.loaded) {
        status.textContent = "Variant data unavailable; article remains at Original.";
        return;
      }

      if (articleLevel === DEFAULT_ARTICLE_LEVEL) {
        status.textContent = "Article language restored to Original.";
        return;
      }

      status.textContent =
        "Reading level changed to " +
        labelForComplexity(complexityLevel) +
        " (" +
        labelForArticleLevel(articleLevel) +
        " precomputed text, " +
        changedCount +
        " segments updated).";
    });
  }

  function syncDesignSlots(slots, design) {
    slots.querySelectorAll(".reading-level-design-slots__button").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.design === design));
    });
  }

  function complexityForArticleLevel(articleLevel) {
    if (articleLevel === "basic") {
      return 1;
    }

    if (articleLevel === "simple") {
      return 3;
    }

    return 5;
  }

  function labelForArticleLevel(level) {
    if (level === "simple") {
      return "Simple";
    }

    if (level === "basic") {
      return "Basic";
    }

    return "Original";
  }

  function labelForComplexity(level) {
    var match = FIVE_LEVELS.filter(function (item) {
      return item.level === Number(level);
    })[0];

    return match ? match.label : "Original";
  }

  function noteForComplexity(level) {
    var match = FIVE_LEVELS.filter(function (item) {
      return item.level === Number(level);
    })[0];

    return match ? match.note : "Full editorial prose";
  }

  function variantCoverage(segments) {
    return ARTICLE_LEVELS.reduce(function (coverage, level) {
      var variants = variantData.variants[level] || {};

      coverage[level] = segments.filter(function (segment) {
        return Boolean(variants[segment.id]);
      }).length;

      return coverage;
    }, {});
  }
})();
