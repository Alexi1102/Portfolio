/* ==========================================================
   SCRIPT.JS — Alexis Rey Portfolio
   ========================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'ar-anim';
  const body        = document.body;
  const toggle      = document.getElementById('animToggle');

  const ROUTE_MAP = {
    '/': { sectionId: 'hero' },
    '/eke-deka': { sectionId: 'eke-deka' },
    '/elmy': { sectionId: 'elmy' },
    '/projet-3': { sectionId: 'adn' },
    '/projet-4': { sectionId: 'projet-4' },
    '/contact': { sectionId: 'contact' },
  };

  function normalizeRoute(pathname) {
    if (!pathname || pathname === '#') return '/';
    const [path] = pathname.split('?');
    const clean = path.replace(/\/+$/, '') || '/';
    return clean.startsWith('/') ? clean : `/${clean}`;
  }

  function resolveRoute(pathname) {
    const route = normalizeRoute(pathname);
    return ROUTE_MAP[route] ? route : '/';
  }

  function scrollToSection(target, offset = 0, behavior = 'smooth') {
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior });
  }

  function goToRoute(pathname, { behavior = 'smooth', push = true } = {}) {
    const route = resolveRoute(pathname);
    const target = document.getElementById(ROUTE_MAP[route].sectionId);
    if (push && location.pathname !== route) {
      history.pushState(null, '', route);
    }
    if (target) {
      setTimeout(() => scrollToSection(target, document.querySelector('.nav')?.offsetHeight + 16 || 0, behavior), 40);
    }
  }

  document.querySelectorAll('a[data-route]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const route = link.getAttribute('href');
      if (!route || !route.startsWith('/')) return;
      e.preventDefault();
      goToRoute(route, { behavior: 'smooth', push: true });
    });
  });

  window.addEventListener('popstate', () => {
    goToRoute(location.pathname, { behavior: 'smooth', push: false });
  });

  goToRoute(location.pathname, { behavior: 'auto', push: false });

  /* ── Toggle animations ─────────────────────────────── */
  function setAnim(on) {
    body.classList.toggle('anim-on', on);
    if (toggle) toggle.checked = on;
    try { localStorage.setItem(STORAGE_KEY, on ? '1' : '0'); } catch (_) {}
  }

  // Restaurer la préférence (défaut : activé)
  const saved = (() => { try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; } })();
  setAnim(saved !== '0');

  if (toggle) toggle.addEventListener('change', () => setAnim(toggle.checked));

  /* ── Replay des animations hero toutes les 30s ─────── */
  function replayHeroAnim() {
    if (!body.classList.contains('anim-on')) return;
    body.classList.remove('anim-on');
    void body.offsetWidth; // force reflow
    body.classList.add('anim-on');
  }
  setInterval(replayHeroAnim, 30000);

  /* ── Contraste automatique des swatches ────────────── */
  document.querySelectorAll('.swatch[data-hex]').forEach(swatch => {
    const hex = swatch.dataset.hex.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const [rs, gs, bs] = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    const L = 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    swatch.style.setProperty('--swatch-text', L > 0.179 ? '#111118' : '#F3FEFF');
  });

  /* ── Scroll reveal — IntersectionObserver ──────────── */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        });
      },
      { threshold: 0.07, rootMargin: '0px 0px -32px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    // Fallback : tout afficher d'emblée
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ── Smooth scroll sur les ancres ──────────────────── */
  const NAV_H = () => document.querySelector('.nav')?.offsetHeight ?? 0;

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id     = a.getAttribute('href');
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - NAV_H() - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── Lien nav actif au scroll ───────────────────────── */
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav__link');

  if ('IntersectionObserver' in window && sections.length) {
    const navIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          navLinks.forEach((l) => l.classList.remove('is-active'));
          const active = document.querySelector(`.nav__link[href="#${e.target.id}"]`);
          if (active) active.classList.add('is-active');
        });
      },
      { rootMargin: `-${NAV_H() + 10}px 0px -60% 0px`, threshold: 0 }
    );
    sections.forEach((s) => navIO.observe(s));
  }

  /* ── Formulaire de contact ──────────────────────────── */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const fname   = form.querySelector('#fname');
      const femail  = form.querySelector('#femail');
      const fmsg    = form.querySelector('#fmessage');
      const btn     = form.querySelector('[type="submit"]');

      // Validation minimale côté client
      [fname, femail, fmsg].forEach((f) => {
        f.style.borderColor = f.value.trim() ? '' : '#ef4444';
      });
      if (!fname.value.trim() || !femail.value.trim() || !fmsg.value.trim()) return;
      if (!femail.value.includes('@')) {
        femail.style.borderColor = '#ef4444';
        return;
      }

      // Feedback visuel d'envoi
      const original = btn.textContent;
      btn.textContent = 'Envoyé ✓';
      btn.style.background = '#16a34a';
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent      = original;
        btn.style.background = '';
        btn.disabled         = false;
        form.reset();
        [fname, femail, fmsg].forEach((f) => (f.style.borderColor = ''));
      }, 3500);
    });

    // Reset la bordure rouge à la saisie
    form.querySelectorAll('.field__input').forEach((input) => {
      input.addEventListener('input', function () { this.style.borderColor = ''; });
    });
  }

  /* ── Traductions i18n ──────────────────────────────── */
  const translations = {
    fr: {
      'lang.current':   'Français',
      'lang.option':    'Anglais',
      'nav.realisations': 'Mes réalisations',
      'hero.badge':     'Disponible pour designer !',
      'hero.tagline':   "Je m'imprègne de votre identité de marque et je conçois une interface sur mesure et à votre image.",
      'hero.cta1':      'Voir mes réalisations',
      'hero.cta2':      'Me contacter',
      'eke.desc':       "Créée en 2019 par de jeunes togolais, l'association togolaise Eke-Deka a pour objectif de participer à l'amélioration du cadre de vie des populations du pays, notamment par la promotion du tourisme durable et de l'agroécologie. Afin d'appuyer l'association togolaise dans la poursuite de ces missions, l'association Eke-Deka France a été créée en 2020. J'ai pu rencontrer les membres de cette association et bénévolement proposer une refonte de leur site Internet.",
      'eke.role1':      'Identité graphique',
      'dt.subject':     'Sujet',
      'eke.subject':    'Association Eke-Deka',
      'eke.date':       '28 mars 2025',
      'elmy.desc':      "elmy est un fournisseur et producteur d'énergie verte basé principalement sur Lyon. Voici la refonte que j'ai eu l'occasion de faire sur l'espace client B2B, suite notamment à une évolution de l'identité graphique.",
      'elmy.subject':   'Refonte espace B2B',
      'elmy.date':      '28 mars 2025',
      'card.typo':      'Typographie',
      'card.colors':    'Couleurs',
      'other.title':    'Autres projets',
      'other.text':     "Non, on ne vit pas dans une saucisse — mais c'est une image amusante pour parler de notre perception limitée du monde. En réalité, on vit dans un univers immense, en expansion, structuré par des lois physiques complexes comme la gravité et la relativité. L'idée de la \"saucisse\" pourrait venir d'une métaphore.",
      'contact.title':  'Contactez moi !',
      'contact.sub':    "Un projet ? Besoin d'un designer pour votre interface ?",
      'contact.name':   'Nom et Prénom',
      'contact.email':  'Adresse email',
      'contact.msg':    'Objet de la demande',
      'contact.send':   'Envoyer',
    },
    en: {
      'lang.current':   'English',
      'lang.option':    'Français',
      'nav.realisations': 'My work',
      'hero.badge':     'Available to design!',
      'hero.tagline':   'I immerse myself in your brand identity and design a tailor-made interface that reflects your image.',
      'hero.cta1':      'See my work',
      'hero.cta2':      'Get in touch',
      'eke.desc':       "Founded in 2019 by young Togolese, the Eke-Deka association aims to improve the living conditions of the country's population through the promotion of sustainable tourism and agroecology. To support the Togolese association, the Eke-Deka France association was created in 2020. I met the members of this association and voluntarily proposed a redesign of their website.",
      'eke.role1':      'Graphic design',
      'dt.subject':     'Project',
      'eke.subject':    'Eke-Deka Association',
      'eke.date':       'March 28, 2025',
      'elmy.desc':      "elmy is a green energy supplier and producer based primarily in Lyon. Here is the redesign I had the opportunity to work on for their B2B client portal, following an evolution of their visual identity.",
      'elmy.subject':   'B2B portal redesign',
      'elmy.date':      'March 28, 2025',
      'card.typo':      'Typography',
      'card.colors':    'Colors',
      'other.title':    'Other projects',
      'other.text':     'No, we don\'t live inside a sausage — but it\'s a fun image to describe our limited perception of the world. In reality, we live in a vast, expanding universe structured by complex physical laws like gravity and relativity. The "sausage" idea might come from a metaphor.',
      'contact.title':  'Contact me!',
      'contact.sub':    'A project? Looking for a designer for your interface?',
      'contact.name':   'Full name',
      'contact.email':  'Email address',
      'contact.msg':    'Subject',
      'contact.send':   'Send',
    },
  };

  function setLang(lang) {
    document.documentElement.lang = lang;
    const t = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (t[key] !== undefined) el.textContent = t[key];
    });
    try { localStorage.setItem('ar-lang', lang); } catch (_) {}
  }

  /* ── Dropdown langue ───────────────────────────────── */
  const langDropdown = document.querySelector('.lang-dropdown');
  const langBtn      = langDropdown?.querySelector('.lang-btn');
  const langOption   = langDropdown?.querySelector('.lang-btn--option');

  if (langBtn) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = langDropdown.classList.toggle('is-open');
      langBtn.setAttribute('aria-expanded', open);
    });

    document.addEventListener('click', () => {
      langDropdown.classList.remove('is-open');
      langBtn.setAttribute('aria-expanded', 'false');
    });
  }

  if (langOption) {
    langOption.addEventListener('click', () => {
      const newLang = document.documentElement.lang === 'en' ? 'fr' : 'en';
      setLang(newLang);
      langDropdown.classList.remove('is-open');
      langBtn.setAttribute('aria-expanded', 'false');
    });
  }

  // Restaurer la langue sauvegardée
  const savedLang = (() => { try { return localStorage.getItem('ar-lang'); } catch (_) { return null; } })();
  if (savedLang && savedLang !== 'fr') setLang(savedLang);

  /* ── Galerie / Modal carousel ──────────────────────── */
  const modal      = document.getElementById('galleryModal');
  const modalTrack = document.getElementById('modalTrack');
  const modalDots  = document.getElementById('modalDots');

  if (modal) {
    let totalSlides  = 0;
    let currentSlide = 0;

    function buildModal(images) {
      // images : [{src, alt}] — src null = placeholder
      modalTrack.innerHTML = '';
      modalDots.innerHTML  = '';
      totalSlides = images.length;

      images.forEach((img, i) => {
        const slide = document.createElement('div');
        slide.className = 'gallery-modal__slide';
        if (img.src) {
          const el = document.createElement('img');
          el.src   = img.src;
          el.alt   = img.alt || '';
          el.className = 'gallery-modal__img';
          slide.appendChild(el);
        } else {
          slide.innerHTML = '<div class="gallery__ph"></div>';
        }
        modalTrack.appendChild(slide);

        const dot = document.createElement('button');
        dot.className = 'gallery-modal__dot';
        dot.setAttribute('aria-label', `Image ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        modalDots.appendChild(dot);
      });
    }

    function goTo(idx) {
      const slideEls = modalTrack.querySelectorAll('.gallery-modal__slide');
      const dotEls   = modalDots.querySelectorAll('.gallery-modal__dot');
      slideEls[currentSlide]?.classList.remove('is-active');
      dotEls[currentSlide]?.classList.remove('is-active');
      currentSlide = (idx + totalSlides) % totalSlides;
      slideEls[currentSlide]?.classList.add('is-active');
      dotEls[currentSlide]?.classList.add('is-active');
    }

    function openModal(images, startIdx) {
      buildModal(images);
      currentSlide = 0;
      goTo(startIdx);
      modal.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
      modal.querySelector('.gallery-modal__close').focus();
    }
    function closeModal() {
      modal.setAttribute('hidden', '');
      document.body.style.overflow = '';
    }

    // Câbler chaque galerie de card
    document.querySelectorAll('.card__gallery').forEach(gallery => {
      const moreEl    = gallery.querySelector('.gallery__thumb--more');
      const moreCount = parseInt(moreEl?.dataset.more ?? '0', 10);

      // Collecter les images visibles (main + 4 thumbs)
      const visibleImages = [];

      const mainImg = gallery.querySelector('.gallery__main .gallery__img');
      visibleImages.push(mainImg ? { src: mainImg.src, alt: mainImg.alt } : { src: null });

      gallery.querySelectorAll('.gallery__thumb').forEach(thumb => {
        const img = thumb.querySelector('.gallery__img');
        visibleImages.push(img ? { src: img.src, alt: img.alt } : { src: null });
      });

      // Ajouter les slides extra (+N) comme placeholders
      const allImages = [...visibleImages];
      for (let i = 0; i < moreCount; i++) allImages.push({ src: null });

      // Clic sur l'image principale
      const mainEl = gallery.querySelector('.gallery__main');
      if (mainEl) mainEl.addEventListener('click', () => openModal(allImages, 0));

      // Clic sur chaque miniature
      gallery.querySelectorAll('.gallery__thumb').forEach((thumb, i) => {
        thumb.addEventListener('click', () => openModal(allImages, i + 1));
      });
    });

    // Fermer
    modal.querySelector('.gallery-modal__backdrop').addEventListener('click', closeModal);
    modal.querySelector('.gallery-modal__close').addEventListener('click', closeModal);
    modal.querySelector('.gallery-modal__prev').addEventListener('click', () => goTo(currentSlide - 1));
    modal.querySelector('.gallery-modal__next').addEventListener('click', () => goTo(currentSlide + 1));

    // Clavier
    document.addEventListener('keydown', (e) => {
      if (modal.hasAttribute('hidden')) return;
      if (e.key === 'Escape')     closeModal();
      if (e.key === 'ArrowLeft')  goTo(currentSlide - 1);
      if (e.key === 'ArrowRight') goTo(currentSlide + 1);
    });
  }

  /* ── Gestion de l'URL au scroll : racine pour hero+projets, /contact pour contact ── */
  if ('IntersectionObserver' in window) {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            if (location.pathname !== '/contact') {
              history.replaceState(null, '', '/contact');
            }
          } else if (entry.boundingClientRect.top > 0) {
            // Contact section est au-dessus de l'écran, revenir à la racine
            if (location.pathname !== '/') {
              history.replaceState(null, '', '/');
            }
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -50% 0px' }
      ).observe(contactSection);
    }
  }

  const projet4 = document.getElementById('projet-4');
  if (projet4 && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        const pastCard = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
        body.classList.toggle('show-end-gradient', pastCard);
      },
      { threshold: 0 }
    ).observe(projet4);
  }

  /* ── Scroll nav + scrollspy URL ────────────────────── */
  const scrollNav = document.getElementById('scrollNav');
  const MOOD_CLASSES = ['mood-eke-deka', 'mood-elmy', 'mood-adn', 'mood-projet-4'];
  if (scrollNav) {
    const projectCards = document.querySelectorAll('#realisations .card');
    const navDots      = scrollNav.querySelectorAll('.scroll-nav__dot');
    const navCursor    = scrollNav.querySelector('.scroll-nav__cursor');
    const navTrack     = scrollNav.querySelector('.scroll-nav__track');
    let lastHash       = '';

    function updateScrollNav() {
      if (!projectCards.length) return;
      const vh = window.innerHeight;

      // Card active : la dernière dont le haut est dans la moitié supérieure de l'écran
      let activeIdx = 0;
      projectCards.forEach((card, i) => {
        if (card.getBoundingClientRect().top < vh * 0.5) activeIdx = i;
      });

      navDots.forEach((dot, i) => dot.classList.toggle('is-active', i === activeIdx));

      // Déplacer le curseur au centre du dot actif
      if (navCursor && navDots[activeIdx] && navTrack) {
        const trackRect = navTrack.getBoundingClientRect();
        const dotRect   = navDots[activeIdx].getBoundingClientRect();
        const cursorH   = navCursor.offsetHeight || 28;
        const top       = dotRect.top - trackRect.top + (dotRect.height - cursorH) / 2;
        navCursor.style.top = Math.max(0, top) + 'px';
      }

      const activeCard = projectCards[activeIdx];
      if (activeCard?.id) {
        // Mood : disparaît quand plus de la moitié de la dernière card est sortie par le haut
        const lastCard      = projectCards[projectCards.length - 1];
        const lastCardRect  = lastCard.getBoundingClientRect();
        const lastCardGone  = lastCardRect.top < -(lastCard.offsetHeight / 2);
        const moodClass     = 'mood-' + activeCard.id;
        const inView        = activeCard.getBoundingClientRect().top < vh * 0.8;
        MOOD_CLASSES.forEach(c => body.classList.remove(c));
        if (inView && !lastCardGone) body.classList.add(moodClass);
      }
    }

    // Clic sur un dot → scroll vers la card correspondante
    navDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const target = projectCards[i];
        if (!target) return;
        const navH = document.querySelector('.nav')?.offsetHeight ?? 0;
        const top  = target.getBoundingClientRect().top + window.scrollY - navH - 24;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });

    // Scroll direct vers la card si l'URL contient déjà un hash valide
    const initHash = location.hash;
    if (initHash) {
      const target = document.querySelector(initHash);
      if (target?.closest('#realisations')) {
        setTimeout(() => {
          const navH = document.querySelector('.nav')?.offsetHeight ?? 0;
          window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH - 24, behavior: 'smooth' });
        }, 150);
      }
    }

    window.addEventListener('scroll', updateScrollNav, { passive: true });
    window.addEventListener('resize', updateScrollNav, { passive: true });
    setTimeout(updateScrollNav, 120);
  }

})();
