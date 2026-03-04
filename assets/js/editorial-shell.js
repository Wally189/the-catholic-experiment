(() => {
  const root = document.documentElement;
  root.classList.add("js");

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const datetimeNodes = Array.from(document.querySelectorAll("[data-datetime]"));
  const getOrdinal = (day) => {
    const tens = day % 100;
    if (tens >= 11 && tens <= 13) {
      return "th";
    }
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const updateDateTime = () => {
    if (datetimeNodes.length === 0) {
      return;
    }
    const now = new Date();
    const weekday = now.toLocaleDateString("en-GB", { weekday: "long" });
    const month = now.toLocaleDateString("en-GB", { month: "long" });
    const day = now.getDate();
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const formatted = `${weekday} ${day}${getOrdinal(day)} ${month} ${year} ${hours}:${minutes}`;
    datetimeNodes.forEach((node) => {
      node.textContent = formatted;
    });
  };

  updateDateTime();
  if (datetimeNodes.length > 0) {
    window.setInterval(updateDateTime, 1000);
  }

  const getCurrentFile = () => {
    const file = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    return file === "" ? "index.html" : file;
  };

  const currentFile = getCurrentFile();
  document.querySelectorAll(".site-nav a, .footer-nav a").forEach((link) => {
    const href = (link.getAttribute("href") || "").toLowerCase();
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) {
      return;
    }
    const linkFile = href.split("#")[0];
    if (linkFile === currentFile) {
      link.setAttribute("aria-current", "page");
    }
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileHeaderMedia = window.matchMedia("(max-width: 760px)");
  const siteHeader = document.querySelector(".site-header");

  const updateHeaderCondensed = () => {
    if (!siteHeader) {
      return;
    }
    if (!mobileHeaderMedia.matches) {
      siteHeader.classList.remove("is-condensed");
      return;
    }
    siteHeader.classList.toggle("is-condensed", window.scrollY > 72);
  };

  const progressBar = document.querySelector("[data-scroll-progress]");
  const updateProgress = () => {
    if (!progressBar) {
      return;
    }
    const doc = document.documentElement;
    const total = Math.max(1, doc.scrollHeight - window.innerHeight);
    const pct = Math.min(1, Math.max(0, window.scrollY / total));
    progressBar.style.transform = `scaleX(${pct})`;
  };

  let ticking = false;
  const scheduleFrame = () => {
    if (ticking) {
      return;
    }
    ticking = true;
    window.requestAnimationFrame(() => {
      updateProgress();
      updateHeaderCondensed();
      if (!reduceMotion) {
        updateParallax();
      }
      ticking = false;
    });
  };

  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  if (revealItems.length > 0) {
    if (reduceMotion) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        {
          threshold: 0.16,
          rootMargin: "0px 0px -8% 0px",
        }
      );

      revealItems.forEach((item) => observer.observe(item));
    }
  }

  const parallaxItems = Array.from(document.querySelectorAll("[data-parallax]"));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const updateParallax = () => {
    const viewportHalf = window.innerHeight / 2;
    parallaxItems.forEach((item) => {
      const layer = item.querySelector("[data-parallax-layer]") || item;
      const speed = Number(item.getAttribute("data-parallax")) || 0.08;
      const rect = item.getBoundingClientRect();

      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        return;
      }

      const offsetFromCenter = rect.top + rect.height / 2 - viewportHalf;
      const translateY = clamp(offsetFromCenter * speed * -0.18, -18, 18);
      layer.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
    });
  };

  updateProgress();
  updateHeaderCondensed();
  if (!reduceMotion) {
    updateParallax();
  }

  window.addEventListener("scroll", scheduleFrame, { passive: true });
  window.addEventListener("resize", scheduleFrame);
})();
