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

function splitIntoLetterSpans(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;

  while ((node = walker.nextNode())) textNodes.push(node);

  textNodes.forEach((textNode) => {
    const text = textNode.textContent.replace(/\s+/g, " ").trim();

    if (!text) {
      textNode.parentNode.removeChild(textNode);
      return;
    }

    const frag = document.createDocumentFragment();
    const words = text.split(" ");

    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement("span");
      wordSpan.className = "hero-word";

      word.split("").forEach((char) => {
        const span = document.createElement("span");
        span.className = "hero-letter";
        span.textContent = char;
        wordSpan.appendChild(span);
      });

      frag.appendChild(wordSpan);

      if (wordIndex < words.length - 1) {
        frag.appendChild(document.createTextNode(" "));
      }
    });

    textNode.parentNode.replaceChild(frag, textNode);
  });

  return Array.from(el.querySelectorAll(".hero-letter"));
}

function setupHeroTitleWave() {
  const title = document.getElementById("hero-title");

  if (!title || !window.gsap || prefersReducedMotion.matches) return;

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const letters = splitIntoLetterSpans(title);

  if (!canHover || !letters.length) return;

  const RADIUS = 90;
  const MAX_LIFT = 9;
  const MAX_ROTATE = 5;

  let pointer = null;
  let rafId = null;

  const applyWave = () => {
    rafId = null;
    if (!pointer) return;

    letters.forEach((letter) => {
      const rect = letter.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = pointer.x - cx;
      const dy = pointer.y - cy;
      const dist = Math.hypot(dx, dy);
      const influence = Math.max(0, 1 - dist / RADIUS);

      gsap.to(letter, {
        y: -MAX_LIFT * influence,
        rotation: (dx < 0 ? 1 : -1) * MAX_ROTATE * influence,
        duration: 0.55,
        ease: "sine.out",
        overwrite: "auto",
      });
    });
  };

  const onPointerMove = (event) => {
    pointer = { x: event.clientX, y: event.clientY };
    if (!rafId) rafId = requestAnimationFrame(applyWave);
  };

  const onPointerLeave = () => {
    pointer = null;
    gsap.to(letters, {
      y: 0,
      rotation: 0,
      duration: 0.7,
      ease: "sine.out",
      overwrite: "auto",
    });
  };

  title.addEventListener("mousemove", onPointerMove);
  title.addEventListener("mouseleave", onPointerLeave);
}

function setupHeroScrollEffect() {
  if (prefersReducedMotion.matches || !window.gsap || !window.ScrollTrigger) return;

  const hero = document.querySelector(".hero");
  const grassStage = document.querySelector(".grass-stage");

  if (!hero || !grassStage) return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.to(grassStage, {
    y: 36,
    opacity: 0.4,
    ease: "none",
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: 0.6,
    },
  });
}

function setupStoryScenes() {
  const section = document.getElementById("story");
  const stage = document.querySelector("[data-story-stage]");

  if (!section || !stage) return;

  const scene1 = stage.querySelector('[data-story-scene="1"]');
  const scene2 = stage.querySelector('[data-story-scene="2"]');
  const scene3 = stage.querySelector('[data-story-scene="3"]');
  const words = Array.from(scene1.querySelectorAll("[data-word]"));
  const gardenText = scene2.querySelector("[data-garden-text]");
  const backdrop = section.querySelector("[data-story-backdrop]");
  const texture = section.querySelector("[data-story-texture]");
  const kicker = scene3.querySelector("[data-story-kicker]");
  const lines = Array.from(scene3.querySelectorAll(".story-line"));

  if (prefersReducedMotion.matches || !window.gsap || !window.ScrollTrigger) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  stage.classList.add("is-pinned");

  gsap.set(words, { color: "#c9cdbf" });
  gsap.set(scene1, { autoAlpha: 1 });
  gsap.set(scene2, { autoAlpha: 0 });
  gsap.set(gardenText, { rotateX: 25, transformOrigin: "50% 100%", scale: 1 });
  gsap.set(scene3, { autoAlpha: 0 });
  gsap.set(kicker, { opacity: 0, y: 16 });
  gsap.set(lines, { opacity: 0, y: 14 });
  gsap.set(backdrop, { backgroundColor: "#f7f5ef" });
  gsap.set(texture, { opacity: 0 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=" + window.innerHeight * 4.5,
      scrub: 0.6,
      pin: true,
      anticipatePin: 1,
    },
  });

  words.forEach((word, index) => {
    tl.to(
      word,
      { color: "#1c1f1a", y: 0, scale: 1, duration: 0.6, ease: "power2.out" },
      index === 0 ? 0 : "+=0.05"
    ).fromTo(word, { y: 6, scale: 0.96 }, { y: 0, scale: 1, duration: 0.6, ease: "power2.out" }, "<");
  });

  tl.to({}, { duration: 0.8 });

  tl.to(scene1, { autoAlpha: 0, y: -20, duration: 0.8, ease: "power1.inOut" })
    .set(scene2, { autoAlpha: 1 })
    .to(gardenText, { rotateX: 0, duration: 1, ease: "power2.out" }, "<");

  tl.to({}, { duration: 0.4 });

  tl.addLabel("growzoom")
    .to(gardenText, { scale: 24, duration: 2.4, ease: "power1.in" }, "growzoom")
    .to(backdrop, { backgroundColor: "#5e7658", duration: 2.4, ease: "power1.inOut" }, "growzoom")
    .to(texture, { opacity: 0.06, duration: 2, ease: "sine.inOut" }, "growzoom+=0.3")
    .to(gardenText, { autoAlpha: 0, duration: 0.4 }, "growzoom+=2");

  tl.set(scene2, { autoAlpha: 0 })
    .set(scene3, { autoAlpha: 1 })
    .to(kicker, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" })
    .to(lines, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.18 }, "<0.2");
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

  gsap.to(scene, {
    y: -8,
    rotation: 0.35,
    duration: 8,
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

const BANNER_CONTENT = [
  {
    title: "건강기능식품 SNS 프로모션 배너",
    desc: "센트룸 멀티 구미의 '맛있게 섭취하는 비타민'이라는 특징을 강조하기 위해 하늘과 구름으로 가볍고 건강한 분위기, 다양한 과일 젤리를 배치하여 제품의 맛과 즐거운 섭취 경험을 직관적으로 전달했습니다.",
    tools: ["Photoshop", "Gemini"],
  },
  {
    title: "해피아워 이벤트 광고 포스터",
    desc: "해피아워 맥주 할인 이벤트를 홍보하기 위해 생맥주를 따르는 순간을 메인 비주얼로 활용해 시원함과 현장감을 전달하고, 대각선으로 배치한 타이포그래피를 통해 역동적인 분위기를 표현했습니다. 블랙과 골드 컬러를 중심으로 프리미엄 펍의 감성과 할인 정보를 효과적으로 전달했습니다.",
    tools: ["Figma", "Gemini"],
  },
  {
    title: "모바일 프로모션 디자인",
    desc: "백화점 봄맞이 사은행사 안내를 위해 하늘색 배경과 꽃, 나비 오브젝트를 활용해 봄의 화사한 분위기와 할인 혜택을 표현했습니다. 할인 정보와 프로모션 혜택을 시각적으로 구분해 사용자가 이벤트 내용을 빠르게 이해할 수 있도록 구성했습니다.",
    tools: ["Photoshop", "Gemini"],
  },
  {
    title: "페스티벌 안내 포스터",
    desc: "파도, 야자수, 무지개 오브젝트를 활용해 여름 해변의 자유롭고 시원한 축제 분위기를 표현했습니다. 행사명, 일정, 라인업 정보를 시각적 위계에 따라 배치해 핵심 정보를 빠르게 전달하도록 구성했습니다.",
    tools: ["Photoshop", "Gemini"],
  },
  {
    title: "향수 브랜드 키비주얼 디자인",
    desc: "물결과 꽃 오브젝트를 활용해 샤워 후 피부에 은은하게 남는 향의 여운과 편안함을 표현했습니다. 차분한 그린 톤과 여백, 중앙 제품 배치를 통해 프리미엄 향수 브랜드의 분위기와 아이덴티티를 강조했습니다.",
    tools: ["Photoshop", "Gemini"],
  },
  {
    title: "인스타그램 이벤트 배너",
    desc: "실제 쇼핑몰 재직 당시 진행한 고객 참여형 SNS 이벤트를 위해 제작한 프로모션 배너로 브랜드와 함께 행복한 순간을 공유하도록 유도하는 캠페인으로 필름 프레임과 고객 사진을 활용해 이벤트 정보를 한눈에 이해할 수 있도록 구성했습니다.",
    tools: ["Photoshop"],
  },
  {
    title: "게임 프로모션 메인 디자인",
    desc: "붉은 조명과 파티클 효과를 활용해 판타지 게임 특유의 화려하고 몰입감 있는 분위기를 표현했습니다. 캐릭터와 게임 타이틀을 중심으로 시선을 집중시키고, 이벤트 문구와 CTA를 명확하게 배치해 참여를 유도하도록 구성했습니다.",
    tools: ["Photoshop", "ChatGPT"],
  },
  {
    title: "뷰티 제품 프로모션 띠배너",
    desc: "실버와 핑크 컬러를 활용해 립 플럼퍼의 쿨링감과 볼륨감을 시원하고 세련된 분위기로 표현했습니다. 제품 이미지와 핵심 카피를 간결하게 배치해 제품 특징을 빠르게 인지할 수 있도록 구성했습니다.",
    tools: ["Figma"],
  },
  {
    title: "F&B 프로모션 띠배너",
    desc: "라멘 이미지를 중심으로 배치하고 곡선 패턴을 활용해 라멘의 면을 연상시켜 브랜드 콘셉트를 시각적으로 표현했습니다. 할인율과 핵심 문구를 강조해 이벤트 정보를 빠르게 인지하고 참여를 유도하도록 구성했습니다.",
    tools: ["Photoshop"],
  },
  {
    title: "의료 프로모션 띠배너",
    desc: "밝은 퍼플 톤과 교정 장치 이미지를 활용해 의료 서비스의 신뢰감과 이벤트 목적을 직관적으로 표현했습니다. 핵심 문구와 혜택 정보를 강조해 사용자가 내용을 한눈에 이해할 수 있도록 구성했습니다.",
    tools: ["Figma", "Gemini"],
  },
];

function setupBannerCoverflow() {
  const stage = document.querySelector("[data-banner-coverflow]");
  const track = document.querySelector("[data-banner-track]");
  const slides = track ? Array.from(track.querySelectorAll(".banner-slide")) : [];
  const info = document.querySelector("[data-banner-info]");

  if (!stage || !track || !slides.length || !info) return;

  const infoIndexEl = info.querySelector("[data-banner-info-current]");
  const infoTitleEl = info.querySelector("[data-banner-info-title]");
  const infoDescEl = info.querySelector("[data-banner-info-desc]");
  const infoToolsEl = info.querySelector("[data-banner-info-tools]");
  const prevBtn = document.querySelector("[data-banner-prev]");
  const nextBtn = document.querySelector("[data-banner-next]");
  const sliderTrack = document.querySelector("[data-banner-slider] .banner-slider-track");
  const sliderFill = document.querySelector("[data-banner-slider-fill]");
  const sliderThumb = document.querySelector("[data-banner-slider-thumb]");

  const count = slides.length;
  let currentIndex = 0;
  let goTo = () => {};

  function updateSlider(index) {
    if (!sliderTrack || !sliderFill || !sliderThumb) return;
    const pct = count > 1 ? (index / (count - 1)) * 100 : 0;
    sliderFill.style.width = `${pct}%`;
    sliderThumb.style.left = `${pct}%`;
    sliderThumb.setAttribute("aria-valuemax", String(count));
    sliderThumb.setAttribute("aria-valuenow", String(index + 1));
  }

  if (sliderTrack) {
    let dragging = false;

    const setFromClientX = (clientX) => {
      const rect = sliderTrack.getBoundingClientRect();
      const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      goTo(Math.round(pct * (count - 1)));
    };

    sliderTrack.addEventListener("pointerdown", (event) => {
      dragging = true;
      sliderTrack.setPointerCapture(event.pointerId);
      setFromClientX(event.clientX);
    });

    sliderTrack.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      setFromClientX(event.clientX);
    });

    const stopDragging = (event) => {
      dragging = false;
      if (sliderTrack.hasPointerCapture(event.pointerId)) {
        sliderTrack.releasePointerCapture(event.pointerId);
      }
    };

    sliderTrack.addEventListener("pointerup", stopDragging);
    sliderTrack.addEventListener("pointercancel", stopDragging);

    sliderThumb?.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        goTo(currentIndex - 1);
        event.preventDefault();
      } else if (event.key === "ArrowRight") {
        goTo(currentIndex + 1);
        event.preventDefault();
      }
    });
  }

  function renderInfo(index) {
    const data = BANNER_CONTENT[index] || {};
    currentIndex = index;

    if (infoIndexEl) infoIndexEl.textContent = String(index + 1).padStart(2, "0");
    if (infoTitleEl) infoTitleEl.textContent = data.title || "";
    if (infoDescEl) infoDescEl.textContent = data.desc || "";

    if (infoToolsEl) {
      infoToolsEl.innerHTML = "";
      (data.tools || []).forEach((tool) => {
        const li = document.createElement("li");
        li.textContent = tool;
        infoToolsEl.appendChild(li);
      });
    }

    updateSlider(index);
  }

  const isDesktop = window.matchMedia("(min-width: 901px)").matches;

  if (!isDesktop || prefersReducedMotion.matches || !window.gsap || !window.ScrollTrigger) {
    renderInfo(0);

    goTo = (index) => {
      const clamped = Math.max(0, Math.min(count - 1, index));
      slides[clamped].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const idx = slides.indexOf(entry.target);
            if (idx !== -1 && idx !== currentIndex) renderInfo(idx);
          }
        });
      },
      { root: track, threshold: [0.6] }
    );

    slides.forEach((slide) => observer.observe(slide));
    prevBtn?.addEventListener("click", () => goTo(currentIndex - 1));
    nextBtn?.addEventListener("click", () => goTo(currentIndex + 1));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  let spacing = Math.min(window.innerWidth * 0.24, 300);

  function layout(virtualIndex) {
    slides.forEach((slide, i) => {
      const d = i - virtualIndex;
      const abs = Math.abs(d);
      const dir = d < 0 ? -1 : 1;

      if (abs > 3.4) {
        gsap.set(slide, { opacity: 0, pointerEvents: "none" });
        return;
      }

      const scale = Math.max(0.52, 1 - abs * 0.22);
      const opacity = Math.max(0, 1 - abs * 0.32);
      const rotate = Math.min(abs * 20, 34) * dir;

      gsap.set(slide, {
        xPercent: -50,
        yPercent: -50,
        x: d * spacing,
        y: abs * 10,
        z: -abs * 60,
        rotateY: -rotate,
        scale,
        opacity,
        zIndex: 100 - Math.round(abs * 10),
        pointerEvents: "auto",
      });
    });

    const nearest = Math.max(0, Math.min(count - 1, Math.round(virtualIndex)));
    if (nearest !== currentIndex) renderInfo(nearest);
  }

  gsap.set(track, { transformStyle: "preserve-3d" });
  slides.forEach((slide, i) => {
    slide.addEventListener("click", () => goTo(i));
  });

  layout(0);
  renderInfo(0);

  const globalNav = document.querySelector(".floating-project-nav");

  const st = ScrollTrigger.create({
    trigger: stage,
    start: "top top",
    end: () => "+=" + (spacing * 2.2 * (count - 1) + window.innerHeight * 0.3),
    pin: true,
    scrub: 0.65,
    anticipatePin: 1,
    onUpdate: (self) => {
      layout(self.progress * (count - 1));
    },
    onEnter: () => globalNav?.classList.add("is-dimmed"),
    onEnterBack: () => globalNav?.classList.add("is-dimmed"),
    onLeave: () => globalNav?.classList.remove("is-dimmed"),
    onLeaveBack: () => globalNav?.classList.remove("is-dimmed"),
  });

  goTo = (index) => {
    const clamped = Math.max(0, Math.min(count - 1, index));
    const progress = count > 1 ? clamped / (count - 1) : 0;
    const target = st.start + (st.end - st.start) * progress;
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  prevBtn?.addEventListener("click", () => goTo(currentIndex - 1));
  nextBtn?.addEventListener("click", () => goTo(currentIndex + 1));

  window.addEventListener("resize", () => {
    spacing = Math.min(window.innerWidth * 0.24, 300);
  });
}

function setupCompareSliders() {
  const frames = document.querySelectorAll("[data-compare-slider]");

  frames.forEach((frame) => {
    const handle = frame.querySelector("[data-compare-handle]");
    let dragging = false;

    const setPos = (pct) => {
      const clamped = Math.min(100, Math.max(0, pct));
      frame.style.setProperty("--pos", `${clamped}%`);
      handle?.setAttribute("aria-valuenow", String(Math.round(clamped)));
    };

    const setPosFromClientX = (clientX) => {
      const rect = frame.getBoundingClientRect();
      setPos(((clientX - rect.left) / rect.width) * 100);
    };

    frame.addEventListener("pointerdown", (event) => {
      dragging = true;
      frame.setPointerCapture(event.pointerId);
      setPosFromClientX(event.clientX);
    });

    frame.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      setPosFromClientX(event.clientX);
    });

    const stopDragging = (event) => {
      dragging = false;
      if (frame.hasPointerCapture(event.pointerId)) {
        frame.releasePointerCapture(event.pointerId);
      }
    };

    frame.addEventListener("pointerup", stopDragging);
    frame.addEventListener("pointercancel", stopDragging);

    handle?.addEventListener("keydown", (event) => {
      const current = parseFloat(handle.getAttribute("aria-valuenow")) || 50;

      if (event.key === "ArrowLeft") {
        setPos(current - 5);
        event.preventDefault();
      } else if (event.key === "ArrowRight") {
        setPos(current + 5);
        event.preventDefault();
      }
    });
  });
}

function setupMagneticHover() {
  if (prefersReducedMotion.matches) return;

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!canHover) return;

  const targets = document.querySelectorAll(
    ".buja-links a"
  );

  targets.forEach((el) => {
    const strength = 0.35;
    const maxOffset = 10;

    const onMove = (event) => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);

      if (window.gsap) {
        gsap.to(el, {
          x: Math.max(-maxOffset, Math.min(maxOffset, dx * strength)),
          y: Math.max(-maxOffset, Math.min(maxOffset, dy * strength)),
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
      } else {
        const x = Math.max(-maxOffset, Math.min(maxOffset, dx * strength));
        const y = Math.max(-maxOffset, Math.min(maxOffset, dy * strength));
        el.style.transform = `translate(${x}px, ${y}px)`;
      }
    };

    const onLeave = () => {
      if (window.gsap) {
        gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      } else {
        el.style.transform = "";
      }
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
  });
}

const THEME_COLORS = [
  { id: "project-gwangju", color: "#b16a34" },
  { id: "project-app", color: "#4f7a3d" },
  { id: "project-brand", color: "#3f463f" },
  { id: "project-web", color: "#8a9a86" },
  { id: "project-buja", color: "#c23b3b" },
];

function setupScrollThemeProgress() {
  const bar = document.querySelector("[data-scroll-progress]");
  if (!bar) return;

  const sections = THEME_COLORS.map((entry) => ({
    ...entry,
    el: document.getElementById(entry.id),
  })).filter((entry) => entry.el);

  let ticking = false;

  const update = () => {
    ticking = false;

    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const progress = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
    bar.style.width = `${progress}%`;

    const marker = window.innerHeight * 0.5;
    let activeColor = "#2f3431";

    sections.forEach((section) => {
      const top = section.el.getBoundingClientRect().top;
      if (top <= marker) activeColor = section.color;
    });

    bar.style.background = activeColor;
  };

  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}

function setupCardTilt() {
  if (prefersReducedMotion.matches) return;

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!canHover) return;

  const cards = document.querySelectorAll(".buja-process-grid article");

  cards.forEach((card) => {
    const maxTilt = 7;

    const onMove = (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;

      card.style.setProperty("--spot-x", `${px * 100}%`);
      card.style.setProperty("--spot-y", `${py * 100}%`);

      const rotateY = (px - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - py) * maxTilt * 2;

      if (window.gsap) {
        gsap.to(card, {
          rotateX,
          rotateY,
          duration: 0.4,
          ease: "power2.out",
          transformPerspective: 700,
          overwrite: "auto",
        });
      } else {
        card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    };

    const onLeave = () => {
      if (window.gsap) {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: "power2.out" });
      } else {
        card.style.transform = "";
      }
    };

    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
  });
}

function setupProfileColumnAlign() {
  const portrait = document.querySelector(".portrait-image");
  const col = document.querySelector(".contact-edu-col");
  if (!portrait || !col) return;

  const sync = () => {
    if (window.innerWidth <= 900) {
      col.style.height = "";
      return;
    }
    const height = portrait.getBoundingClientRect().height;
    if (height > 0) col.style.height = `${height}px`;
  };

  if (portrait.complete) {
    sync();
  } else {
    portrait.addEventListener("load", sync, { once: true });
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(sync, 150);
  });
}

function setupProfileMarquee() {
  const section = document.querySelector(".profile-marquee");
  const track = document.querySelector("[data-marquee-track]");
  const content = document.querySelector("[data-marquee-content]");
  if (!section || !track || !content) return;

  if (!prefersReducedMotion.matches) {
    const baseHTML = content.innerHTML;

    const fillTrack = () => {
      content.innerHTML = baseHTML;
      track.querySelectorAll(".marquee-content").forEach((node, index) => {
        if (index > 0) node.remove();
      });

      const targetWidth = window.innerWidth + 200;
      let guard = 0;
      while (content.scrollWidth < targetWidth && guard < 20) {
        const clones = Array.from(content.children).map((child) => child.cloneNode(true));
        content.append(...clones);
        guard += 1;
      }

      const duplicate = content.cloneNode(true);
      duplicate.removeAttribute("data-marquee-content");
      track.appendChild(duplicate);
    };

    fillTrack();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fillTrack, 200);
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  observer.observe(section);
}

function setupToolGarden() {
  const section = document.querySelector(".tool-garden");
  const svg = section ? section.querySelector("[data-tool-lines]") : null;
  const container = section ? section.querySelector(".tool-garden-inner") : null;
  if (!section || !svg || !container) return;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const stems = Array.from(section.querySelectorAll("[data-connect]"));
  let hasRevealed = false;

  section.querySelectorAll(".tool-badge img[data-icon]").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const span = document.createElement("span");
        span.className = "tool-badge-fallback";
        span.textContent = img.dataset.fallback || "?";
        img.replaceWith(span);
      },
      { once: true }
    );
  });

  const drawLines = () => {
    const containerRect = container.getBoundingClientRect();
    if (containerRect.width === 0) return [];

    svg.setAttribute("viewBox", `0 0 ${containerRect.width} ${containerRect.height}`);
    svg.innerHTML = "";

    const defs = document.createElementNS(SVG_NS, "defs");
    svg.appendChild(defs);

    const anchors = {};
    stems.forEach((stem) => {
      anchors[stem.dataset.connect] = stem;
    });

    const connectors = [];

    Object.entries(anchors).forEach(([key, stem]) => {
      const dot = section.querySelector(`[data-legend="${key}"] .tool-dot`);
      const textEl = section.querySelector(`[data-legend="${key}"] div`);
      const badge = stem.querySelector(".tool-badge");
      if (!dot || !badge) return;

      const badgeRect = badge.getBoundingClientRect();
      const dotRect = dot.getBoundingClientRect();

      const x1 = badgeRect.left + badgeRect.width / 2 - containerRect.left;
      const y1 = badgeRect.top - containerRect.top;
      const x2 = dotRect.left + dotRect.width / 2 - containerRect.left;
      const y2 = dotRect.top + dotRect.height / 2 - containerRect.top;
      const midX = x1 + (x2 - x1) * 0.55;
      const topY = Math.min(y1 - 18, y2);
      const d = `M ${x1} ${y1} L ${x1} ${topY} L ${midX} ${topY} L ${midX} ${y2} L ${x2} ${y2}`;

      const maskId = `tool-line-mask-${key}`;
      const mask = document.createElementNS(SVG_NS, "mask");
      mask.setAttribute("id", maskId);
      mask.setAttribute("maskUnits", "userSpaceOnUse");
      const maskPath = document.createElementNS(SVG_NS, "path");
      maskPath.setAttribute("d", d);
      maskPath.setAttribute("fill", "none");
      maskPath.setAttribute("stroke", "#ffffff");
      maskPath.setAttribute("stroke-width", "10");
      maskPath.setAttribute("stroke-linecap", "round");
      mask.appendChild(maskPath);
      defs.appendChild(mask);

      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "rgba(93, 107, 60, 0.4)");
      path.setAttribute("stroke-width", "1");
      path.setAttribute("stroke-dasharray", "3 4");
      path.setAttribute("mask", `url(#${maskId})`);
      svg.appendChild(path);

      const length = maskPath.getTotalLength();
      maskPath.setAttribute("stroke-dasharray", String(length));
      maskPath.setAttribute("stroke-dashoffset", hasRevealed ? "0" : String(length));

      if (hasRevealed) {
        if (dot) {
          dot.style.opacity = "1";
          dot.style.transform = "scale(1)";
        }
        if (textEl) {
          textEl.style.opacity = "1";
          textEl.style.transform = "none";
        }
      } else if (!prefersReducedMotion.matches && window.gsap) {
        if (dot) gsap.set(dot, { scale: 0.8, opacity: 0, transformOrigin: "50% 50%" });
        if (textEl) gsap.set(textEl, { opacity: 0, y: 8 });
      }

      connectors.push({ key, maskPath, length, dot, textEl });
    });

    return connectors;
  };

  const playReveal = (connectors) => {
    if (prefersReducedMotion.matches || !window.gsap) {
      connectors.forEach(({ maskPath, dot, textEl }) => {
        maskPath.setAttribute("stroke-dashoffset", "0");
        if (dot) {
          dot.style.opacity = "1";
          dot.style.transform = "scale(1)";
        }
        if (textEl) {
          textEl.style.opacity = "1";
          textEl.style.transform = "none";
        }
      });
      return;
    }

    const tl = gsap.timeline();
    connectors.forEach(({ maskPath, dot, textEl }, index) => {
      const start = index * 0.15;
      tl.to(
        maskPath,
        { attr: { "stroke-dashoffset": 0 }, duration: 0.7, ease: "power2.out" },
        start
      );
      if (dot) {
        tl.to(dot, { scale: 1, opacity: 1, duration: 0.35, ease: "power2.out" }, start + 0.7);
      }
      if (textEl) {
        tl.to(textEl, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, start + 0.8);
      }
    });
  };

  let connectors = drawLines();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        hasRevealed = true;
        playReveal(connectors);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.25 }
  );
  observer.observe(section);

  const redraw = () => {
    connectors = drawLines();
  };

  window.addEventListener("load", redraw);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(redraw);
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(redraw, 150);
  });
}

setupGrassAnimation();
setupRevealAnimation();
setupSmoothNavigation();
setupFloatingProjectNav();
setupHeroTitleWave();
setupHeroScrollEffect();
setupStoryScenes();
setupBannerCoverflow();
setupCompareSliders();
setupMagneticHover();
setupScrollThemeProgress();
setupToolGarden();
setupCardTilt();
setupProfileColumnAlign();
setupProfileMarquee();
