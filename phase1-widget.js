(function () {
  var ARTICLE_SELECTOR = "#article-body";
  var RAIL_SELECTOR = ".share-nav__vertical";
  var PROGRESS_SELECTOR = "#article-progress";
  var TARGET_SELECTORS = [
    "#article-body > p:nth-of-type(1)",
    "#article-body > p:nth-of-type(2)",
    "#article-body > p:nth-of-type(3)",
    "#article-body > p:nth-of-type(4)"
  ];

  var DESIGN_SLOTS = [1, 2, 3, 4, 5];
  var ARTICLE_LEVELS = ["original", "clearer", "simple"];
  var FIVE_LEVELS = [
    { level: 1, label: "Essential", note: "Core facts only", articleLevel: "simple" },
    { level: 2, label: "Plain", note: "Plain language", articleLevel: "simple" },
    { level: 3, label: "Simple", note: "Everyday vocabulary", articleLevel: "clearer" },
    { level: 4, label: "Clearer", note: "Shorter sentences", articleLevel: "clearer" },
    { level: 5, label: "Original", note: "Full editorial prose", articleLevel: "original" }
  ];
  var DEFAULT_ARTICLE_LEVEL = "original";
  var DEFAULT_COMPLEXITY_LEVEL = 5;
  var DEFAULT_DESIGN = "1";
  var UPDATED_CLASS = "reading-level-target--updated";
  var UPDATE_FLASH_MS = 520;

  var demoVariants = {
    clearer: {
      0: "Does any other city on Earth irritate people this much? Does it provoke such heated comment from such different groups? Does it make left and right, Americans and Russians alike, grumble like scandalised neighbours peering over the garden fence?",
      1: "In rightwing circles, the charge against London is that it is chaotic and so multicultural that it no longer belongs to the west. The left, meanwhile, sees it as a capitalist free-for-all: not just unequal, but corrupt. Both sides treat these faults as recent. In other words, London was supposedly virtuous until a recent moral fall, or even a Fall.",
      2: "And this is where a knowledgeable local has to step in. We have been hated for <em>much</em> longer than that.",
      3: "Londonophobia is an old prejudice. Its core idea, that London is too lax in one way or another, hardly changes. The Russian propagandists attacking the city today belong to a long tradition. Their Tsarist predecessors also objected to Victorian London because it sheltered Europe's political dissidents. When Joseph Conrad brought that world to life in <em>The Secret Agent</em>, he may not even have known that Lenin was in London, nurturing the revolution."
    },
    simple: {
      0: "Does any other city on Earth annoy people this much? Does any other place make so many different people so angry? London seems able to make people on the left and the right, and people in America and Russia, complain in the same loud way.",
      1: "On the right, people say London is disorderly and so multicultural that it no longer feels part of the west. On the left, people say it is a wild capitalist city that is not only unequal but also corrupt. Both sides talk as if these problems are new. They act as though London was morally fine until recently.",
      2: "But a local who knows the city's history has to interrupt here. People have disliked us for <em>much</em> longer than that.",
      3: "Fear and dislike of London are not new. The basic complaint stays the same: people think London is too loose and too tolerant. The Russian voices attacking it today are only the latest version of that habit. Even in Victorian times, Russian rulers disliked London because it gave shelter to political exiles from Europe. When Joseph Conrad described that world in <em>The Secret Agent</em>, he probably did not even know Lenin was in the city, preparing for revolution."
    }
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    var rail = document.querySelector(RAIL_SELECTOR);
    var article = document.querySelector(ARTICLE_SELECTOR);

    if (!rail || !article) {
      console.warn("[reading-level] Required FT DOM nodes were not found.");
      return;
    }

    var targets = collectTargets();

    if (!targets.length) {
      console.warn("[reading-level] No paragraph targets were found.");
      return;
    }

    targets.forEach(function (target) {
      target.classList.add("reading-level-target");
      target.dataset.originalHtml = target.innerHTML;
    });

    mountPrototypeControls(rail, buildWidgets(targets));
    console.info("[reading-level] Phase 1 widget mounted.", {
      targets: targets.length,
      designs: DESIGN_SLOTS.slice()
    });
  }

  function collectTargets() {
    return TARGET_SELECTORS.map(function (selector) {
      return document.querySelector(selector);
    }).filter(Boolean);
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

  function buildWidgets(targets) {
    var widgets = document.createElement("div");
    widgets.className = "reading-level-widgets";
    widgets.appendChild(buildClassicWidget(targets));
    widgets.appendChild(buildInkDialWidget(targets));
    widgets.appendChild(buildPilcrowWidget(targets));
    widgets.appendChild(buildRingsWidget(targets));
    widgets.appendChild(buildTypeSamplerWidget(targets));
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

  function buildClassicWidget(targets) {
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
        applyArticleLevel(level, complexityForArticleLevel(level), targets, widget);
      });
      body.appendChild(button);
    });

    widget.appendChild(body);
    widget.appendChild(buildStatusNode());
    return widget;
  }

  function buildInkDialWidget(targets) {
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
        applyArticleLevel(item.articleLevel, item.level, targets, widget);
      });
      controls.appendChild(button);
    });

    body.appendChild(controls);
    body.appendChild(buildLevelNote());
    widget.appendChild(body);
    widget.appendChild(buildStatusNode());
    return widget;
  }

  function buildPilcrowWidget(targets) {
    var widget = createWidget(3, "Pilcrow reading level", "Paragraph mark");
    var body = document.createElement("div");
    var row = document.createElement("div");
    var bars = document.createElement("div");
    var mark = document.createElement("div");

    body.className = "reading-level-widget__body";
    row.className = "reading-level-pilcrow";
    bars.className = "reading-level-pilcrow__bars";
    mark.className = "reading-level-pilcrow__mark";
    mark.textContent = "¶";

    FIVE_LEVELS.forEach(function (item) {
      var button = document.createElement("button");
      var fillHeight = 12 + item.level * 15;

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
        applyArticleLevel(item.articleLevel, item.level, targets, widget);
      });
      bars.appendChild(button);
    });

    row.appendChild(bars);
    row.appendChild(mark);
    body.appendChild(row);
    body.appendChild(buildLevelNote());
    widget.appendChild(body);
    widget.appendChild(buildStatusNode());
    return widget;
  }

  function buildRingsWidget(targets) {
    var widget = createWidget(4, "Ripple reading level", "Reach rings");
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
        applyArticleLevel(item.articleLevel, item.level, targets, widget);
      });
      rings.appendChild(button);
    });

    body.appendChild(rings);
    body.appendChild(buildLevelNote());
    widget.appendChild(body);
    widget.appendChild(buildStatusNode());
    return widget;
  }

  function buildTypeSamplerWidget(targets) {
    var widget = createWidget(5, "Typeface reading level", "Type weight");
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
        applyArticleLevel(item.articleLevel, item.level, targets, widget);
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
    status.textContent = "Article language remains at Original.";
    return status;
  }

  function applyArticleLevel(articleLevel, complexityLevel, targets, widget) {
    var nextHtml = demoVariants[articleLevel] || {};
    var prototype = widget.closest(".reading-level-prototype");
    var activeArticleLevel = prototype ? prototype.dataset.articleLevel : DEFAULT_ARTICLE_LEVEL;
    var activeComplexity = prototype ? prototype.dataset.complexityLevel : String(DEFAULT_COMPLEXITY_LEVEL);

    if (activeArticleLevel === articleLevel && activeComplexity === String(complexityLevel)) {
      return;
    }

    targets.forEach(function (target, index) {
      var html = articleLevel === DEFAULT_ARTICLE_LEVEL ? target.dataset.originalHtml : nextHtml[index];

      if (!html || target.innerHTML === html) {
        return;
      }

      target.innerHTML = html;
      target.classList.remove(UPDATED_CLASS);
      void target.offsetWidth;
      target.classList.add(UPDATED_CLASS);
      window.setTimeout(function () {
        target.classList.remove(UPDATED_CLASS);
      }, UPDATE_FLASH_MS);
    });

    if (prototype) {
      prototype.dataset.articleLevel = articleLevel;
      prototype.dataset.complexityLevel = String(complexityLevel);
      syncControls(prototype, articleLevel, complexityLevel);
      syncLevelNotes(prototype, complexityLevel);
      syncStatuses(prototype, articleLevel, complexityLevel);
    }

    console.info("[reading-level] Level changed.", {
      articleLevel: articleLevel,
      complexityLevel: complexityLevel
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

  function syncStatuses(root, articleLevel, complexityLevel) {
    root.querySelectorAll(".reading-level-widget__status").forEach(function (status) {
      status.textContent =
        "Reading level changed to " +
        labelForComplexity(complexityLevel) +
        " (" +
        labelForArticleLevel(articleLevel) +
        " demo text).";
    });
  }

  function syncDesignSlots(slots, design) {
    slots.querySelectorAll(".reading-level-design-slots__button").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.design === design));
    });
  }

  function complexityForArticleLevel(articleLevel) {
    if (articleLevel === "simple") {
      return 1;
    }

    if (articleLevel === "clearer") {
      return 3;
    }

    return 5;
  }

  function labelForArticleLevel(level) {
    if (level === "clearer") {
      return "Clearer";
    }

    if (level === "simple") {
      return "Simple";
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
})();
