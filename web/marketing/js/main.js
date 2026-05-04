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

      var tabbedFrame = root.querySelector("[data-tabbed-frame]");
      var tabbedCarousel = tabbedFrame ? tabbedFrame.querySelector("[data-ppf-carousel]") : null;
      var carouselForPanel = tabbedCarousel ? (tabbedCarousel.getAttribute("data-carousel-for") || "ppf") : null;

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
        var isCarouselTab = tabbedCarousel && id === carouselForPanel;

        if (tabbedCarousel) {
          if (isCarouselTab) {
            tabbedCarousel.removeAttribute("hidden");
            if (video) video.setAttribute("hidden", "");
          } else {
            tabbedCarousel.setAttribute("hidden", "");
            if (video) video.removeAttribute("hidden");
          }
        }

        if (!isCarouselTab && video && vSource && vs) {
          vSource.setAttribute("src", vs);
          video.setAttribute("poster", poster);
          try {
            video.load();
          } catch (_e2) {}
        } else if (!tabbedCarousel && video && vSource && vs) {
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

  // ── PPF Image Carousel ──────────────────────────────────────────────────
  (function () {
    document.querySelectorAll("[data-ppf-carousel]").forEach(function (carousel) {
      var imgs = Array.from(carousel.querySelectorAll(".ppf-carousel__img"));
      var dots = Array.from(carousel.querySelectorAll(".ppf-carousel__dot"));
      var prevBtn = carousel.querySelector(".ppf-carousel__btn--prev");
      var nextBtn = carousel.querySelector(".ppf-carousel__btn--next");
      var current = 0;
      var timer;
      var navToken = 0;

      if (imgs.length <= 1) {
        if (prevBtn) prevBtn.setAttribute("hidden", "");
        if (nextBtn) nextBtn.setAttribute("hidden", "");
        var dotsWrap = carousel.querySelector(".ppf-carousel__dots");
        if (dotsWrap) dotsWrap.setAttribute("hidden", "");
        return;
      }

      // Preload all carousel images to avoid black flash between transitions.
      imgs.forEach(function (img) {
        try { img.loading = "eager"; } catch (_e) {}
        var src = img.currentSrc || img.getAttribute("src");
        if (!src) return;
        var pre = new Image();
        pre.decoding = "async";
        pre.src = src;
      });

      function goTo(idx) {
        var prev = current;
        var next = (idx + imgs.length) % imgs.length;
        if (prev === next) return;

        navToken += 1;
        var token = navToken;
        var nextImg = imgs[next];

        function commit() {
          if (token !== navToken) return;
          current = next;
          imgs[next].classList.add("is-active");
          requestAnimationFrame(function () {
            imgs[prev].classList.remove("is-active");
          });
          if (dots[prev]) dots[prev].classList.remove("is-active");
          if (dots[next]) dots[next].classList.add("is-active");
        }

        if (nextImg.complete && nextImg.naturalWidth > 0) {
          commit();
          return;
        }

        function onReady() { commit(); }
        nextImg.addEventListener("load", onReady, { once: true });
        nextImg.addEventListener("error", onReady, { once: true });
      }

      function startAuto() {
        clearInterval(timer);
        timer = setInterval(function () { goTo(current + 1); }, 4500);
      }

      if (prevBtn) prevBtn.addEventListener("click", function () { goTo(current - 1); startAuto(); });
      if (nextBtn) nextBtn.addEventListener("click", function () { goTo(current + 1); startAuto(); });
      dots.forEach(function (dot, i) {
        dot.addEventListener("click", function () { goTo(i); startAuto(); });
      });

      startAuto();
    });
  })();

  // ── Contact: copy main phone to clipboard ───────────────────────────────
  (function () {
    document.querySelectorAll(".contact-copy-btn[data-copy-phone]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var raw = btn.getAttribute("data-copy-phone") || "";
        var text = String(raw).replace(/\D/g, "");
        if (!text) return;

        var idle = btn.querySelector(".contact-copy-btn__idle");
        var done = btn.querySelector(".contact-copy-btn__done");

        function showDone() {
          if (idle) idle.hidden = true;
          if (done) done.hidden = false;
          setTimeout(function () {
            if (idle) idle.hidden = false;
            if (done) done.hidden = true;
          }, 2000);
        }

        function runFallback() {
          try {
            var ta = document.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.left = "-9999px";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            showDone();
          } catch (_e) {}
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(showDone).catch(runFallback);
        } else {
          runFallback();
        }
      });
    });
  })();
})();
