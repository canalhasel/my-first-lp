/* =========================================================
   CAFÉ MORI — interactions
   - スムーススクロールナビゲーション
   - ヘッダーの背景切り替え
   - スクロール連動のセクションハイライト
   - モバイルメニューの開閉
   - 出現アニメーション（IntersectionObserver）
   - ページトップへ戻るボタン
   ========================================================= */

(function () {
  "use strict";

  const header = document.getElementById("siteHeader");
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = Array.from(document.querySelectorAll(".nav-list a"));
  const toTop = document.getElementById("toTop");
  const sections = Array.from(document.querySelectorAll("main section[id]"));

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- スムーススクロール ---------- */
  function getHeaderOffset() {
    return header ? header.offsetHeight : 0;
  }

  function smoothScrollTo(targetEl) {
    const top =
      targetEl.getBoundingClientRect().top +
      window.pageYOffset -
      getHeaderOffset() +
      1;

    window.scrollTo({
      top: Math.max(top, 0),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  document.querySelectorAll('a[data-scroll][href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (id === "#" || id.length < 2) return;

      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      closeMenu();
      smoothScrollTo(target);

      // フォーカスを移してアクセシビリティを担保
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });

      history.replaceState(null, "", id);
    });
  });

  /* ---------- ヘッダーの状態 & トップへ戻るボタン ---------- */
  function onScroll() {
    const y = window.pageYOffset;

    header.classList.toggle("is-scrolled", y > 40);
    toTop.classList.toggle("is-visible", y > 600);
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    },
    { passive: true }
  );
  onScroll();

  toTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  });

  /* ---------- モバイルメニュー ---------- */
  function openMenu() {
    nav.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "メニューを閉じる");
  }

  function closeMenu() {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "メニューを開く");
  }

  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.contains("is-open");
    isOpen ? closeMenu() : openMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (
      nav.classList.contains("is-open") &&
      !nav.contains(event.target) &&
      !navToggle.contains(event.target)
    ) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 680) closeMenu();
  });

  /* ---------- スクロール連動のナビハイライト ---------- */
  const linkById = new Map(
    navLinks.map((link) => [link.getAttribute("href").slice(1), link])
  );

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((l) => l.classList.remove("is-active"));
        const active = linkById.get(entry.target.id);
        if (active) active.classList.add("is-active");
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => spy.observe(section));

  /* ---------- 出現アニメーション ---------- */
  const revealEls = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) return;
          const delay = Math.min(index * 90, 360);
          setTimeout(() => entry.target.classList.add("is-visible"), delay);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- お問い合わせフォームのバリデーション ---------- */
  const contactForm = document.getElementById("contactForm");

  if (contactForm) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const fields = [
      {
        input: document.getElementById("cf-name"),
        error: document.getElementById("cf-name-error"),
        validate: (value) => (value ? "" : "お名前を入力してください。"),
      },
      {
        input: document.getElementById("cf-email"),
        error: document.getElementById("cf-email-error"),
        validate: (value) => {
          if (!value) return "メールアドレスを入力してください。";
          if (!emailPattern.test(value))
            return "メールアドレスの形式が正しくありません。";
          return "";
        },
      },
      {
        input: document.getElementById("cf-message"),
        error: document.getElementById("cf-message-error"),
        validate: (value) => (value ? "" : "お問い合わせ内容を入力してください。"),
      },
    ];

    function validateField(field) {
      const message = field.validate(field.input.value.trim());
      field.error.textContent = message;
      field.input.closest(".form-row").classList.toggle("is-invalid", Boolean(message));
      return !message;
    }

    fields.forEach((field) => {
      field.input.addEventListener("blur", () => validateField(field));
      field.input.addEventListener("input", () => {
        if (field.input.closest(".form-row").classList.contains("is-invalid")) {
          validateField(field);
        }
      });
    });

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      let firstInvalid = null;
      fields.forEach((field) => {
        const ok = validateField(field);
        if (!ok && !firstInvalid) firstInvalid = field.input;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      alert("送信しました");
      contactForm.reset();
    });
  }

  /* ---------- 現在時刻から営業中かどうかを表示（軽い遊び） ---------- */
  const year = new Date().getFullYear();
  document.querySelectorAll(".footer-copy").forEach((el) => {
    el.textContent = `© 2014–${year} CAFÉ MORI. This is a fictional shop.`;
  });
})();
