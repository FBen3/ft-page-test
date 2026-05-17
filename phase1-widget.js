(function () {
  var ARTICLE_SELECTOR = "#article-body";
  var RAIL_SELECTOR = ".share-nav__vertical";
  var TARGET_SELECTORS = [
    "#article-body > p:nth-of-type(1)",
    "#article-body > p:nth-of-type(2)",
    "#article-body > p:nth-of-type(3)",
    "#article-body > p:nth-of-type(4)"
  ];
  var TARGET_LEVELS = ["original", "clearer", "simple"];
  var DEFAULT_LEVEL = "original";
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

    rail.appendChild(buildWidget(targets));
    console.info("[reading-level] Phase 1 widget mounted.", {
      targets: targets.length,
      levels: TARGET_LEVELS.slice()
    });
  }

  function collectTargets() {
    return TARGET_SELECTORS.map(function (selector) {
      return document.querySelector(selector);
    }).filter(Boolean);
  }

  function buildWidget(targets) {
    var widget = document.createElement("section");
    widget.className = "reading-level-widget";
    widget.setAttribute("aria-label", "Reading level");

    var header = document.createElement("div");
    header.className = "reading-level-widget__header";
    header.innerHTML =
      '<span class="reading-level-widget__eyebrow">Aa</span>' +
      '<span class="reading-level-widget__title">Reading level</span>';

    var body = document.createElement("div");
    body.className = "reading-level-widget__body";

    var status = document.createElement("p");
    status.className = "reading-level-widget__status";
    status.setAttribute("aria-live", "polite");
    status.textContent = "Article language remains at Original.";

    TARGET_LEVELS.forEach(function (level) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "reading-level-widget__button";
      button.dataset.level = level;
      button.setAttribute("aria-pressed", level === DEFAULT_LEVEL ? "true" : "false");
      button.textContent = labelForLevel(level);
      button.addEventListener("click", function () {
        applyLevel(level, targets, widget, status);
      });
      body.appendChild(button);
    });

    var note = document.createElement("p");
    note.className = "reading-level-widget__note";
    note.textContent = "Phase 1 demo changes the first four paragraphs only.";

    body.appendChild(note);
    widget.appendChild(header);
    widget.appendChild(body);
    widget.appendChild(status);
    return widget;
  }

  function applyLevel(level, targets, widget, status) {
    var nextHtml = demoVariants[level] || {};
    var activeLevel = widget.dataset.activeLevel || DEFAULT_LEVEL;

    if (activeLevel === level) {
      return;
    }

    targets.forEach(function (target, index) {
      var html = level === DEFAULT_LEVEL ? target.dataset.originalHtml : nextHtml[index];

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

    widget.dataset.activeLevel = level;
    syncButtons(widget, level);
    status.textContent = "Article language changed to " + labelForLevel(level) + ".";
    console.info("[reading-level] Level changed.", { level: level });
  }

  function syncButtons(widget, level) {
    widget.querySelectorAll(".reading-level-widget__button").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.level === level));
    });
  }

  function labelForLevel(level) {
    if (level === "clearer") {
      return "Clearer";
    }

    if (level === "simple") {
      return "Simple";
    }

    return "Original";
  }
})();
