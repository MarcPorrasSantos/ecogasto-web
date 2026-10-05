(function () {
  'use strict';

  if (!window.EcoApp || !window.EcoData) {
    console.warn('EcoGastoSocial: falta EcoGastoUsuario.js o EcoGastoData.js');
    return;
  }

  const App = window.EcoApp;
  const $ = id => document.getElementById(id);
  const limpiar = App.limpiar;
  const fmt = App.fmt;

  let abierto = false;
  let tabActual = 'achievements';
  let filtroRanking = null;         
  let fotoPendiente = null;         
  let textoResumen = '';

  const MAX_PUBLICACION = 500;      
  const TOP_RANKING = 10;           

  const ESTILO_BOTON_TEXTO = 'background:none;border:none;padding:0;cursor:pointer;font:inherit;color:inherit;';

  function yo() { return App.usuario(); }

  function hoyISO() { return new Date().toISOString().slice(0, 10); }

 
  function fechaDia(valor) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor || '')) {
      const p = valor.split('-');
      return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]))
        .toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return App.fechaCorta(valor);
  }

  function iniciales(nombre) {
    return String(nombre || '?').replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/g, '').slice(0, 2).toUpperCase() || '?';
  }

 
  function imagenSegura(url) {
    return /^https?:\/\/\S+$/i.test(url || '') || /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(url || '');
  }

  function botonesCompartir() {
    return '<div class="share-buttons" data-html2canvas-ignore>' +
      '<button type="button" class="share-btn share-whatsapp" data-compartir="whatsapp">📱 WhatsApp</button>' +
      '<button type="button" class="share-btn share-facebook" data-compartir="facebook">📘 Facebook</button>' +
      '<button type="button" class="share-btn share-instagram" data-compartir="instagram">📸 Instagram</button>' +
    '</div>';
  }

  

  function mapaRetos() {
    const m = {};
    EcoData.listar('retos').forEach(r => { m[r.id] = r; });
    return m;
  }

  function participacionesDe(usuarioId) {
    return EcoData.listar('retosUsuario').filter(p => p.usuarioId === usuarioId);
  }

 
  function puntosDe(usuarioId, mapa) {
    const m = mapa || mapaRetos();
    return participacionesDe(usuarioId)
      .filter(p => p.estado === 'COMPLETADO' && m[p.retoId])
      .reduce((a, p) => a + (Number(m[p.retoId].puntos) || 0), 0);
  }

  function insigniasDe(usuarioId) {
    const catalogo = {};
    EcoData.listar('insignias').forEach(i => { catalogo[i.id] = i; });
    return EcoData.listar('insigniasUsuario')
      .filter(x => x.usuarioId === usuarioId && catalogo[x.insigniaId])
      .map(x => ({ insignia: catalogo[x.insigniaId], fecha: x.fecha }))
      .sort((a, b) => a.insignia.puntosRequeridos - b.insignia.puntosRequeridos);
  }

 
  function otorgarInsignias(usuarioId) {
    const puntos = puntosDe(usuarioId);
    const propias = EcoData.listar('insigniasUsuario')
      .filter(x => x.usuarioId === usuarioId).map(x => x.insigniaId);
    const nuevas = EcoData.listar('insignias')
      .filter(i => Number(i.puntosRequeridos) <= puntos && propias.indexOf(i.id) === -1)
      .sort((a, b) => a.puntosRequeridos - b.puntosRequeridos);
    nuevas.forEach(i => EcoData.agregar('insigniasUsuario',
      { usuarioId: usuarioId, insigniaId: i.id, fecha: hoyISO() }, 'iu'));
    return nuevas;
  }

  
  function reduccionDe(recurso) {
    const lecturas = App.misConsumos()
      .filter(c => c.recurso === recurso)
      .sort((a, b) => App.periodo(b) - App.periodo(a));
    if (lecturas.length < 2) return null;
    const actual = lecturas[0];
    const anterior = lecturas[1];
    return {
      actual: actual,
      anterior: anterior,
      pct: anterior.valor ? (anterior.valor - actual.valor) * 100 / anterior.valor : 0
    };
  }

  
  function calcularRanking(filtro) {
    const mapa = mapaRetos();
    const puntos = {};
    EcoData.listar('retosUsuario').forEach(p => {
      if (p.estado === 'COMPLETADO' && mapa[p.retoId]) {
        puntos[p.usuarioId] = (puntos[p.usuarioId] || 0) + (Number(mapa[p.retoId].puntos) || 0);
      }
    });

    return EcoData.listar('usuarios')
      .filter(u => u.rol !== 'admin' && u.hogar)
      .filter(u => !filtro || (filtro.tipo === 'zona' ? u.hogar.zona === filtro.valor : u.segmento === filtro.valor))
      .map(u => ({ id: u.id, usuario: u.usuario, zona: u.hogar.zona, segmento: u.segmento, puntos: puntos[u.id] || 0 }))
      .sort((a, b) => (b.puntos - a.puntos) || String(a.usuario).localeCompare(String(b.usuario), 'es'));
  }

  function posicionGeneral(usuarioId) {
    return calcularRanking(null).findIndex(x => x.id === usuarioId) + 1;
  }

  

  const RENDER_TAB = {
    achievements: renderLogros,
    community: renderComunidad,
    photos: renderFotos,
    summary: renderResumen,
    reto: renderRetos,
    ranking: renderRanking
  };

  function abrir(tab) {
    if (!App.comprobarSesion() || !yo()) return;
    abierto = true;
    $('socialMediaModal').style.display = 'flex';
    otorgarInsignias(yo().id);      
    activarTab(tab || tabActual);
    $('btnCerrarSocial').focus();
  }

  function cerrar() {
    abierto = false;
    $('socialMediaModal').style.display = 'none';
  }

  function activarTab(tab) {
    tabActual = RENDER_TAB[tab] ? tab : 'achievements';

    document.querySelectorAll('#socialMediaModal .tab-btn').forEach(b => {
      const activo = b.dataset.tab === tabActual;
      b.classList.toggle('active', activo);
      b.setAttribute('aria-selected', String(activo));
    });
    document.querySelectorAll('#socialMediaModal .tab-panel')
      .forEach(p => p.classList.toggle('active', p.id === tabActual));

    renderPuntos();
    RENDER_TAB[tabActual]();
    document.querySelector('#socialMediaModal .tab-content').scrollTop = 0;
  }

  function refrescar() {
    if (!abierto || !yo()) return;
    renderPuntos();
    RENDER_TAB[tabActual]();
  }

  function renderPuntos() {
    const u = yo();
    if (u) $('puntosSocial').textContent = puntosDe(u.id);
  }

  

  function renderRetos() {
    const u = yo();
    const pref = EcoData.preferenciasDe(u.id);
    const servicios = (u.hogar && u.hogar.servicios) || [];
    const porReto = {};
    participacionesDe(u.id).forEach(p => { porReto[p.retoId] = p; });

    
    $('mensajeReto').innerHTML = pref.aceptaRetos
      ? 'Únete a un reto y, cuando registres tu siguiente lectura, márcalo como completado. ' +
        'Se valida con tus dos últimas lecturas del servicio.'
      : 'Desactivaste la participación en retos en tus preferencias. Actívala para unirte a nuevos retos. ' +
        '<button type="button" class="btn-app btn-app--pequeno" data-ir-preferencias>Ir a Preferencias</button>';

    
    const orden = { EN_CURSO: 0, DISPONIBLE: 1, COMPLETADO: 2 };
    const visibles = EcoData.listar('retos')
      .filter(r => r.activo || porReto[r.id])
      .map(r => ({ reto: r, part: porReto[r.id] || null }))
      .sort((a, b) => orden[a.part ? a.part.estado : 'DISPONIBLE'] - orden[b.part ? b.part.estado : 'DISPONIBLE']);

    $('challengesContainer').innerHTML = visibles.length
      ? visibles.map(v => tarjetaReto(v.reto, v.part, servicios, pref.aceptaRetos)).join('')
      : '<p class="vacio">No hay retos activos por ahora. El administrador publicará nuevos retos pronto.</p>';

    renderInsignias();
  }

  function tarjetaReto(r, p, servicios, aceptaRetos) {
    const icono = App.ICONOS[r.recurso] || '🌱';
    const tieneServicio = servicios.indexOf(r.recurso) !== -1;
    const red = reduccionDe(r.recurso);

    let estado;
    let progreso;
    let detalle;
    let boton = '';

    if (p && p.estado === 'COMPLETADO') {
      estado = '<span class="estado-reto estado-reto--completado">✅ Completado el ' + fechaDia(p.fechaCompletado) + '</span>';
      progreso = 100;
      detalle = 'Ganaste ' + r.puntos + ' puntos con este reto.';
    } else {
      progreso = red ? Math.max(0, Math.min(100, red.pct / r.metaPct * 100)) : 0;
      detalle = red
        ? 'Tu reducción actual: ' + fmt(red.pct, 1) + '% (' + App.etiquetaPeriodo(red.anterior.anio, red.anterior.mes) +
          ' → ' + App.etiquetaPeriodo(red.actual.anio, red.actual.mes) + ') · meta ' + r.metaPct + '%'
        : 'Necesitas 2 lecturas de ' + r.recurso + ' para medir tu avance.';

      if (p) {
        estado = '<span class="estado-reto estado-reto--curso">En curso desde ' + fechaDia(p.fechaInicio) + '</span>';
        boton = r.activo
          ? '<button type="button" class="mark-btn" data-completar="' + limpiar(p.id) + '">Marcar como completado</button>'
          : '<button type="button" class="mark-btn" disabled>Reto desactivado por el administrador</button>';
      } else {
        estado = '<span class="estado-reto estado-reto--disponible">Disponible</span>';
        if (!tieneServicio) boton = '<button type="button" class="mark-btn" disabled>Tu hogar no tiene ' + r.recurso + '</button>';
        else if (!aceptaRetos) boton = '<button type="button" class="mark-btn" disabled>Retos desactivados en tus preferencias</button>';
        else boton = '<button type="button" class="mark-btn" data-unirse="' + limpiar(r.id) + '">Unirme (+' + r.puntos + ' pts)</button>';
      }
    }

    return '<div class="reto-card">' +
      '<h3>' + icono + ' ' + limpiar(r.titulo) + '</h3>' +
      '<p>' + limpiar(r.descripcion) + '</p>' +
      '<div class="reto-meta">Meta: reducir ' + r.metaPct + '% · +' + r.puntos + ' pts · Servicio: ' + limpiar(r.recurso) + '</div>' +
      estado +
      '<div class="progress-bar"><div class="progress-fill" style="width:' + progreso.toFixed(0) + '%"></div></div>' +
      '<div class="reto-meta">' + detalle + '</div>' +
      (boton ? '<div class="acciones-reto">' + boton + '</div>' : '') +
    '</div>';
  }

  function renderInsignias() {
    const u = yo();
    const puntos = puntosDe(u.id);
    const obtenidas = {};
    insigniasDe(u.id).forEach(x => { obtenidas[x.insignia.id] = x; });

    const lista = EcoData.listar('insignias').slice().sort((a, b) => a.puntosRequeridos - b.puntosRequeridos);

    document.querySelector('#insigniasContainer .insignias-list').innerHTML = lista.map(i => {
      const ob = obtenidas[i.id];
      return '<div class="insignia-card' + (ob ? '' : ' bloqueada') + '">' +
        '<span class="insignia-icono">' + limpiar(i.icono || '🏅') + '</span>' +
        '<div>' + limpiar(i.nombre) + '</div>' +
        '<small>' + (ob ? 'Obtenida el ' + fechaDia(ob.fecha)
                        : i.puntosRequeridos + ' pts · te faltan ' + Math.max(0, i.puntosRequeridos - puntos)) + '</small>' +
        (ob ? '<button type="button" class="download-badge-btn" data-descargar-insignia data-html2canvas-ignore>Descargar</button>' : '') +
      '</div>';
    }).join('');
  }

 
  function unirse(retoId) {
    if (!App.comprobarSesion()) return;
    const u = yo();
    const reto = EcoData.obtener('retos', retoId);

    if (!EcoData.preferenciasDe(u.id).aceptaRetos) {
      App.toast('Activa "Participar en retos" en tus preferencias para unirte.', 'error'); return;
    }
    if (!reto || !reto.activo) { App.toast('Este reto ya no está activo.', 'error'); renderRetos(); return; }   // CA1
    if (participacionesDe(u.id).some(p => p.retoId === retoId)) {                                              // CA1
      App.toast('Ya participas en este reto.', 'error'); return;
    }
    if (((u.hogar && u.hogar.servicios) || []).indexOf(reto.recurso) === -1) {
      App.toast('Tu hogar no cuenta con el servicio de ' + reto.recurso + '.', 'error'); return;
    }

    EcoData.agregar('retosUsuario', {
      usuarioId: u.id, retoId: retoId, estado: 'EN_CURSO', fechaInicio: hoyISO(), fechaCompletado: null
    }, 'ru');

    App.toast('Te uniste al reto "' + reto.titulo + '". Registra tu próxima lectura de ' + reto.recurso +
              ' y márcalo como completado.');
    renderRetos();
  }

  
  function completar(participacionId) {
    if (!App.comprobarSesion()) return;
    const u = yo();
    const p = EcoData.obtener('retosUsuario', participacionId);
    if (!p || p.usuarioId !== u.id) return;

    if (p.estado === 'COMPLETADO') { App.toast('Este reto ya fue completado.', 'error'); return; }        // CA3
    const reto = EcoData.obtener('retos', p.retoId);
    if (!reto) { App.toast('El reto ya no existe.', 'error'); renderRetos(); return; }
    if (!reto.activo) { App.toast('El administrador desactivó este reto; ya no se puede completar.', 'error'); renderRetos(); return; }

    const red = reduccionDe(reto.recurso);
    if (!red) {
      App.toast('Necesitas al menos 2 lecturas de ' + reto.recurso + ' para validar el reto. ' +
                'Registra tu nueva lectura en Mi Consumo.', 'error');
      return;
    }
    if (red.pct < reto.metaPct) {                                                                        // CA2
      App.toast('Aún no alcanzas la meta: ' +
        (red.pct >= 0 ? 'redujiste ' + fmt(red.pct, 1) + '%' : 'tu consumo subió ' + fmt(-red.pct, 1) + '%') +
        ' y el reto pide ' + reto.metaPct + '%.', 'error');
      return;
    }

    const posicionAntes = posicionGeneral(u.id);
    EcoData.actualizar('retosUsuario', p.id, { estado: 'COMPLETADO', fechaCompletado: hoyISO() });
    const nuevas = otorgarInsignias(u.id);
    const posicionDespues = posicionGeneral(u.id);

    EcoData.agregar('notificaciones', {
      usuarioId: u.id,
      recurso: reto.recurso,
      titulo: '🏆 Reto completado',
      mensaje: 'Completaste "' + reto.titulo + '" y ganaste ' + reto.puntos + ' puntos.' +
               (nuevas.length ? ' Nueva insignia: ' + App.enumerar(nuevas.map(i => i.nombre)) + '.' : ''),
      detalle: 'Reducción validada: ' + fmt(red.pct, 1) + '% (' +
               App.etiquetaPeriodo(red.anterior.anio, red.anterior.mes) + ' → ' +
               App.etiquetaPeriodo(red.actual.anio, red.actual.mes) + ').',
      leida: false,
      fecha: new Date().toISOString()
    }, 'not');

    App.toast('🎉 ¡Reto completado! Ganaste ' + reto.puntos + ' puntos.' +
      (nuevas.length ? ' Nueva insignia: ' + App.enumerar(nuevas.map(i => (i.icono || '') + ' ' + i.nombre)) + '.' : '') +
      (posicionDespues && posicionDespues < posicionAntes
        ? ' Subiste del #' + posicionAntes + ' al #' + posicionDespues + ' del ranking.' : ''));

    App.actualizarContador();
    renderPuntos();
    renderRetos();
  }

 

  function renderFiltrosRanking() {
    const zonas = EcoData.listar('zonas').filter(z => z.activa).map(z => z.nombre);
    const opciones = [{ tipo: '', valor: '', texto: 'Todos' },
                      { tipo: 'segmento', valor: 'Padre de familia', texto: 'Padres de familia' },
                      { tipo: 'segmento', valor: 'Joven independiente', texto: 'Jóvenes independientes' }]
      .concat(zonas.map(z => ({ tipo: 'zona', valor: z, texto: z })));

   
    if (filtroRanking && filtroRanking.tipo === 'zona' && zonas.indexOf(filtroRanking.valor) === -1) filtroRanking = null;

    $('rankingFiltros').innerHTML = opciones.map(o => {
      const activo = filtroRanking ? (filtroRanking.tipo === o.tipo && filtroRanking.valor === o.valor) : !o.tipo;
      return '<button type="button" class="category-btn' + (activo ? ' active' : '') + '" data-tipo="' + o.tipo +
             '" data-valor="' + limpiar(o.valor) + '">' + limpiar(o.texto) + '</button>';
    }).join('');
  }

  function renderRanking() {
    renderFiltrosRanking();
    const u = yo();
    const lista = calcularRanking(filtroRanking);
    const top = lista.slice(0, TOP_RANKING);
    const max = top.length ? top[0].puntos : 0;
    const medallas = ['🥇', '🥈', '🥉'];

   
    $('rankingContainer').innerHTML = top.length
      ? top.map((x, i) => {
          const pct = max ? Math.round(x.puntos / max * 100) : 0;
          return '<div class="rank-row' + (x.id === u.id ? ' is-you' : '') + '">' +
            '<span class="rank-avatar">' + limpiar(iniciales(x.usuario)) + '</span>' +
            '<span class="rank-pos">#' + (i + 1) + '</span>' +                                          // CA3
            '<span class="rank-name">' + (medallas[i] ? medallas[i] + ' ' : '') + limpiar(x.usuario) +
              (x.id === u.id ? ' (tú)' : '') +
              '<span class="rank-meta">' + limpiar(x.zona) + ' · ' + limpiar(x.segmento) + '</span></span>' +
            '<div class="rank-bar-bg"><div class="rank-bar" data-ancho="' + pct + '"></div></div>' +
            '<span class="rank-points">' + x.puntos + ' pts</span>' +
          '</div>';
        }).join('')
      : '<p class="vacio">No hay usuarios en esta categoría.</p>';

    
    requestAnimationFrame(() => {
      document.querySelectorAll('#rankingContainer .rank-bar')
        .forEach(b => { b.style.width = b.dataset.ancho + '%'; });
    });

    const indice = lista.findIndex(x => x.id === u.id);
    const misPuntos = indice >= 0 ? lista[indice].puntos : 0;
    $('miPosicionRanking').textContent = indice === -1
      ? 'No apareces en esta categoría (tu zona es ' + u.hogar.zona + ' y tu segmento, ' + u.segmento + ').'
      : (indice < TOP_RANKING
          ? 'Estás en el puesto #' + (indice + 1) + ' con ' + misPuntos + ' puntos.'
          : 'Tu posición: #' + (indice + 1) + ' de ' + lista.length + ' con ' + misPuntos +
            ' puntos. Completa retos para entrar al top 10.');
  }


  function renderLogros() {
    const u = yo();
    const mapa = mapaRetos();
    const puntos = puntosDe(u.id, mapa);
    const insignias = insigniasDe(u.id);
    const completados = participacionesDe(u.id)
      .filter(p => p.estado === 'COMPLETADO' && mapa[p.retoId])
      .sort((a, b) => String(b.fechaCompletado).localeCompare(String(a.fechaCompletado)));

    if (!completados.length && !insignias.length) {
      $('listaLogros').innerHTML =
        '<div class="vacio"><p>Aún no tienes logros.</p><br>' +
        '<button type="button" class="btn-app" data-ir-tab="reto">Ver retos sostenibles</button></div>';
      return;
    }

    const tarjetas = [];

    tarjetas.push(tarjetaLogro(
      '🌟 Tu progreso en EcoGasto', 'Posición #' + posicionGeneral(u.id) + ' del ranking',
      [[puntos, 'Puntos'], [completados.length, 'Retos completados'], [insignias.length, 'Insignias']],
      'Cada reto completado se valida con tus lecturas reales de consumo.',
      'Llevo ' + puntos + ' puntos en EcoGasto: ' + completados.length + ' retos completados y ' +
        insignias.length + ' insignias. ¡Súmate al ahorro sostenible! 🌱'));

    insignias.slice().reverse().forEach(x => {
      tarjetas.push(tarjetaLogro(
        (x.insignia.icono || '🏅') + ' Insignia: ' + x.insignia.nombre, fechaDia(x.fecha),
        [[x.insignia.puntosRequeridos, 'Puntos requeridos']],
        '¡Desbloqueaste una nueva insignia gracias a tu compromiso con el ahorro!',
        '¡Gané la insignia "' + x.insignia.nombre + '" en EcoGasto! ' + (x.insignia.icono || '🏅') + ' 🌱'));
    });

    completados.forEach(p => {
      const r = mapa[p.retoId];
      tarjetas.push(tarjetaLogro(
        '✅ ' + r.titulo, fechaDia(p.fechaCompletado),
        [['-' + r.metaPct + '%', 'Meta de ' + r.recurso], ['+' + r.puntos, 'Puntos']],
        limpiar(r.descripcion),
        'Completé el reto "' + r.titulo + '" en EcoGasto y reduje mi consumo de ' + r.recurso +
          '. +' + r.puntos + ' puntos 🌱'));
    });

    $('listaLogros').innerHTML = tarjetas.join('');
  }

  function tarjetaLogro(titulo, fecha, stats, texto, textoCompartir) {
    return '<div class="achievement-card" data-texto="' + limpiar(textoCompartir) + '">' +
      '<div class="achievement-header">' +
        '<div class="achievement-title">' + limpiar(titulo) + '</div>' +
        '<div class="achievement-date">' + limpiar(fecha) + '</div>' +
      '</div>' +
      '<div class="achievement-stats">' + stats.map(s =>
        '<div class="stat-item"><div class="stat-value">' + limpiar(s[0]) + '</div>' +
        '<div class="stat-label">' + limpiar(s[1]) + '</div></div>').join('') + '</div>' +
      '<p>' + texto + '</p>' +
      botonesCompartir() +
    '</div>';
  }


  function renderComunidad() {
    const u = yo();
    const usuarios = {};
    EcoData.listar('usuarios').forEach(x => { usuarios[x.id] = x; });

    const pubs = EcoData.listar('publicaciones')
      .filter(p => usuarios[p.usuarioId])
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));              // mas recientes primero

    $('commentList').innerHTML = pubs.length
      ? pubs.map(p => tarjetaPublicacion(p, usuarios[p.usuarioId], u)).join('')
      : '<p class="vacio">Aún no hay publicaciones. ¡Comparte la primera!</p>';
  }

  function tarjetaPublicacion(p, autor, u) {
    const propia = p.usuarioId === u.id;
    const likes = p.meGusta || [];
    const dioLike = likes.indexOf(u.id) !== -1;

    return '<div class="comment-card' + (propia ? ' propia' : '') + '">' +
      '<div class="comment-header">' +
        '<strong class="comment-autor">' + limpiar(autor.usuario) + (propia ? ' (tú)' : '') + '</strong>' +
        '<span>' + App.fechaLarga(p.fecha) + '</span>' +
      '</div>' +
      '<div class="comment-body">' +
        '<p>' + limpiar(p.contenido).replace(/\n/g, '<br>') + '</p>' +
        (imagenSegura(p.imagenUrl)
          ? '<img src="' + limpiar(p.imagenUrl) + '" alt="Foto compartida por ' + limpiar(autor.usuario) + '" loading="lazy">'
          : '') +
      '</div>' +
      '<div class="comment-actions">' +
        '<button type="button" style="' + ESTILO_BOTON_TEXTO + '" class="' + (dioLike ? 'liked' : '') +
          '" data-like="' + limpiar(p.id) + '" aria-pressed="' + dioLike + '">👍 ' + likes.length + '</button>' +
      
        (propia ? '<button type="button" style="' + ESTILO_BOTON_TEXTO + '" class="comment-borrar" data-borrar="' +
                  limpiar(p.id) + '">🗑 Eliminar</button>' : '') +
      '</div>' +
    '</div>';
  }

  function publicar(e) {
    e.preventDefault();
    if (!App.comprobarSesion()) return;

    const contenido = $('commentInput').value.trim();
    const url = $('publicacionImagenUrl').value.trim();

    if (!contenido) { App.mensaje('msg-publicacion', 'error', 'Escribe algo para publicar.'); return; }         // CA1
    if (contenido.length > MAX_PUBLICACION) {
      App.mensaje('msg-publicacion', 'error', 'La publicación admite como máximo ' + MAX_PUBLICACION + ' caracteres.'); return;
    }
    if (url && !/^https?:\/\/\S+$/i.test(url)) {
      App.mensaje('msg-publicacion', 'error', 'La URL de la foto debe empezar con http:// o https://.'); return;
    }

    EcoData.agregar('publicaciones', {
      usuarioId: yo().id, contenido: contenido, imagenUrl: url || null, meGusta: [], fecha: new Date().toISOString()
    }, 'pub');

    $('formPublicacion').reset();
    actualizarContadorPublicacion();
    App.mensaje('msg-publicacion', 'ok', 'Publicado.');
    renderComunidad();
  }

  function actualizarContadorPublicacion() {
    $('contadorPublicacion').textContent = $('commentInput').value.length + ' / ' + MAX_PUBLICACION;
  }

  function alternarMeGusta(id) {
    const p = EcoData.obtener('publicaciones', id);
    if (!p) return;
    const u = yo();
    const likes = (p.meGusta || []).slice();
    const i = likes.indexOf(u.id);
    if (i === -1) likes.push(u.id); else likes.splice(i, 1);
    EcoData.actualizar('publicaciones', id, { meGusta: likes });
    RENDER_TAB[tabActual]();
  }

  function eliminarPublicacion(id) {
    const p = EcoData.obtener('publicaciones', id);
    if (!p || p.usuarioId !== yo().id) return;
    if (!confirm('¿Eliminar esta publicación? Esta acción no se puede deshacer.')) return;
    EcoData.eliminar('publicaciones', id);
    App.toast('Publicación eliminada.');
    RENDER_TAB[tabActual]();
  }


  function renderFotos() {
    const usuarios = {};
    EcoData.listar('usuarios').forEach(x => { usuarios[x.id] = x; });

    const fotos = EcoData.listar('publicaciones')
      .filter(p => usuarios[p.usuarioId] && imagenSegura(p.imagenUrl))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    $('photoGallery').innerHTML = fotos.length
      ? fotos.map(p =>
          '<div class="photo-item">' +
            '<img src="' + limpiar(p.imagenUrl) + '" alt="Acción sostenible de ' + limpiar(usuarios[p.usuarioId].usuario) + '" loading="lazy">' +
            '<div class="photo-overlay"><strong>' + limpiar(usuarios[p.usuarioId].usuario) + '</strong><br>' +
              limpiar(App.recortar(p.contenido, 90)) + '</div>' +
          '</div>').join('')
      : '<p class="nota-tab">Aún no hay fotos de la comunidad. ¡Sé el primero en compartir una!</p>';
  }

 
  function reducirImagen(archivo) {
    return new Promise((resolver, rechazar) => {
      const lector = new FileReader();
      lector.onerror = rechazar;
      lector.onload = () => {
        const img = new Image();
        img.onerror = rechazar;
        img.onload = () => {
          const max = 800;
          const escala = Math.min(1, max / Math.max(img.width, img.height));
          const lienzo = document.createElement('canvas');
          lienzo.width = Math.round(img.width * escala);
          lienzo.height = Math.round(img.height * escala);
          lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
          resolver(lienzo.toDataURL('image/jpeg', 0.72));
        };
        img.src = lector.result;
      };
      lector.readAsDataURL(archivo);
    });
  }

  async function prepararFoto(archivo) {
    App.mensaje('msg-foto', '', '');
    if (!archivo) return;
    if (!/^image\//.test(archivo.type)) { App.toast('Selecciona un archivo de imagen.', 'error'); return; }
    try {
      fotoPendiente = await reducirImagen(archivo);
      $('photoPreview').src = fotoPendiente;
      $('fotoNueva').hidden = false;
      $('photoCaption').focus();
    } catch (err) {
      App.toast('No se pudo leer la imagen.', 'error');
    }
  }

  function cancelarFoto() {
    fotoPendiente = null;
    $('photoInput').value = '';
    $('photoCaption').value = '';
    $('photoPreview').removeAttribute('src');
    $('fotoNueva').hidden = true;
    App.mensaje('msg-foto', '', '');
  }

  function publicarFoto() {
    if (!App.comprobarSesion() || !fotoPendiente) return;
    const texto = $('photoCaption').value.trim();
    if (!texto) { App.mensaje('msg-foto', 'error', 'Describe tu acción sostenible.'); return; }
    if (texto.length > MAX_PUBLICACION) {
      App.mensaje('msg-foto', 'error', 'La descripción admite como máximo ' + MAX_PUBLICACION + ' caracteres.'); return;
    }

    const guardada = EcoData.agregar('publicaciones', {
      usuarioId: yo().id, contenido: texto, imagenUrl: fotoPendiente, meGusta: [], fecha: new Date().toISOString()
    }, 'pub');
    if (!guardada) return;

    cancelarFoto();
    App.toast('Foto publicada. También aparece en la pestaña Comunidad.');
    renderFotos();
  }

  

  function renderResumen() {
    const u = yo();
    const mapa = mapaRetos();
    const mis = App.misConsumos();
    const periodos = App.periodosDe(mis);
    const costoDe = p => mis.filter(c => App.periodo(c) === p.clave).reduce((a, c) => a + EcoData.costoDe(c, u), 0);

    const puntos = puntosDe(u.id, mapa);
    const retos = participacionesDe(u.id).filter(p => p.estado === 'COMPLETADO' && mapa[p.retoId]).length;
    const insignias = insigniasDe(u.id).length;

    $('resumenPeriodo').textContent = u.usuario + ' · ' + (periodos.length
      ? 'Último mes registrado: ' + App.etiquetaPeriodo(periodos[0].anio, periodos[0].mes)
      : 'Aún sin lecturas registradas');
    $('resPuntos').textContent = puntos;
    $('resRetos').textContent = retos;
    $('resInsignias').textContent = insignias;
    $('resCosto').textContent = periodos.length ? App.soles(costoDe(periodos[0])) : 'S/ —';

    
    if (periodos.length >= 2) {
      const ult = costoDe(periodos[0]);
      const ant = costoDe(periodos[1]);
      const pct = ant ? (ult - ant) * 100 / ant : 0;
      const mesUlt = App.etiquetaPeriodo(periodos[0].anio, periodos[0].mes);
      const mesAnt = App.etiquetaPeriodo(periodos[1].anio, periodos[1].mes);
      variacion = pct < 0
        ? '📉 En ' + mesUlt + ' gastaste ' + fmt(-pct, 1) + '% menos que en ' + mesAnt
        : (pct > 0 ? '📈 En ' + mesUlt + ' gastaste ' + fmt(pct, 1) + '% más que en ' + mesAnt
                   : '➖ En ' + mesUlt + ' gastaste lo mismo que en ' + mesAnt);
      variacion += ' (' + App.soles(ult) + ' frente a ' + App.soles(ant) + ').';
    }
    $('resVariacion').textContent = variacion;

    const ultimos = periodos.slice(0, 6).reverse();
    $('resComparativa').innerHTML = ultimos.length
      ? ultimos.map((p, i) =>
          '<div class="resumen-mes' + (i === ultimos.length - 1 ? ' actual' : '') + '">' +
            '<strong>' + App.etiquetaPeriodo(p.anio, p.mes) + '</strong>' +
            '<span>Gasto: ' + App.soles(costoDe(p)) + '</span>' +
          '</div>').join('')
      : '<p class="nota-tab">Registra tus lecturas en Mi Consumo para ver tu gasto mes a mes.</p>';

    textoResumen = 'Mi resumen EcoGasto: ' + puntos + ' puntos, ' + retos + ' retos completados y ' +
      insignias + ' insignias.' + (variacion ? ' ' + variacion.replace(/^\S+\s/, '') : '') +
      ' ¡Únete al cambio sostenible! 🌱';
  }

  

  async function capturar(elemento) {
    if (typeof html2canvas === 'undefined' || !elemento) return null;
    const lienzo = await html2canvas(elemento, { backgroundColor: null, scale: 2 });
    return new Promise(res => lienzo.toBlob(res, 'image/png'));
  }

  function descargar(blob, nombre) {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function copiar(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto).then(() => true).catch(() => false);
    }
    return Promise.resolve(false);
  }

  async function compartir(red, texto, elemento) {
    if (red === 'whatsapp') {
      window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank', 'noopener');
      return;
    }

    if (red === 'facebook') {
      const copiado = await copiar(texto);
      const destino = /^https?:/.test(location.protocol) ? location.origin + location.pathname : 'https://www.facebook.com';
      window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(destino), '_blank', 'noopener');
      App.toast(copiado ? 'Copiamos el texto: pégalo en tu publicación de Facebook.' : 'Escribe tu logro en la publicación de Facebook.');
      return;
    }

  
    try {
      const blob = await capturar(elemento);
      if (!blob) { App.toast('No se pudo generar la imagen.', 'error'); return; }
      const archivo = new File([blob], 'logro-ecogasto.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        try { await navigator.share({ files: [archivo], title: 'Mi logro en EcoGasto', text: texto }); return; }
        catch (err) { /* el usuario cancelo o no se pudo: se descarga */ }
      }
      descargar(blob, 'logro-ecogasto.png');
      const copiado = await copiar(texto);
      App.toast('Descargamos la imagen' + (copiado ? ' y copiamos el texto' : '') + ' para que la subas a Instagram.');
    } catch (err) {
      App.toast('No se pudo generar la imagen.', 'error');
    }
  }

  async function descargarResumen() {
    try {
      const blob = await capturar($('tarjetaResumen'));
      if (!blob) { App.toast('No se pudo generar la infografía.', 'error'); return; }
      descargar(blob, 'resumen-ecogasto.png');
      App.toast('Infografía descargada.');
    } catch (err) {
      App.toast('No se pudo generar la infografía.', 'error');
    }
  }

  

  function conectarEventos() {
    // Modal
    $('btnCerrarSocial').addEventListener('click', cerrar);
    $('socialMediaModal').addEventListener('click', e => { if (e.target === $('socialMediaModal')) cerrar(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && abierto) cerrar(); });

    document.querySelectorAll('#socialMediaModal .tab-btn')
      .forEach(b => b.addEventListener('click', () => activarTab(b.dataset.tab)));

    
    $('socialMediaModal').addEventListener('click', e => {
      const irTab = e.target.closest('[data-ir-tab]');
      if (irTab) { activarTab(irTab.dataset.irTab); return; }
      if (e.target.closest('[data-ir-preferencias]')) { cerrar(); App.irA('preferencias'); }
    });

  
    $('challengesContainer').addEventListener('click', e => {
      const unir = e.target.closest('[data-unirse]');
      const comp = e.target.closest('[data-completar]');
      if (unir) unirse(unir.dataset.unirse);
      if (comp) completar(comp.dataset.completar);
    });
    $('insigniasContainer').addEventListener('click', async e => {
      if (!e.target.closest('[data-descargar-insignia]')) return;
      try {
        descargar(await capturar(e.target.closest('.insignia-card')), 'insignia-ecogasto.png');
      } catch (err) {
        App.toast('No se pudo descargar la insignia.', 'error');
      }
    });

   
    $('rankingFiltros').addEventListener('click', e => {
      const b = e.target.closest('.category-btn');
      if (!b) return;
      filtroRanking = b.dataset.tipo ? { tipo: b.dataset.tipo, valor: b.dataset.valor } : null;
      renderRanking();
    });

    
    $('listaLogros').addEventListener('click', e => {
      const b = e.target.closest('[data-compartir]');
      if (!b) return;
      const tarjeta = b.closest('.achievement-card');
      compartir(b.dataset.compartir, tarjeta.dataset.texto, tarjeta);
    });

  
    $('btnDescargarResumen').addEventListener('click', descargarResumen);
    document.querySelectorAll('#summary [data-compartir]').forEach(b =>
      b.addEventListener('click', () => compartir(b.dataset.compartir, textoResumen, $('tarjetaResumen'))));

 
    $('formPublicacion').addEventListener('submit', publicar);
    $('commentInput').addEventListener('input', actualizarContadorPublicacion);
    ['commentList', 'photoGallery'].forEach(id => {
      $(id).addEventListener('click', e => {
        const like = e.target.closest('[data-like]');
        const borrar = e.target.closest('[data-borrar]');
        if (like) alternarMeGusta(like.dataset.like);
        if (borrar) eliminarPublicacion(borrar.dataset.borrar);
      });
    });

   
    const zona = $('zonaSubirFoto');
    zona.addEventListener('click', () => $('photoInput').click());
    zona.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('photoInput').click(); }
    });
    zona.addEventListener('dragover', e => { e.preventDefault(); zona.classList.add('dragover'); });
    zona.addEventListener('dragleave', () => zona.classList.remove('dragover'));
    zona.addEventListener('drop', e => {
      e.preventDefault();
      zona.classList.remove('dragover');
      prepararFoto(e.dataTransfer.files[0]);
    });
    $('photoInput').addEventListener('change', e => prepararFoto(e.target.files[0]));
    $('btnCancelarFoto').addEventListener('click', cancelarFoto);
    $('btnPublicarFoto').addEventListener('click', publicarFoto);

    
    document.addEventListener('eco:datos', refrescar);
  }

  window.EcoSocial = { abrir: abrir, cerrar: cerrar, refrescar: refrescar };

  document.addEventListener('DOMContentLoaded', conectarEventos);

})();
