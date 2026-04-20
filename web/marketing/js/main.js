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
  if (year) year.textContent = new Date().getFullYear();

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
})();
