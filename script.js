/* ==========================================================
   SCRIPT.JS — Alexis Rey Portfolio
   ========================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'ar-anim';
  const body        = document.body;
  const toggle      = document.getElementById('animToggle');

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

})();
