const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const grassFrameCandidates = Array.from({ length: 7 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  return [`./assets/grass/grass-${number}.png.png`, `./assets/grass/grass-${number}.png`];
});

function setupGrassAnimation() {
  const image = document.querySelector(".grass-frame");
  const canvas = document.querySelector(".grass-canvas");

  if (!image || !canvas) return;

  const island = document.querySelector("[data-grass-animation]");
  let loadedFrames = [];

  const preloadFrame = (src) =>
    new Promise((resolve) => {
      const frame = new Image();
      frame.onload = async () => {
        if (frame.decode) {
          try {
            await frame.decode();
          } catch {
            // Decoding can fail in older browsers even when the image is usable.
          }
        }

        resolve(frame);
      };
      frame.onerror = () => resolve(null);
      frame.src = src;
    });

  const preload = grassFrameCandidates.map(async (candidates) => {
    for (const src of candidates) {
      const loaded = await preloadFrame(src);

      if (loaded) return loaded;
    }

    return null;
  });

  Promise.all(preload).then((results) => {
    loadedFrames = results.filter(Boolean);

    if (!loadedFrames.length) {
      image.classList.add("is-missing");
      island?.classList.add("is-missing");
      return;
    }

    island?.classList.add("has-frame");
    image.src = loadedFrames[loadedFrames.length - 1].src;

    const context = canvas.getContext("2d");
    const firstFrame = loadedFrames[0];
    const finalFrame = loadedFrames[loadedFrames.length - 1];

    canvas.width = finalFrame.naturalWidth;
    canvas.height = finalFrame.naturalHeight;

    const background = sampleEdgeColor(finalFrame);
    document.documentElement.style.setProperty("--hero-bg", background);

    if (!context) return;

    island?.classList.add("uses-canvas");

    const blendCanvas = document.createElement("canvas");
    const blendContext = blendCanvas.getContext("2d");
    blendCanvas.width = canvas.width;
    blendCanvas.height = canvas.height;

    const drawFrame = (targetContext, frame, alpha = 1) => {
      targetContext.globalAlpha = alpha;
      targetContext.drawImage(frame, 0, 0, canvas.width, canvas.height);
      targetContext.globalAlpha = 1;
    };

    const drawFrameLegacy = (frame, alpha = 1) => {
      context.globalAlpha = alpha;
      context.drawImage(frame, 0, 0, canvas.width, canvas.height);
      context.globalAlpha = 1;
    };

    const drawBackground = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawStatic = (frame) => {
      drawBackground();
      drawFrameLegacy(frame);
    };

    if (prefersReducedMotion.matches || loadedFrames.length === 1) {
      drawStatic(finalFrame);
      return;
    }

    const duration = 10800;
    const segmentDuration = duration / (loadedFrames.length - 1);
    const ease = (value) => 1 - Math.pow(1 - value, 3);
    const smoothStep = (value) => value * value * (3 - 2 * value);
    let startTime;

    const drawGrowingFrame = (currentFrame, nextFrame, localProgress, totalProgress) => {
      if (!blendContext) return;

      blendContext.clearRect(0, 0, canvas.width, canvas.height);
      blendContext.fillStyle = background;
      blendContext.fillRect(0, 0, canvas.width, canvas.height);
      drawFrame(blendContext, currentFrame, 1);
      drawFrame(blendContext, nextFrame, localProgress);

      drawBackground();

      const revealProgress = smoothStep(Math.min(totalProgress * 1.08, 1));
      const revealTop = canvas.height * (0.82 - 0.78 * revealProgress);
      const feather = canvas.height * 0.11;
      const hardTop = Math.min(revealTop + feather, canvas.height);

      context.save();
      context.beginPath();
      context.rect(0, hardTop, canvas.width, canvas.height - hardTop);
      context.clip();
      context.drawImage(blendCanvas, 0, 0);
      context.restore();

      if (revealTop < canvas.height) {
        const bandHeight = Math.min(feather, canvas.height - revealTop);
        const gradient = context.createLinearGradient(0, revealTop, 0, revealTop + bandHeight);
        gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 1)");

        context.save();
        context.globalCompositeOperation = "source-over";
        context.beginPath();
        context.rect(0, revealTop, canvas.width, bandHeight);
        context.clip();
        context.drawImage(blendCanvas, 0, 0);
        context.globalCompositeOperation = "destination-in";
        context.fillStyle = gradient;
        context.fillRect(0, revealTop, canvas.width, bandHeight);
        context.restore();
      }
    };

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;

      const elapsed = Math.min(timestamp - startTime, duration);
      const totalProgress = elapsed / duration;
      const rawIndex = elapsed / segmentDuration;
      const frameIndex = Math.min(Math.floor(rawIndex), loadedFrames.length - 2);
      const localProgress = ease(rawIndex - frameIndex);
      const currentFrame = loadedFrames[frameIndex];
      const nextFrame = loadedFrames[frameIndex + 1];

      drawGrowingFrame(currentFrame, nextFrame, localProgress, totalProgress);

      if (elapsed < duration) {
        window.requestAnimationFrame(animate);
      } else {
        drawStatic(finalFrame);
      }
    };

    drawGrowingFrame(firstFrame, loadedFrames[1], 0, 0);
    window.requestAnimationFrame(animate);
  });
}

function sampleEdgeColor(image) {
  const sampler = document.createElement("canvas");
  const context = sampler.getContext("2d", { willReadFrequently: true });

  if (!context) return "#ffffff";

  sampler.width = image.naturalWidth;
  sampler.height = image.naturalHeight;
  context.drawImage(image, 0, 0);

  const points = [];
  const step = 32;
  const edge = 18;

  for (let x = 0; x < sampler.width; x += step) {
    points.push([x, edge], [x, sampler.height - edge]);
  }

  for (let y = 0; y < sampler.height; y += step) {
    points.push([edge, y], [sampler.width - edge, y]);
  }

  const total = points.reduce(
    (sum, [x, y]) => {
      const pixel = context.getImageData(x, y, 1, 1).data;
      sum.red += pixel[0];
      sum.green += pixel[1];
      sum.blue += pixel[2];
      return sum;
    },
    { red: 0, green: 0, blue: 0 }
  );

  const count = points.length;
  const red = Math.round(total.red / count);
  const green = Math.round(total.green / count);
  const blue = Math.round(total.blue / count);

  return `rgb(${red}, ${green}, ${blue})`;
}

function setupRevealAnimation() {
  const revealTargets = document.querySelectorAll(".reveal");

  if (prefersReducedMotion.matches) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
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
