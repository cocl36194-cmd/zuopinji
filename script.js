document.documentElement.classList.add("js-enabled");

const themeButtons = [
  document.getElementById("themeToggle"),
  document.getElementById("navThemeToggle"),
].filter(Boolean);
const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");
const navLinks = Array.from(document.querySelectorAll(".site-nav a[href^='#']"));
const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 821px)");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const lagElements = Array.from(document.querySelectorAll(".scroll-lag"));

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
}

themeButtons.forEach((button) => button.addEventListener("click", toggleTheme));

function setMenuOpen(open) {
  if (!menuToggle || !siteNav) return;
  siteNav.classList.toggle("open", open);
  document.documentElement.classList.toggle("menu-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    setMenuOpen(!siteNav.classList.contains("open"));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

const revealTargets = Array.from(document.querySelectorAll(".reveal"));
revealTargets.forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 42}ms`;
});

if ("IntersectionObserver" in window) {
  const revealPlayObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -12% 0px" },
  );

  const revealResetObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          entry.target.classList.remove("is-visible");
        }
      });
    },
    { threshold: 0, rootMargin: "18% 0px 18% 0px" },
  );

  revealTargets.forEach((element) => {
    revealPlayObserver.observe(element);
    revealResetObserver.observe(element);
  });
} else {
  revealTargets.forEach((element) => element.classList.add("is-visible"));
}

const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function updateCurrentNav() {
  const reference = window.scrollY + 120;
  let currentId = sections[0]?.id;

  sections.forEach((section) => {
    if (section.offsetTop <= reference) currentId = section.id;
  });

  navLinks.forEach((link) => {
    link.toggleAttribute("aria-current", link.getAttribute("href") === `#${currentId}`);
  });
}

function updateScrollDetails() {
  const scrollLimit = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(Math.max(window.scrollY / scrollLimit, 0), 1);
  document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));

  if (reducedMotionQuery.matches) return;

  const viewportCenter = window.innerHeight / 2;
  lagElements.forEach((element) => {
    const lag = Number(element.dataset.lag || 0.02);
    const rect = element.getBoundingClientRect();
    const elementCenter = rect.top + rect.height / 2;
    const offset = Math.max(-42, Math.min(42, (viewportCenter - elementCenter) * lag));
    element.style.setProperty("--lag-y", `${offset.toFixed(2)}px`);
  });
}

let ticking = false;
function requestScrollUpdate() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateCurrentNav();
    updateScrollDetails();
    ticking = false;
  });
}

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate, { passive: true });
requestScrollUpdate();

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement("input");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }

    const original = button.textContent;
    button.textContent = "已复制邮箱";
    button.classList.add("copied");
    window.setTimeout(() => {
      button.textContent = original;
      button.classList.remove("copied");
    }, 1500);
  });
});

function setupCustomCursor() {
  if (!finePointerQuery.matches || reducedMotionQuery.matches) return;

  document.documentElement.classList.add("fine-cursor");
  const cursor = document.createElement("div");
  cursor.className = "custom-cursor";
  document.body.appendChild(cursor);

  let cursorX = 0;
  let cursorY = 0;
  let targetX = 0;
  let targetY = 0;

  document.addEventListener("pointermove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  });

  document.addEventListener("pointerdown", () => cursor.classList.add("clicking"));
  document.addEventListener("pointerup", () => cursor.classList.remove("clicking"));

  function animate() {
    cursorX += (targetX - cursorX) * 0.3;
    cursorY += (targetY - cursorY) * 0.3;
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    requestAnimationFrame(animate);
  }

  document.querySelectorAll("a, button").forEach((element) => {
    element.addEventListener("mouseenter", () => cursor.classList.add("hovering"));
    element.addEventListener("mouseleave", () => cursor.classList.remove("hovering"));
  });

  animate();
}

setupCustomCursor();

function setupCursorGlow() {
  if (!finePointerQuery.matches || reducedMotionQuery.matches) return;

  let pageFrame = 0;
  let pageX = window.innerWidth / 2;
  let pageY = window.innerHeight * 0.18;

  document.addEventListener("pointermove", (event) => {
    pageX = event.clientX;
    pageY = event.clientY;

    if (pageFrame) return;
    pageFrame = requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--page-glow-x", `${pageX}px`);
      document.documentElement.style.setProperty("--page-glow-y", `${pageY}px`);
      pageFrame = 0;
    });
  });

  document.querySelectorAll("[data-cursor-glow]").forEach((surface) => {
    let frame = 0;
    let nextX = 50;
    let nextY = 50;

    surface.addEventListener("pointermove", (event) => {
      const rect = surface.getBoundingClientRect();
      nextX = ((event.clientX - rect.left) / rect.width) * 100;
      nextY = ((event.clientY - rect.top) / rect.height) * 100;

      if (frame) return;
      frame = requestAnimationFrame(() => {
        surface.style.setProperty("--mx", `${nextX}%`);
        surface.style.setProperty("--my", `${nextY}%`);
        frame = 0;
      });
    });
  });
}

setupCursorGlow();
