(function () {
  try {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  } catch (_sr) {}

  const body = document.body;
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-primary");
  const backdrop = document.getElementById("nav-backdrop");

  // ── Smart views router (turn sections into "pages") ──
  /** Full reload to Arabic/English index with ?view= — used from standalone pages (e.g. privacy) that ship the same nav but are not the SPA shell. */
  function hrefToMainIndexWithView(view) {
    try {
      var path = window.location.pathname || "";
      if (/\/en\/index\.html$/i.test(path)) {
        return null;
      }
      if (/\/en\//.test(path)) {
        return "../index.html?view=" + encodeURIComponent(view);
      }
    } catch (_e) {}
    return "index.html?view=" + encodeURIComponent(view);
  }

  const VIEW_BY_ID = {
    hero: "home",
    video: "video",
    cars: "cars",
    buildings: "buildings",
    "window-film": "window-film",
    "warranty-card": "warranty",
    "window-film-faq": "faq",
    "tips-care": "tips",
    about: "about",
    offers: "offers",
    pricing: "pricing",
    gallery: "gallery",
    contact: "contact",
  };

  function syncNavActive(view) {
    if (!nav) return;
    // Mark the exact clicked view as active (even if content is nested under another section)
    const wanted = view || "home";
    const currentFile = (function () {
      try {
        const p = (window.location.pathname || "").split("/").pop() || "";
        return p.toLowerCase();
      } catch (_e) {
        return "";
      }
    })();
    nav.querySelectorAll("a").forEach(function (a) {
      /* Dropdown items all share the same ?view=cars — highlighting every row fights the root
         button state. Only top-level links use aria-current here; cars/buildings use the button. */
      if (a.closest(".nav-dropdown-panel")) {
        a.removeAttribute("aria-current");
        return;
      }
      const href = a.getAttribute("href") || "";
      const m = href.match(/[?&]view=([^&#]+)/);
      const v = m ? decodeURIComponent(m[1]) : "";
      if (v && v === wanted) {
        a.setAttribute("aria-current", "page");
        return;
      }

      // Standalone pages (e.g. offers.html/privacy.html) may not use ?view= links.
      // If the href targets the same file name, keep it active.
      const hrefFile = (href.split("#")[0] || "").split("?")[0].split("/").pop().toLowerCase();
      if (hrefFile && currentFile && hrefFile === currentFile) {
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    });

    // Highlight dropdown root buttons too (cars/buildings)
    nav.querySelectorAll(".nav-dropdown > button[data-nav-go]").forEach(function (btn) {
      const go = btn.getAttribute("data-nav-go");
      if (go && go === wanted) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
  }

  // Track "real" navigations so we don't hijack normal scrolling.
  var __lastNavAt = 0;
  function markNavigation() {
    __lastNavAt = Date.now();
  }

  function setView(view, scrollTargetId) {
    if (!view || view === "home") body.setAttribute("data-view", "home");
    else body.setAttribute("data-view", view);
    syncNavActive(view);

    // Only reset scroll when this change came from an intentional navigation.
    // Prevents "jump to top" during normal scrolling if setView is invoked indirectly.
    var shouldResetScroll = Date.now() - __lastNavAt < 1200;

    // For nested sections (warranty/faq/tips), scroll to sub-element after paint
    if (scrollTargetId) {
      requestAnimationFrame(function () {
        var el = document.getElementById(scrollTargetId);
        if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
        else if (shouldResetScroll) window.scrollTo({ top: 0, behavior: "auto" });
      });
    } else {
      if (shouldResetScroll) {
        try {
          window.scrollTo({ top: 0, behavior: "auto" });
        } catch (_e) {
          window.scrollTo(0, 0);
        }
      }
    }
  }

  function parseInitialView() {
    const params = new URLSearchParams(window.location.search);
    const v = (params.get("view") || "").trim().toLowerCase();
    if (v) return v;
    const hash = (window.location.hash || "").replace(/^#/, "");
    if (hash && VIEW_BY_ID[hash]) return VIEW_BY_ID[hash];
    // Standalone pages can set their intended view via body[data-view]
    try {
      const dv = ((body && body.getAttribute("data-view")) || "").trim().toLowerCase();
      if (dv) return dv;
    } catch (_e) {}
    return "home";
  }

  function updateUrlForView(view, idForHash) {
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    if (idForHash) {
      url.hash = "#" + idForHash;
    } else {
      url.hash = "";
    }
    history.pushState({ view: view }, "", url.toString());
  }

  // Nested views (warranty/faq/tips) are rendered inside #window-film,
  // but we always want to land at the top of the view (not mid-page).
  const NEEDS_SCROLL = {};

  // Brand wordmark: wrap any "Nano Fusion" mentions with logo font
  (function applyNanoFusionWordmark() {
    try {
      // Apply across the whole document (header/nav/footer + main).
      var root = document.body;
      if (!root) return;

      // Keep a non-global test regex to avoid lastIndex side effects.
      var needles = [
        // English: Nano Fusion / nano-fusion / nano‑fusion / nano fusion (any case)
        { re: /\bnano[\s\-‑–—]*fusion\b/gi, test: /\bnano[\s\-‑–—]*fusion\b/i, dir: "ltr" },
        // English: NanoFusion (no separator)
        { re: /\bnanofusion\b/gi, test: /\bnanofusion\b/i, dir: "ltr" },
        // Arabic brand spellings -> render as "NANO FUSION" in logo font
        { re: /نانو[\s\-‑–—]*فيوجن/g, test: /نانو[\s\-‑–—]*فيوجن/, dir: "ltr", replace: "NANO FUSION" },
        { re: /نانوفيوجن/g, test: /نانوفيوجن/, dir: "ltr", replace: "NANO FUSION" },
      ];

      function shouldSkip(el) {
        if (!el || el.nodeType !== 1) return true;
        var tag = (el.tagName || "").toLowerCase();
        if (tag === "script" || tag === "style" || tag === "textarea" || tag === "input") return true;
        // Don't touch code-like blocks (URLs, snippets).
        if (tag === "code" || tag === "pre") return true;
        if (el.closest && el.closest(".nf-wordmark")) return true;
        return false;
      }

      var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          if (!node || !node.nodeValue) return NodeFilter.FILTER_REJECT;
          var p = node.parentElement;
          if (!p || shouldSkip(p)) return NodeFilter.FILTER_REJECT;
          var txt = node.nodeValue;
          for (var i = 0; i < needles.length; i++) {
            if (needles[i].test.test(txt)) {
              return NodeFilter.FILTER_ACCEPT;
            }
          }
          return NodeFilter.FILTER_REJECT;
        },
      });

      var nodes = [];
      while (tw.nextNode()) nodes.push(tw.currentNode);

      nodes.forEach(function (textNode) {
        var txt = textNode.nodeValue || "";
        var container = document.createElement("span");
        container.className = "nf-wordmark-wrap";

        var parts = [txt];
        needles.forEach(function (n) {
          var next = [];
          parts.forEach(function (seg) {
            if (typeof seg !== "string") {
              next.push(seg);
              return;
            }
            var last = 0;
            n.re.lastIndex = 0;
            var m;
            while ((m = n.re.exec(seg))) {
              var start = m.index;
              var end = start + m[0].length;
              if (start > last) next.push(seg.slice(last, start));
              var sp = document.createElement("span");
              sp.className = "nf-wordmark";
              sp.setAttribute("dir", n.dir);
              sp.textContent = n.replace || m[0];
              next.push(sp);
              last = end;
            }
            if (last < seg.length) next.push(seg.slice(last));
          });
          parts = next;
        });

        // Only replace if we actually created wordmark spans
        var hasSpan = parts.some(function (p) {
          return typeof p !== "string";
        });
        if (!hasSpan) return;

        parts.forEach(function (p) {
          if (typeof p === "string") container.appendChild(document.createTextNode(p));
          else container.appendChild(p);
        });

        var parent = textNode.parentNode;
        if (parent) parent.replaceChild(container, textNode);
      });
    } catch (_e) {}
  })();

  function goToSection(id) {
    const mappedView = VIEW_BY_ID[id];
    const el = id ? document.getElementById(id) : null;
    // If the hash points to an element that is NOT a view root (e.g. footer anchors),
    // keep the current page as home and scroll to that element.
    if (!mappedView && el) {
      const carsRoot = document.getElementById("cars");
      const insideCars = !!(carsRoot && (el === carsRoot || carsRoot.contains(el)));
      if (insideCars) {
        setView("cars", id);
        updateUrlForView("cars", id);
        return;
      }
      setView("home", id);
      updateUrlForView("home", id);
      return;
    }

    const view = mappedView || "home";
    var scrollTarget = NEEDS_SCROLL[view] ? id : null;
    /* Only scroll to a *nested* cars anchor (e.g. #paint-protection-hub). Do not
       treat #cars as a scroll target: Node.contains(node) is true for self, which
       wrongly forced scrollIntoView(cars) and skipped a clean “start from top”. */
    if (!scrollTarget && view === "cars" && el) {
      var carsRoot2 = document.getElementById("cars");
      if (carsRoot2 && el !== carsRoot2 && carsRoot2.contains(el)) {
        scrollTarget = id;
      }
    }
    setView(view, scrollTarget);
    updateUrlForView(view, scrollTarget);
  }

  // Init view on load — handle nested scroll targets too
  (function () {
    markNavigation();
    const initView = parseInitialView();
    const initHash = (window.location.hash || "").replace(/^#/, "");
    var scrollTarget = null;
    if (initHash) {
      var hEl = document.getElementById(initHash);
      var carsRoot = document.getElementById("cars");
      if (initView === "cars" && hEl && carsRoot && hEl !== carsRoot && carsRoot.contains(hEl)) {
        scrollTarget = initHash;
      }
    }
    setView(initView, scrollTarget);
  })();

  // Force a clean "top of page" on full page navigations when there is no meaningful anchor.
  // Prevents partial scroll restoration that can happen between standalone pages.
  var __userScrolled = false;
  window.addEventListener(
    "scroll",
    function () {
      __userScrolled = __userScrolled || window.scrollY > 6;
    },
    { passive: true }
  );
  window.addEventListener("load", function () {
    try {
      // If the user started scrolling before the page finished loading,
      // do not yank them back to the top.
      if (__userScrolled) return;
      const hash = (window.location.hash || "").replace(/^#/, "");
      if (hash) {
        // If the hash points to an element, keep default behavior.
        if (document.getElementById(hash)) return;
      }
      window.scrollTo(0, 0);
    } catch (_e) {}
  });

  function closeNav() {
    body.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      const open = body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function (e) {
        const href = link.getAttribute("href") || "";
        // Only intercept navigation when the target URL is the CURRENT page.
        // Standalone pages (e.g., privacy.html) link back to index.html and must reload normally.
        try {
          const targetUrl = new URL(href, window.location.href);
          const currentPath = window.location.pathname.replace(/\/+$/, "");
          const targetPath = targetUrl.pathname.replace(/\/+$/, "");
          if (targetPath && currentPath && targetPath !== currentPath) {
            if (window.matchMedia("(max-width: 960px)").matches) closeNav();
            return;
          }
        } catch (_e) {}
        // Smart router: support both hash links and ?view= links (no full reload)
        const hashOnly = href.match(/^#(.+)/);
        if (hashOnly && hashOnly[1]) {
          e.preventDefault();
          markNavigation();
          goToSection(hashOnly[1]);
        } else if (href.indexOf("view=") !== -1) {
          const viewMatch = href.match(/[?&]view=([^&#]+)/);
          const view = viewMatch ? decodeURIComponent(viewMatch[1]) : "home";
          const hash = href.split("#")[1] || "";
          var scrollTarget = NEEDS_SCROLL[view] ? (hash || null) : null;
          if (!scrollTarget && view === "cars" && hash) {
            var tel = document.getElementById(hash);
            var tcr = document.getElementById("cars");
            if (tel && tcr && tel !== tcr && tcr.contains(tel)) {
              scrollTarget = hash;
            }
          }
          e.preventDefault();
          markNavigation();
          setView(view, scrollTarget);
          updateUrlForView(view, hash || null);
        }
        if (window.matchMedia("(max-width: 960px)").matches) {
          closeNav();
        }
      });
    });

    // Dropdown main buttons: click navigates to cars/buildings.
    // Chevron click opens/closes the panel (useful on mobile).
    nav.querySelectorAll(".nav-dropdown > button[data-nav-go]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        const go = btn.getAttribute("data-nav-go");
        const isChevron = e.target && e.target.classList && e.target.classList.contains("nav-dropdown__chev");
        if (isChevron) {
          e.preventDefault();
          btn.parentElement.classList.toggle("is-open");
          return;
        }
        if (go === "cars") {
          e.preventDefault();
          if (!document.getElementById("cars")) {
            var carsHref = hrefToMainIndexWithView("cars");
            if (carsHref) window.location.href = carsHref;
            return;
          }
          markNavigation();
          goToSection("cars");
        } else if (go === "buildings") {
          e.preventDefault();
          if (!document.getElementById("buildings")) {
            var bHref = hrefToMainIndexWithView("buildings");
            if (bHref) window.location.href = bHref;
            return;
          }
          markNavigation();
          goToSection("buildings");
        }
        if (window.matchMedia("(max-width: 960px)").matches) closeNav();
      });
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeNav);
  }

  window.addEventListener(
    "resize",
    function () {
      if (!window.matchMedia("(max-width: 960px)").matches) {
        closeNav();
      }
    },
    { passive: true }
  );

  window.addEventListener("popstate", function () {
    markNavigation();
    const psView = parseInitialView();
    const psHash = (window.location.hash || "").replace(/^#/, "");
    var psScroll = null;
    if (psHash) {
      var psEl = document.getElementById(psHash);
      var psCars = document.getElementById("cars");
      if (psView === "cars" && psEl && psCars && psEl !== psCars && psCars.contains(psEl)) {
        psScroll = psHash;
      }
    }
    setView(psView, psScroll);
  });

  const year = document.getElementById("year");

  var revealEls = document.querySelectorAll(".reveal");
  // Standalone pages (privacy) should show all content immediately.
  if (body && body.classList && body.classList.contains("page-privacy")) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else
  if (window.IntersectionObserver) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // Hero slider (auto-rotate)
  var slider = document.querySelector(".hero-slider");
  if (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
    var dotsWrap = slider.querySelector(".hero-dots");
    var autoplayMs = Number(slider.getAttribute("data-autoplay-ms")) || 4200;
    var idx = 0;
    var timer = null;

    function renderDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      slides.forEach(function (_s, i) {
        var d = document.createElement("span");
        d.className = "hero-dot" + (i === idx ? " is-active" : "");
        dotsWrap.appendChild(d);
      });
    }

    function setActive(next) {
      idx = (next + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        if (i === idx) s.classList.add("is-active");
        else s.classList.remove("is-active");
      });
      if (dotsWrap) {
        var dots = dotsWrap.querySelectorAll(".hero-dot");
        dots.forEach(function (d, i) {
          if (i === idx) d.classList.add("is-active");
          else d.classList.remove("is-active");
        });
      }
    }

    function start() {
      if (slides.length < 2) return;
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(function () {
        setActive(idx + 1);
      }, autoplayMs);
    }

    // Ensure one active slide
    var preset = slides.findIndex(function (s) {
      return s.classList.contains("is-active");
    });
    if (preset >= 0) idx = preset;
    else if (slides[0]) slides[0].classList.add("is-active");

    renderDots();
    start();

    // Pause when tab hidden
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (timer) window.clearInterval(timer);
        timer = null;
      } else {
        start();
      }
    });
  }

  // Warranty card showcase (tabs + lightbox)
  (function initWarrantyShowcase() {
    var showcase = document.querySelector(".warranty-showcase");
    if (!showcase) return;

    var downloadLink = showcase.querySelector(".warranty-download");
    var previewPanel = showcase.querySelector("[data-warranty-panel='preview']");
    var textPanel = showcase.querySelector("[data-warranty-panel='text']");

    if (!downloadLink && !textPanel) return;

    var sources = {
      ar: {
        file: "warranty-ar.png",
        alt: "كارت الضمان والعناية — نسخة عربية",
        download: "تحميل الكارت",
      },
      en: {
        file: "warranty-en.png",
        alt: "Warranty & care card — English version",
        download: "Download card",
      },
    };

    var initialSrc = (downloadLink && downloadLink.getAttribute && downloadLink.getAttribute("href")) || "";
    var basePath = initialSrc.slice(0, initialSrc.lastIndexOf("/") + 1);

    function setLang(lang) {
      var cfg = sources[lang] || sources.ar;
      var nextSrc = basePath + cfg.file;

      if (downloadLink) {
        downloadLink.setAttribute("href", nextSrc);
        downloadLink.textContent = cfg.download;
      }

      // Text panel language
      if (textPanel) {
        var blocks = Array.prototype.slice.call(textPanel.querySelectorAll("[data-warranty-text]"));
        blocks.forEach(function (b) {
          var active = b.getAttribute("data-warranty-text") === lang;
          b.hidden = !active;
        });
      }

      showcase.setAttribute("data-warranty-lang", lang);
    }

    // Init language from page language (no per-card language toggle)
    var pageLang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
    setLang(pageLang.indexOf("en") === 0 ? "en" : "ar");

    // Show all warranty content (no tabs / no preview image)
    if (previewPanel) previewPanel.hidden = false;
    if (textPanel) textPanel.hidden = false;
    showcase.removeAttribute("data-warranty-view");
  })();

  // FAQ — open all items by default
  (function openAllFaqItems() {
    var faqRoots = document.querySelectorAll("#window-film-faq, #tips-care, .wfbr-faq");
    if (!faqRoots.length) return;
    faqRoots.forEach(function (root) {
      var items = root.querySelectorAll("details");
      items.forEach(function (d) {
        d.setAttribute("open", "");
      });
    });
  })();

  // Car services — interactive paint-protection explorer (tabs + media)
  (function initServiceExplorer() {
    var roots = document.querySelectorAll("[data-service-explorer]");
    if (!roots.length) return;

    roots.forEach(function (root) {
      var picks = Array.prototype.slice.call(root.querySelectorAll(".service-explorer__pick"));
      var video = root.querySelector(".service-explorer__video");
      var vSource = video ? video.querySelector("source") : null;
      var heroImg = root.querySelector("[data-se-hero]");
      var subImg = root.querySelector("[data-se-sub]");
      var strips = root.querySelectorAll("[data-se-filmstrip] [data-se-strip]");
      var panels = Array.prototype.slice.call(root.querySelectorAll("[data-explore-panel]"));

      function pauseVideo() {
        if (video && typeof video.pause === "function") {
          try {
            video.pause();
          } catch (_e) {}
        }
      }

      function setStrip(idx, src, alt) {
        var el = strips[idx];
        if (!el) return;
        if (src) {
          el.removeAttribute("hidden");
          el.setAttribute("src", src);
          el.setAttribute("alt", alt || "");
        } else {
          el.setAttribute("hidden", "");
        }
      }

      function activate(btn) {
        if (!btn) return;

        picks.forEach(function (p) {
          var on = p === btn;
          p.classList.toggle("is-active", on);
          p.setAttribute("aria-selected", on ? "true" : "false");
          p.setAttribute("tabindex", on ? "0" : "-1");
        });

        var id = btn.getAttribute("data-panel");
        panels.forEach(function (pan) {
          var match = pan.getAttribute("data-explore-panel") === id;
          pan.classList.toggle("is-active", match);
          pan.hidden = !match;
        });

        pauseVideo();

        var vs = btn.getAttribute("data-video-src");
        var poster = btn.getAttribute("data-poster-src") || "";
        if (video && vSource && vs) {
          video.removeAttribute("hidden");
          vSource.setAttribute("src", vs);
          video.setAttribute("poster", poster);
          try {
            video.load();
          } catch (_e2) {}
        }

        if (heroImg) {
          var hs = btn.getAttribute("data-hero-src");
          if (hs) {
            heroImg.removeAttribute("hidden");
            heroImg.setAttribute("src", hs);
            heroImg.setAttribute("alt", btn.getAttribute("data-alt-hero") || "");
          }
        }

        if (subImg) {
          var sub = btn.getAttribute("data-sub-src");
          if (sub) {
            subImg.removeAttribute("hidden");
            subImg.setAttribute("src", sub);
            subImg.setAttribute("alt", btn.getAttribute("data-sub-alt") || "");
          } else {
            subImg.setAttribute("hidden", "");
          }
        }

        setStrip(0, btn.getAttribute("data-strip1-src"), btn.getAttribute("data-strip1-alt"));
        setStrip(1, btn.getAttribute("data-strip2-src"), btn.getAttribute("data-strip2-alt"));
      }

      // Lightbox for filmstrip images
      function openLightbox(src, alt) {
        var lb = document.createElement("div");
        lb.className = "phub-lightbox";
        lb.setAttribute("role", "dialog");
        lb.setAttribute("aria-modal", "true");
        lb.setAttribute("aria-label", alt || "صورة مكبّرة");

        var img = document.createElement("img");
        img.src = src;
        img.alt = alt || "";
        img.className = "phub-lightbox__img";

        var closeBtn = document.createElement("button");
        closeBtn.className = "phub-lightbox__close";
        closeBtn.setAttribute("aria-label", "إغلاق");
        closeBtn.textContent = "×";

        lb.appendChild(img);
        lb.appendChild(closeBtn);
        document.body.appendChild(lb);
        closeBtn.focus();

        function closeLb() {
          lb.remove();
          document.removeEventListener("keydown", onKey);
        }
        function onKey(e) {
          if (e.key === "Escape") closeLb();
        }
        lb.addEventListener("click", function (e) {
          if (e.target === lb) closeLb();
        });
        closeBtn.addEventListener("click", closeLb);
        document.addEventListener("keydown", onKey);
      }

      var filmstripImgs = root.querySelectorAll("[data-se-filmstrip] img");
      filmstripImgs.forEach(function (img) {
        img.addEventListener("click", function () {
          openLightbox(img.getAttribute("src"), img.getAttribute("alt"));
        });
      });

      picks.forEach(function (p) {
        p.addEventListener("click", function () {
          activate(p);
        });
        p.addEventListener("keydown", function (e) {
          var isNext = e.key === "ArrowDown" || e.key === "ArrowRight";
          var isPrev = e.key === "ArrowUp" || e.key === "ArrowLeft";
          if (!isNext && !isPrev) return;
          e.preventDefault();
          var i = picks.indexOf(p);
          var next = isNext ? picks[i + 1] : picks[i - 1];
          if (next) {
            next.focus();
            activate(next);
          }
        });
      });

      var initial = root.querySelector(".service-explorer__pick.is-active") || picks[0];
      activate(initial);
    });
  })();

  // Offers brochure — open pages in a lightweight lightbox
  (function initBrochureLightbox() {
    var cards = document.querySelectorAll(".brochure-card[href]");
    if (!cards || !cards.length) return;

    var items = Array.prototype.slice.call(cards).map(function (a) {
      return {
        href: a.getAttribute("href") || "",
        alt: (a.querySelector("img") && a.querySelector("img").getAttribute("alt")) || "Brochure page",
      };
    });

    function openAt(idx) {
      idx = Math.max(0, Math.min(items.length - 1, idx));
      var it = items[idx];
      if (!it || !it.href) return;

      var lb = document.createElement("div");
      lb.className = "brochure-lb";
      lb.setAttribute("role", "dialog");
      lb.setAttribute("aria-modal", "true");
      lb.setAttribute("aria-label", "Brochure viewer");

      var panel = document.createElement("div");
      panel.className = "brochure-lb__panel";

      var img = document.createElement("img");
      img.className = "brochure-lb__img";
      img.src = it.href;
      img.alt = it.alt || "";

      var closeBtn = document.createElement("button");
      closeBtn.className = "brochure-lb__close";
      closeBtn.setAttribute("aria-label", "Close");
      closeBtn.textContent = "×";

      var prevBtn = document.createElement("button");
      prevBtn.className = "brochure-lb__nav brochure-lb__nav--prev";
      prevBtn.setAttribute("aria-label", "Previous");
      prevBtn.textContent = "‹";

      var nextBtn = document.createElement("button");
      nextBtn.className = "brochure-lb__nav brochure-lb__nav--next";
      nextBtn.setAttribute("aria-label", "Next");
      nextBtn.textContent = "›";

      function setIdx(nextIdx) {
        idx = (nextIdx + items.length) % items.length;
        var nextIt = items[idx];
        img.src = nextIt.href;
        img.alt = nextIt.alt || "";
      }

      function close() {
        lb.remove();
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
      }

      function onKey(e) {
        if (e.key === "Escape") return close();
        if (e.key === "ArrowLeft") return setIdx(idx - 1);
        if (e.key === "ArrowRight") return setIdx(idx + 1);
      }

      prevBtn.addEventListener("click", function () { setIdx(idx - 1); });
      nextBtn.addEventListener("click", function () { setIdx(idx + 1); });
      closeBtn.addEventListener("click", close);
      lb.addEventListener("click", function (e) { if (e.target === lb) close(); });

      panel.appendChild(img);
      panel.appendChild(closeBtn);
      panel.appendChild(prevBtn);
      panel.appendChild(nextBtn);
      lb.appendChild(panel);

      document.body.appendChild(lb);
      document.body.style.overflow = "hidden";
      closeBtn.focus();
      document.addEventListener("keydown", onKey);
    }

    cards.forEach(function (a, idx) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        openAt(idx);
      });
    });
  })();
})();
