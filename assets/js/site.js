(() => {
  // Track interval IDs for visibility-based pausing
  const intervals = [];
  
  // Helper to create pausable intervals that stop when tab is hidden
  const createPausableInterval = (callback, delay) => {
    let intervalId = setInterval(callback, delay);
    intervals.push({ callback, delay, get id() { return intervalId; }, set id(v) { intervalId = v; } });
    return intervalId;
  };

  // Pause intervals when tab is hidden, resume when visible
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      intervals.forEach((interval) => {
        clearInterval(interval.id);
      });
    } else {
      intervals.forEach((interval) => {
        interval.callback(); // Update immediately on return
        interval.id = setInterval(interval.callback, interval.delay);
      });
    }
  });

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const backBtn = document.querySelector("[data-back]");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      location.href = backBtn.getAttribute("data-back");
    });
  }

  const langBtn = document.querySelector("[data-lang-target]");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      const target = langBtn.getAttribute("data-lang-target") || "";
      if (target.includes("-ga.html")) {
        localStorage.setItem("preferredLang", "ga");
      } else {
        localStorage.setItem("preferredLang", "en");
      }
      location.href = target;
    });
  }

  const setPreferredLangFromLink = (href) => {
    if (!href || href.startsWith("http")) {
      return;
    }
    if (href.includes("-ga.html")) {
      localStorage.setItem("preferredLang", "ga");
    } else if (href.endsWith(".html")) {
      localStorage.setItem("preferredLang", "en");
    }
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) {
      return;
    }
    setPreferredLangFromLink(link.getAttribute("href") || "");
  });

  const preferredLang = localStorage.getItem("preferredLang");
  const currentLang = (document.documentElement.lang || "").toLowerCase().startsWith("ga") ? "ga" : "en";
  if (!preferredLang) {
    localStorage.setItem("preferredLang", currentLang);
  } else if (preferredLang !== currentLang) {
    const path = location.pathname || "";
    if (preferredLang === "ga" && path.endsWith(".html") && !path.endsWith("-ga.html")) {
      const gaPath = path.replace(/\.html$/i, "-ga.html");
      location.replace(gaPath + location.search + location.hash);
    }
    if (preferredLang === "en" && path.endsWith("-ga.html")) {
      const enPath = path.replace(/-ga\.html$/i, ".html");
      location.replace(enPath + location.search + location.hash);
    }
  }

  const shareBtn = document.querySelector("[data-share]");
  if (shareBtn) {
    const hint = document.querySelector("[data-share-hint]");
    shareBtn.addEventListener("click", async () => {
      const url = location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          if (hint) {
            hint.textContent = "Link copied.";
          }
          return;
        } catch (err) {
          // Fall back to showing the URL below.
        }
      }
      if (hint) {
        hint.textContent = url;
      }
    });
  }

  const landingModal = document.querySelector("[data-landing-modal]");
  if (landingModal) {
    const modalKey = "landingNoticeDismissed";
    const closeModal = () => {
      landingModal.classList.add("is-hidden");
      landingModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      sessionStorage.setItem(modalKey, "1");
    };
    const openModal = () => {
      landingModal.classList.remove("is-hidden");
      landingModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    };
    if (!sessionStorage.getItem(modalKey)) {
      openModal();
    }
    landingModal.querySelectorAll("[data-modal-close]").forEach((el) => {
      el.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !landingModal.classList.contains("is-hidden")) {
        closeModal();
      }
    });
  }

  const devotionEl = document.querySelector("[data-devotion-time]");
  if (devotionEl) {
    const pad2 = (value) => String(value).padStart(2, "0");
    const formatDevotion = () => {
      const now = new Date();
      const year = now.getFullYear();
      const day = pad2(now.getDate());
      const month = pad2(now.getMonth() + 1);
      const hours = pad2(now.getHours());
      const minutes = pad2(now.getMinutes());
      devotionEl.textContent = `Deo gratias - Anno Domini ${year} - ${day}.${month}.${year} - ${hours}:${minutes}`;
    };
    formatDevotion();
    createPausableInterval(formatDevotion, 60000);
  }

  const horaEls = document.querySelectorAll("[data-hora]");
  if (horaEls.length) {
    const firstSaturdayOfMonth = (year, month) => {
      const firstOfMonth = new Date(year, month, 1);
      const offset = (6 - firstOfMonth.getDay() + 7) % 7;
      return new Date(year, month, 1 + offset);
    };

    const getSaturdayRotationLabel = (date) => {
      if (date.getDay() !== 6) {
        return null;
      }
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstSaturday = firstSaturdayOfMonth(year, month);
      const saturdayNumber = Math.floor((date.getDate() - firstSaturday.getDate()) / 7) + 1;
      if (saturdayNumber >= 5) {
        return "Free";
      }
      const anchorSaturday = firstSaturdayOfMonth(2026, 0);
      const dateMidnight = new Date(year, month, date.getDate());
      const weeksSinceAnchor = Math.floor(
        (dateMidnight - anchorSaturday) / (7 * 24 * 60 * 60 * 1000),
      );
      const rotationIndex = ((weeksSinceAnchor % 4) + 4) % 4;
      return ["A", "B", "C", "D"][rotationIndex];
    };

    const toMinutes = (hours, minutes) => hours * 60 + minutes;
    const formatRange = (start, end) => {
      const pad2 = (value) => String(value).padStart(2, "0");
      const startH = Math.floor(start / 60);
      const startM = start % 60;
      const endH = Math.floor(end / 60);
      const endM = end % 60;
      return `${pad2(startH)}:${pad2(startM)}-${pad2(endH)}:${pad2(endM)}`;
    };

    const schedule = [
      { start: toMinutes(5, 45), end: toMinutes(6, 15), label: "Laudes" },
      { start: toMinutes(6, 15), end: toMinutes(7, 15), label: "Prima" },
      { start: toMinutes(7, 15), end: toMinutes(8, 0), label: "Tertia" },
      { start: toMinutes(8, 0), end: toMinutes(10, 0), label: "Labora" },
      { start: toMinutes(10, 0), end: toMinutes(12, 0), label: "Labora" },
      { start: toMinutes(12, 0), end: toMinutes(14, 0), label: "Sexta" },
      { start: toMinutes(14, 0), end: toMinutes(16, 0), label: "Nona" },
      { start: toMinutes(16, 0), end: toMinutes(18, 0), label: "Vesperae" },
      { start: toMinutes(18, 0), end: toMinutes(18, 15), label: "Vesperae" },
      { start: toMinutes(18, 15), end: toMinutes(19, 45), label: "Studium" },
      { start: toMinutes(19, 45), end: toMinutes(21, 30), label: "Requies" },
      { start: toMinutes(21, 30), end: toMinutes(22, 30), label: "Completorium" },
      { start: toMinutes(22, 30), end: toMinutes(24, 0), label: "Silentium" },
      { start: toMinutes(0, 0), end: toMinutes(5, 45), label: "Silentium" },
    ];

    const formatHora = () => {
      const now = new Date();
      const current = toMinutes(now.getHours(), now.getMinutes());
      const entry = schedule.find((item) => current >= item.start && current < item.end);
      if (!entry) {
        return;
      }
      const range = formatRange(entry.start, entry.end);
      const saturdayLabel = getSaturdayRotationLabel(now);
      const label = saturdayLabel ? `${entry.label} - ${saturdayLabel}` : entry.label;
      horaEls.forEach((el) => {
        el.textContent = `${label} · ${range}`;
      });
    };

    formatHora();
    createPausableInterval(formatHora, 60000);
  }

  const dateEls = document.querySelectorAll("[data-date]");
  if (dateEls.length) {
    const pad2 = (value) => String(value).padStart(2, "0");
    const ordinal = (day) => {
      if (day % 100 >= 11 && day % 100 <= 13) {
        return `${day}th`;
      }
      switch (day % 10) {
        case 1:
          return `${day}st`;
        case 2:
          return `${day}nd`;
        case 3:
          return `${day}rd`;
        default:
          return `${day}th`;
      }
    };

    const formatDate = () => {
      const now = new Date();
      const lang = (document.documentElement.lang || "").toLowerCase();
      const path = (location.pathname || "").toLowerCase();
      const isIrish = lang.startsWith("ga") || path.includes("-ga");
      const locale = isIrish ? "ga-IE" : "en-GB";
      const year = now.getFullYear();
      if (isIrish) {
        const gaWeekdays = [
          "Domhnach",
          "Luan",
          "Máirt",
          "Céadaoin",
          "Déardaoin",
          "Aoine",
          "Satharn",
        ];
        const gaMonths = [
          "Eanáir",
          "Feabhra",
          "Márta",
          "Aibreán",
          "Bealtaine",
          "Meitheamh",
          "Iúil",
          "Lúnasa",
          "Meán Fómhair",
          "Deireadh Fómhair",
          "Samhain",
          "Nollaig",
        ];
        const weekday = gaWeekdays[now.getDay()];
        const month = gaMonths[now.getMonth()];
        const day = now.getDate();
        return `${weekday} ${day} ${month} ${year} AD`;
      }
      const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(now);
      const month = new Intl.DateTimeFormat(locale, { month: "long" }).format(now);
      const day = ordinal(now.getDate());
      return `${weekday} ${day} ${month} ${year} AD`;
    };

    const updateDate = () => {
      const value = formatDate();
      dateEls.forEach((el) => {
        el.textContent = value;
      });
    };

    updateDate();
    createPausableInterval(updateDate, 60000);
  }

  const hash = location.hash;
  if (hash) {
    const target = document.querySelector(hash);
    if (target && target.tagName === "DETAILS") {
      const scope = target.closest("main");
      if (scope) {
        const panels = scope.querySelectorAll("details.panel");
        panels.forEach((panel) => {
          if (panel !== target) {
            panel.removeAttribute("open");
          }
        });
      }
      target.setAttribute("open", "");
      target.scrollIntoView({ block: "start" });
    }
  }
})();
