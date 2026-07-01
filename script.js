const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function decodeImage(image) {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve();
  if (typeof image.decode === "function") {
    return image.decode().catch(() => undefined);
  }

  return new Promise((resolve) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", resolve, { once: true });
  });
}

async function setupGrassAnimation() {
  const scene = document.querySelector("[data-grass-animation]");
  const frames = scene ? Array.from(scene.querySelectorAll(".grass-frame")) : [];

  if (!scene || !frames.length) return;

  const finalFrame = frames[frames.length - 1];

  await decodeImage(finalFrame);

  frames.forEach((frame) => frame.classList.remove("is-visible"));
  finalFrame.classList.add("is-visible");
  scene.classList.add("is-ready");

  if (prefersReducedMotion.matches) {
    return;
  }

  if (!window.gsap) {
    scene.classList.add("is-windy");
    finalFrame.classList.add("is-breathing");
    return;
  }

  gsap.set(scene, {
    x: 0,
    y: 0,
    rotation: 0,
    transformOrigin: "50% 58%",
  });
  gsap.set(finalFrame, {
    scale: 1,
    transformOrigin: "50% 62%",
  });

  const wind = gsap.timeline({
    repeat: -1,
    defaults: { ease: "sine.inOut" },
  });

  wind
    .to(scene, { x: 7, y: -5, rotation: 0.12, duration: 4.2 })
    .to(scene, { x: -5, y: 3, rotation: -0.08, duration: 3.8 })
    .to(scene, { x: 4, y: -2, rotation: 0.05, duration: 3.4 })
    .to(scene, { x: 0, y: 0, rotation: 0, duration: 4.4 }, ">-0.2");

  gsap.to(finalFrame, {
    scale: 1.009,
    duration: 7.4,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
}

function setupRevealAnimation() {
  const revealTargets = document.querySelectorAll(".reveal");
  const timelineItems = document.querySelectorAll(".timeline li");

  if (prefersReducedMotion.matches) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
    timelineItems.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealTargets.forEach((target) => observer.observe(target));

  const timelineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const visibleItems = Array.from(timelineItems);
        const index = visibleItems.indexOf(entry.target);
        entry.target.style.transitionDelay = `${Math.max(index, 0) * 140}ms`;
        entry.target.classList.add("is-visible");
        timelineObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.24,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  timelineItems.forEach((target) => timelineObserver.observe(target));
}

function setupSmoothNavigation() {
  const navLinks = document.querySelectorAll('a[href^="#"]');

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);

      if (!target || prefersReducedMotion.matches) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function setupFloatingProjectNav() {
  const floatingNav = document.querySelector(".floating-project-nav");

  if (!floatingNav) return;

  const links = Array.from(floatingNav.querySelectorAll('a[href^="#"]'));
  const sectionLinks = links
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1);
      const section = id ? document.getElementById(id) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean);
  const sectionsByPageOrder = [...sectionLinks].sort(
    (a, b) => a.section.offsetTop - b.section.offsetTop
  );

  const setActiveLink = (activeSection) => {
    links.forEach((link) => {
      link.classList.toggle(
        "is-active",
        link.getAttribute("href") === `#${activeSection.id}`
      );
    });
  };

  if (!sectionLinks.length) return;

  links.forEach((link) => link.classList.remove("is-active"));
  sectionLinks[0].link.classList.add("is-active");

  let ticking = false;
  let fallbackTimer = null;

  const updateActiveByScroll = () => {
    const marker = window.innerHeight * 0.45;
    const current = sectionsByPageOrder.reduce((active, item) => {
      const top = item.section.getBoundingClientRect().top;
      return top <= marker ? item : active;
    }, sectionsByPageOrder[0]);

    setActiveLink(current.section);
    ticking = false;
  };

  const requestActiveUpdate = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateActiveByScroll);
    }

    window.clearTimeout(fallbackTimer);
    fallbackTimer = window.setTimeout(updateActiveByScroll, 120);
  };

  updateActiveByScroll();
  window.addEventListener("scroll", requestActiveUpdate, { passive: true });
  window.addEventListener("scrollend", updateActiveByScroll);
  window.addEventListener("resize", requestActiveUpdate);
}

setupGrassAnimation();
setupRevealAnimation();
setupSmoothNavigation();
setupFloatingProjectNav();
