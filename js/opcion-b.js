/* ============================================
   INCBA — Opción B
   Menú en celular, chat del hero, historia de Pichón, flujo del pedido,
   esquema del CRM, carruseles, botón flotante y eventos del píxel de Meta.
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

  // --- Listas de mensajes que crecen hacia arriba ---
  // Al sumar un mensaje, lo de arriba sube de golpe lo que mide el nuevo: se
  // compensa con un transform y se lo deja volver a cero, así el chat se
  // desplaza suave (técnica FLIP: solo transform, sin tocar el scroll).
  const deslizar = (lista, cambio) => {
    const antes = lista.offsetHeight;
    cambio();
    const delta = lista.offsetHeight - antes;
    if (!delta || sinMovimiento.matches) return;
    lista.style.transition = 'none';
    lista.style.transform = `translateY(${delta}px)`;
    lista.getBoundingClientRect(); // fija el punto de partida
    lista.style.transition = 'transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1)';
    lista.style.transform = '';
  };

  // Salto sin animación (el scroll suave recorrería toda la historia).
  const irA = (el) => {
    try { el.scrollIntoView({ block: 'start', behavior: 'instant' }); } catch (e) { el.scrollIntoView(true); }
  };

  // --- Chat del hero (la pantalla del primer capítulo) ---
  let terminarChat = () => {};
  let modoChat = () => {};
  let acelerarChat = () => {};
  let capituloUno = true; // lo actualiza la historia
  const chat = document.getElementById('chat-hero');
  if (chat) {
    const pantallaChat = chat.closest('.pantalla-h');
    const cuerpo = chat.querySelector('.chat-cuerpo');
    const hilo = chat.querySelector('.chat-hilo');
    const mensajes = [...chat.querySelectorAll('.msg')];
    const escribiendo = chat.querySelector('.chat-escribiendo');
    const pie = chat.querySelector('.chat-pie');
    const estado = chat.querySelector('.chat-estado');
    const estadoEnLinea = estado ? estado.textContent : '';
    const hora = pantallaChat.querySelector('.ph-hora');
    const ponerHora = (msg) => {
      const t = msg.querySelector('time');
      if (hora && t) hora.textContent = t.textContent;
    };

    // La conversación se reproduce una vez. Antes de cada mensaje, quien lo
    // manda escribe (Felipe: puntitos y "escribiendo…"; Vero, que es la dueña
    // del teléfono: el campo de abajo), según el largo del mensaje. Pausa
    // corta entre mensajes del mismo autor y más larga cuando cambia. Sin JS
    // o con movimiento reducido se ve completa; los mensajes que faltan
    // quedan en el DOM, plegados solo a la vista.
    if (!sinMovimiento.matches && hayObservador) {
      let siguiente = 1;
      let reloj = null;
      let terminado = false;
      // Con el teléfono ya en el centro (empezó la historia) va al doble de rápido.
      let ritmo = 1;
      acelerarChat = (rapido) => { ritmo = rapido ? 0.5 : 1; };
      const deFelipe = (msg) => msg.classList.contains('msg-entra');
      const tecleo = (msg) => Math.min(1900, Math.max(650, 380 + msg.textContent.length * 14)) * ritmo;

      const teclear = (msg, ms) => {
        if (deFelipe(msg)) {
          deslizar(hilo, () => { escribiendo.hidden = false; });
          if (estado) estado.textContent = 'escribiendo…';
        } else {
          pie.style.setProperty('--tecleo', `${ms}ms`);
          pie.classList.add('tecleando');
        }
      };
      const dejarDeTeclear = () => {
        pie.classList.remove('tecleando');
        if (estado) estado.textContent = estadoEnLinea;
      };
      const mostrar = (msg) => {
        dejarDeTeclear();
        deslizar(hilo, () => {
          escribiendo.hidden = true;
          msg.classList.remove('pend');
          msg.classList.add('nuevo');
        });
        ponerHora(msg);
        modoChat();
      };
      terminarChat = () => {
        if (terminado) return;
        terminado = true;
        clearTimeout(reloj);
        escribiendo.hidden = true;
        dejarDeTeclear();
        mensajes.forEach((msg) => msg.classList.remove('pend'));
        hilo.style.transform = '';
        ponerHora(mensajes[mensajes.length - 1]);
        cuerpo.scrollTop = cuerpo.scrollHeight; // en column-reverse, el final
        modoChat();
      };
      const avanzar = () => {
        if (siguiente >= mensajes.length) { terminado = true; return; }
        const msg = mensajes[siguiente];
        const mismoAutor = deFelipe(msg) === deFelipe(mensajes[siguiente - 1]);
        const ms = tecleo(msg);
        reloj = setTimeout(() => {
          teclear(msg, ms);
          reloj = setTimeout(() => { mostrar(msg); siguiente += 1; avanzar(); }, ms);
        }, (mismoAutor ? 280 : 850) * ritmo);
      };
      const empezar = () => { if (!terminado) reloj = setTimeout(avanzar, 600); };

      mensajes.forEach((msg, i) => { if (i > 0) msg.classList.add('pend'); });
      ponerHora(mensajes[0]);

      // Subir por el chat para leer desde el principio (o usar el teclado en
      // él) corta la reproducción y muestra todo.
      cuerpo.addEventListener('scroll', () => { if (cuerpo.scrollTop < -8) terminarChat(); }, { passive: true });
      cuerpo.addEventListener('keydown', terminarChat);

      const caja = chat.getBoundingClientRect();
      if (caja.top < window.innerHeight * 0.8 && caja.bottom > 0) {
        empezar();
      } else {
        // Fuera de la pantalla al cargar: arranca cuando el chat se ve.
        const obsChat = new IntersectionObserver((entradas) => {
          if (!entradas[0].isIntersecting) return;
          obsChat.disconnect();
          empezar();
        }, { threshold: 0.35 });
        obsChat.observe(chat);
      }
    }
    // El <head> ocultó los mensajes antes del primer pintado; desde acá manda .pend.
    raiz.classList.remove('chat-previo');

    // Con el dedo el chat no se desplaza por dentro (atrapaba el scroll de la
    // página). En teléfonos, fuera de la historia fija, muestra los últimos
    // mensajes y un botón lo despliega entero; con el teléfono fijo, mientras
    // se lee el primer capítulo, el mismo botón deja subir por el chat.
    const verTodo = document.getElementById('chat-ver-todo');
    if (verTodo) {
      const telefono = window.matchMedia('(pointer: coarse) and (max-width: 599px), (pointer: coarse) and (max-height: 500px)');
      const tactil = window.matchMedia('(pointer: coarse)');
      modoChat = () => {
        const viva = raiz.classList.contains('historia-viva');
        const plegado = telefono.matches && !viva;
        // Cada modo tiene su forma de "abierto": no se arrastra al otro.
        pantallaChat.classList.remove(viva ? 'chat-completo' : 'chat-libre');
        chat.classList.toggle('chat-telefono', plegado);
        const abierto = pantallaChat.classList.contains('chat-completo') || pantallaChat.classList.contains('chat-libre');
        // En la historia, recién cuando hay mensajes que ya no se ven.
        const tapados = cuerpo.scrollHeight - cuerpo.clientHeight > 24;
        verTodo.hidden = abierto || !(plegado || (viva && tactil.matches && capituloUno && tapados));
      };
      verTodo.addEventListener('click', () => {
        terminarChat();
        verTodo.hidden = true;
        if (raiz.classList.contains('historia-viva')) {
          pantallaChat.classList.add('chat-libre');
          // En column-reverse el principio está arriba del todo (scrollTop negativo).
          cuerpo.scrollTo({ top: -cuerpo.scrollHeight, behavior: suave() });
        } else {
          pantallaChat.classList.add('chat-completo');
        }
        cuerpo.focus({ preventScroll: true });
      });
      modoChat();
      alCambiarMedia(telefono, modoChat);
      alCambiarMedia(tactil, modoChat);
    }
  }

  // --- Historia de Pichón ---
  // Con .historia-viva el teléfono queda fijo y el scroll (nativo, sin
  // secuestrar nada) elige el capítulo. Un solo manejador de scroll con
  // requestAnimationFrame escribe --p (el viaje del hero al centro) en el
  // hero, el marco y las pantallas, y marca la pantalla activa; las
  // posiciones se miden al cargar y al cambiar de tamaño.
  const relato = document.querySelector('.relato');
  if (relato) {
    const caps = [...relato.querySelectorAll('.cap')];
    const claves = caps.map((cap) => cap.dataset.clave);
    const pantallas = claves.map((clave) => relato.querySelector(`.pantalla-h[data-clave="${clave}"]`));
    const tarjetas = caps.map((cap) => cap.querySelector('.cap-tarjeta'));
    const pasos = [...relato.querySelectorAll('.hist-pasos li')];
    const clavesPasos = pasos.map((li) => li.dataset.paso);
    const saltar = relato.querySelector('.historia-saltar');
    const destino = document.getElementById('verificacion');
    const escritorio = window.matchMedia('(min-width: 900px)');
    // La misma consulta que en el <head>.
    const altoSuficiente = window.matchMedia('(min-width: 900px) and (min-height: 520px), (max-width: 899px) and (min-height: 600px)');
    const conP = [relato.querySelector('.hero'), relato.querySelector('.telefono'), ...pantallas].filter(Boolean);
    const ajustables = pantallas.filter((p) => !p.classList.contains('ph-chat'));
    const secuencias = new Map();
    let viva = false;
    let activo = -1;
    let m = null;
    let pedido = false;
    let pedidoMedida = false;
    let ultimaP = '';
    let ultimoTamano = '';

    // Escenas con mensajes o bloques que llegan de a uno (.sec): se disparan
    // al llegar al capítulo y, si la persona sigue de largo, se completan.
    // Lo plegado por falta de alto (ver ajustar) se destapa sin esperar turno.
    const plegado = (item, pantalla) => {
      const opcional = item.closest('[data-opcional]');
      return !!opcional && Number(opcional.dataset.opcional) <= Number(pantalla.dataset.ajuste || 0);
    };
    const reproducir = (pantalla) => {
      const items = [...pantalla.querySelectorAll('.sec.pend, .sec.espera')];
      if (!items.length) return;
      const s = { reloj: null };
      secuencias.set(pantalla, s);
      let k = 0;
      const revelar = (item) => {
        const mostrar = () => { item.classList.remove('pend', 'espera'); item.classList.add('nuevo'); };
        const lista = item.closest('.ph-feed-lista');
        if (lista && item.classList.contains('pend')) deslizar(lista, mostrar);
        else mostrar();
      };
      const paso = () => {
        while (k < items.length && plegado(items[k], pantalla)) {
          items[k].classList.remove('pend', 'espera');
          k += 1;
        }
        if (k >= items.length) { secuencias.delete(pantalla); return; }
        const item = items[k];
        k += 1;
        s.reloj = setTimeout(() => { revelar(item); paso(); }, Number(item.dataset.espera) || 500);
      };
      paso();
    };
    const completar = (pantalla) => {
      const s = secuencias.get(pantalla);
      if (s) { clearTimeout(s.reloj); secuencias.delete(pantalla); }
      pantalla.querySelectorAll('.sec.pend, .sec.espera').forEach((item) => item.classList.remove('pend', 'espera'));
    };

    // Ajuste al alto del teléfono. Cada escena se mide en su estado final
    // (.midiendo); si no entra, se achica (--k) hasta K_MIN y, si con eso no
    // alcanza, se pliega lo marcado con data-opcional, un nivel por vez.
    // Con la escala el interior se arma más ancho y el texto ocupa menos
    // renglones, así que la primera medida ya deja la escena adentro.
    const K_MIN = 0.86;
    const K_PISO = 0.7;
    const niveles = new Map(ajustables.map((p) => [p, Math.max(0, ...[...p.querySelectorAll('[data-opcional]')].map((e) => Number(e.dataset.opcional)))]));
    const escalar = (pantalla, k) => {
      const achica = k < 0.995;
      pantalla.classList.toggle('escalada', achica);
      if (achica) pantalla.style.setProperty('--k', k.toFixed(3));
      else pantalla.style.removeProperty('--k');
    };
    const ajustar = (pantalla) => {
      const interior = pantalla.querySelector('.ph-interior');
      const tope = niveles.get(pantalla);
      let k = 1;
      pantalla.classList.add('midiendo');
      for (let n = 0; n <= tope; n += 1) {
        if (n) pantalla.dataset.ajuste = String(n);
        else delete pantalla.dataset.ajuste;
        escalar(pantalla, 1);
        k = 1;
        for (let vuelta = 0; vuelta < 3; vuelta += 1) {
          const cabe = interior.clientHeight / Math.max(1, interior.scrollHeight);
          if (cabe >= 0.995) break;
          k *= cabe;
          escalar(pantalla, k);
        }
        // Esa primera escala suele sobrar un poco: se busca la más grande
        // que todavía entra.
        if (k < 0.995) {
          let alto = 1;
          for (let vuelta = 0; vuelta < 4 && alto - k > 0.01; vuelta += 1) {
            const medio = (k + alto) / 2;
            escalar(pantalla, medio);
            if (interior.scrollHeight <= interior.clientHeight + 1) k = medio;
            else alto = medio;
          }
          escalar(pantalla, k);
        }
        if (k >= K_MIN) break;
      }
      escalar(pantalla, Math.max(k, K_PISO));
      pantalla.classList.remove('midiendo');
    };
    const desajustar = (pantalla) => {
      escalar(pantalla, 1);
      delete pantalla.dataset.ajuste;
    };

    const cambiar = (i) => {
      if (i === activo) return;
      pantallas.forEach((p, j) => { if (j !== activo) p.classList.remove('saliente'); });
      const antes = pantallas[activo];
      if (antes) {
        antes.classList.remove('activa');
        antes.classList.add('saliente');
        completar(antes);
      }
      const ahora = pantallas[i];
      ahora.classList.remove('saliente');
      ahora.classList.add('activa');
      if (!ahora.classList.contains('anima')) {
        ahora.classList.add('anima');
        reproducir(ahora);
      }
      caps.forEach((cap, j) => cap.classList.toggle('activo', j === i));
      activo = i;
      // Si el chat todavía no terminó al pasar al segundo capítulo, se completa.
      if (i > 0) terminarChat();
      capituloUno = i === 0;
      modoChat();
      const k = clavesPasos.indexOf(claves[i]);
      pasos.forEach((li, j) => {
        li.classList.toggle('hecho', k >= 0 && j < k);
        li.classList.toggle('actual', j === k);
      });
    };

    const medir = (forzar) => {
      const y = window.scrollY;
      m = {
        alto: window.innerHeight,
        esc: escritorio.matches,
        // Dónde empieza cada capítulo (en celular, el primero tiene arriba el
        // hueco del teléfono).
        inicios: caps.map((cap) => cap.getBoundingClientRect().top + y + (parseFloat(getComputedStyle(cap).paddingTop) || 0)),
        primero: caps[0].getBoundingClientRect().top + y,
        fin: caps[caps.length - 1].getBoundingClientRect().bottom + y,
        topeTel: parseFloat(getComputedStyle(pantallas[0]).top) || 0,
      };
      // El teléfono empieza a soltarse cuando su borde de abajo llega al final
      // del último capítulo.
      m.soltar = m.fin - m.topeTel - pantallas[0].offsetHeight - 1;
      // Línea de lectura: un capítulo manda cuando su texto llega cerca de su lugar.
      m.linea = (parseFloat(getComputedStyle(tarjetas[0]).top) || 0) + (m.esc ? Math.min(m.alto * 0.14, 110) : 40);
      // El ajuste de las escenas cambia con el tamaño del teléfono o con las
      // fuentes, no con las barras del navegador del celular que van y vienen.
      const tamano = `${pantallas[1].offsetWidth}x${pantallas[1].offsetHeight}`;
      if (forzar || tamano !== ultimoTamano) {
        ultimoTamano = tamano;
        ajustables.forEach(ajustar);
      }
    };

    const actualizar = () => {
      pedido = false;
      if (!viva || !m) return;
      const y = window.scrollY;
      let p;
      let fija;
      if (m.esc) {
        const recorrido = m.alto * 0.55;
        p = y / recorrido;
        fija = y > recorrido * 0.3;
      } else {
        // En celular el teléfono sube desde abajo hasta quedar fijo.
        const arriba = m.primero - y;
        p = 1 - (arriba - m.topeTel) / Math.max(1, m.alto - m.topeTel);
        fija = arriba <= m.topeTel + 2;
      }
      p = Math.min(1, Math.max(0, p));
      const texto = p.toFixed(4);
      if (texto !== ultimaP) {
        ultimaP = texto;
        conP.forEach((el) => el.style.setProperty('--p', texto));
      }
      // "Saltar la historia" se va en cuanto el teléfono empieza a soltarse.
      fija = fija && y < m.soltar;
      acelerarChat(p >= 1);

      let i = 0;
      m.inicios.forEach((inicio, j) => { if (inicio <= y + m.linea) i = j; });
      cambiar(i);

      raiz.classList.toggle('hist-fija', fija);
      raiz.classList.toggle('hist-inicio', m.esc ? i === 0 && p < 0.4 : !fija && p < 0.5);
      raiz.classList.toggle('hist-con-pasos', fija && clavesPasos.includes(claves[i]));
      raiz.classList.toggle('hero-ido', m.esc && p > 0.95);
    };

    const pedir = () => {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(actualizar);
    };
    let forzarMedida = false;
    const remedir = (forzar) => {
      if (forzar === true) forzarMedida = true;
      if (pedidoMedida) return;
      pedidoMedida = true;
      requestAnimationFrame(() => {
        pedidoMedida = false;
        const todo = forzarMedida;
        forzarMedida = false;
        if (!viva) return;
        medir(todo);
        actualizar();
      });
    };
    const remedirTodo = () => remedir(true);

    const encender = () => {
      viva = true;
      raiz.classList.add('historia-viva');
      pantallas.forEach((p) => {
        p.classList.remove('activa', 'saliente');
        if (p.classList.contains('anima')) return;
        p.querySelectorAll('.sec').forEach((item) => item.classList.add(item.classList.contains('sec-fijo') ? 'espera' : 'pend'));
      });
      activo = -1;
      medir(true);
      actualizar();
    };
    const apagar = () => {
      viva = false;
      raiz.classList.remove('historia-viva', 'hist-fija', 'hist-inicio', 'hist-con-pasos', 'hero-ido');
      caps.forEach((cap) => cap.classList.remove('activo'));
      pantallas.forEach(completar);
      ajustables.forEach(desajustar);
      conP.forEach((el) => el.style.removeProperty('--p'));
      ultimaP = '';
      ultimoTamano = '';
      acelerarChat(false);
    };
    const elegirModo = () => {
      const puede = hayObservador && !sinMovimiento.matches && altoSuficiente.matches;
      if (puede && !viva) encender();
      else if (!puede) apagar();
      modoChat();
    };

    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', remedir);
    window.addEventListener('load', remedirTodo);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remedirTodo);
    if ('ResizeObserver' in window) new ResizeObserver(remedirTodo).observe(relato);
    elegirModo();
    alCambiarMedia(altoSuficiente, elegirModo);
    alCambiarMedia(sinMovimiento, elegirModo);

    // Con el teclado, si el foco entra en una pantalla que no está a la
    // vista (el botón del cierre), la página va a su capítulo.
    relato.addEventListener('focusin', (e) => {
      if (!viva) return;
      const pantalla = e.target.closest('.pantalla-h');
      if (!pantalla || pantalla.classList.contains('activa')) return;
      irA(caps[pantallas.indexOf(pantalla)]);
    });

    // "Saltar la historia": salto directo a la banda de Meta, con el foco.
    if (saltar && destino) {
      saltar.addEventListener('click', (e) => {
        e.preventDefault();
        irA(destino);
        destino.focus({ preventScroll: true });
      });
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

  // --- Esquema del CRM: se anima la primera vez que se ve ---
  // La animación (dos pasadas, menos de cinco segundos) está en el CSS; acá
  // solo se decide cuándo empieza: cuando el esquema se ve casi entero.
  if (!sinMovimiento.matches && hayObservador) {
    const obsEsquema = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('anima');
        obsEsquema.unobserve(entrada.target);
      });
    }, { threshold: 0.7 });
    document.querySelectorAll('.esquema').forEach((esquema) => obsEsquema.observe(esquema));
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

    // Arranca oculto y se muestra recién después del hero y la historia de
    // Pichón (el cierre de la historia ya invita al diagnóstico); vuelve a
    // ocultarse en las modalidades del diagnóstico y en Contacto. Esas zonas
    // ya tienen las mismas opciones, y así no tapa sus botones en ningún celular.
    const zonas = [
      document.querySelector('.relato'),
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
