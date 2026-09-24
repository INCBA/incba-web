/* ============================================
   INCBA — Opción B
   Menú en celular, tildes de la escena de pedido y eventos del píxel de Meta.
   Todo el contenido se ve sin este archivo: acá solo hay mejoras.
   ============================================ */

(() => {
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

  // --- Barra: filete inferior en cuanto la página se mueve ---
  const barra = document.getElementById('barra');
  if (barra) {
    const marcarBorde = () => barra.classList.toggle('con-borde', window.scrollY > 4);
    window.addEventListener('scroll', marcarBorde, { passive: true });
    marcarBorde();
  }

  // --- Menú en celular ---
  const botonMenu = document.querySelector('.barra-menu');
  const menu = document.getElementById('menu');

  if (botonMenu && menu) {
    const abrirMenu = (abrir) => {
      botonMenu.setAttribute('aria-expanded', String(abrir));
      menu.classList.toggle('abierto', abrir);
    };
    const estaAbierto = () => botonMenu.getAttribute('aria-expanded') === 'true';

    // Al abrir, el foco pasa al primer enlace: en el DOM el menú va antes que
    // el botón, y sin esto el siguiente Tab saltaría directo al hero.
    botonMenu.addEventListener('click', () => {
      const abrir = !estaAbierto();
      abrirMenu(abrir);
      if (abrir) menu.querySelector('a').focus({ preventScroll: true });
    });

    // Elegir una sección (o el logo) cierra el menú.
    barra.querySelectorAll('#menu a, .barra-logo').forEach((enlace) => {
      enlace.addEventListener('click', () => abrirMenu(false));
    });

    // Si el foco sale de la barra con el teclado, el menú se cierra para no
    // tapar lo que se está enfocando más abajo.
    barra.addEventListener('focusout', (e) => {
      if (estaAbierto() && e.relatedTarget && !barra.contains(e.relatedTarget)) abrirMenu(false);
    });

    // Escape cierra y devuelve el foco al botón.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && estaAbierto()) {
        abrirMenu(false);
        botonMenu.focus();
      }
    });

    // Un toque fuera de la barra también lo cierra.
    document.addEventListener('click', (e) => {
      if (estaAbierto() && !barra.contains(e.target)) abrirMenu(false);
    });

    // Si la ventana pasa a escritorio con el menú abierto, se resetea.
    // (Safari anterior a la 14 solo conoce addListener.)
    const escritorio = window.matchMedia('(min-width: 920px)');
    const alCambiar = (e) => { if (e.matches) abrirMenu(false); };
    if (escritorio.addEventListener) escritorio.addEventListener('change', alCambiar);
    else escritorio.addListener(alCambiar);
  }

  // --- Escena de pedido: los pasos se tildan la primera vez que se ve ---
  // Solo se "destildan" las escenas que todavía están fuera de la pantalla;
  // si ya se ven al cargar, quedan tildadas y no se anima nada.
  if (!sinMovimiento.matches && 'IntersectionObserver' in window) {
    const obsPedido = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.remove('espera');
        entrada.target.classList.add('anima');
        obsPedido.unobserve(entrada.target);
      });
    }, { threshold: 0.6 });

    document.querySelectorAll('.pedido').forEach((pedido) => {
      if (pedido.getBoundingClientRect().top > window.innerHeight) {
        pedido.classList.add('espera');
        obsPedido.observe(pedido);
      }
    });
  }

  // --- Eventos del píxel de Meta ---
  // El píxel se inicializa en el <head> y solo en producción. Igual que en
  // js/main.js: para marcar un CTA nuevo alcanza con data-fb-event="Lead" y,
  // si hace falta, data-fb-name="..." para distinguirlo en el administrador.
  const track = (evento, params) => {
    if (window.INCBA_PIXEL_ON && typeof window.fbq === 'function') {
      window.fbq('track', evento, params);
    }
  };

  const metodoContacto = (href) => {
    if (href.includes('wa.me')) return 'whatsapp';
    if (href.startsWith('tel:')) return 'telefono';
    if (href.startsWith('mailto:')) return 'email';
    return 'otro';
  };

  document.querySelectorAll('a[href^="mailto:"], a[href^="tel:"], a[href*="wa.me"]').forEach((enlace) => {
    enlace.addEventListener('click', () => {
      track('Contact', {
        method: metodoContacto(enlace.getAttribute('href')),
        content_name: enlace.dataset.fbName || enlace.textContent.trim().slice(0, 40),
      });
    });
  });

  document.querySelectorAll('[data-fb-event]').forEach((el) => {
    el.addEventListener('click', () => {
      track(el.dataset.fbEvent, el.dataset.fbName ? { content_name: el.dataset.fbName } : undefined);
    });
  });

  // ViewContent la primera vez que se ven los servicios. Se dispara cuando el
  // comienzo de la sección llega a la mitad de la pantalla: con un umbral del
  // 50 % (como en main.js) no saltaría nunca en celular, porque la sección es
  // mucho más alta que la pantalla.
  const servicios = document.getElementById('servicios');
  if (servicios && 'IntersectionObserver' in window) {
    const obsServicios = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        track('ViewContent', { content_name: 'servicios', content_type: 'section' });
        obsServicios.disconnect();
      });
    }, { rootMargin: '0px 0px -50% 0px' });
    obsServicios.observe(servicios);
  }
})();
