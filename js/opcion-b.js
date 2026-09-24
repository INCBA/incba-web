/* ============================================
   INCBA — Opción B
   Menú en celular, chat del hero, flujo del pedido, carruseles, formulario,
   botón flotante y eventos del píxel de Meta.
   Todo el contenido se ve sin este archivo: acá solo hay mejoras.
   ============================================ */

(() => {
  const raiz = document.documentElement;
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hayObservador = 'IntersectionObserver' in window;
  const suave = () => (sinMovimiento.matches ? 'auto' : 'smooth');
  // Safari anterior a la 14 solo conoce addListener.
  const alCambiarMedia = (media, fn) => {
    if (media.addEventListener) media.addEventListener('change', fn);
    else media.addListener(fn);
  };

  // --- Píxel de Meta ---
  // El píxel se inicializa en el <head> y solo en producción. Igual que en
  // js/main.js: para marcar un CTA nuevo alcanza con data-fb-event="..." y,
  // si hace falta, data-fb-name="..." para distinguirlo en el administrador.
  const track = (evento, params) => {
    if (window.INCBA_PIXEL_ON && typeof window.fbq === 'function') {
      window.fbq('track', evento, params);
    }
  };

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

  if (barra && botonMenu && menu) {
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

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && estaAbierto()) {
        abrirMenu(false);
        botonMenu.focus();
      }
    });

    // Tocar afuera cierra. pointerdown y no click: en iPhone, tocar texto o
    // una zona sin enlaces no genera click.
    document.addEventListener('pointerdown', (e) => {
      if (estaAbierto() && !barra.contains(e.target)) abrirMenu(false);
    });

    // Si la ventana pasa a escritorio con el menú abierto, se resetea.
    alCambiarMedia(window.matchMedia('(min-width: 1080px)'), (e) => { if (e.matches) abrirMenu(false); });
  }

  // --- Chat del hero ---
  const chat = document.querySelector('.chat');
  if (chat) {
    const cuerpo = chat.querySelector('.chat-cuerpo');
    const mensajes = [...chat.querySelectorAll('.msg')];
    let terminar = () => {};

    // La conversación se reproduce una vez. Sin JS o con movimiento reducido
    // se ve completa y scrolleada al final. Los mensajes que faltan quedan en
    // el DOM (ocultos solo a la vista).
    if (!sinMovimiento.matches) {
      const escribiendo = chat.querySelector('.chat-escribiendo');
      const estado = chat.querySelector('.chat-estado');
      const estadoEnLinea = estado ? estado.textContent : '';
      let siguiente = 1;
      let reloj = null;
      let terminado = false;
      let bajando = false;
      let relojBajada = null;

      // En column-reverse el "final" es scrollTop 0: pedir scrollHeight lo lleva ahí.
      const alFinal = () => {
        bajando = true;
        clearTimeout(relojBajada);
        relojBajada = setTimeout(() => { bajando = false; }, 700);
        cuerpo.scrollTo({ top: cuerpo.scrollHeight, behavior: suave() });
      };
      const dejarDeEscribir = () => {
        escribiendo.hidden = true;
        if (estado) estado.textContent = estadoEnLinea;
      };
      const mostrar = (msg) => {
        msg.classList.remove('msg-pendiente');
        msg.classList.add('msg-nuevo');
        alFinal();
      };
      terminar = () => {
        if (terminado) return;
        terminado = true;
        clearTimeout(reloj);
        dejarDeEscribir();
        mensajes.forEach((msg) => msg.classList.remove('msg-pendiente'));
        cuerpo.scrollTop = cuerpo.scrollHeight;
      };
      const avanzar = () => {
        if (siguiente >= mensajes.length) { terminado = true; return; }
        const msg = mensajes[siguiente];
        const largo = msg.textContent.length;
        const listo = () => { mostrar(msg); siguiente += 1; avanzar(); };

        if (msg.classList.contains('msg-entra')) {
          // INCBA escribe: puntitos en la conversación y "escribiendo…" arriba.
          reloj = setTimeout(() => {
            escribiendo.hidden = false;
            if (estado) estado.textContent = 'escribiendo…';
            alFinal();
            reloj = setTimeout(() => { dejarDeEscribir(); listo(); }, Math.min(1600, 700 + largo * 4));
          }, 350);
        } else {
          reloj = setTimeout(listo, Math.min(1100, 500 + largo * 3));
        }
      };
      const preparar = () => mensajes.forEach((msg, i) => { if (i > 0) msg.classList.add('msg-pendiente'); });
      const empezar = () => { if (!terminado) reloj = setTimeout(avanzar, 500); };

      // Solo corta la reproducción subir por el chat para leer desde el
      // principio (o usar el teclado en él). Un toque de paso, con el que se
      // sigue bajando por la página, no la corta.
      cuerpo.addEventListener('scroll', () => {
        if (!bajando && cuerpo.scrollTop < -8) terminar();
      }, { passive: true });
      cuerpo.addEventListener('keydown', terminar);

      const caja = chat.getBoundingClientRect();
      if (caja.top < window.innerHeight * 0.8 && caja.bottom > 0) {
        preparar();
        empezar();
      } else if (hayObservador) {
        // Fuera de la pantalla al cargar: arranca cuando el chat se ve.
        preparar();
        const obsChat = new IntersectionObserver((entradas) => {
          if (!entradas[0].isIntersecting) return;
          obsChat.disconnect();
          empezar();
        }, { threshold: 0.35 });
        obsChat.observe(chat);
      }
    }
    // El <head> ocultó los mensajes antes del primer pintado; desde acá manda
    // msg-pendiente.
    raiz.classList.remove('chat-previo');

    // En teléfonos el chat no se desplaza por dentro (atrapaba el scroll de
    // la página): muestra los últimos mensajes y un botón lo despliega entero.
    const verTodo = document.getElementById('chat-ver-todo');
    if (verTodo) {
      const telefono = window.matchMedia('(pointer: coarse) and (max-width: 599px), (pointer: coarse) and (max-height: 500px)');
      const modoTelefono = () => {
        chat.classList.toggle('chat-telefono', telefono.matches);
        verTodo.hidden = !telefono.matches || chat.classList.contains('chat-completo');
      };
      verTodo.addEventListener('click', () => {
        terminar();
        chat.classList.add('chat-completo');
        verTodo.hidden = true;
        cuerpo.focus({ preventScroll: true });
      });
      modoTelefono();
      alCambiarMedia(telefono, modoTelefono);
    }
  }

  // --- Flujo del pedido: los pasos se activan la primera vez que se ve ---
  // Solo se "apagan" los flujos que todavía están fuera de la pantalla; si ya
  // se ven al cargar, quedan activos y no se anima nada.
  if (!sinMovimiento.matches && hayObservador) {
    const obsFlujo = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.remove('espera');
        entrada.target.classList.add('anima');
        obsFlujo.unobserve(entrada.target);
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.flujo').forEach((flujo) => {
      if (flujo.getBoundingClientRect().top > window.innerHeight) {
        flujo.classList.add('espera');
        obsFlujo.observe(flujo);
      }
    });
  }

  // --- Carruseles ---
  // La pista es un scroll horizontal con snap (el deslizamiento táctil es
  // nativo). Acá se suman botones, puntos, flechas del teclado y el avance
  // solo: se pausa con el mouse, el foco o un toque, se apaga en cuanto la
  // persona navega a mano y el botón de pausa lo apaga o lo vuelve a encender.
  document.querySelectorAll('.carrusel').forEach((carrusel) => {
    const pista = carrusel.querySelector('.carrusel-pista');
    const diapos = [...pista.querySelectorAll('.diapo')];
    const puntos = [...carrusel.querySelectorAll('.carrusel-punto')];
    const botonPausa = carrusel.querySelector('.carrusel-pausa');
    const total = diapos.length;
    const puedeAvanzar = hayObservador && !sinMovimiento.matches;
    const pausas = new Set();
    let avanceSolo = puedeAvanzar;
    let actual = 0;
    let visible = false;
    let reloj = null;
    let moviendo = false; // la pista se desplaza por ir(), no por la persona

    const marcar = (n) => {
      actual = n;
      diapos.forEach((diapo, i) => {
        if (i === n) diapo.removeAttribute('aria-hidden');
        else diapo.setAttribute('aria-hidden', 'true');
      });
      puntos.forEach((punto, i) => punto.setAttribute('aria-current', i === n ? 'true' : 'false'));
    };
    // Un paso de a una diapositiva se desliza; un salto (del 5 al 1, o a un
    // punto lejano) es instantáneo, sin barrer toda la pista.
    const ir = (n) => {
      const destino = ((n % total) + total) % total;
      if (destino === actual) return;
      const salto = Math.abs(destino - actual) > 1;
      moviendo = true;
      pista.scrollTo({ left: destino * pista.clientWidth, behavior: salto ? 'auto' : suave() });
      marcar(destino);
    };
    const programar = () => {
      clearTimeout(reloj);
      if (!avanceSolo || pausas.size || !visible) return;
      reloj = setTimeout(() => { ir(actual + 1); programar(); }, 6000);
    };
    // Mientras avanza solo, los cambios no se anuncian (aria-live="off");
    // quieto, sí. Es el patrón de carrusel de las guías de ARIA.
    const fijarAvance = (activo) => {
      avanceSolo = activo;
      pista.setAttribute('aria-live', activo ? 'off' : 'polite');
      if (botonPausa) {
        botonPausa.classList.toggle('en-pausa', !activo);
        botonPausa.setAttribute('aria-label', activo ? 'Pausar el avance automático' : 'Reanudar el avance automático');
      }
      programar();
    };
    const aMano = () => {
      if (avanceSolo) fijarAvance(false);
      else pista.setAttribute('aria-live', 'polite');
    };
    const pausar = (motivo) => { pausas.add(motivo); clearTimeout(reloj); };
    const seguir = (motivo) => { pausas.delete(motivo); programar(); };

    if (botonPausa && puedeAvanzar) {
      botonPausa.hidden = false;
      botonPausa.addEventListener('click', () => {
        // Reanudar es un pedido explícito: arranca aunque el mouse o el foco
        // sigan sobre el carrusel.
        if (!avanceSolo) { pausas.delete('mouse'); pausas.delete('foco'); }
        fijarAvance(!avanceSolo);
      });
    }
    carrusel.querySelectorAll('.carrusel-flecha').forEach((flecha) => {
      flecha.addEventListener('click', () => { aMano(); ir(actual + Number(flecha.dataset.paso)); });
    });
    puntos.forEach((punto, i) => {
      punto.addEventListener('click', () => { aMano(); ir(i); });
    });
    carrusel.addEventListener('keydown', (e) => {
      const paso = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!paso) return;
      e.preventDefault();
      aMano();
      ir(actual + paso);
    });

    // Tocar la pista solo pausa (puede ser el dedo que sigue bajando por la
    // página); navegar a mano es deslizar hasta otra diapositiva.
    pista.addEventListener('pointerdown', () => pausar('toque'), { passive: true });
    ['pointerup', 'pointercancel'].forEach((tipo) => {
      pista.addEventListener(tipo, () => seguir('toque'), { passive: true });
    });

    // Cuando la pista se detiene, la diapositiva a la vista pasa a ser la actual.
    let quieto = null;
    pista.addEventListener('scroll', () => {
      clearTimeout(quieto);
      quieto = setTimeout(() => {
        const n = Math.round(pista.scrollLeft / pista.clientWidth);
        if (n !== actual && n >= 0 && n < total) {
          if (!moviendo) aMano();
          marcar(n);
        }
        moviendo = false;
      }, 90);
    }, { passive: true });

    carrusel.addEventListener('mouseenter', () => pausar('mouse'));
    carrusel.addEventListener('mouseleave', () => seguir('mouse'));
    carrusel.addEventListener('focusin', () => pausar('foco'));
    carrusel.addEventListener('focusout', (e) => {
      if (!carrusel.contains(e.relatedTarget)) seguir('foco');
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pausar('pestaña');
      else seguir('pestaña');
    });

    marcar(0);

    // Solo avanza mientras se ve.
    if (puedeAvanzar) {
      new IntersectionObserver((entradas) => {
        visible = entradas[0].isIntersecting;
        if (visible) programar();
        else clearTimeout(reloj);
      }, { threshold: 0.6 }).observe(carrusel);
    }
  });

  // --- Formulario: arma el mensaje y abre WhatsApp ---
  const formulario = document.getElementById('contacto-form');
  if (formulario) {
    // Con JS la validación es propia (mensajes junto a cada campo).
    formulario.noValidate = true;
    const campoNombre = document.getElementById('contacto-nombre');
    const campoNecesidad = document.getElementById('contacto-necesidad');
    const campoLugar = document.getElementById('contacto-lugar');
    const errores = new Map([
      [campoNombre, 'Escribe tu nombre.'],
      [campoNecesidad, 'Cuéntanos qué necesitas.'],
    ]);

    // Sin espacios de más ni signos en las puntas: la frase pone su propio punto
    // ("¿Me ayudan con la web?" no termina en "?.").
    const limpiar = (valor) => valor.trim().replace(/\s+/g, ' ')
      .replace(/^[¿¡\s]+/, '')
      .replace(/[\s.,;:!?¡¿…]+$/, '');
    // Va después de "Necesito": "Quiero una tienda" pasa a "quiero una tienda".
    // Solo si la primera palabra es mayúscula y el resto minúsculas, para no
    // tocar siglas ni marcas ("ERP", "WhatsApp").
    const enFrase = (texto) => (/^\p{Lu}\p{Ll}*(\s|$)/u.test(texto) ? texto[0].toLocaleLowerCase('es') + texto.slice(1) : texto);

    const marcarError = (campo, mensaje) => {
      const error = document.getElementById(`${campo.id}-error`);
      error.textContent = mensaje;
      error.hidden = !mensaje;
      if (mensaje) {
        campo.setAttribute('aria-invalid', 'true');
        campo.setAttribute('aria-describedby', error.id);
      } else {
        campo.removeAttribute('aria-invalid');
        campo.removeAttribute('aria-describedby');
      }
    };

    errores.forEach((mensaje, campo) => {
      campo.addEventListener('input', () => {
        if (campo.getAttribute('aria-invalid') === 'true' && limpiar(campo.value)) marcarError(campo, '');
      });
    });

    // Enter (o "Siguiente" en el teclado del celular) en el nombre pasa al
    // campo siguiente en lugar de enviar el formulario a medio completar.
    campoNombre.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        campoNecesidad.focus();
      }
    });

    formulario.addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = limpiar(campoNombre.value);
      const necesidad = enFrase(limpiar(campoNecesidad.value));
      const lugar = limpiar(campoLugar.value);

      let primeroConError = null;
      errores.forEach((mensaje, campo) => {
        const vacio = !limpiar(campo.value);
        marcarError(campo, vacio ? mensaje : '');
        if (vacio && !primeroConError) primeroConError = campo;
      });
      if (primeroConError) {
        primeroConError.focus();
        return;
      }

      let texto = `Hola, soy ${nombre}. Necesito ${necesidad}.`;
      if (lugar) texto += ` Estoy en ${lugar}.`;
      const url = `https://wa.me/5493517422702?text=${encodeURIComponent(texto)}`;

      track('Contact', { method: 'whatsapp_formulario', content_name: 'contacto-formulario' });
      // Algunos navegadores internos (el de Instagram o Facebook) no abren
      // ventanas nuevas: si no se abrió nada, se va a WhatsApp en esta misma.
      const ventana = window.open(url, '_blank');
      if (ventana) ventana.opener = null;
      else window.location.href = url;
    });
  }

  // --- Botón flotante ---
  const flotante = document.getElementById('flotante');
  if (flotante) {
    const botonFlotante = document.getElementById('flotante-boton');
    const menuFlotante = document.getElementById('flotante-menu');
    const opciones = [...menuFlotante.querySelectorAll('a')];
    const flotanteAbierto = () => botonFlotante.getAttribute('aria-expanded') === 'true';
    const abrirFlotante = (abrir, devolverFoco = false) => {
      botonFlotante.setAttribute('aria-expanded', String(abrir));
      menuFlotante.hidden = !abrir;
      if (abrir) opciones[0].focus();
      else if (devolverFoco) botonFlotante.focus();
    };

    botonFlotante.addEventListener('click', () => abrirFlotante(!flotanteAbierto()));
    opciones.forEach((opcion) => {
      opcion.addEventListener('click', () => abrirFlotante(false, true));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && flotanteAbierto()) abrirFlotante(false, true);
    });
    // Tocar afuera cierra (pointerdown, por lo mismo que en el menú).
    document.addEventListener('pointerdown', (e) => {
      if (flotanteAbierto() && !flotante.contains(e.target)) abrirFlotante(false);
    });
    flotante.addEventListener('focusout', (e) => {
      if (flotanteAbierto() && e.relatedTarget && !flotante.contains(e.relatedTarget)) abrirFlotante(false);
    });
    // El flotante es lo último de la página: un Tab desde la última opción
    // saca el foco del documento (relatedTarget null) y el menú quedaba abierto.
    opciones[opciones.length - 1].addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.shiftKey) abrirFlotante(false);
    });

    // Arranca oculto y se muestra recién después del hero; vuelve a ocultarse
    // en las modalidades del diagnóstico y en Contacto. Esas zonas ya tienen
    // las mismas opciones, y así no tapa sus botones en ningún celular.
    const zonas = [
      document.getElementById('inicio'),
      document.querySelector('.modalidades'),
      document.getElementById('contacto'),
    ].filter(Boolean);
    if (zonas.length && hayObservador) {
      const aLaVista = new Set();
      const obsZonas = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) aLaVista.add(entrada.target);
          else aLaVista.delete(entrada.target);
        });
        const ocultar = aLaVista.size > 0;
        if (ocultar && flotanteAbierto()) abrirFlotante(false);
        flotante.classList.toggle('oculto', ocultar);
      }, { rootMargin: '0px 0px -20% 0px' });
      zonas.forEach((zona) => obsZonas.observe(zona));
    } else {
      flotante.classList.remove('oculto');
    }
  }

  // --- Eventos del píxel ---
  // WhatsApp, teléfono y correo: "Contact" con el método. La agenda online
  // (Calendly) lleva data-fb-event="Schedule" en el HTML.
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
  if (servicios && hayObservador) {
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
