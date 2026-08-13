/* ═══════════════════════════════════════════════════════
   Junghwa Splendor Kim — main.js
   Patrón IIFE clásico, sin módulos, sin dependencias.
   Cada init va envuelto en safe(): si uno falla, el resto vive.
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function safe(fn, name) {
    try { fn(); } catch (e) {
      if (window.console) console.warn('[init:' + name + ']', e);
    }
  }

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Texto suelto en el idioma activo, con el inglés de respaldo */
  function tr(key, fallback) {
    var d = window.__I18N__;
    if (!d) return fallback;
    var l = document.documentElement.getAttribute('lang') || 'en';
    var v = (d[l] && d[l][key]) || (d.en && d.en[key]);
    return v || fallback;
  }

  /* ── 0. Idioma: inglés y coreano ─────────────────── */
  var LANGS = ['en', 'ko'];
  var STORE = 'jsk-lang';

  function initI18n() {
    var dict = window.__I18N__;
    if (!dict) return;                 /* sin diccionario, queda el inglés del HTML */

    function chosen() {
      /* 1º lo que diga la dirección (?lang=…) */
      var q = (window.location.search.match(/[?&]lang=([a-z]{2})/i) || [])[1];
      if (q && LANGS.indexOf(q.toLowerCase()) >= 0) return q.toLowerCase();
      /* 2º el idioma que el visitante eligió la vez anterior */
      try {
        var s = window.localStorage.getItem(STORE);
        if (s && LANGS.indexOf(s) >= 0) return s;
      } catch (e) {}
      /* 3º por defecto, inglés: es la web de una autora internacional */
      return 'en';
    }

    function apply(lang, remember) {
      var t = dict[lang] || dict.en;
      var base = dict.en;   /* el inglés es el idioma base */
      var i, j;

      document.documentElement.setAttribute('lang', lang);

      /* Textos */
      var nodes = document.querySelectorAll('[data-i18n]');
      for (i = 0; i < nodes.length; i++) {
        var k = nodes[i].getAttribute('data-i18n');
        var v = (t[k] != null) ? t[k] : base[k];
        if (v != null) nodes[i].innerHTML = v;
      }

      /* Atributos: data-i18n-attrs="alt:clave;content:otra" */
      var attrs = document.querySelectorAll('[data-i18n-attrs]');
      for (i = 0; i < attrs.length; i++) {
        var pairs = attrs[i].getAttribute('data-i18n-attrs').split(';');
        for (j = 0; j < pairs.length; j++) {
          var p = pairs[j].split(':');
          if (p.length < 2) continue;
          var name = p[0].replace(/^\s+|\s+$/g, '');
          var key  = p[1].replace(/^\s+|\s+$/g, '');
          var val  = (t[key] != null) ? t[key] : base[key];
          if (val != null) attrs[i].setAttribute(name, val);
        }
      }

      /* Bandera activa */
      var btns = document.querySelectorAll('.lang__b');
      for (i = 0; i < btns.length; i++) {
        var on = btns[i].getAttribute('data-lang') === lang;
        btns[i].classList.toggle('is-on', on);
        btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      }

      /* El botón del menú puede estar abierto: respetamos su etiqueta */
      var burger = document.getElementById('navBurger');
      if (burger && burger.getAttribute('aria-expanded') === 'true') {
        var close = (t['a11y.menuClose'] || base['a11y.menuClose']);
        if (close) burger.setAttribute('aria-label', close);
      }

      if (remember) {
        try { window.localStorage.setItem(STORE, lang); } catch (e) {}
        /* La URL queda compartible: ?lang=en, ?lang=ko */
        if (window.history && window.history.replaceState) {
          var url = window.location.pathname +
                    (lang === 'en' ? '' : '?lang=' + lang) +
                    window.location.hash;
          window.history.replaceState(null, '', url);
        }
      }
    }

    apply(chosen(), false);

    var switcher = document.getElementById('lang');
    if (switcher) {
      switcher.addEventListener('click', function (e) {
        var b = e.target;
        while (b && b !== switcher && !b.getAttribute('data-lang')) b = b.parentNode;
        if (!b || b === switcher) return;
        apply(b.getAttribute('data-lang'), true);
      });
    }
  }

  /* ── 1. Año del pie ──────────────────────────────── */
  function initYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ── 2. Navegación: siempre visible, fondo sólido al bajar ─ */
  function initNav() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    var ticking = false;

    function update() {
      /* La barra queda fija y visible todo el rato; solo gana fondo
         sólido en cuanto se sale de la portada, para que se lea. */
      nav.classList.toggle('is-solid', window.pageYOffset > 40);
      nav.classList.remove('is-hidden');
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ── 2b. Menú: desplegables y versión móvil ──────── */
  function initMenu() {
    var links  = document.getElementById('navLinks');
    var burger = document.getElementById('navBurger');
    var groups = document.querySelectorAll('.nav__group');
    var i;

    /* Menú móvil */
    if (links && burger) {
      var openMobile = function (state) {
        links.classList.toggle('is-open', state);
        burger.setAttribute('aria-expanded', state ? 'true' : 'false');
        burger.setAttribute('aria-label', state
          ? tr('a11y.menuClose', 'Close the menu')
          : tr('a11y.menuOpen', 'Open the menu'));
      };

      burger.addEventListener('click', function () {
        openMobile(!links.classList.contains('is-open'));
      });

      /* Al elegir destino, el menú se aparta */
      links.addEventListener('click', function (e) {
        if (e.target && e.target.tagName === 'A') openMobile(false);
      });

      window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') openMobile(false);
      });

      window.addEventListener('resize', function () {
        if (window.innerWidth > 900) openMobile(false);
      });
    }

    /* Desplegables de escritorio: el hover lo hace el CSS,
       el clic es para pantallas táctiles y para el teclado. */
    function closeAll(except) {
      for (var j = 0; j < groups.length; j++) {
        var m = groups[j].querySelector('.nav__menu');
        var b = groups[j].querySelector('.nav__top');
        if (m && m !== except) {
          m.classList.remove('is-open');
          if (b) b.setAttribute('aria-expanded', 'false');
        }
      }
    }

    for (i = 0; i < groups.length; i++) {
      (function (group) {
        var btn  = group.querySelector('.nav__top');
        var menu = group.querySelector('.nav__menu');
        if (!btn || !menu) return;
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var willOpen = !menu.classList.contains('is-open');
          closeAll(menu);
          menu.classList.toggle('is-open', willOpen);
          btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        });
      })(groups[i]);
    }

    document.addEventListener('click', function () { closeAll(null); });
  }

  /* ── 3. Barra de progreso ────────────────────────── */
  function initProgress() {
    var bar = document.getElementById('progressBar');
    if (!bar) return;
    var ticking = false;

    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.pageYOffset / max) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, pct)).toFixed(2) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ── 4. Reveal al entrar en pantalla ─────────────── */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    function showAll() {
      for (var i = 0; i < items.length; i++) items[i].classList.add('is-in');
    }

    if (!('IntersectionObserver' in window)) { showAll(); return; }

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          var el = entries[i].target;
          /* Escalonado según su posición entre hermanos revelables */
          var idx = 0, sib = el.previousElementSibling;
          while (sib) {
            if (sib.classList && sib.classList.contains('reveal')) idx++;
            sib = sib.previousElementSibling;
          }
          el.style.transitionDelay = (Math.min(idx, 6) * 0.08) + 's';
          el.classList.add('is-in');
          io.unobserve(el);
        }
      }
    }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });

    for (var i = 0; i < items.length; i++) io.observe(items[i]);

    /* Red de seguridad: a los 6 s nada sigue escondido */
    window.setTimeout(showAll, 6000);
  }

  /* ── 5. Portada con inclinación 3D ───────────────── */
  function initTilt() {
    var el = document.getElementById('tilt');
    if (!el || reduced) return;
    if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;

    var host = el.parentNode;

    host.addEventListener('mousemove', function (e) {
      var r = host.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform =
        'rotateY(' + (px * 13).toFixed(2) + 'deg) ' +
        'rotateX(' + (-py * 11).toFixed(2) + 'deg) ' +
        'translateZ(18px)';
      el.style.transitionDuration = '.15s';
    });

    host.addEventListener('mouseleave', function () {
      el.style.transitionDuration = '.7s';
      el.style.transform = '';
    });
  }

  /* ── 5b. Fondo de vídeo (solo tema violeta) ──────── */
  function initHeroVideo() {
    var v = document.getElementById('heroVideo');
    if (!v) return;
    if (document.documentElement.getAttribute('data-tema') !== 'violeta') return;

    /* Con "menos movimiento" activado: se queda el póster, no arranca */
    if (reduced) { v.removeAttribute('autoplay'); v.pause(); return; }

    function go() {
      var p = v.play();
      if (p && p.catch) p.catch(function () {/* autoplay bloqueado: lo reintenta el gesto */});
    }
    if (v.readyState >= 2) go();
    else v.addEventListener('loadeddata', go, { once: true });

    /* Plan B: si el navegador bloqueó el autoplay, arranca al primer
       gesto del visitante (toque, clic, scroll o tecla). Se quita solo. */
    function kick() {
      go();
      if (!v.paused) off();
    }
    function off() {
      ['pointerdown', 'touchstart', 'click', 'keydown', 'scroll'].forEach(function (ev) {
        window.removeEventListener(ev, kick, true);
      });
    }
    ['pointerdown', 'touchstart', 'click', 'keydown', 'scroll'].forEach(function (ev) {
      window.addEventListener(ev, kick, { capture: true, passive: true });
    });

    /* Ahorra batería: pausa cuando el hero no se ve o la pestaña está oculta */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) v.pause(); else go();
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) go(); else v.pause();
      }, { threshold: 0.02 });
      io.observe(v);
    }
  }

  /* ── 5c. Vídeo tras la portada del libro ─────────── */
  function initBookVideo() {
    var v = document.getElementById('bookVideo');
    if (!v) return;
    if (reduced) return;                 /* queda el póster, quieto */

    function go() {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }

    /* Solo se carga y reproduce cuando el libro está a la vista */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { v.preload = 'auto'; go(); }
        else v.pause();
      }, { threshold: 0.2 });
      io.observe(v);
    } else {
      v.preload = 'auto'; go();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) v.pause();
    });
  }

  /* ── 6. El estanque: estrellas, reflejo y ondas ──── */
  function initPond() {
    var canvas = document.getElementById('pond');
    if (!canvas || !canvas.getContext) return;
    /* En violeta el fondo es el vídeo: no gastamos CPU dibujando el cielo */
    if (document.documentElement.getAttribute('data-tema') === 'violeta'
        && document.getElementById('heroVideo')) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* Los colores los toma del tema activo: el cielo cambia con la paleta */
    var css = window.getComputedStyle(document.documentElement);
    function tone(name, fallback) {
      var v = css.getPropertyValue(name);
      v = v ? v.replace(/^\s+|\s+$/g, '') : '';
      return v || fallback;
    }
    var C_STAR  = tone('--star-rgb',  '239,233,221');
    var C_ACC   = tone('--gold-rgb',  '201,168,106');
    var C_LILAC = tone('--lilac-rgb', '159,176,214');
    var C_WATER = tone('--water-rgb', '14,27,46');
    var C_INK   = tone('--ink-rgb',   '7,11,20');

    function rgba(c, a) { return 'rgba(' + c + ',' + a + ')'; }

    /* El tema violeta pone el cielo en marcha: giro lento alrededor de la
       luna, órbitas como las de la portada y alguna estrella fugaz.
       El tema oscuro deja el cielo quieto, solo titilando. */
    var moving = document.documentElement.getAttribute('data-tema') === 'violeta';
    var SPIN = 0.0055;                 /* radianes por segundo: una vuelta en 19 min */

    var w = 0, h = 0, dpr = 1, horizon = 0;
    var px = 0, py = 0, radius = 0;    /* polo del giro y alcance del cielo */
    var stars = [], ripples = [], shots = [];
    var running = true, raf = null, t0 = Date.now(), lastT = 0;
    var nextShot = 4 + Math.random() * 8;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      horizon = h * 0.66;

      /* La luna es también el eje del giro. En pantallas anchas el retrato
         ocupa la derecha, así que se corre al hueco entre columnas. */
      px = w * (w >= 900 ? 0.50 : 0.78);
      py = horizon * 0.28;
      var ex = Math.max(px, w - px);
      var ey = Math.max(py, horizon - py);
      radius = Math.sqrt(ex * ex + ey * ey) * 1.05;

      seed();
    }

    function seed() {
      stars = [];
      /* Si el cielo gira hay que sembrar el disco entero, no solo lo que
         se ve: las estrellas que salen de cuadro deben volver a entrar. */
      var area = moving ? Math.PI * radius * radius : w * horizon;
      var top  = moving ? 380 : 190;
      var n = Math.round(Math.min(top, Math.max(70, area / 9000)));

      for (var i = 0; i < n; i++) {
        var x, y;
        if (moving) {
          var ang = Math.random() * Math.PI * 2;
          var rr = radius * Math.sqrt(Math.random());   /* reparto uniforme */
          x = px + Math.cos(ang) * rr;
          y = py + Math.sin(ang) * rr;
        } else {
          x = Math.random() * w;
          y = Math.random() * horizon * 0.98;
        }
        stars.push({
          x: x, y: y,
          r: Math.random() * 1.25 + 0.35,
          a: Math.random() * 0.55 + 0.35,
          ph: Math.random() * Math.PI * 2,
          sp: Math.random() * 0.9 + 0.4,
          acc: Math.random() < 0.18
        });
      }
    }

    function ripple(x, y) {
      if (ripples.length > 14) return;
      ripples.push({ x: x, y: y, r: 2, max: 60 + Math.random() * 90, a: 0.32 });
    }

    function drawWater() {
      var g = ctx.createLinearGradient(0, horizon, 0, h);
      g.addColorStop(0, rgba(C_WATER, 0.55));
      g.addColorStop(1, rgba(C_INK, 0.95));
      ctx.fillStyle = g;
      ctx.fillRect(0, horizon, w, h - horizon);

      /* Línea de horizonte: un hilo de luz */
      var lg = ctx.createLinearGradient(0, 0, w, 0);
      lg.addColorStop(0, rgba(C_ACC, 0));
      lg.addColorStop(0.5, rgba(C_ACC, 0.22));
      lg.addColorStop(1, rgba(C_ACC, 0));
      ctx.fillStyle = lg;
      ctx.fillRect(0, horizon, w, 1);
    }

    /* Órbitas: el eco de los diagramas celestes de la portada */
    function drawOrbits(time) {
      var rot = time * SPIN * 0.6;
      var rings = [0.30, 0.46, 0.66, 0.86];
      ctx.lineWidth = 1;
      for (var i = 0; i < rings.length; i++) {
        var rr = radius * rings[i];
        ctx.strokeStyle = rgba(C_ACC, (0.055 - i * 0.009).toFixed(4));
        ctx.beginPath();
        ctx.ellipse(px, py, rr, rr * (0.30 + i * 0.06), rot + i * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function drawStars(time) {
      var rot = moving ? time * SPIN : 0;
      var cos = Math.cos(rot), sin = Math.sin(rot);

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var sx = s.x, sy = s.y;

        if (moving) {                       /* giro alrededor del polo */
          var dx = s.x - px, dy = s.y - py;
          sx = px + dx * cos - dy * sin;
          sy = py + dx * sin + dy * cos;
          /* Las que se ponen tras el horizonte, o salen de cuadro, descansan */
          if (sy > horizon || sy < -30 || sx < -30 || sx > w + 30) continue;
        }

        var tw = 0.55 + 0.45 * Math.sin(time * s.sp + s.ph);
        var a = s.a * tw;

        ctx.fillStyle = rgba(s.acc ? C_ACC : C_STAR, a.toFixed(3));
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();

        /* Reflejo tembloroso bajo el horizonte */
        var depth = (horizon - sy) / horizon;
        var ry = horizon + (horizon - sy) * 0.52;
        if (ry < h) {
          var wob = Math.sin(time * 1.4 + s.ph * 2 + ry * 0.02) * (2 + depth * 9);
          ctx.fillStyle = rgba(s.acc ? C_ACC : C_LILAC, (a * 0.3).toFixed(3));
          ctx.beginPath();
          ctx.ellipse(sx + wob, ry, s.r * 1.6, s.r * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function shoot() {
      shots.push({
        x: Math.random() * w * 0.85,
        y: Math.random() * horizon * 0.55,
        vx: 380 + Math.random() * 300,
        vy: 150 + Math.random() * 190,
        life: 1
      });
    }

    function drawShots(dt) {
      for (var i = shots.length - 1; i >= 0; i--) {
        var s = shots[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt * 1.15;
        if (s.life <= 0 || s.y > horizon || s.x > w + 80) { shots.splice(i, 1); continue; }

        var tx = s.x - s.vx * 0.06, ty = s.y - s.vy * 0.06;
        var g = ctx.createLinearGradient(tx, ty, s.x, s.y);
        g.addColorStop(0, rgba(C_STAR, 0));
        g.addColorStop(1, rgba(C_STAR, (0.75 * s.life).toFixed(3)));
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }
    }

    function drawRipples() {
      for (var i = ripples.length - 1; i >= 0; i--) {
        var r = ripples[i];
        r.r += 1.15;
        r.a *= 0.975;
        if (r.r > r.max || r.a < 0.006) { ripples.splice(i, 1); continue; }
        ctx.strokeStyle = rgba(C_ACC, r.a.toFixed(4));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.r, r.r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    function frame() {
      if (!running) { raf = null; return; }
      var time = (Date.now() - t0) / 1000;
      var dt = Math.min(0.05, lastT ? time - lastT : 0.016);
      lastT = time;

      ctx.clearRect(0, 0, w, h);
      if (moving) drawOrbits(time);
      drawWater();
      drawStars(time);

      if (moving) {
        nextShot -= dt;
        if (nextShot <= 0) { shoot(); nextShot = 7 + Math.random() * 12; }
        drawShots(dt);
      }

      drawRipples();

      if (Math.random() < 0.012) {
        ripple(Math.random() * w, horizon + Math.random() * (h - horizon));
      }
      raf = window.requestAnimationFrame(frame);
    }

    function play() { if (!raf && running) raf = window.requestAnimationFrame(frame); }
    function pause() { running = false; if (raf) { window.cancelAnimationFrame(raf); raf = null; } }
    function resume() { running = true; play(); }

    resize();

    /* Un fotograma estático siempre, aunque no animemos */
    ctx.clearRect(0, 0, w, h);
    drawWater(); drawStars(0);

    if (reduced) return;   // cielo fijo: sigue siendo bonito, no se mueve

    var rt = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(rt);
      rt = window.setTimeout(resize, 180);
    });

    var hero = canvas.parentNode;
    var lastMove = 0;
    hero.addEventListener('mousemove', function (e) {
      var now = Date.now();
      if (now - lastMove < 110) return;
      lastMove = now;
      var r = canvas.getBoundingClientRect();
      var y = e.clientY - r.top;
      if (y > horizon) ripple(e.clientX - r.left, y);
    });

    document.addEventListener('visibilitychange', function () {
      document.hidden ? pause() : resume();
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? resume() : pause();
      }, { threshold: 0.02 });
      io.observe(canvas);
    }

    play();
  }

  /* ── Arranque ────────────────────────────────────── */
  function boot() {
    safe(initI18n, 'i18n');
    safe(initYear, 'year');
    safe(initNav, 'nav');
    safe(initMenu, 'menu');
    safe(initProgress, 'progress');
    safe(initReveal, 'reveal');
    safe(initTilt, 'tilt');
    safe(initHeroVideo, 'heroVideo');
    safe(initBookVideo, 'bookVideo');
    safe(initPond, 'pond');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
