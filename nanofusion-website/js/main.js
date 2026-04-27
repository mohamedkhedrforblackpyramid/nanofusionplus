(function () {
  const body = document.body;
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-primary");
  const backdrop = document.getElementById("nav-backdrop");

  // ── Smart views router (turn sections into "pages") ──
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
    nav.querySelectorAll("a").forEach(function (a) {
      const href = a.getAttribute("href") || "";
      const m = href.match(/[?&]view=([^&#]+)/);
      const v = m ? decodeURIComponent(m[1]) : "";
      if (v && v === wanted) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    // Highlight dropdown root buttons too (cars/buildings)
    nav.querySelectorAll(".nav-dropdown > button[data-nav-go]").forEach(function (btn) {
      const go = btn.getAttribute("data-nav-go");
      if (go && go === wanted) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
  }

  function setView(view, scrollTargetId) {
    if (!view || view === "home") body.setAttribute("data-view", "home");
    else body.setAttribute("data-view", view);
    syncNavActive(view);

    // Always reset scroll position when navigating via the top bar.
    // Using "auto" avoids mid-scroll states and ensures the view starts at the top.
    try {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    } catch (_e0) {}

    // For nested sections (warranty/faq/tips), scroll to sub-element after paint
    if (scrollTargetId) {
      requestAnimationFrame(function () {
        var el = document.getElementById(scrollTargetId);
        if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
        else window.scrollTo({ top: 0, behavior: "auto" });
      });
    } else {
      try {
        window.scrollTo({ top: 0, behavior: "auto" });
      } catch (_e) {
        window.scrollTo(0, 0);
      }
    }
  }

  function parseInitialView() {
    const params = new URLSearchParams(window.location.search);
    const v = (params.get("view") || "").trim().toLowerCase();
    if (v) return v;
    const hash = (window.location.hash || "").replace(/^#/, "");
    if (hash && VIEW_BY_ID[hash]) return VIEW_BY_ID[hash];
    return "home";
  }

  function updateUrlForView(view, idForHash) {
    const url = new URL(window.location.href);
    url.searchParams.set("view", view);
    if (idForHash) url.hash = "#" + idForHash;
    history.pushState({ view: view }, "", url.toString());
  }

  // Nested views (warranty/faq/tips) are rendered inside #window-film,
  // but we always want to land at the top of the view (not mid-page).
  const NEEDS_SCROLL = {};

  function goToSection(id) {
    const mappedView = VIEW_BY_ID[id];
    const el = id ? document.getElementById(id) : null;
    // If the hash points to an element that is NOT a view root (e.g. footer anchors),
    // keep the current page as home and scroll to that element.
    if (!mappedView && el) {
      setView("home", id);
      updateUrlForView("home", id);
      return;
    }

    const view = mappedView || "home";
    const scrollTarget = NEEDS_SCROLL[view] ? id : null;
    setView(view, scrollTarget);
    updateUrlForView(view, id);
  }

  // Init view on load — handle nested scroll targets too
  (function () {
    const initView = parseInitialView();
    const initHash = (window.location.hash || "").replace(/^#/, "");
    const scrollTarget = null;
    setView(initView, scrollTarget);
  })();

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
          goToSection(hashOnly[1]);
        } else if (href.indexOf("view=") !== -1) {
          const viewMatch = href.match(/[?&]view=([^&#]+)/);
          const view = viewMatch ? decodeURIComponent(viewMatch[1]) : "home";
          const hash = href.split("#")[1] || "";
          const scrollTarget = NEEDS_SCROLL[view] ? (hash || null) : null;
          e.preventDefault();
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
          goToSection("cars");
        } else if (go === "buildings") {
          e.preventDefault();
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
    setView(parseInitialView());
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
})();
