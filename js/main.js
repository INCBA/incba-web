/* ============================================
   INCBA — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Navigation scroll behavior ---
  const nav = document.querySelector('.nav');
  const handleScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // --- Mobile menu toggle ---
  const toggle = document.querySelector('.nav-mobile-toggle');
  const links = document.querySelector('.nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('active');
      const spans = toggle.querySelectorAll('span');
      if (links.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });

    // Close menu on link click
    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('active');
        const spans = toggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      });
    });
  }

  // --- Scroll-triggered animations ---
  const fadeEls = document.querySelectorAll('.fade-up');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach(el => observer.observe(el));
  } else {
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const offset = nav.offsetHeight + 20;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // --- Counter animation for metrics ---
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => counterObserver.observe(el));
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1500;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  // --- Decoder: pause animations until in view ---
  const decoder = document.getElementById('decoder');
  if (decoder && 'IntersectionObserver' in window) {
    decoder.style.setProperty('--play', 'paused');
    const decoderObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          decoder.classList.add('decoder-active');
          decoderObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    decoderObs.observe(decoder);
  }

  // --- Meta pixel conversion events ---
  // El píxel se inicializa en el <head> y solo en producción. Para las landings
  // nuevas alcanza con marcar el CTA: data-fb-event="Lead" y, si hace falta,
  // data-fb-name="diagnostico" para distinguirlo en el administrador de eventos.
  const track = (event, params) => {
    if (window.INCBA_PIXEL_ON && typeof window.fbq === 'function') {
      window.fbq('track', event, params);
    }
  };

  const contactMethod = (href) => {
    if (href.includes('wa.me')) return 'whatsapp';
    if (href.startsWith('tel:')) return 'telefono';
    if (href.startsWith('mailto:')) return 'email';
    return 'otro';
  };

  document.querySelectorAll('a[href^="mailto:"], a[href^="tel:"], a[href*="wa.me"]').forEach(link => {
    link.addEventListener('click', () => {
      track('Contact', {
        method: contactMethod(link.getAttribute('href')),
        content_name: link.dataset.fbName || link.textContent.trim().slice(0, 40),
      });
    });
  });

  document.querySelectorAll('[data-fb-event]').forEach(el => {
    el.addEventListener('click', () => {
      track(el.dataset.fbEvent, el.dataset.fbName ? { content_name: el.dataset.fbName } : undefined);
    });
  });

  // Mirar los servicios es la señal más temprana de interés: sirve para armar
  // públicos y, más adelante, para comparar landings por servicio.
  const servicios = document.getElementById('servicios');
  if (servicios && 'IntersectionObserver' in window) {
    const serviciosObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          track('ViewContent', { content_name: 'servicios', content_type: 'section' });
          serviciosObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    serviciosObs.observe(servicios);
  }

});
