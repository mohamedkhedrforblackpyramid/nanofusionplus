(function () {
  const body = document.body;
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-primary");
  const backdrop = document.getElementById("nav-backdrop");

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
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 960px)").matches) {
          closeNav();
        }
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

  const year = document.getElementById("year");

  var revealEls = document.querySelectorAll(".reveal");
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

    var previewImg = showcase.querySelector(".warranty-preview__img");
    var downloadLink = showcase.querySelector(".warranty-download");
    var openBtn = showcase.querySelector("[data-warranty-open]");
    var textToggleBtns = Array.prototype.slice.call(showcase.querySelectorAll("[data-warranty-view]"));
    var previewPanel = showcase.querySelector("[data-warranty-panel='preview']");
    var textPanel = showcase.querySelector("[data-warranty-panel='text']");

    if (!previewImg || !downloadLink) return;

    var sources = {
      ar: {
        file: "warranty-ar.png",
        alt: "كارت الضمان والعناية — نسخة عربية",
        hint: "اضغط للتكبير",
        download: "تحميل الكارت",
      },
      en: {
        file: "warranty-en.png",
        alt: "Warranty & care card — English version",
        hint: "Click to zoom",
        download: "Download card",
      },
    };

    var initialSrc = previewImg.getAttribute("src") || "";
    var basePath = initialSrc.slice(0, initialSrc.lastIndexOf("/") + 1);

    function setLang(lang) {
      var cfg = sources[lang] || sources.ar;
      var nextSrc = basePath + cfg.file;

      previewImg.setAttribute("src", nextSrc);
      previewImg.setAttribute("alt", cfg.alt);

      downloadLink.setAttribute("href", nextSrc);
      downloadLink.textContent = cfg.download;

      var hint = showcase.querySelector(".warranty-preview__hint");
      if (hint) hint.textContent = cfg.hint;

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

    function setView(view) {
      if (!previewPanel || !textPanel) return;
      var isText = view === "text";
      previewPanel.hidden = isText;
      textPanel.hidden = !isText;
      showcase.setAttribute("data-warranty-view", isText ? "text" : "preview");
      textToggleBtns.forEach(function (b) {
        var active = b.getAttribute("data-warranty-view") === view;
        if (active) b.classList.add("is-active");
        else b.classList.remove("is-active");
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    // View toggle (Preview/Text)
    if (textToggleBtns.length) {
      textToggleBtns.forEach(function (b) {
        b.addEventListener("click", function () {
          setView(b.getAttribute("data-warranty-view"));
        });
      });
    }

    // Lightbox
    var lightbox = null;
    var lbImg = null;
    var lbDl = null;

    function ensureLightbox() {
      if (lightbox) return;

      lightbox = document.createElement("div");
      lightbox.className = "warranty-lightbox";
      lightbox.setAttribute("role", "dialog");
      lightbox.setAttribute("aria-modal", "true");
      lightbox.setAttribute("aria-label", "Warranty card preview");
      lightbox.innerHTML =
        '<div class="warranty-lightbox__backdrop" data-warranty-close></div>' +
        '<div class="warranty-lightbox__panel" role="document">' +
        '  <div class="warranty-lightbox__bar">' +
        '    <a class="btn btn-ghost warranty-lightbox__download" download>Download</a>' +
        '    <button type="button" class="warranty-lightbox__close" data-warranty-close aria-label="Close">×</button>' +
        "  </div>" +
        '  <img class="warranty-lightbox__img" alt="">' +
        "</div>";

      document.body.appendChild(lightbox);

      lbImg = lightbox.querySelector(".warranty-lightbox__img");
      lbDl = lightbox.querySelector(".warranty-lightbox__download");

      lightbox.addEventListener("click", function (e) {
        var target = e.target;
        if (target && target.hasAttribute && target.hasAttribute("data-warranty-close")) {
          closeLightbox();
        }
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeLightbox();
      });
    }

    function openLightbox() {
      ensureLightbox();
      if (!lightbox || !lbImg || !lbDl) return;

      var lang = showcase.getAttribute("data-warranty-lang") || "ar";
      var cfg = sources[lang] || sources.ar;
      var src = previewImg.getAttribute("src") || "";

      lbImg.setAttribute("src", src);
      lbImg.setAttribute("alt", cfg.alt);
      lbDl.setAttribute("href", src);
      lbDl.textContent = cfg.download;

      body.classList.add("warranty-lightbox-open");
      lightbox.classList.add("is-open");
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.remove("is-open");
      body.classList.remove("warranty-lightbox-open");
    }

    if (openBtn) {
      openBtn.addEventListener("click", openLightbox);
    }

    // Init language from page language (no per-card language toggle)
    var pageLang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
    setLang(pageLang.indexOf("en") === 0 ? "en" : "ar");

    // Init view
    var initialView = showcase.getAttribute("data-warranty-view") || "preview";
    setView(initialView);
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

  // Intro video preview: loop first N seconds until user starts full playback
  (function initIntroLoopVideos() {
    var videos = document.querySelectorAll("video[data-intro-loop]");
    if (!videos.length) return;

    videos.forEach(function (video) {
      var limit = Number(video.getAttribute("data-intro-loop")) || 0.5;
      var previewMode = true;
      var userInteracted = false;

      function ensurePlay() {
        if (!previewMode || typeof video.play !== "function") return;
        try {
          var p = video.play();
          if (p && typeof p.catch === "function") p.catch(function () {});
        } catch (_e) {}
      }

      function onTimeUpdate() {
        if (!previewMode) return;
        if (video.currentTime >= limit) {
          try {
            video.currentTime = 0;
          } catch (_e2) {}
          ensurePlay();
        }
      }

      function leavePreviewMode() {
        if (!previewMode || !userInteracted) return;
        previewMode = false;
        video.removeEventListener("timeupdate", onTimeUpdate);
        video.muted = false;
      }

      video.addEventListener("timeupdate", onTimeUpdate);
      video.addEventListener("loadedmetadata", ensurePlay);

      // Any direct interaction means user wants normal full playback
      video.addEventListener("pointerdown", function () {
        userInteracted = true;
        leavePreviewMode();
      });
      video.addEventListener("keydown", function () {
        userInteracted = true;
        leavePreviewMode();
      });
      video.addEventListener("play", function () {
        leavePreviewMode();
      });

      ensurePlay();
    });
  })();

})();
