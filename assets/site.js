// EPV site behaviour: mobile menu, scroll reveal, guide index highlighting, code copy buttons.
// Loaded as an external file so the nginx Content-Security-Policy (script-src 'self') allows it.
(() => {
  // Reuse the sprite path already in the page, so the site works at any base path.
  const spriteUse = document.querySelector('use[href*="icons.svg#"]');
  const spritePath = spriteUse
    ? spriteUse.getAttribute('href').split('#')[0]
    : '/assets/img/icons.svg';
  const iconHref = (name) => `${spritePath}#i-${name}`;

  // Mobile navigation toggle.
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  // Reveal on scroll. Only elements that start below the viewport are hidden,
  // so nothing already on screen flashes, and no-JS visitors see everything.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = document.querySelectorAll('[data-reveal]');
  if (!reduceMotion && 'IntersectionObserver' in window && revealTargets.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('reveal-in');
          entry.target.classList.remove('reveal-pending');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    for (const element of revealTargets) {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.classList.add('reveal-pending');
        observer.observe(element);
      }
    }
  }

  // Guide pages: highlight the section currently being read in the side index.
  const indexLinks = [...document.querySelectorAll('.page-index a[href^="#"]')];
  if (indexLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(indexLinks.map((link) => [link.getAttribute('href').slice(1), link]));
    const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    const visible = new Set();
    const update = () => {
      const current = sections.find((section) => visible.has(section)) ?? null;
      for (const link of indexLinks) link.classList.remove('is-active');
      if (current) {
        const link = byId.get(current.id);
        link.classList.add('is-active');
      }
    };
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        update();
      },
      { rootMargin: '-20% 0px -55% 0px' },
    );
    for (const section of sections) spy.observe(section);
  }

  // Code blocks: add a copy button that copies the command text.
  if (navigator.clipboard) {
    for (const block of document.querySelectorAll('.code-block')) {
      const head = block.querySelector('.code-head');
      const code = block.querySelector('pre code');
      if (!head || !code) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-button';
      button.setAttribute('aria-label', 'Copy command');
      const svgNs = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNs, 'svg');
      svg.setAttribute('class', 'icon');
      svg.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS(svgNs, 'use');
      use.setAttribute('href', iconHref('copy'));
      svg.append(use);
      const label = document.createElement('span');
      label.textContent = 'Copy';
      button.append(svg, label);
      let timer;
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(code.textContent ?? '');
          label.textContent = 'Copied';
          use.setAttribute('href', iconHref('check'));
          button.classList.add('is-copied');
        } catch {
          label.textContent = 'Copy failed';
        }
        clearTimeout(timer);
        timer = setTimeout(() => {
          label.textContent = 'Copy';
          use.setAttribute('href', iconHref('copy'));
          button.classList.remove('is-copied');
        }, 1800);
      });
      head.append(button);
    }
  }
})();
