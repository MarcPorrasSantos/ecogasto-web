(function () {
  'use strict';

 
  const DURACION_SESION_MS = 8 * 60 * 60 * 1000;      
  const CLAVE_SESION = 'usuarioLogueado';
  const CLAVE_MENSAJE = 'ecoMensajeLogin';

 
  const CONFIG_IA = {
    apiKey: '',
    modelo: 'gemini-2.5-flash',       
    tiempoMaximo: 12000
  };

  const ICONOS = { Agua: '💧', Luz: '⚡', Gas: '🔥', Transporte: '🚌' };

  const MESES_LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
                        'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const COLOR = {
    verde: '#2E7D32',
    verdeClaro: 'rgba(76, 175, 80, 0.18)',
    azul: '#03A9F4',
    amarillo: '#FFC107',
    rojo: '#C62828'
  };

  const HOY = new Date();
  const ANIO_ACTUAL = HOY.getFullYear();
  const MES_ACTUAL = HOY.getMonth();            


  let usuario = null;               
  let vistaActual = 'consumo';
  let recursoSeleccionado = null;   
  let anioPreferido = null;
  let tipActual = null;            
  let generandoTip = false;
  let comparacionVisible = false;
  let hogarPrimeraVez = false;
  let selectoresListos = false;
  const graficos = {};

 

  const $ = id => document.getElementById(id);
  const hayChart = () => typeof Chart !== 'undefined';

  
  function limpiar(valor) {
    return String(valor === undefined || valor === null ? '' : valor)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmt(n, decimales) {
    const d = decimales === undefined ? 1 : decimales;
    return Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function soles(n) { return 'S/ ' + fmt(n, 2); }


  function conSigno(pct) {
    if (pct > 0) return '+' + fmt(pct, 1) + '%';
    if (pct < 0) return '−' + fmt(Math.abs(pct), 1) + '%';
    return '0.0%';
  }

  function enumerar(lista) {
    if (lista.length <= 1) return lista.join('');
    return lista.slice(0, -1).join(', ') + ' y ' + lista[lista.length - 1];
  }

  function recortar(texto, max) {
    const t = String(texto || '').trim();
    if (t.length <= max) return t;
    const corte = t.slice(0, max);
    const punto = corte.lastIndexOf('.');
    return punto > max * 0.6 ? corte.slice(0, punto + 1) : corte.slice(0, max - 1) + '…';
  }


  function acentuar(texto) {
    return String(texto).replace(/\banio\b/g, 'año').replace(/informacion/g, 'información');
  }

  function mesLargo(mes) { return MESES_LARGOS[EcoData.MESES.indexOf(mes)] || mes; }
  function etiquetaPeriodo(anio, mes) { return mesLargo(mes) + ' ' + anio; }
  function periodo(c) { return EcoData.periodoDe(c.anio, c.mes); }
  function periodoActual() { return ANIO_ACTUAL * 100 + MES_ACTUAL + 1; }
  function ordenRecurso(a, b) { return EcoData.RECURSOS.indexOf(a.recurso) - EcoData.RECURSOS.indexOf(b.recurso); }

  function fechaCorta(valor) {
    const d = new Date(valor);
    return isNaN(d) ? String(valor || '') : d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function fechaLarga(valor) {
    const d = new Date(valor);
    return isNaN(d) ? String(valor || '')
      : d.toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

 
  function mensaje(id, tipo, texto) {
    const el = $(id);
    if (!el) return;
    el.className = 'form-msg' + (tipo ? ' ' + tipo : '');
    el.textContent = texto || '';
  }

  let temporizadorToast = null;
  function toast(texto, tipo) {
    const t = $('toastUsuario');
    if (!t) return;
    t.textContent = texto;
    t.className = 'toast-usuario visible' + (tipo ? ' ' + tipo : '');
    clearTimeout(temporizadorToast);
    temporizadorToast = setTimeout(() => t.classList.remove('visible'), tipo === 'alerta' ? 6500 : 3500);
  }

  function destruirGrafico(clave) {
    if (graficos[clave]) { graficos[clave].destroy(); delete graficos[clave]; }
  }


  function avisarCambio() { document.dispatchEvent(new CustomEvent('eco:datos')); }

  function kpi(valor, etiqueta, modificador) {
    return '<div class="kpi' + (modificador ? ' kpi--' + modificador : '') + '">' +
             '<div class="kpi-valor">' + valor + '</div>' +
             '<div class="kpi-etiqueta">' + etiqueta + '</div>' +
           '</div>';
  }

  

  function hogar() { return usuario && usuario.hogar ? usuario.hogar : null; }

  function serviciosHogar() {
    const h = hogar();
    return h ? EcoData.RECURSOS.filter(r => (h.servicios || []).indexOf(r) !== -1) : [];
  }

  function misConsumos() {
    return EcoData.listar('consumos').filter(c => c.usuarioId === usuario.id);
  }

  function ultimaDe(lista, recurso) {
    return lista.filter(c => c.recurso === recurso).sort((a, b) => periodo(b) - periodo(a))[0] || null;
  }

 
  function periodosDe(lista) {
    const mapa = {};
    lista.forEach(c => { const k = periodo(c); mapa[k] = { clave: k, anio: Number(c.anio), mes: c.mes }; });
    return Object.keys(mapa).map(k => mapa[k]).sort((a, b) => b.clave - a.clave);
  }

 
  function nivelDe(valor, recurso, zona) {
    const u = EcoData.umbralesDe(recurso, zona);
    if (valor >= u.umbralAlto) return { clase: 'alto', texto: 'Alto' };
    if (valor <= u.umbralBajo) return { clase: 'bajo', texto: 'Bajo' };
    return { clase: 'moderado', texto: 'Moderado' };
  }

  function misNotificaciones() {
    return EcoData.listar('notificaciones')
      .filter(n => n.usuarioId === usuario.id)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));     // HU09 CA1
  }

  function llenarSelectPeriodos(id, periodos) {
    const sel = $(id);
    const actual = sel.value;
    sel.innerHTML = periodos.map(p =>
      '<option value="' + p.clave + '">' + etiquetaPeriodo(p.anio, p.mes) + '</option>').join('');
    if (periodos.some(p => String(p.clave) === actual)) sel.value = actual;
  }

  

  function leerSesion() {
    try { return JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null'); }
    catch (err) { return null; }
  }

  function guardarSesion(u) {
    const expira = Date.now() + DURACION_SESION_MS;
    const carga = JSON.stringify({ sub: u.usuario, rol: u.rol, exp: Math.floor(expira / 1000) });
    const token = 'eco.' + btoa(String.fromCharCode.apply(null, new TextEncoder().encode(carga)));
    localStorage.setItem(CLAVE_SESION, JSON.stringify({
      id: u.id, nombre: u.usuario, rol: u.rol, token: token, inicio: Date.now(), expira: expira
    }));
  }

  function validarSesion() {
    const s = leerSesion();
    if (!s || !s.id || !s.expira) return { ok: false };
    if (Date.now() > s.expira) {
      return { ok: false, mensaje: 'Tu sesión expiró (duración máxima: 8 horas). Vuelve a iniciar sesión.' };
    }
    const u = EcoData.obtener('usuarios', s.id);
    if (!u) return { ok: false, mensaje: 'Tu cuenta ya no existe. Comunícate con el administrador.' };
    if (u.activo === false) {
      return { ok: false, mensaje: 'Tu cuenta fue bloqueada. Comunícate con el administrador para desbloquearla.' };
    }
    return { ok: true, usuario: u };
  }

  
  function comprobarSesionActiva() {
    if (!usuario) return false;
    const v = validarSesion();
    if (!v.ok) { cerrarSesion(v.mensaje, 'error'); return false; }
    usuario = v.usuario;
    return true;
  }

  function cerrarSesion(texto, tipo) {
    localStorage.removeItem(CLAVE_SESION);
    if (texto) sessionStorage.setItem(CLAVE_MENSAJE, JSON.stringify({ texto: texto, tipo: tipo || 'info' }));
    window.location.href = window.location.pathname + window.location.search;
  }

  function mostrarMensajeLogin(texto, tipo) {
    document.querySelector('#SesionEcoGasto .container').classList.remove('active');
    mensaje('msg-login', tipo || 'info', texto);
    setTimeout(() => $('SesionEcoGasto').scrollIntoView({ behavior: 'smooth' }), 150);
  }

  const DEMO = {
    Agua: [168, 172, 160, 155, 149, 151],
    Luz:  [98, 95, 92, 101, 104, 96],
    Gas:  [14, 13, 15, 16, 17, 15]
  };

  function abrirGraficoDemo(recurso) {
    if (!hayChart() || !DEMO[recurso]) return;
    const ref = EcoData.umbralesDe(recurso, 'Costa');
    const unidad = EcoData.UNIDADES[recurso];
    const meses = EcoData.MESES.slice(0, 6).map(mesLargo);

    $('TituloGraficoDemo').textContent = 'Ejemplo: consumo mensual de ' + recurso + ' (' + unidad + ')';
    $('GraficoDemo').style.display = 'block';

    destruirGrafico('demo');
    graficos.demo = new Chart($('graficoDemo'), {
      type: 'line',
      data: {
        labels: meses,
        datasets: [
          { label: 'Hogar de ejemplo (Costa)', data: DEMO[recurso], borderColor: COLOR.verde,
            backgroundColor: COLOR.verdeClaro, fill: true, tension: 0.3, borderWidth: 2 },
          { label: 'Promedio nacional de referencia', data: meses.map(() => ref.promedioNacional),
            borderColor: COLOR.azul, borderDash: [6, 5], pointRadius: 0, borderWidth: 2, fill: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, title: { display: true, text: unidad } } },
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  function cerrarGraficoDemo() {
    $('GraficoDemo').style.display = 'none';
    destruirGrafico('demo');
  }

  function panelRegistro(abrir) {
    document.querySelector('#SesionEcoGasto .container').classList.toggle('active', abrir);
  }

  function iniciarLanding() {
  
    $('GraficoDemo').style.animation = 'none';

    const btnConsumo = document.querySelector('.BotonesXconsumo .btn1');
    if (btnConsumo) {
      btnConsumo.addEventListener('click', e => {
        e.preventDefault();
        $('ImgConsumo').classList.add('ocultar');
        $('DetalleConsumo').classList.add('mostrar');
        $('DetalleTarjetas').classList.add('mostrar');
      });
    }

    document.querySelectorAll('.BotonesXconsumo .btn2, .BotonesXconsumo .btn3, .BotonesXconsumo .btn4')
      .forEach(b => b.addEventListener('click', e => {
        e.preventDefault();
        $('AlertaRegistro').style.display = 'flex';
      }));

    $('IrARegistro').addEventListener('click', () => {
      $('AlertaRegistro').style.display = 'none';
      panelRegistro(true);
      $('SesionEcoGasto').scrollIntoView({ behavior: 'smooth' });
    });
    $('CerrarAlertaRegistro').addEventListener('click', () => { $('AlertaRegistro').style.display = 'none'; });

    document.querySelectorAll('#DetalleTarjetas .TarjetaConsumo')
      .forEach(t => t.addEventListener('click', () => abrirGraficoDemo(t.dataset.recurso)));
    $('CerrarGraficoDemo').addEventListener('click', cerrarGraficoDemo);

  
    document.querySelector('.register-btn').addEventListener('click', () => panelRegistro(true));
    document.querySelector('.login-btn').addEventListener('click', () => panelRegistro(false));
    document.querySelectorAll('.nav-links a[href="#SesionEcoGasto"], .BtnEmpCambio')
      .forEach(a => a.addEventListener('click', () => panelRegistro(true)));
    const avatar = document.querySelector('.ContenedorFotoPerfil');
    if (avatar) avatar.addEventListener('click', () => panelRegistro(false));

    $('linkTerminos').addEventListener('click', e => { e.preventDefault(); $('ModalTerminos').style.display = 'flex'; });
    $('btnCerrarTerminos').addEventListener('click', () => { $('ModalTerminos').style.display = 'none'; });

    $('linkOlvide').addEventListener('click', e => {
      e.preventDefault();
      mensaje('msg-login', 'info', 'Para restablecer tu contraseña comunícate con el administrador de EcoGasto.');
    });
  }


  function iniciarRegistro() {
    $('registerForm').addEventListener('submit', e => {
      e.preventDefault();

      ['err-usuario', 'err-email', 'err-contrasena', 'err-confirmar', 'err-terms']
        .forEach(id => { $(id).textContent = ''; });
      $('reg-success').hidden = true;

      const nombre    = $('registro-usuario').value.trim();
      const email     = $('registro-email').value.trim();
      const clave     = $('registro-contrasena').value;
      const confirmar = $('registro-confirmar').value;
      const terminos  = $('registro-terms').checked;
      const usuarios  = EcoData.listar('usuarios');

      let valido = true;
      const error = (id, texto) => { $(id).textContent = texto; valido = false; };

     
      if (!nombre) error('err-usuario', 'El usuario es obligatorio.');
      else if (nombre.length < 4 || nombre.length > 40) error('err-usuario', 'Debe tener entre 4 y 40 caracteres.');
      else if (usuarios.some(u => String(u.usuario).toLowerCase() === nombre.toLowerCase())) {
        error('err-usuario', 'Ese usuario ya existe.');
      }
    
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error('err-email', 'Email inválido.');
      else if (usuarios.some(u => String(u.email || '').toLowerCase() === email.toLowerCase())) {
        error('err-email', 'Ese email ya está registrado.');
      }
   
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(clave)) {
        error('err-contrasena', 'Mínimo 8 caracteres, con mayúscula, minúscula y número.');
      }
      if (clave !== confirmar) error('err-confirmar', 'Las contraseñas no coinciden.');
      if (!terminos) error('err-terms', 'Debes aceptar los términos y condiciones.');
      if (!valido) return;

      const nuevo = EcoData.agregar('usuarios', {
        usuario: nombre,
        nombreCompleto: nombre,
        email: email,
        contrasena: clave,
        rol: 'usuario',
        segmento: 'Joven independiente',
        fechaRegistro: new Date().toLocaleDateString('es-PE'),
        simulado: false,
        activo: true,
        intentosFallidos: 0,
        hogar: null
      }, 'usr-web');

      EcoData.preferenciasDe(nuevo.id);

      $('registerForm').reset();
      $('reg-success').hidden = false;

      setTimeout(() => {
        $('reg-success').hidden = true;
        panelRegistro(false);
        $('login-usuario').value = nombre;
        mensaje('msg-login', 'ok', 'Cuenta creada. Ingresa tu contraseña para continuar.');
        $('login-contrasena').focus();
      }, 1400);
    });
  }

 
  function iniciarLogin() {
    $('loginForm').addEventListener('submit', e => {
      e.preventDefault();

      const nombre = $('login-usuario').value.trim();
      const clave = $('login-contrasena').value;

      if (!nombre || !clave) {                                        // CA1
        mensaje('msg-login', 'error', 'Usuario y contraseña son obligatorios.');
        return;
      }

      const r = EcoData.autenticar(nombre, clave);

      if (!r.ok) {
        $('login-contrasena').value = '';

        if (r.motivo === 'bloqueado') {                               // CA3
          mensaje('msg-login', 'error', r.recienBloqueado
            ? 'Superaste los 5 intentos permitidos. Tu cuenta quedó bloqueada; comunícate con el administrador.'
            : 'Tu cuenta está bloqueada. Comunícate con el administrador.');
          EcoData.registrarAuditoria(nombre,
            r.recienBloqueado ? 'Bloqueo de cuenta' : 'Acceso denegado', 'usuarios',
            r.recienBloqueado ? 'Cuenta bloqueada tras 5 intentos fallidos' : 'Intento de ingreso con la cuenta bloqueada');
        } else {
          const restantes = r.intentos ? EcoData.MAX_INTENTOS - r.intentos : 0;
          mensaje('msg-login', 'error', 'Usuario o contraseña incorrectos.' +
            (restantes ? ' Te quedan ' + restantes + ' intento' + (restantes === 1 ? '' : 's') + '.' : ''));
          EcoData.registrarAuditoria(nombre, 'Acceso fallido', 'usuarios',
            'Credenciales invalidas desde la pagina principal' +
            (r.intentos ? ' (intento ' + r.intentos + ' de ' + EcoData.MAX_INTENTOS + ')' : ''));
        }
        return;
      }

      const u = r.usuario;


      if (u.rol === 'admin') {
        sessionStorage.setItem('ecoAdminSesion', JSON.stringify({
          usuario: u.usuario, nombre: u.nombreCompleto, inicio: EcoData.ahora()
        }));
        EcoData.registrarAuditoria(u.usuario, 'Inicio de sesion', 'usuarios', 'Acceso concedido desde la pagina principal');
        window.location.href = 'Admin.html';
        return;
      }

      guardarSesion(u);
      $('loginForm').reset();
      mensaje('msg-login', '', '');
      entrar();
    });
  }

  function entrar() {
    const v = validarSesion();
    if (!v.ok) {
      localStorage.removeItem(CLAVE_SESION);
      if (v.mensaje) mostrarMensajeLogin(v.mensaje, 'error');
      return;
    }
    usuario = v.usuario;

    if (!usuario.hogar) { abrirModalHogar(true); return; }
    mostrarApp();
  }

  function mostrarApp() {
    $('MenuLanding').style.display = 'none';
    document.querySelector('main').style.display = 'none';
    $('AlertaRegistro').style.display = 'none';
    cerrarGraficoDemo();
    $('PrincipalEcoGasto').style.display = 'block';
    $('nombreUsuarioBarra').textContent = usuario.usuario;
    window.scrollTo(0, 0);

    llenarSelectoresFijos();
    revisarRecordatorioSemanal();
    mostrarVista('consumo');
    actualizarContador();
    avisarCambio();
  }


  function abrirModalHogar(primeraVez) {
    hogarPrimeraVez = primeraVez;
    cerrarMenu();

    const h = usuario.hogar || {};
    const zonasActivas = EcoData.listar('zonas').filter(z => z.activa);   // CA2
    const zonaVigente = zonasActivas.some(z => z.nombre === h.zona);

    $('tituloHogar').textContent = primeraVez ? '🏡 Información de tu hogar' : '🏡 Editar mi hogar';
    $('btnGuardarHogar').textContent = primeraVez ? 'Guardar y continuar' : 'Guardar cambios';
    $('btnCancelarHogar').textContent = primeraVez ? 'Cerrar sesión' : 'Cancelar';

    $('hogarZona').innerHTML = '<option value="">Elige tu zona</option>' +
      zonasActivas.map(z => '<option value="' + limpiar(z.nombre) + '">' + limpiar(z.nombre) + '</option>').join('');
    $('hogarZona').value = zonaVigente ? h.zona : '';

    $('hogarServicios').innerHTML = EcoData.RECURSOS.map(r =>
      '<label><input type="checkbox" value="' + r + '"' +
      ((h.servicios || []).indexOf(r) !== -1 ? ' checked' : '') + '> ' + ICONOS[r] + ' ' + r + '</label>').join('');

    $('esPadre').checked = !!h.esPadre;
    $('hogarPersonas').value = h.personas || '';

    mensaje('msg-hogar', '', '');
    if (h.zona && !zonaVigente) {
      mensaje('msg-hogar', 'info', 'La zona "' + h.zona + '" fue desactivada por el administrador. Elige otra.');
    }
    if (!zonasActivas.length) mensaje('msg-hogar', 'error', 'No hay zonas activas. Comunícate con el administrador.');

    $('FormularioHogarModal').style.display = 'flex';
    $('hogarPersonas').focus();
  }

  function guardarHogar(e) {
    e.preventDefault();
    if (!comprobarSesionActiva()) return;

    const personas = Number($('hogarPersonas').value);
    const zona = $('hogarZona').value;
    const esPadre = $('esPadre').checked;
    const servicios = Array.prototype.slice.call($('hogarServicios').querySelectorAll('input:checked'))
      .map(i => i.value);
    const zonasActivas = EcoData.listar('zonas').filter(z => z.activa).map(z => z.nombre);

    if (!Number.isInteger(personas) || personas < 1 || personas > 20) {             // CA1
      mensaje('msg-hogar', 'error', 'El número de personas debe ser un entero entre 1 y 20.');
      return;
    }
    if (zonasActivas.indexOf(zona) === -1) {                                          // CA2
      mensaje('msg-hogar', 'error', 'Elige una zona activa.');
      return;
    }
    if (!servicios.length) {                                                          // CA3
      mensaje('msg-hogar', 'error', 'Marca al menos un servicio disponible.');
      return;
    }

    usuario = EcoData.actualizar('usuarios', usuario.id, {
      hogar: {
        esPadre: esPadre,
        personas: personas,
        zona: zona,
        servicios: servicios,
        fechaActualizacion: new Date().toISOString().slice(0, 10)
      },
      segmento: esPadre ? 'Padre de familia' : 'Joven independiente'
    });

    $('FormularioHogarModal').style.display = 'none';

    if (hogarPrimeraVez) {
      hogarPrimeraVez = false;
      mostrarApp();
      toast('¡Listo! Ahora registra tu primera lectura de consumo.');
    } else {
      toast('Datos del hogar actualizados.');
      refrescarVistaActual();
      avisarCambio();
    }
  }


  const RENDER = {
    consumo: renderConsumo,
    impacto: renderImpacto,
    tips: abrirTips,
    comparar: renderComparar,
    estadisticas: renderEstadisticas,
    notificaciones: renderNotificaciones,
    preferencias: cargarPreferencias
  };

  function mostrarVista(nombre) {
    if (!comprobarSesionActiva()) return;
    if (!usuario.hogar) { abrirModalHogar(true); return; }
    if (!RENDER[nombre]) nombre = 'consumo';

    vistaActual = nombre;
    document.querySelectorAll('#PrincipalEcoGasto .app-vista')
      .forEach(v => v.classList.toggle('activa', v.dataset.vista === nombre));
    document.querySelectorAll('.app-nav [data-ir]')
      .forEach(b => b.classList.toggle('activo', b.dataset.ir === nombre));

    cerrarMenu();
    window.scrollTo(0, 0);
    RENDER[nombre]();
  }

 
  function refrescarVistaActual() {
    if (!usuario || !usuario.hogar) return;
    if (vistaActual === 'tips') renderListasTips();
    else if (vistaActual !== 'preferencias') RENDER[vistaActual]();
    actualizarContador();
  }

  function cerrarMenu() {
    $('menu-items').classList.add('oculto');
    $('toggle-menu').setAttribute('aria-expanded', 'false');
  }


  function renderConsumo() {
    const h = hogar();
    const servicios = serviciosHogar();
    const mis = misConsumos();
    const zonaActiva = EcoData.listar('zonas').some(z => z.nombre === h.zona && z.activa);

    $('saludoNombre').textContent = usuario.nombreCompleto || usuario.usuario;
    $('resumenHogar').textContent = 'Zona ' + h.zona + ' · ' + h.personas + ' persona' +
      (Number(h.personas) === 1 ? '' : 's') + ' · ' + usuario.segmento +
      ' · Servicios: ' + (servicios.join(', ') || 'ninguno');

    const aviso = $('avisoConsumo');
    if (!zonaActiva) {
      aviso.className = 'aviso-app aviso-app--alerta';
      aviso.textContent = 'La zona ' + h.zona + ' fue desactivada por el administrador. Actualiza la información de tu hogar.';
      aviso.hidden = false;
    } else if (!mis.length) {
      aviso.className = 'aviso-app';
      aviso.textContent = 'Registra tu primera lectura para ver tu gráfico, tu impacto ambiental y tu Eco Tip personalizado.';
      aviso.hidden = false;
    } else {
      aviso.hidden = true;
    }

    if (!recursoSeleccionado || servicios.indexOf(recursoSeleccionado) === -1) {
      recursoSeleccionado = servicios.find(r => mis.some(c => c.recurso === r)) || servicios[0] || null;
    }

    renderKpisConsumo(mis);
    renderTarjetas(mis, servicios);
    prepararFormLectura(servicios);
    prepararSelectGrafico(servicios, mis);
    renderGrafico();
    renderHistorial(mis);
  }

  function renderKpisConsumo(mis) {
    const ult = periodosDe(mis)[0];
    const sinLeer = misNotificaciones().filter(n => !n.leida).length;

    if (!ult) {
      $('kpisConsumo').innerHTML =
        kpi('—', 'Último mes registrado') +
        kpi('S/ —', 'Gasto estimado de ese mes', 'amarillo') +
        kpi('—', 'Servicios con consumo alto en tu zona', 'azul') +
        kpi(sinLeer, 'Notificaciones sin leer', sinLeer ? 'rojo' : '');
      return;
    }

    const delMes = mis.filter(c => periodo(c) === ult.clave);
    const gasto = delMes.reduce((a, c) => a + EcoData.costoDe(c, usuario), 0);
    const altos = delMes.filter(c => nivelDe(c.valor, c.recurso, hogar().zona).clase === 'alto').map(c => c.recurso);

    $('kpisConsumo').innerHTML =
      kpi(etiquetaPeriodo(ult.anio, ult.mes), 'Último mes registrado') +
      kpi(soles(gasto), 'Gasto estimado de ese mes', 'amarillo') +
      kpi(altos.length ? limpiar(altos.join(', ')) : 'Ninguno', 'Servicios con consumo alto en tu zona', altos.length ? 'rojo' : 'azul') +
      kpi(sinLeer, 'Notificaciones sin leer', sinLeer ? 'rojo' : '');
  }

  function renderTarjetas(mis, servicios) {
    const h = hogar();

    $('TarjetasRecursos').innerHTML = EcoData.RECURSOS.map(r => {
      const cabecera = '<div class="rc-cabecera"><span class="rc-nombre">' + r + '</span>' +
                       '<span class="rc-icono">' + ICONOS[r] + '</span></div>';

      if (servicios.indexOf(r) === -1) {
        return '<article class="recurso-card sin-servicio">' + cabecera +
          '<div class="rc-detalle">Tu hogar no cuenta con este servicio.</div>' +
          '<div class="rc-acciones"><button type="button" class="btn-app btn-app--claro btn-app--pequeno" data-editar-hogar>' +
          'Actualizar hogar</button></div></article>';
      }

      const u = ultimaDe(mis, r);
      let cuerpo = '<div class="rc-detalle">Aún no registras lecturas.</div>';
      if (u) {
        const n = nivelDe(u.valor, r, h.zona);
        cuerpo =
          '<div class="rc-valor">' + fmt(u.valor, 1) + ' <small class="unidad">' + limpiar(EcoData.UNIDADES[r]) + '</small></div>' +
          '<div class="rc-detalle">' + etiquetaPeriodo(u.anio, u.mes) + ' · ' + soles(EcoData.costoDe(u, usuario)) + '</div>' +
          '<div><span class="nivel nivel--' + n.clase + '">Consumo ' + n.texto.toLowerCase() + '</span></div>';
      }

      return '<article class="recurso-card' + (r === recursoSeleccionado ? ' seleccionada' : '') + '" data-recurso="' + r +
        '" tabindex="0" aria-label="Ver el gráfico de ' + r + '">' + cabecera + cuerpo +
        '<div class="rc-acciones"><button type="button" class="btn-app btn-app--pequeno" data-registrar="' + r + '">' +
        '+ Registrar lectura</button></div></article>';
    }).join('');
  }

  function seleccionarRecurso(r) {
    if (serviciosHogar().indexOf(r) === -1) return;
    recursoSeleccionado = r;
    document.querySelectorAll('#TarjetasRecursos .recurso-card[data-recurso]')
      .forEach(c => c.classList.toggle('seleccionada', c.dataset.recurso === r));
    $('recursoGrafico').value = r;
    llenarAniosGrafico(misConsumos());
    renderGrafico();

    // Si el formulario esta libre, se prepara para ese servicio.
    if (!$('lecturaId').value && !$('lecturaValor').value) {
      $('lecturaRecurso').value = r;
      aplicarPeriodoSugerido();
      actualizarAyudaLectura();
    }
  }


  function prepararSelectGrafico(servicios, mis) {
    $('recursoGrafico').innerHTML = servicios.map(r =>
      '<option value="' + r + '">' + ICONOS[r] + ' ' + r + '</option>').join('');
    if (recursoSeleccionado) $('recursoGrafico').value = recursoSeleccionado;
    llenarAniosGrafico(mis);
  }

  function llenarAniosGrafico(mis) {
    const anios = mis.filter(c => c.recurso === recursoSeleccionado).map(c => Number(c.anio))
      .filter((a, i, arr) => arr.indexOf(a) === i).sort((a, b) => b - a);
    const lista = anios.length ? anios : [ANIO_ACTUAL];
    $('anioGrafico').innerHTML = lista.map(a => '<option value="' + a + '">' + a + '</option>').join('');
    $('anioGrafico').value = lista.indexOf(anioPreferido) !== -1 ? anioPreferido : lista[0];
  }

  function renderGrafico() {
    destruirGrafico('consumo');
    const r = recursoSeleccionado;
    const anio = Number($('anioGrafico').value);

    if (!r) {
      $('graficoCaja').hidden = true;
      $('graficoVacio').hidden = false;
      return;
    }

    const h = hogar();
    const unidad = EcoData.UNIDADES[r];

    const datos = misConsumos()
      .filter(c => c.recurso === r && Number(c.anio) === anio)
      .sort((a, b) => EcoData.MESES.indexOf(a.mes) - EcoData.MESES.indexOf(b.mes));

    $('TituloGrafico').textContent = ICONOS[r] + ' Consumo mensual de ' + r + ' · ' + anio;

    if (!datos.length) {
      $('graficoCaja').hidden = true;
      $('graficoVacio').hidden = false;
      $('graficoVacioTexto').textContent = 'Aún no registras lecturas de ' + r + ' en ' + anio + '.';
      return;
    }

    $('graficoCaja').hidden = false;
    $('graficoVacio').hidden = true;
    if (!hayChart()) return;

   
    const ref = EcoData.umbralesDe(r, h.zona);

    graficos.consumo = new Chart($('graficoPorRecurso'), {
      type: 'line',
      data: {
        labels: datos.map(c => mesLargo(c.mes)),
        datasets: [
          { label: 'Tu consumo de ' + r, data: datos.map(c => c.valor), borderColor: COLOR.verde,
            backgroundColor: COLOR.verdeClaro, fill: true, tension: 0.3, borderWidth: 2, pointRadius: 4 },
        
          { label: 'Promedio nacional (' + h.zona + ')', data: datos.map(() => ref.promedioNacional),
            borderColor: COLOR.azul, borderDash: [6, 5], borderWidth: 2, pointRadius: 0, fill: false },
          { label: 'Umbral de consumo alto (' + h.zona + ')', data: datos.map(() => ref.umbralAlto),
            borderColor: COLOR.amarillo, borderDash: [2, 4], borderWidth: 2, pointRadius: 0, fill: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: { y: { beginAtZero: true, title: { display: true, text: unidad } } },      
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + fmt(ctx.parsed.y, 1) + ' ' + unidad } }
        }
      }
    });
  }



  function llenarSelectoresFijos() {
    if (selectoresListos) return;
    selectoresListos = true;
    $('lecturaMes').innerHTML = EcoData.MESES.map((m, i) =>
      '<option value="' + m + '">' + MESES_LARGOS[i] + '</option>').join('');
    $('lecturaAnio').min = EcoData.ANIO_MINIMO;
    $('lecturaAnio').max = ANIO_ACTUAL;
  }

  function prepararFormLectura(servicios) {
    if ($('lecturaId').value) return;               
    const sel = $('lecturaRecurso');
    const actual = sel.value;
    sel.innerHTML = servicios.map(r => '<option value="' + r + '">' + ICONOS[r] + ' ' + r + '</option>').join('');
    if (servicios.indexOf(actual) !== -1) sel.value = actual;
    else if (recursoSeleccionado) sel.value = recursoSeleccionado;
    if (!$('lecturaValor').value) aplicarPeriodoSugerido();
    actualizarAyudaLectura();
  }

  
  function aplicarPeriodoSugerido() {
    const u = ultimaDe(misConsumos(), $('lecturaRecurso').value);
    let anio = ANIO_ACTUAL;
    let mes = MES_ACTUAL;
    if (u) {
      let i = EcoData.MESES.indexOf(u.mes) + 1;
      let a = Number(u.anio);
      if (i > 11) { i = 0; a++; }
      if (a * 100 + i + 1 <= periodoActual()) { anio = a; mes = i; }
    }
    $('lecturaMes').value = EcoData.MESES[mes];
    $('lecturaAnio').value = anio;
  }

  function actualizarAyudaLectura() {
    const r = $('lecturaRecurso').value;
    const v = Number($('lecturaValor').value);
    $('lecturaUnidad').textContent = r ? '(' + EcoData.UNIDADES[r] + ')' : '';

    if (r && v > 0) {
      const h = hogar();
      const t = EcoData.umbralesDe(r, h.zona);
      $('lecturaCostoPreview').textContent = 'Costo estimado: ' + soles(EcoData.calcularCosto(r, v, usuario)) +
        ' · tarifa de ' + h.zona + ': S/ ' + t.tarifa + ' por unidad' +
        (r === 'Agua' ? ' (× ' + h.personas + ' personas × 30 días)' : '');
    } else {
      $('lecturaCostoPreview').textContent = '';
    }
  }

  function modoCrear(recurso) {
    $('lecturaId').value = '';
    ['lecturaRecurso', 'lecturaMes', 'lecturaAnio'].forEach(id => { $(id).disabled = false; });
    if (recurso) $('lecturaRecurso').value = recurso;
    aplicarPeriodoSugerido();
    $('lecturaValor').value = '';
    $('tituloLectura').textContent = 'Registrar lectura';
    $('btnGuardarLectura').textContent = 'Guardar lectura';
    $('btnCancelarEdicion').hidden = true;
    mensaje('msg-lectura', '', '');
    actualizarAyudaLectura();
  }

  function modoEditar(c) {
    const sel = $('lecturaRecurso');
    
    if (!Array.prototype.some.call(sel.options, o => o.value === c.recurso)) {
      sel.insertAdjacentHTML('beforeend', '<option value="' + c.recurso + '">' + ICONOS[c.recurso] + ' ' + c.recurso + '</option>');
    }
    sel.value = c.recurso;
    $('lecturaMes').value = c.mes;
    $('lecturaAnio').value = c.anio;
    $('lecturaValor').value = c.valor;
    $('lecturaId').value = c.id;
   
    ['lecturaRecurso', 'lecturaMes', 'lecturaAnio'].forEach(id => { $(id).disabled = true; });

    $('tituloLectura').textContent = 'Corregir lectura · ' + c.recurso + ' ' + etiquetaPeriodo(c.anio, c.mes);
    $('btnGuardarLectura').textContent = 'Guardar cambios';
    $('btnCancelarEdicion').hidden = false;
    mensaje('msg-lectura', '', '');
    actualizarAyudaLectura();
    $('bloqueLectura').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('lecturaValor').focus({ preventScroll: true });
  }

  function guardarLectura(e) {
    e.preventDefault();
    if (!comprobarSesionActiva()) return;

    const id = $('lecturaId').value;
    const recurso = $('lecturaRecurso').value;
    const mes = $('lecturaMes').value;
    const anio = Number($('lecturaAnio').value);
    const textoValor = $('lecturaValor').value;
    const valor = Number(textoValor);

   
    if (!recurso) { mensaje('msg-lectura', 'error', 'Elige un servicio.'); return; }
    if (!Number.isInteger(anio) || anio < EcoData.ANIO_MINIMO) {
      mensaje('msg-lectura', 'error', 'El año debe ser ' + EcoData.ANIO_MINIMO + ' o posterior.');
      return;
    }
    if (EcoData.periodoDe(anio, mes) > periodoActual()) {
      mensaje('msg-lectura', 'error', 'No se puede registrar un mes futuro.');
      return;
    }
    if (textoValor === '' || !(valor > 0)) {
      mensaje('msg-lectura', 'error', 'El valor debe ser mayor a 0.');
      return;
    }

    if (id) {
      const r = EcoData.actualizarConsumo(id, { valor: valor });
      if (!r.ok) { mensaje('msg-lectura', 'error', acentuar(r.mensaje)); return; }
      modoCrear(recurso);
      mensaje('msg-lectura', 'ok', 'Lectura corregida. Nuevo costo estimado: ' + soles(r.consumo.costoEstimado) + '.');
      toast('Lectura corregida.');
    } else {
      // Registra, calcula el costo y revisa la regla de anomalia (HU08).
      const r = EcoData.registrarConsumo({ usuarioId: usuario.id, recurso: recurso, anio: anio, mes: mes, valor: valor });
      if (!r.ok) { mensaje('msg-lectura', 'error', acentuar(r.mensaje)); return; }

      recursoSeleccionado = recurso;
      anioPreferido = anio;
      modoCrear(recurso);
      mensaje('msg-lectura', 'ok', 'Lectura de ' + recurso + ' de ' + etiquetaPeriodo(anio, mes) +
        ' guardada. Costo estimado: ' + soles(r.consumo.costoEstimado) + '.');

      if (r.alertaGenerada) {
        toast('⚠️ Consumo anómalo de ' + recurso + ': supera en más de 20% tu promedio y el umbral alto de tu zona. ' +
              'Revisa tus notificaciones.', 'alerta');
      } else {
        toast('Lectura guardada.');
      }
    }

    renderConsumo();                                 // CA4 de HU05: sin recargar
    actualizarContador();
    avisarCambio();
  }

  function renderHistorial(mis) {
    const sel = $('historialRecurso');
    const filtro = sel.value;
    const presentes = EcoData.RECURSOS.filter(r => mis.some(c => c.recurso === r));
    sel.innerHTML = '<option value="">Todos los servicios</option>' +
      presentes.map(r => '<option value="' + r + '">' + ICONOS[r] + ' ' + r + '</option>').join('');
    if (presentes.indexOf(filtro) !== -1) sel.value = filtro;

    const h = hogar();
    const filas = mis.filter(c => !sel.value || c.recurso === sel.value)
      .sort((a, b) => (periodo(b) - periodo(a)) || ordenRecurso(a, b));

    $('tablaHistorial').innerHTML = filas.length
      ? filas.map(c => {
          const n = nivelDe(c.valor, c.recurso, h.zona);
          return '<tr>' +
            '<td>' + etiquetaPeriodo(c.anio, c.mes) + '</td>' +
            '<td>' + ICONOS[c.recurso] + ' ' + c.recurso + '</td>' +
            '<td class="num">' + fmt(c.valor, 2) + '</td>' +
            '<td>' + limpiar(EcoData.UNIDADES[c.recurso]) + '</td>' +
            '<td class="num">' + soles(EcoData.costoDe(c, usuario)) + '</td>' +
            '<td><span class="nivel nivel--' + n.clase + '">' + n.texto + '</span></td>' +
            '<td><div class="acciones">' +
              '<button type="button" class="btn-app btn-app--claro btn-app--pequeno" data-editar-lectura="' + limpiar(c.id) + '">Editar</button>' +
              '<button type="button" class="btn-app btn-app--peligro btn-app--pequeno" data-eliminar-lectura="' + limpiar(c.id) + '">Eliminar</button>' +
            '</div></td>' +
          '</tr>';
        }).join('')
      : '<tr><td colspan="7"><div class="vacio">Todavía no registras lecturas.</div></td></tr>';
  }

  function eliminarLectura(id) {
    const c = EcoData.obtener('consumos', id);
    if (!c) return;
    if (!confirm('¿Eliminar la lectura de ' + c.recurso + ' de ' + etiquetaPeriodo(c.anio, c.mes) +
                 '? Esta acción no se puede deshacer.')) return;
    EcoData.eliminar('consumos', id);
    if ($('lecturaId').value === id) modoCrear();
    toast('Lectura eliminada.');
    renderConsumo();
    avisarCambio();
  }

  

  function renderImpacto() {
    const mis = misConsumos();
    const periodos = periodosDe(mis);

    $('impactoVacio').hidden = periodos.length > 0;
    $('impactoContenido').hidden = !periodos.length;
    if (!periodos.length) { $('impactoPeriodo').innerHTML = ''; return; }

    llenarSelectPeriodos('impactoPeriodo', periodos);
    const clave = Number($('impactoPeriodo').value);
    const h = hogar();
    const delMes = mis.filter(c => periodo(c) === clave).sort(ordenRecurso);

    let totalCo2 = 0;
    let gasto = 0;
    let litros = null;

    const filas = delMes.map(c => {
      // El agua se registra en L/dia por persona: primero se pasa a litros del mes.
      const litrosMes = c.recurso === 'Agua' ? c.valor * h.personas * 30 : 0;
      const co2 = (c.recurso === 'Agua' ? litrosMes : c.valor) * EcoData.FACTOR_CO2[c.recurso];
      totalCo2 += co2;
      gasto += EcoData.costoDe(c, usuario);
      if (c.recurso === 'Agua') litros = litrosMes;              // CA2: solo agua
      return { c: c, co2: co2 };
    });

    $('co2-impacto').textContent = fmt(totalCo2, 2) + ' kg CO₂';       // CA1
    $('agua-impacto').textContent = litros === null ? 'Sin lectura de agua' : fmt(litros, 0) + ' litros';
    $('costo-impacto').textContent = soles(gasto);

    $('tablaImpacto').innerHTML = filas.map(f =>
      '<tr><td>' + ICONOS[f.c.recurso] + ' ' + f.c.recurso + '</td>' +
      '<td class="num">' + fmt(f.c.valor, 2) + '</td>' +
      '<td>' + limpiar(EcoData.UNIDADES[f.c.recurso]) + '</td>' +
      '<td class="num">' + fmt(f.co2, 2) + '</td></tr>').join('') +
      '<tr><td colspan="3"><strong>Total</strong></td><td class="num"><strong>' + fmt(totalCo2, 2) + '</strong></td></tr>';

    const porUnidad = { Agua: 'litro', Luz: 'kWh', Gas: 'm³', Transporte: 'sol' };
    $('notaFactores').textContent = 'Factores de emisión usados: ' +
      EcoData.RECURSOS.map(r => r + ' ' + EcoData.FACTOR_CO2[r] + ' kg CO₂ por ' + porUnidad[r]).join(' · ') +
      '. El agua se convierte primero a litros del mes (valor × personas × 30).';

    const mayor = filas.slice().sort((a, b) => b.co2 - a.co2)[0];
    $('consejoImpacto').textContent = mayor && totalCo2 > 0
      ? '💡 ' + mayor.c.recurso + ' aporta el ' + fmt(mayor.co2 / totalCo2 * 100, 0) +
        '% de tu huella de este mes. Reducirlo es lo que más impacto tendrá; revisa la sección Tips.'
      : '';

    if (comparacionVisible) renderComparacionNacional();
    else $('resultadoComparacion').innerHTML = '';
  }

  function renderComparacionNacional() {
    const clave = Number($('impactoPeriodo').value);
    const h = hogar();
    const delMes = misConsumos().filter(c => periodo(c) === clave).sort(ordenRecurso);

    $('resultadoComparacion').innerHTML = '<ul class="lista-tips">' + delMes.map(c => {
      const prom = EcoData.umbralesDe(c.recurso, h.zona).promedioNacional;
      const dif = prom ? (c.valor - prom) * 100 / prom : 0;
      const texto = dif > 0 ? 'por encima del promedio' : (dif < 0 ? 'por debajo del promedio' : 'igual al promedio');
      return '<li>' + ICONOS[c.recurso] + ' <strong>' + c.recurso + '</strong>: ' + fmt(c.valor, 1) +
        ' frente a ' + fmt(prom, 1) + ' ' + limpiar(EcoData.UNIDADES[c.recurso]) + ' → ' +
        '<span class="' + (dif > 0 ? 'dif-mas' : 'dif-menos') + '">' + conSigno(dif) + '</span> ' + texto + '</li>';
    }).join('') + '</ul>';
  }

  

  function abrirTips() {
    if (!tipActual || tipActual.usuarioId !== usuario.id) generarTip();
    else { pintarTip(); renderListasTips(); }
  }

  // CA1: servicio con mayor desviacion respecto al promedio nacional en el ultimo mes.
  function datosParaTip() {
    const mis = misConsumos();
    const ult = periodosDe(mis)[0];
    if (!ult) return null;
    const h = hogar();
    return mis.filter(c => periodo(c) === ult.clave).map(c => {
      const prom = EcoData.umbralesDe(c.recurso, h.zona).promedioNacional || 0;
      return { c: c, prom: prom, razon: prom ? c.valor / prom : 0 };
    }).sort((a, b) => b.razon - a.razon)[0];
  }

  function armarPrompt(c, prom, dif) {
    const h = hogar();
    return [
      'Eres un asesor de ahorro domestico en Peru.',
      'Hogar en la zona ' + h.zona + ', ' + h.personas + ' personas, segmento "' + usuario.segmento + '".',
      'Su consumo de ' + c.recurso + ' en ' + etiquetaPeriodo(c.anio, c.mes) + ' fue ' + c.valor + ' ' +
        EcoData.UNIDADES[c.recurso] + '; el promedio nacional de referencia es ' + prom + ' (' + conSigno(dif) + ').',
      'Da UN consejo practico y concreto para reducir el consumo de ' + c.recurso +
        ', en espanol, en maximo 3 oraciones y menos de 500 caracteres, sin saludos, sin listas y sin formato markdown.'
    ].join(' ');
  }

  async function consultarIA(prompt) {
    if (!CONFIG_IA.apiKey || !CONFIG_IA.modelo) throw new Error('IA no configurada');

    const control = new AbortController();
    const espera = setTimeout(() => control.abort(), CONFIG_IA.tiempoMaximo);
    try {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
                  encodeURIComponent(CONFIG_IA.modelo) + ':generateContent';
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': CONFIG_IA.apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
        }),
        signal: control.signal
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);

      const datos = await resp.json();
      const partes = datos && datos.candidates && datos.candidates[0] &&
                     datos.candidates[0].content && datos.candidates[0].content.parts;
      const texto = (partes || []).map(p => p.text || '').join('').replace(/[*#_`]/g, '').trim();
      if (!texto) throw new Error('Respuesta vacia');
      return recortar(texto, 600);                                     // CA2
    } finally {
      clearTimeout(espera);
    }
  }

  // Plan B: catalogo activo del administrador (HU18), por servicio y segmento.
  function tipDelCatalogo(recurso) {
    const seg = usuario.segmento;
    const activos = EcoData.listar('tips').filter(t => t.activo && (t.segmento === 'Todos' || t.segmento === seg));
    let lista = activos.filter(t => t.recurso === recurso);
    if (lista.length > 1 && tipActual) lista = lista.filter(t => t.texto !== tipActual.texto);
    if (!lista.length) lista = activos;
    if (!lista.length) {
      return 'Tu consumo de ' + recurso + ' es el que más se aleja del promedio. Revisa tus hábitos de ' +
             recurso.toLowerCase() + ' esta semana y compara tu próxima lectura.';
    }
    return lista[Math.floor(Math.random() * lista.length)].texto;
  }

  async function generarTip() {
    if (generandoTip) return;
    mensaje('msg-tip', 'ok', '');

    const d = datosParaTip();
    if (!d) {
      tipActual = null;
      $('origenTip').hidden = true;
      $('contextoTip').textContent = '';
      $('texto-tip').textContent = 'Registra al menos una lectura de consumo para recibir tu tip personalizado.';
      $('btn-tip-util').disabled = true;
      $('btn-tip-no-util').disabled = true;
      $('btnOtroTip').disabled = true;
      renderListasTips();
      return;
    }

    generandoTip = true;
    $('btnOtroTip').disabled = true;
    $('btn-tip-util').disabled = true;
    $('btn-tip-no-util').disabled = true;
    $('origenTip').hidden = true;
    $('texto-tip').textContent = 'Generando tu tip…';

    const c = d.c;
    const dif = d.prom ? (c.valor - d.prom) * 100 / d.prom : 0;
    $('contextoTip').textContent = 'Basado en tu consumo de ' + c.recurso + ' de ' + etiquetaPeriodo(c.anio, c.mes) + ': ' +
      fmt(c.valor, 1) + ' ' + EcoData.UNIDADES[c.recurso] + ' (' + conSigno(dif) + ' frente al promedio nacional).';

    let texto;
    let origen;
    try {
      texto = await consultarIA(armarPrompt(c, d.prom, dif));
      origen = 'IA';
    } catch (err) {
      // CA3: si la IA falla, el usuario igual recibe un tip.
      if (CONFIG_IA.apiKey) console.warn('EcoGasto: la IA no respondio, se usa el catalogo.', err);
      texto = tipDelCatalogo(c.recurso);
      origen = 'CATALOGO';
    }

    // CA4: cada tip se guarda con su origen.
    tipActual = EcoData.agregar('recomendaciones', {
      usuarioId: usuario.id, recurso: c.recurso, texto: texto, origen: origen,
      util: null, fecha: new Date().toISOString()
    }, 'rec');

    generandoTip = false;
    $('btnOtroTip').disabled = false;
    pintarTip();
    renderListasTips();
  }

  function pintarTip() {
    if (!tipActual) return;
    const esIA = tipActual.origen === 'IA';
    const etiqueta = $('origenTip');
    etiqueta.hidden = false;
    etiqueta.className = 'etiqueta-origen etiqueta-origen--' + (esIA ? 'ia' : 'catalogo');
    etiqueta.textContent = esIA ? '✨ Generado con IA' : '🌱 Tip EcoGasto';
    $('texto-tip').textContent = tipActual.texto;

    const valorado = tipActual.util === true || tipActual.util === false;
    $('btn-tip-util').disabled = valorado;
    $('btn-tip-no-util').disabled = valorado;
  }

  // CA5: la valoracion solo puede ser verdadero o falso.
  function valorarTip(util) {
    if (!tipActual) return;
    EcoData.actualizar('recomendaciones', tipActual.id, { util: util });
    tipActual.util = util;
    $('btn-tip-util').disabled = true;
    $('btn-tip-no-util').disabled = true;
    mensaje('msg-tip', 'ok', '¡Gracias por tu opinión!' + (util ? '' : ' Prueba con "Generar otro tip".'));
    renderListasTips();
  }

  function renderListasTips() {
    const d = datosParaTip();
    const recurso = tipActual ? tipActual.recurso : (d ? d.c.recurso : serviciosHogar()[0]);
    const seg = usuario.segmento;
    $('tipsRecursoNombre').textContent = recurso || 'tu servicio';

    // Solo tips activos (HU18 CA3): si el admin desactiva uno, desaparece aqui.
    const tips = EcoData.listar('tips').filter(t =>
      t.activo && t.recurso === recurso && (t.segmento === 'Todos' || t.segmento === seg) &&
      (!tipActual || t.texto !== tipActual.texto));

    $('listaTipsCatalogo').innerHTML = tips.length
      ? tips.map(t => '<li>' + limpiar(t.texto) +
          (t.segmento !== 'Todos' ? '<small>Para: ' + limpiar(t.segmento) + '</small>' : '') + '</li>').join('')
      : '<li>El administrador aún no publicó más consejos de este servicio.</li>';

    const historial = EcoData.listar('recomendaciones')
      .filter(r => r.usuarioId === usuario.id && (!tipActual || r.id !== tipActual.id))
      .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
      .slice(0, 5);

    $('historialTips').innerHTML = historial.length
      ? historial.map(r => '<li>' + limpiar(recortar(r.texto, 160)) + '<small>' +
          (ICONOS[r.recurso] || '') + ' ' + limpiar(r.recurso) + ' · ' +
          (r.origen === 'IA' ? 'Generado con IA' : 'Tip EcoGasto') + ' · ' + fechaCorta(r.fecha) + ' · ' +
          (r.util === true ? '👍 Te sirvió' : (r.util === false ? '👎 No te ayudó' : 'Sin valorar')) +
          '</small></li>').join('')
      : '<li>Aún no tienes tips anteriores.</li>';
  }

 

  function actualizarContador() {
    if (!usuario) return;
    const n = misNotificaciones().filter(x => !x.leida).length;
    const badge = $('contadorNotif');
    badge.textContent = n > 99 ? '99+' : n;
    badge.hidden = n === 0;
  }

  function renderNotificaciones() {
    const lista = misNotificaciones();
    const sinLeer = lista.filter(n => !n.leida).length;

    $('resumenNotificaciones').textContent = (lista.length
      ? 'Tienes ' + sinLeer + ' sin leer de ' + lista.length + '. '
      : '') + 'Las alertas se generan cuando registras una lectura anómala de un servicio que tienes activado en Preferencias.';

    $('contenedorNotificaciones').innerHTML = lista.length
      ? lista.map(n => {
          const esAlerta = /^Alerta/.test(n.titulo || '');
          return '<div class="noti-card' + (n.leida ? '' : ' no-leida') + (esAlerta ? ' alerta' : '') + '">' +
            '<strong>' + (esAlerta ? '⚠️ ' : '') + limpiar(n.titulo) + '</strong><br>' +
            '<span>' + limpiar(n.mensaje) + '</span>' +
            (n.detalle ? '<em class="noti-detalle">' + limpiar(n.detalle) + '</em>' : '') +
            '<small>' + fechaLarga(n.fecha) + '</small>' +
          '</div>';
        }).join('')
      : '<p class="vacio">No tienes notificaciones.</p>';

    $('btnMarcarLeidas').disabled = !sinLeer;
    $('btnLimpiarNotificaciones').disabled = !lista.length;
    actualizarContador();
  }

  function marcarTodasLeidas() {
    const todas = EcoData.listar('notificaciones');
    todas.forEach(n => { if (n.usuarioId === usuario.id) n.leida = true; });
    EcoData.guardarTabla('notificaciones', todas);
    toast('Notificaciones marcadas como leídas.');
    renderNotificaciones();
  }

  function eliminarNotificaciones() {
    if (!confirm('¿Eliminar todas tus notificaciones? Esta acción no se puede deshacer.')) return;    // CA2
    EcoData.guardarTabla('notificaciones',
      EcoData.listar('notificaciones').filter(n => n.usuarioId !== usuario.id));
    toast('Notificaciones eliminadas.');
    renderNotificaciones();
  }

  const CAMPOS_PREFERENCIA = {
    prefAgua: 'notifAgua',
    prefLuz: 'notifLuz',
    prefGas: 'notifGas',
    prefTransporte: 'notifTransporte',
    prefRetos: 'aceptaRetos',
    prefWeeklyReminder: 'recordatorioSemanal'
  };

  function cargarPreferencias() {
    const p = EcoData.preferenciasDe(usuario.id);
    Object.keys(CAMPOS_PREFERENCIA).forEach(id => { $(id).checked = !!p[CAMPOS_PREFERENCIA[id]]; });
    mensaje('msg-preferencias', '', '');
  }

  function guardarPreferencias(e) {
    e.preventDefault();
    if (!comprobarSesionActiva()) return;

    const p = EcoData.preferenciasDe(usuario.id);
    const cambios = {};
    // CA3: todos los campos son booleanos.
    Object.keys(CAMPOS_PREFERENCIA).forEach(id => { cambios[CAMPOS_PREFERENCIA[id]] = $(id).checked === true; });

    const activaRecordatorio = cambios.recordatorioSemanal && !p.recordatorioSemanal;
    if (activaRecordatorio) cambios.ultimoRecordatorio = null;

    EcoData.actualizar('preferencias', p.id, cambios);
    if (activaRecordatorio) revisarRecordatorioSemanal();

    mensaje('msg-preferencias', 'ok', 'Preferencias guardadas.');
    toast('Preferencias guardadas.');
    actualizarContador();
    avisarCambio();
    setTimeout(() => { if (vistaActual === 'preferencias') mostrarVista('notificaciones'); }, 900);
  }

  // Recordatorio semanal: se genera como notificacion al entrar, una vez cada 7 dias.
  function revisarRecordatorioSemanal() {
    const p = EcoData.preferenciasDe(usuario.id);
    if (!p.recordatorioSemanal) return;
    const semana = 7 * 24 * 60 * 60 * 1000;
    if (p.ultimoRecordatorio && Date.now() - new Date(p.ultimoRecordatorio).getTime() < semana) return;

    const mes = EcoData.MESES[MES_ACTUAL];
    const mis = misConsumos();
    const pendientes = serviciosHogar().filter(r =>
      !mis.some(c => c.recurso === r && Number(c.anio) === ANIO_ACTUAL && c.mes === mes));

    EcoData.agregar('notificaciones', {
      usuarioId: usuario.id,
      recurso: null,
      titulo: '📅 Recordatorio semanal',
      mensaje: pendientes.length
        ? 'Aún no registras ' + enumerar(pendientes) + ' de ' + etiquetaPeriodo(ANIO_ACTUAL, mes) + '.'
        : 'Ya registraste todos tus servicios de ' + etiquetaPeriodo(ANIO_ACTUAL, mes) + '. ¡Bien hecho!',
      detalle: 'Registrar tus lecturas a tiempo mantiene al día tus gráficos, alertas y retos.',
      leida: false,
      fecha: new Date().toISOString()
    }, 'not');

    EcoData.actualizar('preferencias', p.id, { ultimoRecordatorio: new Date().toISOString() });
  }

  

  function mostrarVacioComparar(texto) {
    $('compararVacio').textContent = texto;
    $('compararVacio').hidden = false;
    $('compararContenido').hidden = true;
  }

  function renderComparar() {
    destruirGrafico('comparar');
    const mis = misConsumos();
    const periodos = periodosDe(mis);

    if (!periodos.length) {
      $('compararPeriodo').innerHTML = '';
      mostrarVacioComparar('Registra al menos una lectura para compararte con otros hogares.');
      return;
    }

    llenarSelectPeriodos('compararPeriodo', periodos);
    const clave = Number($('compararPeriodo').value);
    const p = periodos.find(x => x.clave === clave);
    const h = hogar();

    // CA1: misma zona y +/- 1 persona. CA2: el hogar propio no entra.
    const similares = EcoData.listar('usuarios').filter(u =>
      u.id !== usuario.id && u.rol !== 'admin' && u.hogar && u.hogar.zona === h.zona &&
      Math.abs(Number(u.hogar.personas) - Number(h.personas)) <= 1);
    const ids = {};
    similares.forEach(u => { ids[u.id] = true; });
    const todos = EcoData.listar('consumos');

    const filas = mis.filter(c => periodo(c) === clave).sort(ordenRecurso).map(c => {
      const otros = todos.filter(o => ids[o.usuarioId] && o.recurso === c.recurso &&
                                      Number(o.anio) === Number(c.anio) && o.mes === c.mes);
      if (!otros.length) return null;
      const prom = otros.reduce((a, o) => a + o.valor, 0) / otros.length;
      return { recurso: c.recurso, mio: c.valor, prom: prom, dif: (c.valor - prom) * 100 / prom, hogares: otros.length };
    }).filter(Boolean);

    if (!filas.length) {
      mostrarVacioComparar('Aún no hay hogares similares en tu zona (' + h.zona + ', ' + h.personas +
        ' ± 1 personas) con lecturas de ' + etiquetaPeriodo(p.anio, p.mes) + '. Prueba con otro mes.');
      return;
    }

    $('compararVacio').hidden = true;
    $('compararContenido').hidden = false;

    // CA3: solo promedios y cantidades, ningun dato personal de otros hogares.
    $('tablaComparar').innerHTML = filas.map(f =>
      '<tr><td>' + ICONOS[f.recurso] + ' ' + f.recurso + '</td>' +
      '<td class="num">' + fmt(f.mio, 1) + '</td>' +
      '<td class="num">' + fmt(f.prom, 1) + '</td>' +
      '<td class="num ' + (f.dif > 0 ? 'dif-mas' : 'dif-menos') + '">' + conSigno(f.dif) + '</td>' +
      '<td class="num">' + f.hogares + '</td></tr>').join('');

    if (hayChart()) {
      graficos.comparar = new Chart($('chartSim'), {
        type: 'bar',
        data: {
          labels: filas.map(f => f.recurso),
          datasets: [{
            label: 'Diferencia frente a hogares similares (%)',
            data: filas.map(f => Number(f.dif.toFixed(1))),
            backgroundColor: filas.map(f => f.dif > 0 ? 'rgba(198, 40, 40, 0.75)' : 'rgba(46, 125, 50, 0.8)'),
            borderRadius: 6
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: {
            y: { title: { display: true, text: '% sobre (+) o bajo (−) el promedio' },
                 ticks: { callback: v => v + '%' } }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const f = filas[ctx.dataIndex];
                  return ['Tú: ' + fmt(f.mio, 1) + ' ' + EcoData.UNIDADES[f.recurso],
                          'Similares: ' + fmt(f.prom, 1) + ' (' + f.hogares + ' hogares)',
                          'Diferencia: ' + conSigno(f.dif)];
                }
              }
            }
          }
        }
      });
    }

    const arriba = filas.filter(f => f.dif > 0).map(f => f.recurso);
    $('mensajeComparacion').textContent = arriba.length
      ? '⚠️ Estás por encima de hogares parecidos al tuyo en ' + enumerar(arriba) +
        '. Revisa los Eco Tips de ' + (arriba.length > 1 ? 'esos servicios.' : 'ese servicio.')
      : '🎉 Estás por debajo del promedio de hogares similares en todos los servicios comparados. ¡Sigue así!';
  }

 
  function renderEstadisticas() {
    const h = hogar();
    // CA2: solo zonas activas.
    const zonas = EcoData.listar('zonas').filter(z => z.activa).map(z => z.nombre);

    const selZona = $('zonaSelect');
    const zonaAnterior = selZona.value;
    selZona.innerHTML = zonas.map(z => '<option value="' + limpiar(z) + '">' + limpiar(z) +
      (z === h.zona ? ' (tu zona)' : '') + '</option>').join('');
    selZona.value = zonas.indexOf(zonaAnterior) !== -1 ? zonaAnterior
                  : (zonas.indexOf(h.zona) !== -1 ? h.zona : (zonas[0] || ''));
    const zona = selZona.value;

    const hogaresZona = EcoData.listar('usuarios').filter(u => u.rol !== 'admin' && u.hogar && u.hogar.zona === zona);
    const ids = {};
    hogaresZona.forEach(u => { ids[u.id] = true; });
    const consumosZona = EcoData.listar('consumos').filter(c => ids[c.usuarioId]);

    const anios = consumosZona.map(c => Number(c.anio))
      .filter((a, i, arr) => arr.indexOf(a) === i).sort((a, b) => b - a);
    const selAnio = $('anioEstadisticas');
    const anioAnterior = selAnio.value;
    selAnio.innerHTML = (anios.length ? anios : [ANIO_ACTUAL]).map(a => '<option value="' + a + '">' + a + '</option>').join('');
    if (anios.map(String).indexOf(anioAnterior) !== -1) selAnio.value = anioAnterior;
    const anio = Number(selAnio.value);
    const delAnio = consumosZona.filter(c => Number(c.anio) === anio);

    (graficos.zona || []).forEach(g => g.destroy());
    graficos.zona = [];

    const personasProm = hogaresZona.length
      ? hogaresZona.reduce((a, u) => a + Number(u.hogar.personas || 0), 0) / hogaresZona.length : 0;

    $('kpisZona').innerHTML =
      kpi(hogaresZona.length, 'Hogares registrados en ' + limpiar(zona || '—')) +
      kpi(delAnio.length.toLocaleString('es-PE'), 'Lecturas registradas en ' + anio, 'azul') +
      kpi(fmt(personasProm, 1), 'Personas por hogar (promedio)', 'amarillo');

    if (!delAnio.length) {
      $('estadisticasVacio').hidden = false;
      $('gridEstadisticas').innerHTML = '';
      return;
    }
    $('estadisticasVacio').hidden = true;

    const esMiZona = zona === h.zona;
    const mias = misConsumos().filter(c => Number(c.anio) === anio);
    const recursos = EcoData.RECURSOS.filter(r => delAnio.some(c => c.recurso === r));

    // CA3: un grafico por servicio, cada uno con su unidad.
    $('gridEstadisticas').innerHTML = recursos.map(r =>
      '<div class="app-bloque"><h3>' + ICONOS[r] + ' ' + r + ' · ' + limpiar(EcoData.UNIDADES[r]) + '</h3>' +
      '<div class="grafico-caja"><canvas id="chartZona-' + r + '"></canvas></div></div>').join('');

    if (!hayChart()) return;

    recursos.forEach(r => {
      const meses = EcoData.MESES.filter(m => delAnio.some(c => c.recurso === r && c.mes === m));
      const promedios = meses.map(m => {
        const v = delAnio.filter(c => c.recurso === r && c.mes === m);
        return Number((v.reduce((a, c) => a + c.valor, 0) / v.length).toFixed(2));     // CA1
      });

      const datasets = [{
        label: 'Promedio de ' + zona, data: promedios, backgroundColor: 'rgba(3, 169, 244, 0.55)',
        borderColor: COLOR.azul, borderWidth: 1, borderRadius: 4, order: 2
      }];

      if (esMiZona && serviciosHogar().indexOf(r) !== -1) {
        datasets.push({
          type: 'line', label: 'Tu hogar', order: 1,
          data: meses.map(m => { const c = mias.find(x => x.recurso === r && x.mes === m); return c ? c.valor : null; }),
          borderColor: COLOR.verde, backgroundColor: COLOR.verde, borderWidth: 2, tension: 0.3, spanGaps: true
        });
      }

      graficos.zona.push(new Chart($('chartZona-' + r), {
        type: 'bar',
        data: { labels: meses.map(mesLargo), datasets: datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, title: { display: true, text: EcoData.UNIDADES[r] } } },
          plugins: {
            legend: { position: 'bottom' },
            tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + fmt(ctx.parsed.y, 2) } }
          }
        }
      }));
    });
  }

  

  function iniciarApp() {
    // Menu lateral
    $('toggle-menu').addEventListener('click', e => {
      e.stopPropagation();
      const oculto = $('menu-items').classList.toggle('oculto');
      $('toggle-menu').setAttribute('aria-expanded', String(!oculto));
    });
    document.addEventListener('click', e => { if (!e.target.closest('.app-menu')) cerrarMenu(); });

    // Cualquier elemento con data-ir abre una vista
    document.querySelectorAll('#PrincipalEcoGasto [data-ir]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); mostrarVista(el.dataset.ir); });
    });

    ['btnEditarHogar', 'btnEditarHogarAtajo'].forEach(id => {
      $(id).addEventListener('click', () => abrirModalHogar(false));
    });
    $('btnSocial').addEventListener('click', () => {
      cerrarMenu();
      if (window.EcoSocial) window.EcoSocial.abrir();
      else toast('El módulo social no está disponible.', 'error');
    });
    $('btnCerrarSesion').addEventListener('click', () => cerrarSesion());

    // Hogar
    $('formHogarLogin').addEventListener('submit', guardarHogar);
    $('btnCancelarHogar').addEventListener('click', () => {
      if (hogarPrimeraVez) cerrarSesion();
      else $('FormularioHogarModal').style.display = 'none';
    });

    // Mi Consumo
    $('TarjetasRecursos').addEventListener('click', e => {
      const registrar = e.target.closest('[data-registrar]');
      if (registrar) {
        modoCrear(registrar.dataset.registrar);
        $('bloqueLectura').scrollIntoView({ behavior: 'smooth', block: 'center' });
        $('lecturaValor').focus({ preventScroll: true });
        return;
      }
      if (e.target.closest('[data-editar-hogar]')) { abrirModalHogar(false); return; }
      const tarjeta = e.target.closest('.recurso-card[data-recurso]');
      if (tarjeta) seleccionarRecurso(tarjeta.dataset.recurso);
    });
    $('TarjetasRecursos').addEventListener('keydown', e => {
      const tarjeta = e.target.closest('.recurso-card[data-recurso]');
      if (tarjeta && e.target === tarjeta && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        seleccionarRecurso(tarjeta.dataset.recurso);
      }
    });

    $('recursoGrafico').addEventListener('change', e => seleccionarRecurso(e.target.value));
    $('anioGrafico').addEventListener('change', e => { anioPreferido = Number(e.target.value); renderGrafico(); });
    $('btnIrRegistrar').addEventListener('click', () => {
      modoCrear(recursoSeleccionado);
      $('bloqueLectura').scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('lecturaValor').focus({ preventScroll: true });
    });

    $('formLectura').addEventListener('submit', guardarLectura);
    $('lecturaRecurso').addEventListener('change', () => {
      if (!$('lecturaId').value) aplicarPeriodoSugerido();
      actualizarAyudaLectura();
    });
    $('lecturaValor').addEventListener('input', actualizarAyudaLectura);
    $('btnCancelarEdicion').addEventListener('click', () => modoCrear());

    $('historialRecurso').addEventListener('change', () => renderHistorial(misConsumos()));
    $('tablaHistorial').addEventListener('click', e => {
      const editar = e.target.closest('[data-editar-lectura]');
      const eliminar = e.target.closest('[data-eliminar-lectura]');
      if (editar) {
        const c = EcoData.obtener('consumos', editar.dataset.editarLectura);
        if (c) modoEditar(c);
      }
      if (eliminar) eliminarLectura(eliminar.dataset.eliminarLectura);
    });

    // Impacto
    $('impactoPeriodo').addEventListener('change', renderImpacto);
    $('btnCompararPromedio').addEventListener('click', () => { comparacionVisible = true; renderComparacionNacional(); });

    // Tips
    $('btn-tip-util').addEventListener('click', () => valorarTip(true));
    $('btn-tip-no-util').addEventListener('click', () => valorarTip(false));
    $('btnOtroTip').addEventListener('click', generarTip);

    // Notificaciones y preferencias
    $('btnMarcarLeidas').addEventListener('click', marcarTodasLeidas);
    $('btnLimpiarNotificaciones').addEventListener('click', eliminarNotificaciones);
    $('formPreferencias').addEventListener('submit', guardarPreferencias);

    // Comparar y estadisticas
    $('compararPeriodo').addEventListener('change', renderComparar);
    $('zonaSelect').addEventListener('change', renderEstadisticas);
    $('anioEstadisticas').addEventListener('change', renderEstadisticas);

    // Escape cierra ventanas
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if ($('GraficoDemo').style.display === 'block') cerrarGraficoDemo();
      $('AlertaRegistro').style.display = 'none';
      $('ModalTerminos').style.display = 'none';
      if ($('FormularioHogarModal').style.display === 'flex' && !hogarPrimeraVez) {
        $('FormularioHogarModal').style.display = 'none';
      }
      cerrarMenu();
    });
  }


  const CLAVES_SINCRONIZADAS = ['usuariosEco', 'ecoZonas', 'ecoTarifas', 'ecoConsumos', 'ecoTips', 'ecoRetos',
    'ecoNotificaciones', 'ecoPreferencias', 'ecoRetosUsuario', 'ecoInsigniasUsuario', 'ecoPublicaciones',
    CLAVE_SESION];

  function iniciarSincronizacion() {
    let espera = null;
    window.addEventListener('storage', e => {
      if (e.key !== null && CLAVES_SINCRONIZADAS.indexOf(e.key) === -1) return;
      clearTimeout(espera);
      espera = setTimeout(() => {
        if (!usuario || !comprobarSesionActiva()) return;
        refrescarVistaActual();
        avisarCambio();
      }, 250);
    });

    setInterval(() => { if (usuario) comprobarSesionActiva(); }, 30000);
  }


  window.EcoApp = {
    usuario: () => (usuario ? EcoData.obtener('usuarios', usuario.id) : null),
    comprobarSesion: comprobarSesionActiva,
    misConsumos: () => (usuario ? misConsumos() : []),
    periodosDe: periodosDe,
    periodo: periodo,
    mesLargo: mesLargo,
    etiquetaPeriodo: etiquetaPeriodo,
    limpiar: limpiar,
    fmt: fmt,
    soles: soles,
    conSigno: conSigno,
    enumerar: enumerar,
    recortar: recortar,
    fechaCorta: fechaCorta,
    fechaLarga: fechaLarga,
    mensaje: mensaje,
    toast: toast,
    avisarCambio: avisarCambio,
    actualizarContador: actualizarContador,
    irA: mostrarVista,
    ICONOS: ICONOS,
    COLOR: COLOR
  };


  document.addEventListener('DOMContentLoaded', () => {
    EcoData.inicializar();

    iniciarLanding();
    iniciarRegistro();
    iniciarLogin();
    iniciarApp();
    iniciarSincronizacion();

   
    const pendiente = sessionStorage.getItem(CLAVE_MENSAJE);
    if (pendiente) {
      sessionStorage.removeItem(CLAVE_MENSAJE);
      try {
        const m = JSON.parse(pendiente);
        mostrarMensajeLogin(m.texto, m.tipo);
      } catch (err) { /* mensaje corrupto: se ignora */ }
    }

    if (leerSesion()) {
      const v = validarSesion();
      if (v.ok) entrar();
      else {
        localStorage.removeItem(CLAVE_SESION);
        if (v.mensaje) mostrarMensajeLogin(v.mensaje, 'error');
      }
    }
  });

})();
