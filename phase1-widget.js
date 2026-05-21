(function () {
  var ARTICLE_SELECTOR = "#article-body";
  var RAIL_SELECTOR = ".share-nav__vertical";
  var PROGRESS_SELECTOR = "#article-progress";
  var SEGMENT_SELECTOR = ":scope > p, :scope > blockquote, :scope > figure figcaption";

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
      "p-001": "Does any other city on Earth irritate people this much? Does it provoke such heated comment from such different groups? Does it make left and right, Americans and Russians alike, grumble like scandalised neighbours peering over the garden fence?",
      "p-002": "In rightwing circles, the charge against London is that it is chaotic and so multicultural that it no longer belongs to the west. The left, meanwhile, sees it as a capitalist free-for-all: not just unequal, but corrupt. Both sides treat these faults as recent. In other words, London was supposedly virtuous until a recent moral fall, or even a Fall.",
      "p-003": "And this is where a knowledgeable local has to step in. We have been hated for <em>much</em> longer than that.",
      "p-004": "Londonophobia is an old prejudice. Its core idea, that London is too lax in one way or another, hardly changes. The Russian propagandists attacking the city today belong to a long tradition. Their Tsarist predecessors also objected to Victorian London because it sheltered Europe's political dissidents. When Joseph Conrad brought that world to life in <em>The Secret Agent</em>, he may not even have known that Lenin was in London, nurturing the revolution.",
      "p-005": "Even then, London had already been cursed for centuries. There is a long tension between Paris, refined and hierarchical, and London, commercial and freewheeling. The philosopher Jürgen Habermas, who died last month, contrasted the 17th-century <em>salons</em>, where discussion was brilliant but controlled, with the argumentative chaos of London coffee houses.",
      "p-006": "That contrast keeps returning. In the 1990s, French officials worried that “Londonistan” was too soft on Islamic radicals. This repeated an old view abroad, and across much of England, that London is dangerously tolerant. Criticise that trait if you like. But do not pretend it appeared during JD Vance’s lifetime.",
      "p-007": "The left also indulges in this recency bias. Consider the sweet idea that London “became” commercial only a few decades ago. In today’s typical state-of-London novel, a trillionaire called Dmitri torments an angelic servant on a zero-hours contract in his Holland Park mansion, while somehow never being there. This paint-by-numbers version is forgivable from US correspondents. Others need not take it seriously, or romanticise the past. If anything, the supposedly egalitarian London of the 1970s, when the panic was that Arabs were buying the city, is the exception in a much longer history of near-piratical capitalism. London was called the Great Wen about 200 years ago.",
      "p-008": "Notice the common thread. Whether a critic of London is on the left, or a conservative rich enough to live anywhere and choosing a golf resort, the complaint is often the same: regulate it, regiment it, bring it into line. The anti-foreign instinct and the anti-commercial instinct often go together.",
      "p-009": "Londonophobia is the best proof I know for the horseshoe theory of politics. Left and right end up hating the same thing: liberalism. Both movements, at their core, want control.",
      "p-010": "For people who think in systems, the city must be offensive. London is loose not only about people, but also about buildings and streets. There is no rational street layout, let alone a grid, thank God, and no consistent architectural style. Places around the corner from each other can feel as if they belong to different centuries. I nominate Holloway Road into Highbury Fields as the sharpest tonal contrast in the city, though I will hear other suggestions.",
      "p-011": "Francis Ford Coppola said that <em>Apocalypse Now</em> was so chaotic, expensive and painful to make that it stopped being just about Vietnam. The film <em>was</em> Vietnam. It embodied the madness of the war. By that logic, London is not merely a liberal city. It <em>is</em> liberalism. Its winding streets, architectural jumble and chalk-and-cheese neighbourhoods are what happens when individual choices accumulate over centuries. It could not have been designed from above by someone with one total idea. No wonder the schematically minded find it irritating. The result is, and always has been, a city with all the right enemies."
    },
    simple: {
      "p-001": "Does any other city on Earth annoy people this much? Does any other place make so many different people so angry? London seems able to make people on the left and the right, and people in America and Russia, complain in the same loud way.",
      "p-002": "On the right, people say London is disorderly and so multicultural that it no longer feels part of the west. On the left, people say it is a wild capitalist city that is not only unequal but also corrupt. Both sides talk as if these problems are new. They act as though London was morally fine until recently.",
      "p-003": "But a local who knows the city's history has to interrupt here. People have disliked us for <em>much</em> longer than that.",
      "p-004": "Fear and dislike of London are not new. The basic complaint stays the same: people think London is too loose and too tolerant. The Russian voices attacking it today are only the latest version of that habit. Even in Victorian times, Russian rulers disliked London because it gave shelter to political exiles from Europe. When Joseph Conrad described that world in <em>The Secret Agent</em>, he probably did not even know Lenin was in the city, preparing for revolution.",
      "p-005": "Even then, people had complained about London for centuries. Paris has often stood for order and refinement; London for trade and freedom. The philosopher Jürgen Habermas, who died last month, compared the controlled debates of 17th-century <em>salons</em> with the noisy arguments of London coffee houses.",
      "p-006": "The same contrast appears again and again. In the 1990s, some French officials called London “Londonistan” because they thought it was too soft on Islamic radicals. That was an old complaint: London is too tolerant. You can dislike that about us. But do not pretend it is new.",
      "p-007": "The left does this too. It likes the idea that London only “became” commercial recently. In many modern London novels, a billionaire named Dmitri exploits a kind servant in a Holland Park mansion while barely appearing himself. That simple picture is understandable from outsiders, but others should know better. Nor should they romanticise the past. The supposedly fair London of the 1970s was unusual. The city has a much longer history of aggressive capitalism. People were calling it the Great Wen about 200 years ago.",
      "p-008": "The same idea runs through all of this. A London critic may be leftwing, or a rich conservative living on a golf resort. But the demand is often the same: control the city and make it fit a plan. Hostility to foreigners and hostility to commerce often sit close together.",
      "p-009": "Dislike of London is the best example I know of the horseshoe theory of politics. The far left and the far right can end up hating the same thing: liberalism. Both want more control.",
      "p-010": "For people who like neat systems, London must be annoying. The city is loose not just with people but with streets and buildings. There is no simple grid, thank God, and no single architectural style. Two nearby places can feel centuries apart. My best example is the change from Holloway Road to Highbury Fields, though I will accept other nominations.",
      "p-011": "Francis Ford Coppola said making <em>Apocalypse Now</em> became so chaotic and painful that the film was no longer just about Vietnam. The film <em>was</em> Vietnam. In the same way, London is not just a liberal city. It <em>is</em> liberalism. Its winding streets, mixed architecture and very different neighbourhoods are the result of many individual choices over centuries. No single planner with one big idea could have created it. That is why people who love tidy systems dislike it. London has always had the right enemies."
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

    var segments = collectSegments(article);

    if (!segments.length) {
      console.warn("[reading-level] No article text segments were found.");
      return;
    }

    registerSegments(segments);

    mountPrototypeControls(rail, buildWidgets(segments));
    console.info("[reading-level] Phase 2 widget mounted.", {
      segments: segments.length,
      variantCoverage: variantCoverage(segments),
      designs: DESIGN_SLOTS.slice()
    });
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
    status.textContent = "Article language remains at Original.";
    return status;
  }

  function applyArticleLevel(articleLevel, complexityLevel, segments, widget) {
    var nextHtml = demoVariants[articleLevel] || {};
    var prototype = widget.closest(".reading-level-prototype");
    var activeArticleLevel = prototype ? prototype.dataset.articleLevel : DEFAULT_ARTICLE_LEVEL;
    var activeComplexity = prototype ? prototype.dataset.complexityLevel : String(DEFAULT_COMPLEXITY_LEVEL);
    var changedCount = 0;
    var missingCount = 0;

    if (activeArticleLevel === articleLevel && activeComplexity === String(complexityLevel)) {
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
      if (articleLevel === DEFAULT_ARTICLE_LEVEL) {
        status.textContent = "Article language restored to Original.";
        return;
      }

      status.textContent =
        "Reading level changed to " +
        labelForComplexity(complexityLevel) +
        " (" +
        labelForArticleLevel(articleLevel) +
        " demo text, " +
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

  function variantCoverage(segments) {
    return ARTICLE_LEVELS.reduce(function (coverage, level) {
      var variants = demoVariants[level] || {};

      coverage[level] = segments.filter(function (segment) {
        return Boolean(variants[segment.id]);
      }).length;

      return coverage;
    }, {});
  }
})();
