(function () {
  'use strict';

  /* =======================================================================
     ESTADO
     ======================================================================= */

  var adminActual = null;               // usuario autenticado
  var intentosFallidos = 0;
  var graficos = {};                    // instancias de Chart.js
  var paginas = { usuarios: 1, consumos: 1, auditoria: 1 };
  var POR_PAGINA = 12;

  var COLORES = {
    verde:   '#4CAF50',
    verdeOsc:'#2E7D32',
    azul:    '#03A9F4',
    amarillo:'#FFC107',
    rojo:    '#C62828',
    gris:    '#CECECE'
  };
  var PALETA_EXTRA = ['#8E24AA', '#6D4C41', '#00897B', '#546E7A'];   // zonas nuevas

  var CLAVE_SESION = 'ecoAdminSesion';
  var RE_CONTRASENA = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* =======================================================================
     UTILIDADES DE DOM
     ======================================================================= */

  function $(id) { return document.getElementById(id); }
  function $$(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }

  // Escapa el texto antes de insertarlo en la tabla.
  function limpiar(valor) {
    return String(valor === undefined || valor === null ? '' : valor)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var temporizadorAviso = null;
  function avisar(mensaje) {
    var caja = $('Notificacion');
    caja.textContent = mensaje;
    caja.classList.add('visible');
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(function () { caja.classList.remove('visible'); }, 3600);
  }

  function opciones(lista, seleccionado) {
    return lista.map(function (v) {
      var valor = typeof v === 'object' ? v.valor : v;
      var texto = typeof v === 'object' ? v.texto : v;
      return '<option value="' + limpiar(valor) + '"' +
             (String(valor) === String(seleccionado) ? ' selected' : '') + '>' +
             limpiar(texto) + '</option>';
    }).join('');
  }

  // Llena un <select> conservando la opcion que el administrador tenia elegida.
  function llenarSelect(id, primera, lista, porDefecto) {
    var sel = $(id);
    var actual = sel.value;
    sel.innerHTML = (primera ? '<option value="">' + limpiar(primera) + '</option>' : '') + opciones(lista);
    var valores = lista.map(function (v) { return String(typeof v === 'object' ? v.valor : v); });
    if (actual && valores.indexOf(actual) !== -1) sel.value = actual;
    else if (porDefecto !== undefined) sel.value = porDefecto;
  }

  function hoyISO() { return new Date().toISOString().slice(0, 10); }

  function periodoDe(c) { return EcoData.periodoDe(c.anio, c.mes); }

  function etiquetaConsumo(c) {
    var u = EcoData.obtener('usuarios', c.usuarioId);
    return (u ? u.usuario : 'usuario eliminado') + ' / ' + c.recurso + ' ' + c.mes + ' ' + c.anio;
  }

  function etiquetaDe(d) {
    return d.usuario || d.titulo || d.nombre ||
           (d.texto ? d.recurso + ': ' + String(d.texto).slice(0, 40) + '...' : '') ||
           (d.recurso ? d.recurso + (d.zona ? ' / ' + d.zona : '') : '') || 'registro';
  }

  /* =======================================================================
     1. AUTENTICACION  (HU02)
     ======================================================================= */

  function mostrarAvisoAcceso(tipo, mensaje) {
    var caja = $('AvisoAcceso');
    caja.className = 'aviso aviso--' + tipo;
    caja.textContent = mensaje;
    caja.style.display = 'block';
  }

  function iniciarSesion(evento) {
    evento.preventDefault();

    var usuario = $('acceso-usuario').value.trim();
    var contrasena = $('acceso-contrasena').value;

    var resultado = EcoData.autenticarAdmin(usuario, contrasena);

    if (!resultado.ok) {
      intentosFallidos++;

      if (resultado.motivo === 'permisos') {
        // Las credenciales existen, pero la cuenta no es administradora.
        mostrarAvisoAcceso('alerta',
          'La cuenta "' + usuario + '" es valida, pero no tiene permisos de administrador. ' +
          'Ingrese desde la pagina principal.');
        EcoData.registrarAuditoria(usuario, 'Acceso denegado', 'usuarios',
          'Intento de ingreso al panel sin rol de administrador');
      } else if (resultado.motivo === 'bloqueado') {
        mostrarAvisoAcceso('error',
          'La cuenta "' + usuario + '" esta bloqueada. Solo un administrador puede desbloquearla.');
        EcoData.registrarAuditoria(usuario, 'Acceso denegado', 'usuarios',
          resultado.recienBloqueado ? 'Cuenta bloqueada tras 5 intentos fallidos'
                                    : 'Intento de ingreso al panel con una cuenta bloqueada');
      } else {
        mostrarAvisoAcceso('error',
          'Usuario o contrasena incorrectos. Intento ' + intentosFallidos + ' de 5.');
        EcoData.registrarAuditoria(usuario || 'desconocido', 'Acceso fallido', 'usuarios',
          'Credenciales invalidas');
      }

      if (intentosFallidos >= 5) {
        mostrarAvisoAcceso('error',
          'Se alcanzo el limite de intentos. Recargue la pagina para volver a intentarlo.');
        $('FormAcceso').querySelector('button[type="submit"]').disabled = true;
      }

      $('acceso-contrasena').value = '';
      return;
    }

    intentosFallidos = 0;
    adminActual = resultado.usuario;

    // La sesion vive en sessionStorage: se cierra al cerrar la pestana.
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify({
      usuario: adminActual.usuario,
      nombre: adminActual.nombreCompleto,
      inicio: EcoData.ahora()
    }));

    EcoData.registrarAuditoria(adminActual.usuario, 'Inicio de sesion', 'usuarios',
      'Acceso concedido al panel de administracion');

    abrirPanel();
  }

  function cerrarSesion() {
    if (adminActual) {
      EcoData.registrarAuditoria(adminActual.usuario, 'Cierre de sesion', 'usuarios',
        'El administrador salio del panel');
    }
    sessionStorage.removeItem(CLAVE_SESION);
    adminActual = null;
    $('Panel').classList.remove('visible');
    $('Acceso').style.display = 'flex';
    $('FormAcceso').reset();
    $('AvisoAcceso').style.display = 'none';
    window.scrollTo(0, 0);
  }

  function restaurarSesion() {
    var guardada = sessionStorage.getItem(CLAVE_SESION);
    if (!guardada) return false;
    try {
      var datos = JSON.parse(guardada);
      var encontrado = EcoData.listar('usuarios').find(function (u) {
        return u.usuario === datos.usuario && u.rol === 'admin' && u.activo !== false;
      });
      if (!encontrado) return false;
      adminActual = encontrado;
      return true;
    } catch (err) {
      return false;
    }
  }

  function abrirPanel() {
    $('Acceso').style.display = 'none';
    $('Panel').classList.add('visible');
    $('AdminNombre').textContent = adminActual.nombreCompleto || adminActual.usuario;
    refrescarTodo();
  }

  function refrescarTodo() {
    prepararFiltros();
    renderTodas();
    dibujarResumen();
  }

  /* =======================================================================
     2. NAVEGACION
     ======================================================================= */

  function cambiarVista(nombre) {
    $$('.vista').forEach(function (v) { v.classList.remove('activa'); });
    var vista = $('vista-' + nombre);
    if (vista) vista.classList.add('activa');

    $$('.lateral nav button').forEach(function (b) {
      b.classList.toggle('activo', b.dataset.vista === nombre);
    });

    if (nombre === 'resumen') dibujarResumen();         // HU15 CA1: se recalcula al abrir
    document.querySelector('.contenido').scrollTop = 0;
    window.scrollTo(0, 0);
  }

  /* =======================================================================
     3. RESUMEN: INDICADORES, GRAFICOS Y LECTURA POR ZONA  (HU15)
     ======================================================================= */

  function dibujarResumen() {
    var ind = EcoData.indicadores();

    $('Indicadores').innerHTML = [
      tarjeta(ind.totalUsuarios, 'Usuarios registrados', ''),
      tarjeta(ind.hogares, 'Hogares con datos', ''),
      tarjeta(ind.registrosConsumo.toLocaleString('es-PE'), 'Lecturas de consumo', '--azul'),
      tarjeta(ind.alertas, 'Alertas de consumo anomalo', '--amarillo'),
      tarjeta(ind.pctEnRiesgo + '%', 'Consumo alto en algun servicio', '--amarillo'),
      tarjeta(ind.pctConCarencia + '%', 'Hogares con al menos una carencia', '--amarillo'),
      tarjeta(ind.usuariosReales, 'Cuentas creadas desde la web', '')
    ].join('');

    dibujarDistribucion(ind.distribucion);
    dibujarCarencias(ind.carencias);
    dibujarSerie();
    dibujarTablaZonas(ind.carencias);
    dibujarHallazgos(ind);
  }

  function tarjeta(cifra, etiqueta, modificador) {
    return '<div class="indicador' + (modificador ? ' indicador' + modificador : '') + '">' +
             '<div class="cifra">' + limpiar(cifra) + '</div>' +
             '<div class="etiqueta">' + limpiar(etiqueta) + '</div>' +
           '</div>';
  }

  function destruir(nombre) {
    if (graficos[nombre]) { graficos[nombre].destroy(); delete graficos[nombre]; }
  }

  /* Grafico 1: que porcentaje de usuarios consume mucho, moderado o poco. */
  function dibujarDistribucion(dist) {
    var modo = $('FiltroVistaConsumo').value;
    var esPorcentaje = modo === 'porcentaje';
    var etiquetas = EcoData.RECURSOS;

    function serie(clave, clavePct) {
      return etiquetas.map(function (r) {
        return esPorcentaje ? dist[r][clavePct] : dist[r][clave];
      });
    }

    destruir('distribucion');
    graficos.distribucion = new Chart($('ChartDistribucion'), {
      type: 'bar',
      data: {
        labels: etiquetas,
        datasets: [
          { label: 'Consumo bajo',     data: serie('bajo', 'pctBajo'),         backgroundColor: COLORES.verde },
          { label: 'Consumo moderado', data: serie('moderado', 'pctModerado'), backgroundColor: COLORES.amarillo },
          { label: 'Consumo alto',     data: serie('alto', 'pctAlto'),         backgroundColor: COLORES.rojo }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { stacked: true },
          y: {
            stacked: true, beginAtZero: true,
            max: esPorcentaje ? 100 : undefined,
            title: { display: true, text: esPorcentaje ? 'Porcentaje de usuarios' : 'Cantidad de usuarios' },
            ticks: { callback: function (v) { return esPorcentaje ? v + '%' : v; } }
          }
        },
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var recurso = ctx.label;
                var sufijo = esPorcentaje ? '%' : ' usuarios';
                return ctx.dataset.label + ': ' + ctx.parsed.y + sufijo +
                       '  (base: ' + dist[recurso].total + ' hogares con el servicio)';
              }
            }
          }
        }
      }
    });
  }

  /* Grafico 2: carencias por zona (incluye las zonas que agregue el admin). */
  function dibujarCarencias(carencias) {
    var paleta = { Agua: COLORES.azul, Luz: COLORES.amarillo, Gas: COLORES.rojo, Transporte: COLORES.verdeOsc };
    var zonas = EcoData.ZONAS;

    destruir('carencias');
    graficos.carencias = new Chart($('ChartCarencias'), {
      type: 'bar',
      data: {
        labels: zonas,
        datasets: EcoData.RECURSOS.map(function (recurso) {
          return {
            label: 'Sin ' + recurso.toLowerCase(),
            data: zonas.map(function (z) { return carencias[z].carencias[recurso].pct; }),
            backgroundColor: paleta[recurso]
          };
        })
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true, max: 100,
            title: { display: true, text: 'Hogares sin el servicio' },
            ticks: { callback: function (v) { return v + '%'; } }
          }
        },
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var zona = ctx.label;
                var recurso = ctx.dataset.label.replace('Sin ', '');
                recurso = recurso.charAt(0).toUpperCase() + recurso.slice(1);
                var dato = carencias[zona].carencias[recurso];
                return ctx.dataset.label + ': ' + dato.pct + '%  (' +
                       dato.cantidad + ' de ' + carencias[zona].hogares + ' hogares)';
              }
            }
          }
        }
      }
    });
  }

  /* Grafico 3: evolucion mensual por zona del servicio seleccionado.
     Usa el anio mas reciente con lecturas y solo los meses que tienen datos. */
  function dibujarSerie() {
    var recurso = $('FiltroRecursoSerie').value || 'Agua';
    var anio = EcoData.listar('consumos').reduce(function (max, c) {
      return Math.max(max, Number(c.anio) || 0);
    }, 0) || new Date().getFullYear();

    var series = EcoData.serieMensualPorZona(recurso, anio);
    var zonas = Object.keys(series).filter(function (z) {
      return series[z].some(function (v) { return v !== null; });
    });
    var indices = [];
    EcoData.MESES.forEach(function (m, i) {
      if (zonas.some(function (z) { return series[z][i] !== null; })) indices.push(i);
    });

    var paleta = { Costa: COLORES.azul, Sierra: COLORES.verdeOsc, Selva: COLORES.amarillo };
    var nota = $('ChartSerie').closest('.bloque').querySelector('.bloque-nota');
    if (nota) nota.textContent = 'Evolucion del promedio de los hogares de cada zona en ' + anio +
                                 '. Solo se muestran los meses con lecturas.';

    destruir('serie');
    graficos.serie = new Chart($('ChartSerie'), {
      type: 'line',
      data: {
        labels: indices.map(function (i) { return EcoData.MESES[i]; }),
        datasets: zonas.map(function (zona, k) {
          return {
            label: zona,
            data: indices.map(function (i) { return series[zona][i]; }),
            borderColor: paleta[zona] || PALETA_EXTRA[k % PALETA_EXTRA.length],
            backgroundColor: 'transparent',
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 3,
            spanGaps: true
          };
        })
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: EcoData.UNIDADES[recurso] } }
        },
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  function dibujarTablaZonas(carencias) {
    var resumen = EcoData.resumenPorZona();

    $('TablaZonas').innerHTML = EcoData.ZONAS.map(function (zona) {
      var r = resumen[zona];
      var c = carencias[zona];
      if (!r || !c) return '';
      var principal = c.carenciaPrincipal;
      var carencia = r.hogares
        ? '<span class="etiqueta-estado etiqueta-estado--alto">' + limpiar(principal) + ' · ' +
          c.carencias[principal].pct + '%</span>'
        : '<span class="etiqueta-estado etiqueta-estado--inactivo">Sin hogares</span>';
      return '<tr>' +
        '<td><strong>' + limpiar(zona) + '</strong></td>' +
        '<td class="numero">' + r.hogares + '</td>' +
        '<td class="numero">' + r.personas + '</td>' +
        '<td class="numero">' + r.promedios.Agua + '</td>' +
        '<td class="numero">' + r.promedios.Luz + '</td>' +
        '<td class="numero">' + r.promedios.Gas + '</td>' +
        '<td class="numero">' + r.promedios.Transporte + '</td>' +
        '<td class="numero">S/ ' + r.gastoEstimado.toLocaleString('es-PE') + '</td>' +
        '<td>' + carencia + '</td>' +
      '</tr>';
    }).join('');
  }

  /* Lectura en texto de lo que muestran los graficos. */
  function dibujarHallazgos(ind) {
    var hallazgos = [];
    var carencias = ind.carencias;

    EcoData.ZONAS.forEach(function (zona) {
      var c = carencias[zona];
      if (!c || !c.hogares) return;
      var principal = c.carenciaPrincipal;
      var pct = c.carencias[principal].pct;
      if (pct >= 40) {
        hallazgos.push({
          zona: zona,
          texto: 'El ' + pct + '% de los hogares no cuenta con ' + principal.toLowerCase() +
                 ' (' + c.carencias[principal].cantidad + ' de ' + c.hogares + '). ' +
                 'Es la carencia mas extendida de la zona y conviene priorizarla.'
        });
      } else if (pct >= 15) {
        hallazgos.push({
          zona: zona,
          texto: 'Carencia moderada de ' + principal.toLowerCase() + ': afecta al ' + pct +
                 '% de los hogares registrados.'
        });
      } else {
        hallazgos.push({
          zona: zona,
          texto: 'Cobertura de servicios adecuada. La mayor brecha es ' + principal.toLowerCase() +
                 ', con solo ' + pct + '% de hogares sin acceso.'
        });
      }
    });

    // Servicio con mayor proporcion de consumo alto en toda la plataforma.
    var peor = null;
    EcoData.RECURSOS.forEach(function (recurso) {
      if (!ind.distribucion[recurso].total) return;
      if (!peor || ind.distribucion[recurso].pctAlto > ind.distribucion[peor].pctAlto) peor = recurso;
    });

    if (peor) {
      hallazgos.push({
        zona: 'General',
        texto: peor + ' es el servicio con mayor proporcion de consumo excesivo: ' +
               ind.distribucion[peor].pctAlto + '% de los usuarios supera el umbral alto de su zona. ' +
               'Conviene reforzar los Eco Tips de este servicio.'
      });
    }

    // HU07: utilidad de los Eco Tips segun la valoracion de los usuarios.
    var recomendaciones = EcoData.listar('recomendaciones');
    if (recomendaciones.length) {
      var valoradas = recomendaciones.filter(function (r) { return r.util === true || r.util === false; });
      var utiles = valoradas.filter(function (r) { return r.util === true; }).length;
      var conIA = recomendaciones.filter(function (r) { return r.origen === 'IA'; }).length;
      hallazgos.push({
        zona: 'Eco Tips',
        texto: recomendaciones.length + ' tips entregados a los usuarios (' + conIA + ' generados con IA). ' +
               (valoradas.length
                 ? Math.round(utiles / valoradas.length * 100) + '% de los ' + valoradas.length + ' valorados fueron utiles.'
                 : 'Aun no hay valoraciones.')
      });
    }

    $('Hallazgos').innerHTML = hallazgos.map(function (h) {
      return '<li><span class="zona">' + limpiar(h.zona) + '</span><span>' + limpiar(h.texto) + '</span></li>';
    }).join('');
  }

  /* =======================================================================
     4. FILTROS
     ======================================================================= */

  function prepararFiltros() {
    var zonas = EcoData.listar('zonas').map(function (z) { return z.nombre; });

    llenarSelect('FiltroZonaUsuarios', 'Todas las zonas', zonas);
    llenarSelect('FiltroSegmentoUsuarios', 'Todos los segmentos', EcoData.SEGMENTOS);
    llenarSelect('FiltroRecursoConsumos', 'Todos los servicios', EcoData.RECURSOS);
    llenarSelect('FiltroMesConsumos', 'Todos los meses', EcoData.MESES);
    llenarSelect('FiltroRecursoTips', 'Todos los servicios', EcoData.RECURSOS);
    llenarSelect('FiltroRecursoSerie', null, EcoData.RECURSOS, 'Agua');
  }

  /* =======================================================================
     5. TABLAS
     ======================================================================= */

  function renderTodas() {
    renderUsuarios();
    renderConsumos();
    renderTarifas();
    renderZonas();
    renderTips();
    renderRetos();
    renderAuditoria();
  }

  function paginar(filas, clave) {
    var total = Math.max(1, Math.ceil(filas.length / POR_PAGINA));
    if (paginas[clave] > total) paginas[clave] = total;
    var inicio = (paginas[clave] - 1) * POR_PAGINA;
    return { pagina: filas.slice(inicio, inicio + POR_PAGINA), total: total, cantidad: filas.length };
  }

  function pintarPaginacion(contenedorId, clave, info) {
    $(contenedorId).innerHTML =
      '<span>' + info.cantidad.toLocaleString('es-PE') + ' registros · pagina ' +
        paginas[clave] + ' de ' + info.total + '</span>' +
      '<button type="button" class="boton boton--claro boton--pequeno" data-pagina="' + clave +
        '" data-salto="-1"' + (paginas[clave] <= 1 ? ' disabled' : '') + '>Anterior</button>' +
      '<button type="button" class="boton boton--claro boton--pequeno" data-pagina="' + clave +
        '" data-salto="1"' + (paginas[clave] >= info.total ? ' disabled' : '') + '>Siguiente</button>';
  }

  function filaVacia(columnas, mensaje) {
    return '<tr><td colspan="' + columnas + '"><div class="sin-datos">' + limpiar(mensaje) + '</div></td></tr>';
  }

  function botonesFila(tabla, id, extra) {
    return '<div class="acciones">' +
      '<button type="button" class="boton boton--claro boton--pequeno" data-editar="' + tabla + '" data-id="' + limpiar(id) + '">Editar</button>' +
      (extra || '') +
      '<button type="button" class="boton boton--peligro boton--pequeno" data-eliminar="' + tabla + '" data-id="' + limpiar(id) + '">Eliminar</button>' +
    '</div>';
  }

  /* ---------- Usuarios (HU16) ---------- */

  function renderUsuarios() {
    var texto = $('BuscarUsuarios').value.trim().toLowerCase();
    var zona = $('FiltroZonaUsuarios').value;
    var segmento = $('FiltroSegmentoUsuarios').value;

    // Primero el admin, luego las cuentas reales y al final la poblacion simulada.
    function rango(u) { return u.rol === 'admin' ? 0 : (u.simulado ? 2 : 1); }

    var filas = EcoData.listar('usuarios').filter(function (u) {
      if (zona && (!u.hogar || u.hogar.zona !== zona)) return false;
      if (segmento && u.segmento !== segmento) return false;
      if (!texto) return true;
      return [u.usuario, u.nombreCompleto, u.email].join(' ').toLowerCase().indexOf(texto) !== -1;
    }).sort(function (a, b) { return rango(a) - rango(b); });

    var info = paginar(filas, 'usuarios');

    $('TablaUsuarios').innerHTML = info.pagina.length
      ? info.pagina.map(function (u) {
          var hogar = u.hogar || {};
          var servicios = (hogar.servicios || []).join(', ') || '—';
          var origen = u.rol === 'admin'
            ? '<span class="etiqueta-estado etiqueta-estado--admin">Administrador</span>'
            : (u.simulado
                ? '<span class="etiqueta-estado etiqueta-estado--inactivo">Simulado</span>'
                : '<span class="etiqueta-estado etiqueta-estado--real">Registro real</span>');

          var intentos = Number(u.intentosFallidos) || 0;
          var estado = u.activo === false
            ? ' <span class="etiqueta-estado etiqueta-estado--alto">Bloqueado</span>'
            : (intentos ? ' <span class="etiqueta-estado etiqueta-estado--moderado">' + intentos +
                          ' intento' + (intentos === 1 ? '' : 's') + ' fallido' + (intentos === 1 ? '' : 's') + '</span>' : '');

          var bloquear = u.id === adminActual.id ? '' :
            '<button type="button" class="boton boton--claro boton--pequeno" data-bloquear="' + limpiar(u.id) + '">' +
            (u.activo === false ? 'Desbloquear' : 'Bloquear') + '</button>';

          return '<tr>' +
            '<td>' + limpiar(u.usuario) + '</td>' +
            '<td>' + limpiar(u.nombreCompleto) + '</td>' +
            '<td>' + limpiar(u.email) + '</td>' +
            '<td>' + limpiar(u.segmento) + '</td>' +
            '<td>' + limpiar(hogar.zona || '—') + '</td>' +
            '<td class="numero">' + limpiar(hogar.personas || '—') + '</td>' +
            '<td>' + limpiar(servicios) + '</td>' +
            '<td>' + origen + estado + '</td>' +
            '<td>' + botonesFila('usuarios', u.id, bloquear) + '</td>' +
          '</tr>';
        }).join('')
      : filaVacia(9, 'No hay usuarios que coincidan con los filtros aplicados.');

    pintarPaginacion('PaginacionUsuarios', 'usuarios', info);
  }

  /* ---------- Consumos (HU16) ---------- */

  function nivelDe(valor, recurso, zona) {
    var umbral = EcoData.umbralesDe(recurso, zona);
    if (valor >= umbral.umbralAlto) return { clase: 'alto', texto: 'Alto' };
    if (valor <= umbral.umbralBajo) return { clase: 'bajo', texto: 'Bajo' };
    return { clase: 'moderado', texto: 'Moderado' };
  }

  function renderConsumos() {
    var texto = $('BuscarConsumos').value.trim().toLowerCase();
    var recurso = $('FiltroRecursoConsumos').value;
    var mes = $('FiltroMesConsumos').value;

    var usuarios = {};
    EcoData.listar('usuarios').forEach(function (u) { usuarios[u.id] = u; });

    // Las lecturas mas recientes primero (asi se ven las que registran los usuarios).
    var filas = EcoData.listar('consumos').filter(function (c) {
      if (recurso && c.recurso !== recurso) return false;
      if (mes && c.mes !== mes) return false;
      if (!texto) return true;
      var u = usuarios[c.usuarioId];
      return u && u.usuario.toLowerCase().indexOf(texto) !== -1;
    }).sort(function (a, b) { return periodoDe(b) - periodoDe(a); });

    var info = paginar(filas, 'consumos');

    $('TablaConsumos').innerHTML = info.pagina.length
      ? info.pagina.map(function (c) {
          var u = usuarios[c.usuarioId];
          var zona = u && u.hogar ? u.hogar.zona : 'Costa';
          var nivel = nivelDe(c.valor, c.recurso, zona);
          var costo = EcoData.costoDe(c, u);
          return '<tr>' +
            '<td>' + limpiar(u ? u.usuario : 'usuario eliminado') + '</td>' +
            '<td>' + limpiar(zona) + '</td>' +
            '<td>' + limpiar(c.recurso) + '</td>' +
            '<td>' + limpiar(c.mes + ' ' + c.anio) + '</td>' +
            '<td class="numero">' + limpiar(c.valor) +
              '<br><small style="color:#6B756B;">S/ ' + costo.toFixed(2) + '</small></td>' +
            '<td>' + limpiar(EcoData.UNIDADES[c.recurso]) + '</td>' +
            '<td><span class="etiqueta-estado etiqueta-estado--' + nivel.clase + '">' + nivel.texto + '</span></td>' +
            '<td>' + botonesFila('consumos', c.id) + '</td>' +
          '</tr>';
        }).join('')
      : filaVacia(8, 'No hay lecturas que coincidan con los filtros aplicados.');

    pintarPaginacion('PaginacionConsumos', 'consumos', info);
  }

  /* ---------- Tarifas y umbrales (HU17) ---------- */

  function renderTarifas() {
    var filas = EcoData.listar('tarifas');

    $('TablaTarifas').innerHTML = filas.length
      ? filas.map(function (t) {
          return '<tr>' +
            '<td><strong>' + limpiar(t.recurso) + '</strong></td>' +
            '<td>' + limpiar(t.zona) + '</td>' +
            '<td>' + limpiar(t.unidad) + '</td>' +
            '<td class="numero">' + limpiar(t.umbralBajo) + '</td>' +
            '<td class="numero">' + limpiar(t.umbralAlto) + '</td>' +
            '<td class="numero">' + limpiar(t.promedioNacional) + '</td>' +
            '<td class="numero">' + limpiar(t.tarifa) + '</td>' +
            '<td>' + botonesFila('tarifas', t.id) + '</td>' +
          '</tr>';
        }).join('')
      : filaVacia(8, 'No hay parametros configurados.');
  }

  /* ---------- Zonas (HU17) ---------- */

  function hogaresEnZona(nombre) {
    return EcoData.listar('usuarios').filter(function (u) { return u.hogar && u.hogar.zona === nombre; }).length;
  }

  function renderZonas() {
    var zonas = EcoData.listar('zonas');

    $('TablaZonasCrud').innerHTML = zonas.length
      ? zonas.map(function (z) {
          return '<tr>' +
            '<td><strong>' + limpiar(z.nombre) + '</strong></td>' +
            '<td>' + limpiar(z.descripcion) + '</td>' +
            '<td class="numero">' + hogaresEnZona(z.nombre) + '</td>' +
            '<td><span class="etiqueta-estado etiqueta-estado--' + (z.activa ? 'activo' : 'inactivo') + '">' +
              (z.activa ? 'Activa' : 'Inactiva') + '</span></td>' +
            '<td>' + botonesFila('zonas', z.id) + '</td>' +
          '</tr>';
        }).join('')
      : filaVacia(5, 'No hay zonas registradas.');
  }

  /* ---------- Eco Tips (HU18) ---------- */

  function renderTips() {
    var texto = $('BuscarTips').value.trim().toLowerCase();
    var recurso = $('FiltroRecursoTips').value;

    var filas = EcoData.listar('tips').filter(function (t) {
      if (recurso && t.recurso !== recurso) return false;
      if (!texto) return true;
      return t.texto.toLowerCase().indexOf(texto) !== -1;
    });

    $('TablaTips').innerHTML = filas.length
      ? filas.map(function (t) {
          return '<tr>' +
            '<td>' + limpiar(t.recurso) + '</td>' +
            '<td>' + limpiar(t.segmento) + '</td>' +
            '<td>' + limpiar(t.texto) + '</td>' +
            '<td><span class="etiqueta-estado etiqueta-estado--' + (t.activo ? 'activo' : 'inactivo') + '">' +
              (t.activo ? 'Publicado' : 'Oculto') + '</span></td>' +
            '<td>' + botonesFila('tips', t.id) + '</td>' +
          '</tr>';
        }).join('')
      : filaVacia(5, 'No hay recomendaciones que coincidan con la busqueda.');
  }

  /* ---------- Retos (HU18) ---------- */

  function renderRetos() {
    var filas = EcoData.listar('retos');
    var participaciones = EcoData.listar('retosUsuario');

    $('TablaRetos').innerHTML = filas.length
      ? filas.map(function (r) {
          var propias = participaciones.filter(function (p) { return p.retoId === r.id; });
          var completados = propias.filter(function (p) { return p.estado === 'COMPLETADO'; }).length;
          return '<tr>' +
            '<td><strong>' + limpiar(r.titulo) + '</strong></td>' +
            '<td>' + limpiar(r.recurso) + '</td>' +
            '<td>' + limpiar(r.descripcion) + '</td>' +
            '<td class="numero">' + limpiar(r.metaPct) + '%</td>' +
            '<td class="numero">' + limpiar(r.puntos) + '</td>' +
            '<td><span class="etiqueta-estado etiqueta-estado--' + (r.activo ? 'activo' : 'inactivo') + '">' +
              (r.activo ? 'Activo' : 'Inactivo') + '</span>' +
              '<br><small style="color:#6B756B;">' + propias.length + ' participantes · ' + completados + ' completados</small></td>' +
            '<td>' + botonesFila('retos', r.id) + '</td>' +
          '</tr>';
        }).join('')
      : filaVacia(7, 'No hay retos registrados.');
  }

  /* ---------- Auditoria (HU15, solo lectura) ---------- */

  function renderAuditoria() {
    var texto = $('BuscarAuditoria').value.trim().toLowerCase();

    var filas = EcoData.listar('auditoria').filter(function (a) {
      if (!texto) return true;
      return [a.accion, a.tabla, a.detalle, a.admin].join(' ').toLowerCase().indexOf(texto) !== -1;
    });

    var info = paginar(filas, 'auditoria');

    $('TablaAuditoria').innerHTML = info.pagina.length
      ? info.pagina.map(function (a) {
          return '<tr>' +
            '<td>' + limpiar(a.fecha) + '</td>' +
            '<td>' + limpiar(a.admin) + '</td>' +
            '<td>' + limpiar(a.accion) + '</td>' +
            '<td>' + limpiar(a.tabla) + '</td>' +
            '<td>' + limpiar(a.detalle) + '</td>' +
          '</tr>';
        }).join('')
      : filaVacia(5, 'Todavia no hay movimientos registrados.');

    pintarPaginacion('PaginacionAuditoria', 'auditoria', info);
  }

  /* =======================================================================
     6. FORMULARIOS: DEFINICION DE CAMPOS POR TABLA
     Propiedades extra de cada campo:
       porDefecto         valor al crear
       bloqueadoAlEditar  se muestra deshabilitado al editar
       opcionalAlEditar   deja de ser obligatorio al editar
       vacioAlEditar      no muestra el valor guardado (contrasena)
       ayudaEdicion       texto de ayuda distinto al editar
     ======================================================================= */

  function esquema(tabla, registro) {
    var zonas = EcoData.listar('zonas')
      .filter(function (z) { return z.activa; })
      .map(function (z) { return z.nombre; });

    // Al editar se conserva la zona actual aunque este desactivada.
    var zonaActual = registro && (registro.hogar ? registro.hogar.zona : registro.zona);
    if (zonaActual && zonas.indexOf(zonaActual) === -1) zonas.push(zonaActual);

    var hoy = new Date();

    var esquemas = {
      usuarios: {
        titulo: 'usuario',
        campos: [
          { id: 'usuario',        etiqueta: 'Nombre de usuario', tipo: 'text', requerido: true, maxlength: 40,
            ayuda: 'Entre 4 y 40 caracteres. No puede repetirse.' },
          { id: 'nombreCompleto', etiqueta: 'Nombre completo',   tipo: 'text', requerido: true },
          { id: 'email',          etiqueta: 'Correo electronico', tipo: 'email', requerido: true },
          { id: 'contrasena',     etiqueta: 'Contrasena',        tipo: 'password', requerido: true,
            opcionalAlEditar: true, vacioAlEditar: true,
            ayuda: 'Minimo 8 caracteres, con mayuscula, minuscula y numero.',
            ayudaEdicion: 'Dejela vacia para mantener la actual. Si escribe una nueva debe tener minimo 8 caracteres, con mayuscula, minuscula y numero.' },
          { id: 'rol',            etiqueta: 'Rol',      tipo: 'select', valores: ['usuario', 'admin'] },
          { id: 'activo',         etiqueta: 'Cuenta activa (desmarque para bloquearla)', tipo: 'casilla', porDefecto: true },
          { id: 'segmento',       etiqueta: 'Segmento', tipo: 'select', valores: EcoData.SEGMENTOS },
          { id: 'hogar.zona',     etiqueta: 'Zona',     tipo: 'select', valores: zonas },
          { id: 'hogar.personas', etiqueta: 'Personas en el hogar', tipo: 'number', min: 1, max: 20, porDefecto: 1 },
          { id: 'hogar.servicios', etiqueta: 'Servicios con los que cuenta el hogar',
            tipo: 'casillas', valores: EcoData.RECURSOS,
            ayuda: 'Los servicios no marcados se contabilizan como carencia. Para una cuenta con rol admin estos datos se ignoran.' }
        ]
      },

      consumos: {
        titulo: 'lectura de consumo',
        campos: [
          { id: 'usuarioId', etiqueta: 'Usuario', tipo: 'select', requerido: true, bloqueadoAlEditar: true,
            valores: EcoData.listar('usuarios')
              .filter(function (u) { return u.rol !== 'admin' && u.hogar; })
              .map(function (u) {
                return { valor: u.id, texto: u.usuario + ' — ' + u.hogar.zona + ' (' + (u.hogar.servicios || []).join(', ') + ')' };
              }) },
          { id: 'recurso', etiqueta: 'Servicio', tipo: 'select', valores: EcoData.RECURSOS, bloqueadoAlEditar: true },
          { id: 'mes',     etiqueta: 'Mes',      tipo: 'select', valores: EcoData.MESES, bloqueadoAlEditar: true,
            porDefecto: EcoData.MESES[hoy.getMonth()] },
          { id: 'anio',    etiqueta: 'Año',      tipo: 'number', requerido: true, bloqueadoAlEditar: true,
            min: EcoData.ANIO_MINIMO, max: hoy.getFullYear(), porDefecto: hoy.getFullYear() },
          { id: 'valor',   etiqueta: 'Valor registrado', tipo: 'number', requerido: true, paso: '0.01', min: 0.01,
            ayuda: 'Agua en L/dia por persona, luz en kWh/mes, gas en m3/mes, transporte en soles al mes. ' +
                   'Si supera en mas de 20% el promedio del usuario y el umbral alto de su zona, se le genera una alerta.',
            ayudaEdicion: 'Solo se corrige el valor; el costo estimado se recalcula con la tarifa vigente.' }
        ]
      },

      tarifas: {
        titulo: 'parametro de tarifa',
        campos: [
          { id: 'recurso', etiqueta: 'Servicio', tipo: 'select', valores: EcoData.RECURSOS },
          { id: 'zona',    etiqueta: 'Zona',     tipo: 'select', valores: zonas },
          { id: 'umbralBajo', etiqueta: 'Umbral de consumo bajo', tipo: 'number', paso: '0.01', min: 0, requerido: true,
            ayuda: 'Por debajo de este valor el consumo se clasifica como bajo.' },
          { id: 'umbralAlto', etiqueta: 'Umbral de consumo alto', tipo: 'number', paso: '0.01', min: 0, requerido: true,
            ayuda: 'A partir de este valor el consumo es alto y puede generar alertas al usuario.' },
          { id: 'promedioNacional', etiqueta: 'Promedio nacional de referencia', tipo: 'number', paso: '0.01', min: 0, requerido: true,
            ayuda: 'Es la linea de referencia que ve el usuario en su grafico y en la comparacion nacional.' },
          { id: 'tarifa', etiqueta: 'Tarifa en soles por unidad', tipo: 'number', paso: '0.0001', min: 0, requerido: true,
            ayuda: 'Se usa para calcular el costo estimado de cada lectura.' }
        ]
      },

      zonas: {
        titulo: 'zona',
        campos: [
          { id: 'nombre',      etiqueta: 'Nombre de la zona', tipo: 'text', requerido: true,
            ayuda: 'Si la renombra, los hogares y tarifas de la zona se actualizan.' },
          { id: 'descripcion', etiqueta: 'Descripcion',       tipo: 'textarea' },
          { id: 'activa',      etiqueta: 'Zona activa (solo las activas aparecen al registrar un hogar)',
            tipo: 'casilla', porDefecto: true }
        ]
      },

      tips: {
        titulo: 'Eco Tip',
        campos: [
          { id: 'recurso',  etiqueta: 'Servicio', tipo: 'select', valores: EcoData.RECURSOS },
          { id: 'segmento', etiqueta: 'Segmento destinatario', tipo: 'select',
            valores: ['Todos'].concat(EcoData.SEGMENTOS) },
          { id: 'texto',    etiqueta: 'Recomendacion', tipo: 'textarea', requerido: true, maxlength: 300,
            ayuda: 'Maximo 300 caracteres. Tambien sirve de respaldo cuando la IA no responde.' },
          { id: 'activo',   etiqueta: 'Publicado en la plataforma', tipo: 'casilla', porDefecto: true }
        ]
      },

      retos: {
        titulo: 'reto sostenible',
        campos: [
          { id: 'titulo',      etiqueta: 'Titulo',      tipo: 'text', requerido: true },
          { id: 'recurso',     etiqueta: 'Servicio',    tipo: 'select', valores: EcoData.RECURSOS },
          { id: 'descripcion', etiqueta: 'Descripcion', tipo: 'textarea', requerido: true },
          { id: 'metaPct',     etiqueta: 'Meta de reduccion (%)', tipo: 'number', min: 1, max: 100, requerido: true,
            ayuda: 'Se valida comparando las dos ultimas lecturas del usuario en ese servicio.' },
          { id: 'puntos',      etiqueta: 'Puntos otorgados', tipo: 'number', min: 1, requerido: true },
          { id: 'activo',      etiqueta: 'Reto activo', tipo: 'casilla', porDefecto: true,
            ayuda: 'Solo los retos activos se muestran a los usuarios. Para retirarlo, desactivelo en lugar de eliminarlo.' }
        ]
      }
    };

    return esquemas[tabla];
  }

  /* =======================================================================
     7. VENTANA MODAL
     ======================================================================= */

  var edicion = { tabla: null, id: null };

  function valorAnidado(objeto, ruta) {
    return ruta.split('.').reduce(function (o, k) {
      return o && o[k] !== undefined ? o[k] : undefined;
    }, objeto);
  }

  function campoHTML(campo, registro) {
    var valor = registro ? valorAnidado(registro, campo.id) : campo.porDefecto;
    if (registro && campo.vacioAlEditar) valor = '';

    var nombre = 'c_' + campo.id.replace(/\./g, '__');
    var bloqueado = !!(registro && campo.bloqueadoAlEditar);
    var requerido = campo.requerido && !(registro && campo.opcionalAlEditar);
    var atributos = (requerido ? ' required' : '') + (bloqueado ? ' disabled' : '') +
                    (campo.maxlength ? ' maxlength="' + campo.maxlength + '"' : '');
    var ayuda = registro && campo.ayudaEdicion ? campo.ayudaEdicion : campo.ayuda;
    var html = '<div class="campo">';

    if (campo.tipo === 'casilla') {
      html += '<label style="display:flex; align-items:center; gap:8px; font-weight:400;">' +
                '<input type="checkbox" name="' + nombre + '"' + (valor ? ' checked' : '') + '> ' +
                limpiar(campo.etiqueta) +
              '</label>';
    } else {
      html += '<label for="' + nombre + '">' + limpiar(campo.etiqueta) + '</label>';

      if (campo.tipo === 'select') {
        html += '<select id="' + nombre + '" name="' + nombre + '"' + atributos + '>' +
                opciones(campo.valores, valor) + '</select>';

      } else if (campo.tipo === 'textarea') {
        html += '<textarea id="' + nombre + '" name="' + nombre + '"' + atributos + '>' +
                limpiar(valor || '') + '</textarea>';

      } else if (campo.tipo === 'casillas') {
        var marcados = Array.isArray(valor) ? valor : [];
        html += '<div class="grupo-casillas">' + campo.valores.map(function (v) {
          return '<label><input type="checkbox" name="' + nombre + '" value="' + limpiar(v) + '"' +
                 (marcados.indexOf(v) !== -1 ? ' checked' : '') + '> ' + limpiar(v) + '</label>';
        }).join('') + '</div>';

      } else {
        html += '<input type="' + campo.tipo + '" id="' + nombre + '" name="' + nombre + '"' +
                ' value="' + limpiar(valor !== undefined ? valor : '') + '"' + atributos +
                (campo.tipo === 'password' ? ' autocomplete="new-password"' : '') +
                (campo.min !== undefined ? ' min="' + campo.min + '"' : '') +
                (campo.max !== undefined ? ' max="' + campo.max + '"' : '') +
                (campo.paso ? ' step="' + campo.paso + '"' : '') + '>';
      }
    }

    if (ayuda) html += '<span class="campo-ayuda">' + limpiar(ayuda) + '</span>';
    html += '</div>';
    return html;
  }

  function abrirModal(tabla, id) {
    var registro = id ? EcoData.obtener(tabla, id) : null;
    var def = esquema(tabla, registro);
    if (!def) return;

    if (tabla === 'consumos' && !id && !def.campos[0].valores.length) {
      avisar('No hay usuarios con hogar registrado para asignarles una lectura.');
      return;
    }

    edicion = { tabla: tabla, id: id || null };

    $('ModalTitulo').textContent = (id ? 'Editar ' : 'Agregar ') + def.titulo;
    $('ModalGuardar').textContent = id ? 'Guardar cambios' : 'Crear registro';
    $('ModalCuerpo').innerHTML = def.campos.map(function (c) { return campoHTML(c, registro); }).join('');
    $('Modal').classList.add('visible');

    var primero = $('ModalCuerpo').querySelector('input:not([disabled]), select:not([disabled]), textarea');
    if (primero) primero.focus();
  }

  function cerrarModal() {
    $('Modal').classList.remove('visible');
    edicion = { tabla: null, id: null };
  }

  function asignarAnidado(objeto, ruta, valor) {
    var partes = ruta.split('.');
    var actual = objeto;
    for (var i = 0; i < partes.length - 1; i++) {
      if (!actual[partes[i]] || typeof actual[partes[i]] !== 'object') actual[partes[i]] = {};
      actual = actual[partes[i]];
    }
    actual[partes[partes.length - 1]] = valor;
  }

  function leerFormulario(def) {
    var formulario = $('ModalForm');
    var datos = {};

    def.campos.forEach(function (campo) {
      var nombre = 'c_' + campo.id.replace(/\./g, '__');
      var valor;

      if (campo.tipo === 'casilla') {
        valor = formulario.querySelector('[name="' + nombre + '"]').checked;

      } else if (campo.tipo === 'casillas') {
        valor = Array.prototype.slice
          .call(formulario.querySelectorAll('[name="' + nombre + '"]:checked'))
          .map(function (el) { return el.value; });

      } else {
        var el = formulario.querySelector('[name="' + nombre + '"]');
        valor = el.value;
        if (campo.tipo === 'number') valor = valor === '' ? '' : Number(valor);
        else if (typeof valor === 'string') valor = valor.trim();
      }

      asignarAnidado(datos, campo.id, valor);
    });

    return datos;
  }

  // Validaciones de negocio (en el backend las harian los servicios).
  function validar(tabla, d, actual) {
    var id = actual ? actual.id : null;

    if (tabla === 'usuarios') {
      var usuarios = EcoData.listar('usuarios');
      if (d.usuario.length < 4 || d.usuario.length > 40) return 'El nombre de usuario debe tener entre 4 y 40 caracteres.';
      if (usuarios.some(function (u) { return u.id !== id && String(u.usuario).toLowerCase() === d.usuario.toLowerCase(); })) {
        return 'Ya existe un usuario con ese nombre.';
      }
      if (!RE_EMAIL.test(d.email)) return 'El correo no tiene un formato valido.';
      if (usuarios.some(function (u) { return u.id !== id && String(u.email || '').toLowerCase() === d.email.toLowerCase(); })) {
        return 'Ya existe una cuenta con ese correo.';
      }
      if ((!actual || d.contrasena) && !RE_CONTRASENA.test(d.contrasena)) {
        return 'La contrasena debe tener minimo 8 caracteres, con mayuscula, minuscula y numero.';
      }
      if (actual && actual.id === adminActual.id && (d.rol !== 'admin' || !d.activo)) {
        return 'No puede quitarse el rol de administrador ni bloquear su propia cuenta.';
      }
      if (d.rol !== 'admin') {
        var personas = Number(d.hogar.personas);
        if (!Number.isInteger(personas) || personas < 1 || personas > 20) return 'Las personas del hogar deben ser un entero entre 1 y 20.';
        if (!d.hogar.zona) return 'Seleccione una zona activa.';
        if (!d.hogar.servicios.length) return 'Marque al menos un servicio disponible del hogar.';
      }
    }

    if (tabla === 'tarifas') {
      var numericos = ['umbralBajo', 'umbralAlto', 'promedioNacional', 'tarifa'];
      if (numericos.some(function (k) { return d[k] === '' || isNaN(d[k]) || Number(d[k]) < 0; })) {
        return 'Tarifa, umbrales y promedio nacional son obligatorios y no pueden ser negativos.';
      }
      if (Number(d.umbralBajo) >= Number(d.umbralAlto)) return 'El umbral alto debe ser mayor que el umbral bajo.';
      if (EcoData.listar('tarifas').some(function (t) { return t.id !== id && t.recurso === d.recurso && t.zona === d.zona; })) {
        return 'Ya existe una tarifa para ' + d.recurso + ' en ' + d.zona + '. Edite esa fila.';
      }
    }

    if (tabla === 'zonas') {
      if (!d.nombre) return 'El nombre de la zona es obligatorio.';
      if (EcoData.listar('zonas').some(function (z) { return z.id !== id && z.nombre.toLowerCase() === d.nombre.toLowerCase(); })) {
        return 'Ya existe una zona con ese nombre.';
      }
    }

    if (tabla === 'tips') {
      if (!d.texto) return 'El texto del tip es obligatorio.';
      if (d.texto.length > 300) return 'El tip admite como maximo 300 caracteres.';
      if (['Todos'].concat(EcoData.SEGMENTOS).indexOf(d.segmento) === -1) return 'Seleccione un segmento valido.';
    }

    if (tabla === 'retos') {
      if (!d.titulo) return 'El titulo del reto es obligatorio.';
      if (!d.descripcion) return 'La descripcion del reto es obligatoria.';
      if (!Number.isInteger(Number(d.metaPct)) || d.metaPct < 1 || d.metaPct > 100) return 'La meta debe ser un entero entre 1 y 100.';
      if (!(Number(d.puntos) > 0)) return 'Los puntos deben ser mayores a 0.';
    }

    return null;
  }

  function prepararUsuario(d, actual) {
    if (actual && !d.contrasena) d.contrasena = actual.contrasena;       // HU16 CA2
    if (d.rol === 'admin') {
      d.hogar = null;
      d.segmento = 'Administrador';
    } else {
      if (EcoData.SEGMENTOS.indexOf(d.segmento) === -1) d.segmento = 'Joven independiente';
      d.hogar.esPadre = d.segmento === 'Padre de familia';
      d.hogar.personas = Number(d.hogar.personas);
      d.hogar.fechaActualizacion = hoyISO();
    }
    d.intentosFallidos = 0;               // HU16 CA3 (el UPDATE del backend tambien los reinicia)
    if (!actual) {
      d.simulado = false;
      d.fechaRegistro = new Date().toLocaleDateString('es-PE');
    }
  }

  // Al crear una zona se generan sus tarifas con los valores base nacionales.
  function crearTarifasBase(zona) {
    var existentes = EcoData.listar('tarifas');
    var creadas = 0;
    EcoData.RECURSOS.forEach(function (recurso) {
      if (existentes.some(function (t) { return t.recurso === recurso && t.zona === zona; })) return;
      var base = EcoData.umbralesDe(recurso, '');
      EcoData.agregar('tarifas', {
        recurso: recurso, zona: zona, unidad: EcoData.UNIDADES[recurso],
        tarifa: base.tarifa, umbralBajo: base.umbralBajo, umbralAlto: base.umbralAlto,
        promedioNacional: base.promedioNacional
      }, 'tar');
      creadas++;
    });
    return creadas;
  }

  function cambiosTarifa(antes, despues) {
    var campos = { tarifa: 'tarifa', umbralBajo: 'umbral bajo', umbralAlto: 'umbral alto', promedioNacional: 'promedio nacional' };
    var cambios = Object.keys(campos)
      .filter(function (k) { return Number(antes[k]) !== Number(despues[k]); })
      .map(function (k) { return campos[k] + ' ' + antes[k] + ' -> ' + despues[k]; });
    return cambios.length ? ' (' + cambios.join(', ') + ')' : '';
  }

  // HU16 CA4: las lecturas del admin siguen las reglas de HU04 y disparan HU08.
  function guardarConsumo(d) {
    var r = edicion.id
      ? EcoData.actualizarConsumo(edicion.id, { valor: Number(d.valor) })
      : EcoData.registrarConsumo({ usuarioId: d.usuarioId, recurso: d.recurso, anio: Number(d.anio), mes: d.mes, valor: Number(d.valor) });

    if (!r.ok) { avisar(r.mensaje); return; }

    EcoData.registrarAuditoria(adminActual.usuario, edicion.id ? 'Modificacion' : 'Alta', 'consumos',
      (edicion.id ? 'Se corrigio la lectura: ' : 'Se registro la lectura: ') + etiquetaConsumo(r.consumo) +
      ' = ' + r.consumo.valor + ' (costo S/ ' + Number(r.consumo.costoEstimado).toFixed(2) + ')' +
      (r.alertaGenerada ? '. Genero una alerta de consumo anomalo para el usuario' : ''));

    avisar(edicion.id ? 'Lectura corregida.'
      : (r.alertaGenerada ? 'Lectura registrada. Se genero una alerta de consumo anomalo para el usuario.' : 'Lectura registrada.'));

    cerrarModal();
    refrescarTodo();
  }

  function guardarModal(evento) {
    evento.preventDefault();

    var tabla = edicion.tabla;
    var actual = edicion.id ? EcoData.obtener(tabla, edicion.id) : null;
    if (edicion.id && !actual) { avisar('El registro ya no existe.'); cerrarModal(); refrescarTodo(); return; }

    var def = esquema(tabla, actual);
    if (!def) return;

    var datos = leerFormulario(def);
    var error = validar(tabla, datos, actual);
    if (error) { avisar(error); return; }

    if (tabla === 'consumos') { guardarConsumo(datos); return; }
    if (tabla === 'usuarios') prepararUsuario(datos, actual);
    if (tabla === 'tarifas') datos.unidad = EcoData.UNIDADES[datos.recurso];

    var etiqueta = etiquetaDe(datos);

    if (edicion.id) {
      EcoData.actualizar(tabla, edicion.id, datos);

      var detalle = 'Se actualizo el registro: ' + etiqueta;
      if (tabla === 'tarifas') detalle += cambiosTarifa(actual, datos);
      if (tabla === 'zonas' && actual.nombre !== datos.nombre) {
        detalle += ' (antes "' + actual.nombre + '"; se actualizaron sus hogares y tarifas)';
      }
      if (tabla === 'usuarios' && actual.activo !== false && datos.activo === false) detalle += ' (cuenta bloqueada)';
      if (tabla === 'usuarios' && actual.activo === false && datos.activo) detalle += ' (cuenta desbloqueada, intentos reiniciados)';

      EcoData.registrarAuditoria(adminActual.usuario, 'Modificacion', tabla, detalle);
      avisar('Cambios guardados.');
    } else {
      var nuevo = EcoData.agregar(tabla, datos, tabla.slice(0, 3));
      var detalleAlta = 'Se creo el registro: ' + etiqueta;

      if (tabla === 'usuarios') EcoData.preferenciasDe(nuevo.id);        // preferencias por defecto
      if (tabla === 'zonas') {
        var creadas = crearTarifasBase(nuevo.nombre);
        if (creadas) detalleAlta += ' y ' + creadas + ' tarifas base';
      }

      EcoData.registrarAuditoria(adminActual.usuario, 'Alta', tabla, detalleAlta);
      avisar(tabla === 'zonas' ? 'Zona creada con sus tarifas base. Ajustelas en Tarifas y umbrales.' : 'Registro creado.');
    }

    cerrarModal();
    refrescarTodo();
  }

  /* =======================================================================
     8. ELIMINACION Y BLOQUEO
     ======================================================================= */

  function eliminarRegistro(tabla, id) {
    var registro = EcoData.obtener(tabla, id);
    if (!registro) return;

    var etiqueta = tabla === 'consumos' ? etiquetaConsumo(registro) : etiquetaDe(registro);
    var mensaje = 'Se eliminara el registro "' + etiqueta + '". Esta accion no se puede deshacer.';

    if (tabla === 'usuarios') {
      if (registro.id === adminActual.id) { avisar('No puede eliminar la cuenta con la que inicio sesion.'); return; }
      if (registro.rol === 'admin') {
        var administradores = EcoData.listar('usuarios').filter(function (u) { return u.rol === 'admin'; });
        if (administradores.length <= 1) {
          avisar('No se puede eliminar la unica cuenta de administrador del sistema.');
          return;
        }
      }
      mensaje = 'Se eliminara el usuario "' + etiqueta + '" junto con su hogar, lecturas, notificaciones, ' +
                'retos, insignias y publicaciones. Esta accion no se puede deshacer.';
    }

    if (tabla === 'zonas') {
      var hogares = hogaresEnZona(registro.nombre);
      if (hogares) {
        avisar('No se puede eliminar la zona "' + registro.nombre + '": tiene ' + hogares +
               ' hogar(es) registrado(s). Desactivela en su lugar.');
        return;
      }
      mensaje = 'Se eliminara la zona "' + registro.nombre + '" y sus tarifas. Esta accion no se puede deshacer.';
    }

    if (tabla === 'retos') {
      var participaciones = EcoData.listar('retosUsuario').filter(function (p) { return p.retoId === id; }).length;
      if (participaciones) {
        mensaje = 'El reto "' + etiqueta + '" tiene ' + participaciones + ' participacion(es). Si lo elimina, ' +
                  'se borraran y los usuarios perderan esos puntos. Se recomienda desactivarlo. Eliminar de todos modos?';
      }
    }

    if (tabla === 'tarifas') {
      mensaje += ' Los hogares de esa zona usaran los valores base nacionales hasta que cree otra tarifa.';
    }

    if (!confirm(mensaje)) return;

    EcoData.eliminar(tabla, id);
    if (tabla === 'zonas') {
      EcoData.guardarTabla('tarifas', EcoData.listar('tarifas').filter(function (t) { return t.zona !== registro.nombre; }));
    }

    EcoData.registrarAuditoria(adminActual.usuario, 'Eliminacion', tabla, 'Se elimino el registro: ' + etiqueta);
    avisar('Registro eliminado.');
    refrescarTodo();
  }

  // HU16: bloquear / desbloquear. Desbloquear reinicia los intentos fallidos.
  function alternarBloqueo(id) {
    var u = EcoData.obtener('usuarios', id);
    if (!u) return;
    if (u.id === adminActual.id) { avisar('No puede bloquear su propia cuenta.'); return; }

    var bloquear = u.activo !== false;
    if (bloquear && !confirm('Se bloqueara la cuenta "' + u.usuario + '". No podra iniciar sesion ' +
                             'y, si tiene una sesion abierta, se cerrara. Continuar?')) return;

    EcoData.actualizar('usuarios', id, { activo: !bloquear, intentosFallidos: 0 });
    EcoData.registrarAuditoria(adminActual.usuario, bloquear ? 'Bloqueo' : 'Desbloqueo', 'usuarios',
      bloquear ? 'Se bloqueo la cuenta: ' + u.usuario
               : 'Se desbloqueo la cuenta: ' + u.usuario + ' (intentos fallidos reiniciados a 0)');
    avisar(bloquear ? 'Cuenta bloqueada.' : 'Cuenta desbloqueada.');
    renderUsuarios();
    renderAuditoria();
  }

  /* =======================================================================
     9. EXPORTACION A CSV
     ======================================================================= */

  function exportar(tabla) {
    var filas = EcoData.listar(tabla);
    if (!filas.length) { avisar('No hay datos para exportar.'); return; }

    // Se aplanan los objetos anidados (por ejemplo hogar.zona) en columnas.
    function aplanar(objeto, prefijo, destino) {
      Object.keys(objeto).forEach(function (clave) {
        var valor = objeto[clave];
        var nombre = prefijo ? prefijo + '.' + clave : clave;
        if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
          aplanar(valor, nombre, destino);
        } else {
          destino[nombre] = Array.isArray(valor) ? valor.join(' | ') : valor;
        }
      });
      return destino;
    }

    // Las contrasenas nunca salen del sistema.
    var planas = filas.map(function (f) {
      var copia = Object.assign({}, f);
      delete copia.contrasena;
      return aplanar(copia, '', {});
    });

    var columnas = [];
    planas.forEach(function (f) {
      Object.keys(f).forEach(function (c) { if (columnas.indexOf(c) === -1) columnas.push(c); });
    });

    var lineas = [columnas.join(';')];
    planas.forEach(function (f) {
      lineas.push(columnas.map(function (c) {
        var v = f[c] === undefined || f[c] === null ? '' : String(f[c]);
        return '"' + v.replace(/"/g, '""') + '"';
      }).join(';'));
    });

    // El BOM permite que Excel abra el archivo con los acentos correctos.
    var blob = new Blob(['\ufeff' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'ecogasto-' + tabla + '.csv';
    enlace.click();
    URL.revokeObjectURL(url);

    EcoData.registrarAuditoria(adminActual.usuario, 'Exportacion', tabla,
      'Se descargaron ' + filas.length + ' registros en formato CSV');
    avisar('Archivo descargado.');
    renderAuditoria();
  }

  /* =======================================================================
     10. ENLACE DE EVENTOS
     ======================================================================= */

  function conectarEventos() {

    $('FormAcceso').addEventListener('submit', iniciarSesion);
    $('BtnSalir').addEventListener('click', cerrarSesion);

    $$('.lateral nav button').forEach(function (boton) {
      boton.addEventListener('click', function () { cambiarVista(boton.dataset.vista); });
    });

    $('BtnRecalcular').addEventListener('click', function () {
      dibujarResumen();
      avisar('Estadisticas recalculadas con los datos vigentes.');
    });

    // Filtros
    $('FiltroVistaConsumo').addEventListener('change', function () {
      dibujarDistribucion(EcoData.distribucionConsumo());
    });
    $('FiltroRecursoSerie').addEventListener('change', dibujarSerie);

    ['BuscarUsuarios', 'FiltroZonaUsuarios', 'FiltroSegmentoUsuarios'].forEach(function (id) {
      $(id).addEventListener('input', function () { paginas.usuarios = 1; renderUsuarios(); });
    });
    ['BuscarConsumos', 'FiltroRecursoConsumos', 'FiltroMesConsumos'].forEach(function (id) {
      $(id).addEventListener('input', function () { paginas.consumos = 1; renderConsumos(); });
    });
    ['BuscarTips', 'FiltroRecursoTips'].forEach(function (id) {
      $(id).addEventListener('input', renderTips);
    });
    $('BuscarAuditoria').addEventListener('input', function () { paginas.auditoria = 1; renderAuditoria(); });

    // Un unico escuchador para todos los botones de las tablas.
    document.addEventListener('click', function (e) {
      var boton = e.target.closest('button');
      if (!boton) return;

      if (boton.dataset.nuevo)    abrirModal(boton.dataset.nuevo, null);
      if (boton.dataset.editar)   abrirModal(boton.dataset.editar, boton.dataset.id);
      if (boton.dataset.eliminar) eliminarRegistro(boton.dataset.eliminar, boton.dataset.id);
      if (boton.dataset.bloquear) alternarBloqueo(boton.dataset.bloquear);
      if (boton.dataset.exportar) exportar(boton.dataset.exportar);

      if (boton.dataset.pagina) {
        var clave = boton.dataset.pagina;
        paginas[clave] += Number(boton.dataset.salto);
        if (paginas[clave] < 1) paginas[clave] = 1;
        if (clave === 'usuarios')  renderUsuarios();
        if (clave === 'consumos')  renderConsumos();
        if (clave === 'auditoria') renderAuditoria();
      }
    });

    // Modal
    $('ModalForm').addEventListener('submit', guardarModal);
    $('ModalCerrar').addEventListener('click', cerrarModal);
    $('ModalCancelar').addEventListener('click', cerrarModal);
    $('Modal').addEventListener('click', function (e) {
      if (e.target === $('Modal')) cerrarModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && $('Modal').classList.contains('visible')) cerrarModal();
    });

    // Restablecer la demostracion
    $('BtnReiniciarDatos').addEventListener('click', function () {
      if (!confirm('Se borraran todos los registros y se volvera a generar la poblacion de ' +
                   'demostracion. Las cuentas creadas desde la web tambien se perderan. Continuar?')) return;
      EcoData.reiniciar();
      adminActual = EcoData.listar('usuarios').find(function (u) { return u.rol === 'admin'; }) || adminActual;
      EcoData.registrarAuditoria(adminActual.usuario, 'Restablecimiento', 'todas',
        'Se regeneraron los datos de demostracion');
      refrescarTodo();
      avisar('Datos de demostracion restablecidos.');
    });

    // Sincronizacion: si en otra pestana un usuario registra lecturas, publica
    // o se registra, el panel se actualiza sin recargar.
    var claves = ['usuariosEco', 'ecoZonas', 'ecoTarifas', 'ecoConsumos', 'ecoTips', 'ecoRetos', 'ecoAuditoria',
                  'ecoNotificaciones', 'ecoRecomendaciones', 'ecoRetosUsuario', 'ecoPublicaciones'];
    var espera = null;
    window.addEventListener('storage', function (e) {
      if (!adminActual) return;
      if (e.key !== null && claves.indexOf(e.key) === -1) return;
      clearTimeout(espera);
      espera = setTimeout(function () {
        var vigente = EcoData.obtener('usuarios', adminActual.id);
        if (!vigente || vigente.rol !== 'admin' || vigente.activo === false) { cerrarSesion(); return; }
        if ($('Modal').classList.contains('visible')) return;     // no interrumpe un formulario abierto
        refrescarTodo();
      }, 300);
    });
  }

  /* =======================================================================
     11. ARRANQUE
     ======================================================================= */

  document.addEventListener('DOMContentLoaded', function () {
    EcoData.inicializar();
    conectarEventos();

    // Si ya habia una sesion abierta en esta pestana (o el admin entro desde
    // la pagina principal), se entra directamente.
    if (restaurarSesion()) {
      abrirPanel();
    } else {
      $('acceso-usuario').focus();
    }
  });

})();
