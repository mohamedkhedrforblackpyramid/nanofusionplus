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

  var carbonWrap = document.querySelector(".carbon-wrap");
  if (carbonWrap) {
    var carbonPanel = carbonWrap.querySelector(".carbon-panel");
    var carbonTrigger = carbonWrap.querySelector(".carbon-trigger");
    var carbonBackdrop = carbonWrap.querySelector(".carbon-panel__backdrop");
    var carbonClose = carbonWrap.querySelector(".carbon-panel__close");
    var carbonVideo = carbonWrap.querySelector("[data-carbon-video]");
    var coarsePointer =
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(pointer: coarse)").matches;

    function pauseCarbonVideo() {
      if (carbonVideo && !carbonVideo.paused) carbonVideo.pause();
    }

    function openCarbonPanel() {
      if (!carbonPanel) return;
      carbonPanel.classList.add("is-open");
      carbonPanel.setAttribute("aria-hidden", "false");
      if (carbonTrigger) carbonTrigger.setAttribute("aria-expanded", "true");
    }

    function closeCarbonPanel() {
      if (!carbonPanel) return;
      carbonPanel.classList.remove("is-open");
      carbonWrap.classList.remove("carbon-wrap--manual-close");
      carbonPanel.setAttribute("aria-hidden", "true");
      if (carbonTrigger) carbonTrigger.setAttribute("aria-expanded", "false");
      pauseCarbonVideo();
    }

    function dismissCarbonOverlay() {
      carbonWrap.classList.add("carbon-wrap--manual-close");
      pauseCarbonVideo();
    }

    if (carbonTrigger && coarsePointer) {
      carbonTrigger.addEventListener("click", function (e) {
        e.stopPropagation();
        if (carbonPanel.classList.contains("is-open")) closeCarbonPanel();
        else openCarbonPanel();
      });
    }

    if (carbonBackdrop) {
      carbonBackdrop.addEventListener("click", function (e) {
        e.stopPropagation();
        dismissCarbonOverlay();
        if (coarsePointer) closeCarbonPanel();
      });
    }

    if (carbonClose) {
      carbonClose.addEventListener("click", function (e) {
        e.stopPropagation();
        dismissCarbonOverlay();
        if (coarsePointer) closeCarbonPanel();
      });
    }

    carbonWrap.addEventListener("mouseenter", function () {
      if (!coarsePointer && carbonPanel) carbonPanel.setAttribute("aria-hidden", "false");
    });

    carbonWrap.addEventListener("mouseleave", function () {
      carbonWrap.classList.remove("carbon-wrap--manual-close");
      if (!coarsePointer && carbonPanel && !carbonPanel.classList.contains("is-open")) {
        carbonPanel.setAttribute("aria-hidden", "true");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      dismissCarbonOverlay();
      if (coarsePointer) closeCarbonPanel();
    });
  }
})();
