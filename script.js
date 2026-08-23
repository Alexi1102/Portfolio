/* ==========================================================
   SCRIPT.JS — Alexis Rey Portfolio
   ========================================================== */

(function () {
  'use strict';

  // Le site met à jour l'URL en scrollant (pushState/replaceState). Sans ça,
  // le navigateur restaure de lui-même le dernier scroll connu pour cette
  // page à chaque arrivée/rechargement (ex : atterrir sur la carte projet
  // "eke-deka" si c'est là qu'on était la dernière fois).
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // Polices "spécimen" (affichées à titre décoratif dans les cards projet,
  // ex : "Oswald Aa123") : chargées seulement après le premier rendu, pour
  // ne pas peser sur la chaîne de requêtes critiques du chargement initial.
  window.addEventListener('load', () => {
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Space+Grotesk:wght@400;600;700&family=Rajdhani:wght@600;700&family=Nunito:wght@400;600&family=Montserrat:wght@400;600&display=swap';
    document.head.appendChild(link);
  });

  const STORAGE_KEY = 'ar-anim';
  const body        = document.body;
  const toggle      = document.getElementById('animToggle');

  const footerYear = document.getElementById('footerYear');
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  const ROUTE_MAP = {
    '/': { sectionId: 'hero' },
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
    if (behavior === 'auto') {
      // Le CSS force `scroll-behavior: smooth` globalement : on le désactive
      // ponctuellement pour qu'un scroll de synchronisation (chargement de
      // page) soit vraiment instantané, sans faire "descendre" la page.
      const root = document.documentElement;
      const prevBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, top);
      root.style.scrollBehavior = prevBehavior;
    } else {
      window.scrollTo({ top, behavior });
    }
  }

  function goToRoute(pathname, { behavior = 'smooth', push = true } = {}) {
    const route = resolveRoute(pathname);
    const target = document.getElementById(ROUTE_MAP[route].sectionId);
    if (push && location.pathname !== route) {
      history.pushState(null, '', route);
    }
    if (target) {
      setTimeout(() => scrollToSection(target, NAV_H() + 16, behavior), 40);
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

  /* ── Codes hexa : affichage au scroll sur mobile/tablette ──
     Le survol n'existe pas au tactile ; on affiche le code hexa
     quand le swatch est visible à l'écran (voir CSS pour le gate
     par largeur d'écran). */
  if ('IntersectionObserver' in window) {
    const swatchIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.target.classList.toggle('swatch--visible', e.isIntersecting));
      },
      { threshold: 0.6 }
    );
    document.querySelectorAll('.swatch[data-hex]').forEach((s) => swatchIO.observe(s));
  }

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
    // observe() déclenche un premier callback immédiat reflétant l'état
    // ACTUEL (avant tout scroll) : si la première card est déjà à moins de
    // 32px du bas de l'écran au chargement (selon la hauteur de viewport,
    // qui varie avec l'affichage/masquage de la barre d'adresse mobile),
    // elle se révélait tout de suite — de façon incohérente d'un chargement
    // à l'autre. On repousse observe() au premier scroll réel : tant que
    // rien n'a été touché, rien ne se révèle.
    const startReveal = () => revealEls.forEach((el) => io.observe(el));
    if (window.scrollY > 0) {
      startReveal();
    } else {
      window.addEventListener('scroll', startReveal, { once: true, passive: true });
    }
  } else {
    // Fallback : tout afficher d'emblée
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ── Pause des animations du hero hors écran ─────────
     Les floats des mockups et le rebond du chevron tournent en boucle
     infinie : les mettre en pause dès que le hero sort du viewport évite
     de payer leur coût de rendu pendant tout le reste de la visite
     (voir #hero.hero--in-view dans style.css). */
  const heroEl = document.getElementById('hero');
  if (heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => heroEl.classList.toggle('hero--in-view', entry.isIntersecting),
      { threshold: 0 }
    ).observe(heroEl);
  } else if (heroEl) {
    heroEl.classList.add('hero--in-view');
  }

  /* ── ALEXIS/REY : mise à l'échelle pour remplir .hero__rey-row ───
     Calcul purement analytique à partir des ratios intrinsèques
     largeur/hauteur de chaque image (connus dès les attributs width/
     height du HTML, jamais mesurés sur le rendu affiché) : le résultat
     ne dépend donc jamais de l'état précédent (mêmes chiffres qu'on
     arrive à cette largeur par un resize progressif ou par un chargement
     direct — contrairement à l'ancienne version qui mesurait la taille
     actuellement affichée pour en déduire la suivante, et pouvait donc
     dériver légèrement selon l'historique des redimensionnements).
     L'écart fixe de 20px entre ALEXIS et REY ne suit pas cette échelle
     (ce n'est pas une image), on le retire donc du calcul. */
  const HERO_NAME_GAP = 10; // px — voir margin-left sur .hero__rey-img
  // Pas de plafond : --max-w est maintenant borné (1600px, voir le
  // breakpoint 1440px), donc la largeur disponible ne peut plus exploser —
  // le nom peut grossir librement jusqu'à remplir cette largeur.
  // Filet de sécurité contre un calcul dégénéré (ratioSum ~0) uniquement —
  // pas une taille "minimale voulue" : sur mobile, la largeur locale
  // disponible pour le nom (après la photo) peut naturellement demander
  // une hauteur sous 20px. Un plancher trop haut forçait alors le nom à
  // dépasser son conteneur au lieu de rétrécir davantage.
  const HERO_NAME_MIN_H = 8; // px

  function fitHeroName() {
    const group = document.querySelector('.hero__name-group');
    const row   = document.querySelector('.hero__rey-row');
    if (!group || !row) return null;
    const scalingImages = group.querySelectorAll('.hero__letter, .hero__rey-img');
    if (!scalingImages.length) return null;
    // Somme des ratios largeur/hauteur intrinsèques des seules images dont
    // la hauteur suit --hero-name-h : à une hauteur H, leur largeur totale
    // vaut exactement ratioSum * H.
    let ratioSum = 0;
    scalingImages.forEach((img) => {
      const w = img.width, h = img.height;
      if (w > 0 && h > 0) ratioSum += w / h;
    });
    if (ratioSum <= 0) return null;
    // offsetWidth, pas getBoundingClientRect() : sous 1024px, .hero__hero-row
    // (un ancêtre) est agrandi via transform:scale(1.25) — un
    // getBoundingClientRect() remonterait alors une largeur déjà multipliée
    // par 1.25, faussant tout le calcul (la hauteur qui en résulte serait
    // réappliquée à travers ce même scale, donc appliquée deux fois).
    const availableWidth = row.offsetWidth;
    if (!availableWidth) return null;
    // Pointillés et curseur ont une taille propre (clamp() en vw/rem), pas
    // pilotée par --hero-name-h : on mesure directement l'image (jamais le
    // wrapper .hero__dots-wrap, dont le max-width est animé à l'arrivée sur
    // la page) et on ajoute la marge du wrapper séparément. Leur largeur
    // DOIT être intégrée au calcul pour qu'ALEXIS REY + pointillés + curseur
    // tiennent ensemble exactement dans availableWidth, sans jamais déborder
    // — .hero__rey-row a overflow:hidden (garde-fou), donc tout débordement
    // serait invisible, pas juste visuellement coupé.
    const dotsImg  = group.querySelector('.hero__dots');
    const dotsWrap = group.querySelector('.hero__dots-wrap');
    const cursor   = group.querySelector('.hero__cursor');
    let fixedWidth = HERO_NAME_GAP;
    if (dotsImg && dotsWrap && getComputedStyle(dotsWrap).display !== 'none') {
      fixedWidth += dotsImg.offsetWidth + parseFloat(getComputedStyle(dotsWrap).marginLeft || '0');
    }
    if (cursor && getComputedStyle(cursor).display !== 'none') {
      const cs = getComputedStyle(cursor);
      fixedWidth += cursor.offsetWidth + parseFloat(cs.marginLeft || '0') + parseFloat(cs.marginRight || '0');
    }
    let newHeight = (availableWidth - fixedWidth) / ratioSum;
    if (!Number.isFinite(newHeight)) return null;
    newHeight = Math.max(newHeight, HERO_NAME_MIN_H);
    document.documentElement.style.setProperty('--hero-name-h', newHeight + 'px');
    // fitHeroRole() doit cibler la largeur du texte "ALEXIS REY" seul (sans
    // les pointillés/curseur, qui débordent volontairement) : UI/UX DESIGNER
    // doit toujours faire la même taille que ce texte, pas s'ajuster à la
    // largeur totale du groupe (qui inclut les pointillés/curseur).
    return newHeight * ratioSum + HERO_NAME_GAP;
  }
  /* ── "UI / UX DESIGNER" : même largeur que le texte "ALEXIS REY" seul
     (sans les pointillés/curseur, qui débordent volontairement à droite) ──
     Par agrandissement du texte (font-size), pas par étirement des
     espaces (pas de text-align:justify) : on mesure la largeur naturelle
     du rôle sur une seule ligne (white-space:nowrap en CSS) et on
     recalcule la taille de police pour qu'elle égale exactement la
     largeur d'ALEXIS REY, déjà mise à l'échelle par fitHeroName().
     Le letter-spacing (.03rem, fixe) ne grossit pas avec le font-size —
     comme pour l'écart de 20px d'ALEXIS/REY, on l'isole de la partie qui
     scale réellement (les glyphes) pour ne pas sous-estimer la taille
     nécessaire. */
  // Même logique que HERO_NAME_MIN_H : un plancher trop haut forçait le
  // rôle à dépasser son conteneur sur les écrans les plus étroits au lieu
  // de rétrécir davantage.
  const HERO_ROLE_MIN_FS = 10; // px
  function fitHeroRole(targetWidth) {
    const role = document.querySelector('.hero__role');
    if (!role || !targetWidth) return;
    // targetWidth vient de fitHeroName() (voir ce commentaire) plutôt que
    // d'une mesure de .hero__name-group : juste après avoir changé
    // --hero-name-h, une lecture de layout synchrone sur le groupe renvoie
    // encore sa largeur AVANT changement (transition height .15s en cours,
    // pas encore avancée), pas la largeur cible — ce décalage dépendait du
    // temps écoulé depuis le dernier calcul, d'où les tailles différentes
    // observées entre deux refreshs ou après un resize.
    // offsetWidth (boîte de layout) plutôt que getBoundingClientRect() :
    // insensible à un éventuel transform (rotate/scale) sur l'élément, qui
    // fausserait la boîte englobante mesurée sans changer la vraie largeur
    // du texte.
    const currentFontSize = parseFloat(getComputedStyle(role).fontSize);
    const totalWidth = role.offsetWidth;
    const originalSpacing = role.style.letterSpacing;
    role.style.letterSpacing = '0px';
    const glyphWidth = role.offsetWidth;
    role.style.letterSpacing = originalSpacing;
    const spacingContribution = totalWidth - glyphWidth;
    if (!targetWidth || !currentFontSize || glyphWidth <= 0) return;
    const targetGlyphWidth = targetWidth - spacingContribution;
    let newFontSize = currentFontSize * (targetGlyphWidth / glyphWidth);
    if (!Number.isFinite(newFontSize)) return;
    newFontSize = Math.max(newFontSize, HERO_ROLE_MIN_FS);
    role.style.fontSize = newFontSize + 'px';
  }
  function fitHero() {
    const targetWidth = fitHeroName();
    fitHeroRole(targetWidth);
  }
  let heroNameTicking = false;
  const scheduleFitHero = () => {
    if (heroNameTicking) return;
    heroNameTicking = true;
    requestAnimationFrame(() => {
      heroNameTicking = false;
      fitHero();
    });
  };

  /* ── Révélation en une seule fois, une fois tout prêt ──────────
     Recalculer fitHero() à chaque évènement (chargement, police prête...)
     tant que le nom/rôle sont VISIBLES fait apparaître chaque état
     intermédiaire (images pas encore chargées, police de secours avant
     Anton...) comme un saut de taille bien visible. On cache le nom/rôle
     (opacity, voir style.css) jusqu'à ce que les images du nom soient
     chargées ET les polices prêtes, on calcule la taille finale à ce
     moment-là (deux passes à une frame d'écart, pour laisser le layout
     bien se stabiliser), puis on révèle — aucun état intermédiaire
     n'est jamais visible.
     L'écouteur 'resize' n'est attaché qu'APRÈS cette révélation : sinon
     un resize qui se déclenche tout seul pendant le chargement (ex : une
     barre de défilement qui apparaît/disparaît) peut recalculer avec des
     images ou des polices pas encore prêtes et laisser cette valeur-là
     affichée — une course avec le calcul déterministe ci-dessous,
     explique le "parfois une taille, parfois une autre" observé. */
  function heroNameImagesReady() {
    const imgs = document.querySelectorAll('.hero__name-group img');
    return Promise.all(Array.from(imgs).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    }));
  }
  // style.css et la feuille Google Fonts chargent en asynchrone (preload +
  // media="print" -> "all" au onload, voir <head>) : tant qu'elles n'ont pas
  // fini, la page ne tourne que sur le <style> critique inliné, un
  // sous-ensemble figé qui peut différer du rendu final. Calculer la taille
  // du nom à ce moment-là donnait un résultat qui dépendait de la vitesse de
  // chargement de ces feuilles (réseau/cache) — d'où deux tailles selon le
  // refresh. On attend qu'elles soient posées avant de calculer quoi que ce
  // soit ; fonts.ready est vérifié APRÈS (et non en parallèle) car il ne
  // "connaît" Anton/Poppins qu'une fois leurs règles @font-face enregistrées,
  // donc seulement après le chargement de la feuille Google Fonts.
  function linkReady(selector) {
    const link = document.querySelector(selector);
    if (!link) return Promise.resolve();
    if (link.media === 'all') return Promise.resolve();
    return new Promise((resolve) => {
      link.addEventListener('load', resolve, { once: true });
      link.addEventListener('error', resolve, { once: true });
    });
  }
  function heroReady() {
    return Promise.all([
      heroNameImagesReady(),
      // rel="stylesheet" précisé : il existe aussi un <link rel="preload">
      // vers la même URL (voir <head>), dont le 'load' ne correspond pas à
      // l'application de la feuille et qu'un sélecteur trop large attraperait
      // en premier (ordre du DOM).
      linkReady('link[rel="stylesheet"][href*="fonts.googleapis.com"]'),
      linkReady('link[rel="stylesheet"][href="style.css"]'),
    ]).then(() => (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve());
  }
  heroReady().then(() => {
    // .hero__letter/.hero__rey-img/.hero__role ont une transition (height/
    // font-size) pensée pour un resize ultérieur, pas pour ce tout premier
    // calcul : sans ça, ce calcul fait passer la taille de la valeur de
    // repli CSS à la taille finale via cette transition (150ms), qui démarre
    // à peine avant la révélation (opacity) — le nom apparaît donc en fondu
    // PENDANT qu'il grossit encore vers sa taille finale, perçu comme un
    // effet de zoom. On coupe la transition pour cette application initiale
    // uniquement, puis on la restaure avant de révéler.
    const transitionEls = [
      ...document.querySelectorAll('.hero__letter, .hero__rey-img'),
      document.querySelector('.hero__role'),
    ].filter(Boolean);
    transitionEls.forEach((el) => { el.style.transition = 'none'; });
    fitHero();
    requestAnimationFrame(() => {
      fitHero();
      // Force l'application de la taille avant de réactiver la transition,
      // pour qu'un futur resize démarre bien sa propre transition depuis
      // cette valeur-ci (et non depuis une valeur pas encore "gelée").
      transitionEls.forEach((el) => void el.offsetHeight);
      transitionEls.forEach((el) => { el.style.transition = ''; });
      if (heroEl) heroEl.classList.add('hero--name-ready');
      window.addEventListener('resize', scheduleFitHero, { passive: true });
    });
  });

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

      const fname    = form.querySelector('#fname');
      const femail   = form.querySelector('#femail');
      const fmsg     = form.querySelector('#fmessage');
      const fconsent = form.querySelector('#fconsent');
      const btn      = form.querySelector('[type="submit"]');
      const ferror   = form.querySelector('#formError');

      // Validation minimale côté client
      [fname, femail, fmsg].forEach((f) => {
        f.style.borderColor = f.value.trim() ? '' : '#ef4444';
      });
      if (!fname.value.trim() || !femail.value.trim() || !fmsg.value.trim()) return;
      if (!femail.value.includes('@')) {
        femail.style.borderColor = '#ef4444';
        return;
      }
      if (!fconsent.checked) return;

      if (ferror) ferror.hidden = true;
      const original = btn.textContent;
      btn.disabled = true;

      // FormData(form) reprend tous les champs du <form>, y compris l'input
      // caché form-name (obligatoire pour que Netlify route l'envoi vers le
      // bon formulaire déclaré au build) et le honeypot bot-field.
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString(),
      })
        .then((response) => {
          if (!response.ok) throw new Error('Netlify Forms a répondu ' + response.status);

          btn.textContent      = 'Envoyé ✓';
          btn.style.background = '#16a34a';
          form.reset();
          [fname, femail, fmsg].forEach((f) => (f.style.borderColor = ''));

          setTimeout(() => {
            btn.textContent      = original;
            btn.style.background = '';
            btn.disabled         = false;
          }, 3500);
        })
        .catch(() => {
          // Échec (réseau ou réponse non ok) : on laisse les champs saisis
          // tels quels pour que la personne puisse simplement réessayer.
          btn.disabled    = false;
          btn.textContent = original;
          if (ferror) ferror.hidden = false;
        });
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
      'nav.realisationsAria': 'Lien vers mes réalisations',
      'nav.contactAria': 'Lien vers contact',
      'hero.badge':     'Disponible pour designer !',
      'hero.tagline':   "Je m'imprègne de votre identité de marque et je conçois une interface sur mesure et à votre image.",
      'hero.cta1':      'Voir mes réalisations',
      'hero.cta2':      'Me contacter',
      'eke.desc':       "Créée en 2019 par de jeunes togolais, l'association togolaise Eke-Deka a pour objectif de participer à l'amélioration du cadre de vie des populations du pays, notamment par la promotion du tourisme durable et de l'agroécologie. Afin d'appuyer l'association togolaise dans la poursuite de ces missions, l'association Eke-Deka France a été créée en 2020. J'ai pu rencontrer les membres de cette association et bénévolement proposer une refonte de leur site Internet.",
      'eke.role1':      'Identité graphique',
      'dt.subject':     'Sujet',
      'eke.subject':    'Association Eke-Deka',
      'eke.date':       '28 mars 2025',
      'eke.note':       "En allant au Togo j'ai rencontré l'équipe d'Eke-Deka et j'ai pu me rendre à la ferme Biala, coeur de l'association. M'imprégner du lieu, des gens et de leurs valeurs a nourri toute la refonte. Le défi : construire une identité forte, inspirée des maisons de la ferme, mais assez simple pour que les membres, qui ne sont pas développeurs, puissent la faire vivre eux-mêmes dans les limites de Wix.",
      'elmy.desc':      "elmy est un fournisseur et producteur d'énergie verte basé principalement sur Lyon. Voici la refonte que j'ai eu l'occasion de faire sur l'espace client B2B, suite notamment à une évolution de l'identité graphique.",
      'elmy.subject':   'Refonte espace client B2B',
      'elmy.date':      '28 mars 2025',
      'elmy.note':      "J'ai retravaillé l'interface de l'espace client B2B avec les développeurs et le directeur artistique, qui venait de poser la nouvelle direction artistique elmy Pro. La difficulté était de garder un espace client accueillant sans perdre le sérieux attendu par des professionnels, et de rendre les informations de consommation et de contrat lisibles du premier coup d'œil.",
      'gnc.desc':       "Game'n Chill est une association loi 1901 qui organise des tournois de jeux vidéo, du rétro au plus récent, dans une ambiance volontairement détendue. Le site sert de point de rendez-vous à la communauté : agenda des événements, classements, galerie photo, inscriptions, et même un randomizer pour tirer les jeux au sort. L'esprit reste le même à chaque édition, jouer sérieusement sans se prendre au sérieux.",
      'gnc.role':       'Directeur artistique',
      'gnc.subject':    "Association d'événements gaming",
      'gnc.note':       "J'y suis directeur artistique bénévole. J'ai dessiné le logo et mené une refonte complète du site, aujourd'hui en cours d'intégration. En parallèle, je reprends petit à petit les autres supports, affiches, réseaux sociaux, visuels de tournois, pour que tout parle la même langue visuelle. Un travail de fond, qui avance au rythme de l'association et de ses événements.",
      'ameliorama.desc': "Ameliorama III est une map moddée pour Call of Duty Black Ops III, développée par Gogu (pseudo Steam). Les joueurs y récoltent des ressources pour améliorer leur base et leur personnage, affrontent des vagues infinies de zombies sur le champ de bataille et se renforcent entre deux assauts dans la safe zone. Les deux volets précédents ont bien marché, le dernier a dépassé 95 000 téléchargements.",
      'ameliorama.subject': 'Map Call of Duty BO III',
      'ameliorama.note': "Gogu m'a confié le design de l'interface. Le pari : faire tenir ensemble Call of Duty et un RPG heroic fantasy, sans tomber dans le pastiche médiéval. J'ai gardé des formes simples et travaillé les reliefs avec un or bien marqué, en regardant du côté de Hearthstone. La map n'est pas encore sortie, l'interface continue d'évoluer et d'autres écrans arrivent.",
      'card.typo':      'Typographie',
      'card.colors':    'Couleurs',
      'other.title':    'Autres projets',
      'other.text':     "Mon cœur de métier, c'est l'UI/UX. Ma curiosité va plus loin : j'ai par exemple exploré le monde de YouTube en gérant la direction artistique, le logo et les miniatures de la chaîne YouTube Ledok. Si vous avez un projet de création digitale qui sort de ce que vous voyez ici, n'hésitez pas à me contacter également !",
      'contact.title':  'Contactez moi !',
      'contact.sub':    "Un projet ? Besoin d'un designer pour votre interface ?",
      'contact.name':   'Nom et Prénom',
      'contact.email':  'Adresse email',
      'contact.msg':    'Objet de la demande',
      'contact.consentPre': "J'accepte que mes données soient utilisées pour me recontacter, conformément à la",
      'contact.send':   'Envoyer',
      'contact.error':  'Une erreur est survenue. Merci de réessayer.',
      'footer.contactTitle':   'Contact',
      'footer.socialTitle':    'Réseaux sociaux',
      'footer.legalStatus':    'Entrepreneur individuel (EI)',
      'footer.legal':    'Mentions légales',
      'footer.privacyShort': 'Confidentialité',
      'footer.privacyLower': 'politique de confidentialité',
      'footer.linkedinAria':  "Profil LinkedIn d'Alexis Rey",
      'footer.instagramAria': "Profil Instagram d'Alexis Rey",
    },
    en: {
      'lang.current':   'English',
      'lang.option':    'Français',
      'nav.realisations': 'My work',
      'nav.realisationsAria': 'Link to my work',
      'nav.contactAria': 'Link to contact',
      'hero.badge':     'Available to design!',
      'hero.tagline':   'I immerse myself in your brand identity and design a tailor-made interface that reflects your image.',
      'hero.cta1':      'See my work',
      'hero.cta2':      'Get in touch',
      'eke.desc':       "Founded in 2019 by young Togolese, the Eke-Deka association aims to improve the living conditions of the country's population through the promotion of sustainable tourism and agroecology. To support the Togolese association, the Eke-Deka France association was created in 2020. I met the members of this association and voluntarily proposed a redesign of their website.",
      'eke.role1':      'Graphic design',
      'dt.subject':     'Project',
      'eke.subject':    'Eke-Deka Association',
      'eke.date':       'March 28, 2025',
      'eke.note':       "Traveling to Togo, I met the Eke-Deka team and was able to visit the Biala farm, the heart of the association. Immersing myself in the place, the people and their values shaped the entire redesign. The challenge: building a strong identity, inspired by the farm's houses, yet simple enough for the members — who aren't developers — to keep it alive themselves within Wix's constraints.",
      'elmy.desc':      "elmy is a green energy supplier and producer based primarily in Lyon. Here is the redesign I had the opportunity to work on for their B2B client portal, following an evolution of their visual identity.",
      'elmy.subject':   'B2B portal redesign',
      'elmy.date':      'March 28, 2025',
      'elmy.note':      "I reworked the B2B client portal interface with the developers and the art director, who had just set the new elmy Pro visual direction. The challenge was to keep the portal approachable without losing the seriousness expected by professionals, and to make consumption and contract information readable at a glance.",
      'gnc.desc':       "Game'n Chill is a French non-profit association that organizes video game tournaments, from retro classics to the latest releases, in a deliberately relaxed atmosphere. The site is the community's meeting point: event schedule, leaderboards, photo gallery, sign-ups, and even a randomizer to draw games at random. The spirit stays the same every time: play seriously without taking yourself too seriously.",
      'gnc.role':       'Art director',
      'gnc.subject':    'Gaming events association',
      'gnc.note':       "I'm the volunteer art director there. I designed the logo and led a full redesign of the site, now being implemented. Alongside that, I'm gradually reworking the other materials — posters, social media, tournament visuals — so everything speaks the same visual language. It's ongoing work that moves at the pace of the association and its events.",
      'ameliorama.desc': "Ameliorama III is a custom map mod for Call of Duty: Black Ops III, developed by Gogu (Steam handle). Players gather resources to upgrade their base and character, face endless waves of zombies on the battlefield, and gear up between assaults in the safe zone. The two previous installments did well, with the last one passing 95,000 downloads.",
      'ameliorama.subject': 'Call of Duty BO III map',
      'ameliorama.note': "Gogu entrusted me with the interface design. The challenge: making Call of Duty and a heroic-fantasy RPG coexist, without falling into medieval pastiche. I kept the shapes simple and worked the depth with a strong, well-defined gold, taking cues from Hearthstone. The map hasn't been released yet — the interface keeps evolving, with more screens on the way.",
      'card.typo':      'Typography',
      'card.colors':    'Colors',
      'other.title':    'Other projects',
      'other.text':     "My core expertise is UI/UX. My curiosity goes further: for example, I explored the world of YouTube, handling the art direction, logo, and thumbnails for the Ledok YouTube channel. If you have a digital design project that falls outside what you see here, feel free to reach out to me as well!",
      'contact.title':  'Contact me!',
      'contact.sub':    'A project? Looking for a designer for your interface?',
      'contact.name':   'Full name',
      'contact.email':  'Email address',
      'contact.msg':    'Subject',
      'contact.consentPre': 'I agree that my data will be used to reply to me, in accordance with the',
      'contact.send':   'Send',
      'contact.error':  'Something went wrong. Please try again.',
      'footer.contactTitle':   'Contact',
      'footer.socialTitle':    'Social media',
      'footer.legalStatus':    'Sole proprietor (EI)',
      'footer.legal':    'Legal notice',
      'footer.privacyShort': 'Privacy',
      'footer.privacyLower': 'privacy policy',
      'footer.linkedinAria':  "Alexis Rey's LinkedIn profile",
      'footer.instagramAria': "Alexis Rey's Instagram profile",
    },
  };

  function setLang(lang) {
    document.documentElement.lang = lang;
    const t = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (t[key] !== undefined) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.dataset.i18nAria;
      if (t[key] !== undefined) el.setAttribute('aria-label', t[key]);
    });
    try { localStorage.setItem('ar-lang', lang); } catch (_) {}
  }

  /* ── Dropdown langue ───────────────────────────────── */
  const langDropdown = document.querySelector('.lang-dropdown');
  const langBtn      = langDropdown?.querySelector('.lang-btn');
  const langMenu     = langDropdown?.querySelector('.lang-dropdown__menu');
  const langOption   = langDropdown?.querySelector('.lang-btn--option');

  // Le menu fermé doit être totalement inatteignable au clavier (inert),
  // pas seulement invisible/non-cliquable à la souris (opacity+pointer-events).
  function setLangMenuOpen(open) {
    langDropdown.classList.toggle('is-open', open);
    langBtn.setAttribute('aria-expanded', open);
    if (langMenu) langMenu.toggleAttribute('inert', !open);
  }

  if (langBtn) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setLangMenuOpen(!langDropdown.classList.contains('is-open'));
    });

    document.addEventListener('click', () => {
      setLangMenuOpen(false);
    });
  }

  if (langOption) {
    langOption.addEventListener('click', () => {
      const newLang = document.documentElement.lang === 'en' ? 'fr' : 'en';
      setLang(newLang);
      setLangMenuOpen(false);
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

      // Ajouter les slides extra (+N) : vraies images si fournies, sinon placeholders
      const allImages = [...visibleImages];
      const moreImages = (moreEl?.dataset.moreImages ?? '').split(',').map(s => s.trim()).filter(Boolean);
      if (moreImages.length) {
        moreImages.forEach(src => allImages.push({ src, alt: '' }));
      } else {
        for (let i = 0; i < moreCount; i++) allImages.push({ src: null });
      }

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

  const lastCardEl = document.getElementById('ameliorama-3');
  if (lastCardEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        const pastCard = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
        body.classList.toggle('show-end-gradient', pastCard);
      },
      { threshold: 0 }
    ).observe(lastCardEl);
  }

  /* ── Scroll nav + scrollspy URL + hash d'URL ─────────
     Ces trois logiques lisaient chacune des getBoundingClientRect() sur
     leurs propres listeners 'scroll'/'resize' : comme les writes de l'une
     (classList, style.top, history.replaceState) precedent les reads de
     la suivante dans la meme passe d'evenement, le navigateur devait
     recalculer le layout de facon synchrone entre les deux (forced
     reflow / layout thrashing). On fusionne tout en une seule passe —
     toutes les lectures d'abord, puis toutes les ecritures — declenchee
     au plus une fois par frame via requestAnimationFrame plutot qu'a
     chaque evenement de scroll brut. */
  const scrollNav    = document.getElementById('scrollNav');
  const MOOD_CLASSES = ['mood-eke-deka', 'mood-elmy', 'mood-game-n-chill', 'mood-ameliorama-3'];
  const projectCards = scrollNav ? document.querySelectorAll('#realisations .card') : [];
  const navDots       = scrollNav ? scrollNav.querySelectorAll('.scroll-nav__dot') : [];
  const navCursor     = scrollNav ? scrollNav.querySelector('.scroll-nav__cursor') : null;
  const navTrack      = scrollNav ? scrollNav.querySelector('.scroll-nav__track') : null;
  // .scroll-nav est display:none sous 1024px (voir style.css) : sur mobile/
  // tablette, calculer et écrire la position du curseur à chaque scroll ne
  // sert à rien puisque rien n'est visible — coût de thread principal évité
  // en dessous de ce seuil.
  const scrollNavMQ  = window.matchMedia('(min-width: 1025px)');

  const hashSections = [
    { hash: 'welcome',      el: document.getElementById('hero') },
    { hash: 'eke-deka',     el: document.getElementById('eke-deka') },
    { hash: 'elmy',         el: document.getElementById('elmy') },
    { hash: 'game-n-chill', el: document.getElementById('game-n-chill') },
    { hash: 'ameliorama-3', el: document.getElementById('ameliorama-3') },
    { hash: 'contact',      el: document.getElementById('contact') },
  ].filter((s) => s.el);

  let lastHash = '';

  function updateScrollState() {
    const vh = window.innerHeight;

    // ── Lectures ──
    let activeIdx = 0;
    projectCards.forEach((card, i) => {
      if (card.getBoundingClientRect().top < vh * 0.5) activeIdx = i;
    });

    const scrollNavVisible = scrollNavMQ.matches;

    let cursorTop = null;
    if (scrollNavVisible && navCursor && navDots[activeIdx] && navTrack) {
      const trackRect = navTrack.getBoundingClientRect();
      const dotRect   = navDots[activeIdx].getBoundingClientRect();
      const cursorH   = navCursor.offsetHeight || 28;
      cursorTop = Math.max(0, dotRect.top - trackRect.top + (dotRect.height - cursorH) / 2);
    }

    const activeCard = projectCards[activeIdx];
    let moodClass = null, moodInView = false;
    if (activeCard?.id) {
      // Mood : disparaît quand plus de la moitié de la dernière card est sortie par le haut
      const lastCard      = projectCards[projectCards.length - 1];
      const lastCardRect  = lastCard.getBoundingClientRect();
      const lastCardGone  = lastCardRect.top < -(lastCard.offsetHeight / 2);
      const inView        = activeCard.getBoundingClientRect().top < vh * 0.8;
      moodClass   = 'mood-' + activeCard.id;
      moodInView  = inView && !lastCardGone;
    }

    let activeHash = hashSections[0];
    hashSections.forEach((s) => {
      if (s.el.getBoundingClientRect().top < vh * 0.5) activeHash = s;
    });

    // ── Écritures ──
    if (scrollNavVisible) {
      navDots.forEach((dot, i) => dot.classList.toggle('is-active', i === activeIdx));
      if (cursorTop !== null) navCursor.style.top = cursorTop + 'px';
    }
    if (moodClass) {
      MOOD_CLASSES.forEach(c => body.classList.remove(c));
      if (moodInView) body.classList.add(moodClass);
    }
    if (activeHash && activeHash.hash !== lastHash) {
      lastHash = activeHash.hash;
      // On ne touche qu'au hash : changer le chemin vers une URL absolue
      // ("/", "/contact"...) lève une SecurityError si le site est ouvert
      // en local (file://) plutôt que via un serveur.
      history.replaceState(null, '', location.pathname + location.search + '#' + activeHash.hash);
    }
  }

  if (scrollNav) {
    // Clic sur un dot → scroll vers la card correspondante
    navDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const target = projectCards[i];
        if (!target) return;
        const top = target.getBoundingClientRect().top + window.scrollY - NAV_H() - 24;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  if (scrollNav || hashSections.length) {
    let scrollTicking = false;
    const requestScrollUpdate = () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        scrollTicking = false;
        updateScrollState();
      });
    };

    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    window.addEventListener('resize', requestScrollUpdate, { passive: true });
    setTimeout(updateScrollState, 150);
  }

  // Scroll vers l'ancre demandée dans l'URL au chargement (carte projet,
  // #welcome...). Le hash a été retiré de l'URL tout en haut de index.html
  // pour éviter le saut brut du navigateur ; on scrolle ici nous-mêmes,
  // instantanément et avec le bon offset de nav.
  if (window.__initHash) {
    const target = document.querySelector(window.__initHash);
    if (target) {
      scrollToSection(target, NAV_H() + 24, 'auto');
      // Remettre le hash dans l'URL une fois bien positionné (pour que le
      // lien reste partageable/rechargeable tel quel).
      history.replaceState(null, '', location.pathname + location.search + window.__initHash);
    }
  }

})();
