const EcoData = (function () {

  const ZONAS_BASE = ['Costa', 'Sierra', 'Selva'];

  const RECURSOS = ['Agua', 'Luz', 'Gas', 'Transporte'];

  const UNIDADES = {
    Agua:        'L/dia por persona',
    Luz:         'kWh/mes por hogar',
    Gas:         'm3/mes por hogar',
    Transporte:  'S//mes por hogar'
  };

  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
  const MESES_SEMILLA = 6;
  const ANIO_SEMILLA = 2026;
  const ANIO_MINIMO = 2024;                 // HU04 CA1

  const SEGMENTOS = ['Padre de familia', 'Joven independiente'];

  const FACTOR_CO2 = { Agua: 0.0003, Luz: 0.21, Gas: 1.9, Transporte: 0.12 };

  const MAX_INTENTOS = 5;                   // HU02 CA3

  // Claves de localStorage
  const K = {
    usuarios:         'usuariosEco',
    zonas:            'ecoZonas',
    tarifas:          'ecoTarifas',
    consumos:         'ecoConsumos',
    tips:             'ecoTips',
    retos:            'ecoRetos',
    auditoria:        'ecoAuditoria',
    notificaciones:   'ecoNotificaciones',
    preferencias:     'ecoPreferencias',
    recomendaciones:  'ecoRecomendaciones',
    retosUsuario:     'ecoRetosUsuario',
    insignias:        'ecoInsignias',
    insigniasUsuario: 'ecoInsigniasUsuario',
    publicaciones:    'ecoPublicaciones',
    version:          'ecoSeedVersion'
  };

  const VERSION_SEMILLA = 3;

  function leer(clave, porDefecto) {
    try {
      const crudo = localStorage.getItem(clave);
      return crudo ? JSON.parse(crudo) : porDefecto;
    } catch (err) {
      console.warn('EcoData: no se pudo leer "' + clave + '"', err);
      return porDefecto;
    }
  }

  function escribir(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (err) {
      console.error('EcoData: no se pudo guardar "' + clave + '"', err);
      alert('No se pudo guardar la informacion. El almacenamiento del navegador esta lleno.');
      return false;
    }
  }

  function nuevoId(prefijo) {
    return prefijo + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
  }

  function ahora() {
    return new Date().toLocaleString('es-PE');
  }


  function crearRandom(semilla) {
    let s = semilla >>> 0;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
  }

  function entre(rnd, min, max) {
    return min + rnd() * (max - min);
  }

  function elegir(rnd, lista) {
    return lista[Math.floor(rnd() * lista.length)];
  }

  const PERFIL_ZONA = {
    Costa: {
      cobertura: { Agua: 0.95, Luz: 0.98, Gas: 0.86, Transporte: 0.91 },
      consumo:   { Agua: [120, 235], Luz: [55, 165], Gas: [7, 24], Transporte: [70, 340] },
      peso: 0.52
    },
    Sierra: {
      cobertura: { Agua: 0.77, Luz: 0.89, Gas: 0.44, Transporte: 0.63 },
      consumo:   { Agua: [60, 150], Luz: [35, 115], Gas: [4, 15], Transporte: [40, 190] },
      peso: 0.30
    },
    Selva: {
      cobertura: { Agua: 0.61, Luz: 0.78, Gas: 0.29, Transporte: 0.54 },
      consumo:   { Agua: [70, 165], Luz: [30, 105], Gas: [3, 13], Transporte: [35, 170] },
      peso: 0.18
    }
  };

  const NOMBRES = ['Ana', 'Luis', 'Maria', 'Jose', 'Carmen', 'Jorge', 'Rosa', 'Miguel', 'Elena',
    'Cesar', 'Julia', 'Victor', 'Patricia', 'Raul', 'Silvia', 'Diego', 'Lucia', 'Andres',
    'Gloria', 'Marco', 'Teresa', 'Fernando', 'Karina', 'Oscar', 'Beatriz', 'Ricardo',
    'Sandra', 'Pablo', 'Norma', 'Hugo', 'Delia', 'Ivan', 'Pilar', 'Alonso', 'Nadia'];

  const APELLIDOS = ['Quispe', 'Mamani', 'Flores', 'Rojas', 'Vasquez', 'Huaman', 'Chavez',
    'Ramos', 'Castillo', 'Paredes', 'Zapata', 'Ccahuana', 'Salazar', 'Bautista', 'Nunez',
    'Alvarado', 'Cordova', 'Ticona', 'Guerrero', 'Sifuentes', 'Aguilar', 'Palomino'];


  function zonasIniciales() {
    return [
      { id: 'zona-costa',  nombre: 'Costa',
        descripcion: 'Franja costera. Mayor cobertura de servicios y el consumo de agua mas alto del pais.',
        activa: true },
      { id: 'zona-sierra', nombre: 'Sierra',
        descripcion: 'Region andina. Cobertura de gas domiciliario limitada; predomina el GLP en balon.',
        activa: true },
      { id: 'zona-selva',  nombre: 'Selva',
        descripcion: 'Region amazonica. Menor acceso a agua potable y a red electrica continua.',
        activa: true }
    ];
  }

  const UMBRALES_BASE = {
    Agua:       { bajo: 100, alto: 175, promedio: 145, tarifa: 0.0052 },
    Luz:        { bajo: 60,  alto: 110, promedio: 82.3, tarifa: 0.68 },
    Gas:        { bajo: 8,   alto: 16,  promedio: 12,   tarifa: 2.10 },
    Transporte: { bajo: 80,  alto: 200, promedio: 140,  tarifa: 1.00 }
  };

  const FACTOR_TARIFA = { Costa: 1.00, Sierra: 1.12, Selva: 1.25 };

  function tarifasIniciales() {
    const filas = [];
    RECURSOS.forEach(function (recurso) {
      ZONAS_BASE.forEach(function (zona) {
        const base = UMBRALES_BASE[recurso];
        filas.push({
          id: 'tar-' + recurso.toLowerCase() + '-' + zona.toLowerCase(),
          recurso: recurso,
          zona: zona,
          unidad: UNIDADES[recurso],
          tarifa: Number((base.tarifa * FACTOR_TARIFA[zona]).toFixed(4)),
          umbralBajo: base.bajo,
          umbralAlto: base.alto,
          promedioNacional: base.promedio
        });
      });
    });
    return filas;
  }

  function tipsIniciales() {
    return [
      { id: 'tip-1', recurso: 'Agua', segmento: 'Todos',
        texto: 'Reduzca el tiempo de ducha a 5 minutos. Una ducha de 10 minutos consume hasta 200 litros.', activo: true },
      { id: 'tip-2', recurso: 'Agua', segmento: 'Padre de familia',
        texto: 'Reutilice el agua del lavado de ropa para regar plantas o limpiar patios.', activo: true },
      { id: 'tip-3', recurso: 'Luz', segmento: 'Todos',
        texto: 'Desconecte los cargadores que no esta usando. El consumo en espera representa cerca del 4% del gasto electrico.', activo: true },
      { id: 'tip-4', recurso: 'Luz', segmento: 'Joven independiente',
        texto: 'Cambie los focos incandescentes por focos LED: consumen hasta 80% menos energia.', activo: true },
      { id: 'tip-5', recurso: 'Gas', segmento: 'Todos',
        texto: 'Tape las ollas mientras cocina. Reduce el tiempo de coccion y el consumo de gas.', activo: true },
      { id: 'tip-6', recurso: 'Gas', segmento: 'Padre de familia',
        texto: 'Revise periodicamente las conexiones de gas. Una fuga eleva el recibo y pone en riesgo al hogar.', activo: true },
      { id: 'tip-7', recurso: 'Transporte', segmento: 'Joven independiente',
        texto: 'Para trayectos menores a 3 km, use bicicleta. Ahorra pasaje y reduce su huella de carbono.', activo: true },
      { id: 'tip-8', recurso: 'Transporte', segmento: 'Todos',
        texto: 'Agrupe sus diligencias en un solo recorrido para reducir viajes innecesarios.', activo: true }
    ];
  }

  function retosIniciales() {
    return [
      { id: 'reto-1', titulo: 'Reduce agua 10%', descripcion: 'Baje su consumo de agua un 10% antes del domingo.',
        recurso: 'Agua', metaPct: 10, puntos: 50, activo: true },
      { id: 'reto-2', titulo: 'Ahorra luz 15%', descripcion: 'Disminuya su uso de energia electrica un 15% esta semana.',
        recurso: 'Luz', metaPct: 15, puntos: 60, activo: true },
      { id: 'reto-3', titulo: 'Gas responsable 20%', descripcion: 'Reduzca su consumo de gas un 20% en 7 dias.',
        recurso: 'Gas', metaPct: 20, puntos: 70, activo: true },
      { id: 'reto-4', titulo: 'Semana sin taxi', descripcion: 'Reemplace los viajes en taxi por transporte publico o bicicleta.',
        recurso: 'Transporte', metaPct: 25, puntos: 80, activo: false }
    ];
  }

  function insigniasIniciales() {
    return [
      { id: 'ins-1', nombre: 'Eco Novato',          puntosRequeridos: 50,  icono: '🌱' },
      { id: 'ins-2', nombre: 'Guardian del Ahorro', puntosRequeridos: 110, icono: '🛡️' },
      { id: 'ins-3', nombre: 'Maestro Sostenible',  puntosRequeridos: 180, icono: '🏆' }
    ];
  }


  const TOTAL_SIMULADOS = 180;

  function generarPoblacion() {
    const rnd = crearRandom(20251775);
    const usuarios = [];
    const consumos = [];

    const bolsaZonas = [];
    ZONAS_BASE.forEach(function (zona) {
      const cantidad = Math.round(TOTAL_SIMULADOS * PERFIL_ZONA[zona].peso);
      for (let i = 0; i < cantidad; i++) bolsaZonas.push(zona);
    });

    bolsaZonas.forEach(function (zona, indice) {
      const perfil = PERFIL_ZONA[zona];
      const nombre = elegir(rnd, NOMBRES);
      const apellido = elegir(rnd, APELLIDOS);
      const usuarioId = 'usr-sim-' + (indice + 1);

      const esJoven = rnd() < (zona === 'Costa' ? 0.42 : 0.28);
      const segmento = esJoven ? 'Joven independiente' : 'Padre de familia';

      const servicios = RECURSOS.filter(function (recurso) {
        return rnd() < perfil.cobertura[recurso];
      });

      const personas = esJoven
        ? Math.round(entre(rnd, 1, 2))
        : Math.round(entre(rnd, 3, 6));

      const fecha = new Date(2025, Math.floor(entre(rnd, 0, 6)), Math.floor(entre(rnd, 1, 28)));

      usuarios.push({
        id: usuarioId,
        usuario: (nombre + apellido + (indice + 1)).toLowerCase(),
        nombreCompleto: nombre + ' ' + apellido,
        email: nombre.toLowerCase() + '.' + apellido.toLowerCase() + (indice + 1) + '@correo.pe',
        contrasena: 'Demo1234',
        rol: 'usuario',
        segmento: segmento,
        fechaRegistro: fecha.toLocaleDateString('es-PE'),
        simulado: true,
        activo: true,
        intentosFallidos: 0,
        hogar: { esPadre: !esJoven, personas: personas, zona: zona, servicios: servicios }
      });

      servicios.forEach(function (recurso) {
        const rango = perfil.consumo[recurso];
        const nivel = entre(rnd, rango[0], rango[1]);
        MESES.slice(0, MESES_SEMILLA).forEach(function (mes) {
          const variacion = entre(rnd, 0.88, 1.12);
          consumos.push({
            id: 'con-' + usuarioId + '-' + recurso.toLowerCase() + '-' + mes.toLowerCase(),
            usuarioId: usuarioId,
            recurso: recurso,
            anio: ANIO_SEMILLA,
            mes: mes,
            valor: Number((nivel * variacion).toFixed(1))
          });
        });
      });
    });

    return { usuarios: usuarios, consumos: consumos };
  }

  function participacionesDemo(usuarios) {
    const rnd = crearRandom(4242);
    const retos = leer(K.retos, []).filter(function (r) { return r.activo; });
    const filas = [];
    usuarios.filter(function (u) { return u.simulado && u.hogar; }).forEach(function (u) {
      retos.forEach(function (r) {
        if ((u.hogar.servicios || []).indexOf(r.recurso) === -1) return;
        const x = rnd();
        if (x < 0.30) {
          filas.push({ id: 'ru-' + u.id + '-' + r.id, usuarioId: u.id, retoId: r.id,
            estado: 'COMPLETADO', fechaInicio: '2026-06-01', fechaCompletado: '2026-06-20' });
        } else if (x < 0.45) {
          filas.push({ id: 'ru-' + u.id + '-' + r.id, usuarioId: u.id, retoId: r.id,
            estado: 'EN_CURSO', fechaInicio: '2026-06-01', fechaCompletado: null });
        }
      });
    });
    return filas;
  }

  function publicacionesDemo(usuarios) {
    const textos = [
      ['usr-sim-2',   '2026-06-28T19:10:00', 'Instale aireadores en los canos de la cocina y el bano. En un mes baje mi consumo de agua casi 15%.'],
      ['usr-sim-15',  '2026-06-25T08:40:00', 'Cambiamos todos los focos a LED. El recibo de luz de junio llego S/ 18 mas barato.'],
      ['usr-sim-40',  '2026-06-21T13:05:00', 'Ahora tapo las ollas al cocinar. Parece poco, pero el gas nos esta durando mucho mas.'],
      ['usr-sim-101', '2026-06-18T17:30:00', 'En la sierra el agua es escasa: reutilizamos el agua del lavado para el biohuerto.'],
      ['usr-sim-150', '2026-06-12T07:15:00', 'Voy al mercado en bicicleta tres veces por semana. Ahorro pasaje y hago ejercicio.'],
      ['usr-sim-60',  '2026-06-08T21:50:00', 'Alguien sabe cuanto consume una terma electrica? Mi recibo de luz subio este mes.']
    ];
    const ids = usuarios.map(function (u) { return u.id; });
    return textos.filter(function (t) { return ids.indexOf(t[0]) !== -1; }).map(function (t, i) {
      return { id: 'pub-demo-' + (i + 1), usuarioId: t[0], contenido: t[2], imagenUrl: null,
               meGusta: [], fecha: new Date(t[1]).toISOString() };
    });
  }


  const ADMIN_POR_DEFECTO = {
    id: 'usr-admin-1',
    usuario: 'admin',
    nombreCompleto: 'Administrador EcoGasto',
    email: 'admin@ecogasto.pe',
    contrasena: 'EcoGasto2025',
    rol: 'admin',
    segmento: 'Administrador',
    fechaRegistro: '01/06/2025',
    simulado: false,
    activo: true,
    intentosFallidos: 0,
    hogar: null
  };


  function normalizarUsuario(u, indice) {
    if (!u.id)            u.id = 'usr-' + (indice + 1) + '-' + (u.usuario || 'sin-nombre');
    if (!u.rol)           u.rol = 'usuario';
    if (!u.segmento)      u.segmento = u.hogar && u.hogar.esPadre ? 'Padre de familia' : 'Joven independiente';
    if (!u.fechaRegistro) u.fechaRegistro = new Date().toLocaleDateString('es-PE');
    if (u.simulado === undefined) u.simulado = false;
    if (!u.nombreCompleto) u.nombreCompleto = u.usuario || 'Sin nombre';
    if (u.activo === undefined) u.activo = true;              // HU02 / HU16
    if (!u.intentosFallidos) u.intentosFallidos = 0;
    return u;
  }

  function inicializar() {
    const versionGuardada = Number(localStorage.getItem(K.version) || 0);

    // Datos maestros: se crean si no existen.
    if (!localStorage.getItem(K.zonas))     escribir(K.zonas, zonasIniciales());
    if (!localStorage.getItem(K.tarifas))   escribir(K.tarifas, tarifasIniciales());
    if (!localStorage.getItem(K.tips))      escribir(K.tips, tipsIniciales());
    if (!localStorage.getItem(K.retos))     escribir(K.retos, retosIniciales());
    if (!localStorage.getItem(K.insignias)) escribir(K.insignias, insigniasIniciales());
    ['auditoria', 'notificaciones', 'preferencias', 'recomendaciones', 'insigniasUsuario'].forEach(function (t) {
      if (!localStorage.getItem(K[t])) escribir(K[t], []);
    });

    let usuarios = leer(K.usuarios, []);
    let consumos = leer(K.consumos, []);

    const reales = usuarios.filter(function (u) { return !u.simulado; }).map(normalizarUsuario);

    if (versionGuardada < VERSION_SEMILLA) {
      const poblacion = generarPoblacion();
      usuarios = reales.concat(poblacion.usuarios);
      const idsReales = reales.map(function (u) { return u.id; });
      const consumosReales = consumos.filter(function (c) { return idsReales.indexOf(c.usuarioId) !== -1; });
      consumos = consumosReales.concat(poblacion.consumos);
      escribir(K.version, VERSION_SEMILLA);
    } else {
      usuarios = usuarios.map(normalizarUsuario);
    }

    consumos.forEach(function (c) { if (!c.anio) c.anio = ANIO_SEMILLA; });

    if (!usuarios.some(function (u) { return u.rol === 'admin'; })) {
      usuarios.unshift(Object.assign({}, ADMIN_POR_DEFECTO));
    }

    escribir(K.usuarios, usuarios);
    escribir(K.consumos, consumos);

    if (!localStorage.getItem(K.retosUsuario))  escribir(K.retosUsuario, participacionesDemo(usuarios));
    if (!localStorage.getItem(K.publicaciones)) escribir(K.publicaciones, publicacionesDemo(usuarios));
  }

  
  function listar(tabla)              { return leer(K[tabla], []); }
  function guardarTabla(tabla, filas) { return escribir(K[tabla], filas); }

  function obtener(tabla, id) {
    return listar(tabla).find(function (f) { return f.id === id; }) || null;
  }

  function agregar(tabla, registro, prefijoId) {
    const filas = listar(tabla);
    if (!registro.id) registro.id = nuevoId(prefijoId || tabla.slice(0, 3));
    filas.push(registro);
    guardarTabla(tabla, filas);
    return registro;
  }

  function actualizar(tabla, id, cambios) {
    const filas = listar(tabla);
    const indice = filas.findIndex(function (f) { return f.id === id; });
    if (indice === -1) return null;
    const anterior = filas[indice];
    filas[indice] = Object.assign({}, anterior, cambios);
    guardarTabla(tabla, filas);

    // Si el admin renombra una zona, los hogares y las tarifas la siguen.
    if (tabla === 'zonas' && cambios.nombre && cambios.nombre !== anterior.nombre) {
      renombrarZona(anterior.nombre, cambios.nombre);
    }
    return filas[indice];
  }

  function renombrarZona(antes, despues) {
    const usuarios = listar('usuarios');
    usuarios.forEach(function (u) { if (u.hogar && u.hogar.zona === antes) u.hogar.zona = despues; });
    guardarTabla('usuarios', usuarios);
    const tarifas = listar('tarifas');
    tarifas.forEach(function (t) { if (t.zona === antes) t.zona = despues; });
    guardarTabla('tarifas', tarifas);
  }

  const DEPENDIENTES_USUARIO = ['consumos', 'notificaciones', 'preferencias', 'recomendaciones',
                                'retosUsuario', 'insigniasUsuario', 'publicaciones'];

  function eliminar(tabla, id) {
    const filas = listar(tabla);
    const restantes = filas.filter(function (f) { return f.id !== id; });
    if (restantes.length === filas.length) return false;
    guardarTabla(tabla, restantes);

    if (tabla === 'usuarios') {
      DEPENDIENTES_USUARIO.forEach(function (t) {
        guardarTabla(t, listar(t).filter(function (f) { return f.usuarioId !== id; }));
      });
    }
    // HU18: eliminar un reto borra sus participaciones.
    if (tabla === 'retos') {
      guardarTabla('retosUsuario', listar('retosUsuario').filter(function (f) { return f.retoId !== id; }));
    }
    return true;
  }


  function registrarAuditoria(admin, accion, tabla, detalle) {
    const filas = listar('auditoria');
    filas.unshift({
      id: nuevoId('aud'),
      fecha: ahora(),
      admin: admin || 'desconocido',
      accion: accion,
      tabla: tabla,
      detalle: detalle
    });
    guardarTabla('auditoria', filas.slice(0, 300));
  }

  function nombresZonas() {
    const zonas = leer(K.zonas, null);
    return zonas && zonas.length ? zonas.map(function (z) { return z.nombre; }) : ZONAS_BASE.slice();
  }

  function umbralesDe(recurso, zona) {
    const fila = listar('tarifas').find(function (t) {
      return t.recurso === recurso && t.zona === zona;
    });
    if (fila) return fila;
    const base = UMBRALES_BASE[recurso];
    return { umbralBajo: base.bajo, umbralAlto: base.alto,
             promedioNacional: base.promedio, tarifa: base.tarifa };
  }

  function promedioUsuario(consumos, usuarioId, recurso) {
    const propios = consumos.filter(function (c) {
      return c.usuarioId === usuarioId && c.recurso === recurso;
    });
    if (!propios.length) return null;
    const suma = propios.reduce(function (a, c) { return a + c.valor; }, 0);
    return suma / propios.length;
  }

  function usuariosFinales() {
    return listar('usuarios').filter(function (u) { return u.rol !== 'admin' && u.hogar; });
  }

  function distribucionConsumo() {
    const usuarios = usuariosFinales();
    const consumos = listar('consumos');
    const resultado = {};

    RECURSOS.forEach(function (recurso) {
      let bajo = 0, moderado = 0, alto = 0;
      usuarios.forEach(function (u) {
        const promedio = promedioUsuario(consumos, u.id, recurso);
        if (promedio === null) return;
        const umbral = umbralesDe(recurso, u.hogar.zona);
        if (promedio >= umbral.umbralAlto)      alto++;
        else if (promedio <= umbral.umbralBajo) bajo++;
        else                                    moderado++;
      });
      const total = bajo + moderado + alto;
      resultado[recurso] = {
        total: total, bajo: bajo, moderado: moderado, alto: alto,
        pctBajo:     total ? Number((bajo / total * 100).toFixed(1))     : 0,
        pctModerado: total ? Number((moderado / total * 100).toFixed(1)) : 0,
        pctAlto:     total ? Number((alto / total * 100).toFixed(1))     : 0
      };
    });
    return resultado;
  }

  function carenciasPorZona() {
    const usuarios = usuariosFinales();
    const resultado = {};

    nombresZonas().forEach(function (zona) {
      const hogares = usuarios.filter(function (u) { return u.hogar.zona === zona; });
      const fila = { hogares: hogares.length, carencias: {} };

      RECURSOS.forEach(function (recurso) {
        const sinServicio = hogares.filter(function (u) {
          return (u.hogar.servicios || []).indexOf(recurso) === -1;
        }).length;
        fila.carencias[recurso] = {
          cantidad: sinServicio,
          pct: hogares.length ? Number((sinServicio / hogares.length * 100).toFixed(1)) : 0
        };
      });

      let peor = null;
      RECURSOS.forEach(function (recurso) {
        if (!peor || fila.carencias[recurso].pct > fila.carencias[peor].pct) peor = recurso;
      });
      fila.carenciaPrincipal = peor;
      resultado[zona] = fila;
    });
    return resultado;
  }

  function resumenPorZona() {
    const usuarios = usuariosFinales();
    const consumos = listar('consumos');
    const resultado = {};

    nombresZonas().forEach(function (zona) {
      const hogares = usuarios.filter(function (u) { return u.hogar.zona === zona; });
      const fila = { hogares: hogares.length, personas: 0, promedios: {}, gastoEstimado: 0 };

      fila.personas = hogares.reduce(function (a, u) { return a + (Number(u.hogar.personas) || 0); }, 0);

      RECURSOS.forEach(function (recurso) {
        const valores = [];
        hogares.forEach(function (u) {
          const p = promedioUsuario(consumos, u.id, recurso);
          if (p !== null) valores.push(p);
        });
        const promedio = valores.length
          ? valores.reduce(function (a, b) { return a + b; }, 0) / valores.length
          : 0;
        fila.promedios[recurso] = Number(promedio.toFixed(1));

        const umbral = umbralesDe(recurso, zona);
        const factor = recurso === 'Agua'
          ? (fila.hogares ? fila.personas / fila.hogares : 0) * 30
          : 1;
        fila.gastoEstimado += promedio * factor * (umbral.tarifa || 0);
      });

      fila.gastoEstimado = Number(fila.gastoEstimado.toFixed(2));
      resultado[zona] = fila;
    });
    return resultado;
  }

  function anioMasReciente(consumos) {
    return consumos.reduce(function (max, c) { return Math.max(max, Number(c.anio) || 0); }, 0) || ANIO_SEMILLA;
  }

  // Evolucion mensual por zona para un recurso. Los meses sin datos quedan en
  // null para que el grafico deje el hueco en lugar de caer a cero.
  function serieMensualPorZona(recurso, anio) {
    const usuarios = usuariosFinales();
    const consumos = listar('consumos');
    const anioSerie = Number(anio) || anioMasReciente(consumos);
    const resultado = {};

    nombresZonas().forEach(function (zona) {
      const ids = {};
      usuarios.forEach(function (u) { if (u.hogar.zona === zona) ids[u.id] = true; });

      resultado[zona] = MESES.map(function (mes) {
        const valores = consumos.filter(function (c) {
          return c.recurso === recurso && c.mes === mes && Number(c.anio) === anioSerie && ids[c.usuarioId];
        });
        if (!valores.length) return null;
        const suma = valores.reduce(function (a, c) { return a + c.valor; }, 0);
        return Number((suma / valores.length).toFixed(1));
      });
    });
    return resultado;
  }

  function indicadores() {
    const todos = listar('usuarios');
    const finales = usuariosFinales();
    const dist = distribucionConsumo();
    const consumos = listar('consumos');

    let enRiesgo = 0;
    finales.forEach(function (u) {
      const excede = RECURSOS.some(function (recurso) {
        const p = promedioUsuario(consumos, u.id, recurso);
        if (p === null) return false;
        return p >= umbralesDe(recurso, u.hogar.zona).umbralAlto;
      });
      if (excede) enRiesgo++;
    });

    const carencias = carenciasPorZona();
    let hogaresConCarencia = 0;
    finales.forEach(function (u) {
      if ((u.hogar.servicios || []).length < RECURSOS.length) hogaresConCarencia++;
    });

    return {
      totalUsuarios: todos.filter(function (u) { return u.rol !== 'admin'; }).length,
      usuariosReales: todos.filter(function (u) { return !u.simulado && u.rol !== 'admin'; }).length,
      hogares: finales.length,
      registrosConsumo: consumos.length,
      alertas: listar('notificaciones').filter(function (n) { return /^Alerta/.test(n.titulo || ''); }).length,
      pctEnRiesgo: finales.length ? Number((enRiesgo / finales.length * 100).toFixed(1)) : 0,
      pctConCarencia: finales.length ? Number((hogaresConCarencia / finales.length * 100).toFixed(1)) : 0,
      distribucion: dist,
      carencias: carencias
    };
  }

  /* ---------------------------------------------------------------------
     12. REGLAS DE NEGOCIO COMPARTIDAS (usuario y administrador)
     Reemplazan en el prototipo a los endpoints EP08, EP10, EP21 y EP45-EP46.
     --------------------------------------------------------------------- */

  function periodoDe(anio, mes) {
    return Number(anio) * 100 + (MESES.indexOf(mes) + 1);
  }

  function periodoActual() {
    const hoy = new Date();
    return hoy.getFullYear() * 100 + hoy.getMonth() + 1;
  }

  // HU04: costo con la tarifa de la zona. El agua se registra en L/dia por
  // persona, por eso su costo es valor x personas x 30 x tarifa.
  function calcularCosto(recurso, valor, usuario) {
    const hogar = usuario && usuario.hogar;
    if (!hogar) return 0;
    const tarifa = umbralesDe(recurso, hogar.zona).tarifa || 0;
    const factor = recurso === 'Agua' ? (Number(hogar.personas) || 1) * 30 : 1;
    return Number((Number(valor) * factor * tarifa).toFixed(2));
  }

  // Las lecturas de la demo no guardan costo: se calcula con la tarifa vigente.
  function costoDe(consumo, usuario) {
    if (typeof consumo.costoEstimado === 'number') return consumo.costoEstimado;
    return calcularCosto(consumo.recurso, consumo.valor, usuario || obtener('usuarios', consumo.usuarioId));
  }

  // HU01 / HU09: preferencias por usuario (se crean con los valores por defecto).
  function preferenciasDe(usuarioId) {
    const filas = listar('preferencias');
    let p = filas.find(function (f) { return f.usuarioId === usuarioId; });
    if (!p) {
      p = { id: nuevoId('pre'), usuarioId: usuarioId, notifAgua: true, notifLuz: true, notifGas: true,
            notifTransporte: true, aceptaRetos: true, recordatorioSemanal: false, ultimoRecordatorio: null };
      filas.push(p);
      guardarTabla('preferencias', filas);
    }
    return p;
  }

  // HU04 CA1-CA5 (y HU16 CA4: el admin sigue las mismas reglas).
  function validarConsumo(d, idExcluir) {
    const usuario = obtener('usuarios', d.usuarioId);
    if (!usuario || !usuario.hogar) return 'El usuario no tiene un hogar registrado.';
    if (RECURSOS.indexOf(d.recurso) === -1) return 'Selecciona un servicio valido.';
    if ((usuario.hogar.servicios || []).indexOf(d.recurso) === -1) {
      return 'El hogar no cuenta con el servicio de ' + d.recurso + '. Primero actualiza la informacion del hogar.';
    }
    const anio = Number(d.anio);
    if (!Number.isInteger(anio) || anio < ANIO_MINIMO) return 'El anio debe ser ' + ANIO_MINIMO + ' o posterior.';
    if (MESES.indexOf(d.mes) === -1) return 'Selecciona un mes entre enero y diciembre.';
    if (periodoDe(anio, d.mes) > periodoActual()) return 'No se puede registrar un mes futuro.';
    if (!(Number(d.valor) > 0)) return 'El valor debe ser mayor a 0.';

    const repetida = listar('consumos').some(function (c) {
      return c.id !== idExcluir && c.usuarioId === d.usuarioId && c.recurso === d.recurso &&
             Number(c.anio) === anio && c.mes === d.mes;
    });
    if (repetida) {
      return 'Ya existe la lectura de ' + d.recurso + ' para ' + (MESES.indexOf(d.mes) + 1) + '/' + anio +
             '. Edita esa lectura en lugar de crear otra.';
    }
    return null;
  }

  const CONSEJO_ALERTA = {
    Agua: 'Revisa posibles fugas en canos, inodoro y terma.',
    Luz: 'Revisa equipos en modo espera y focos que queden encendidos.',
    Gas: 'Revisa las conexiones y el tiempo de coccion.',
    Transporte: 'Agrupa tus viajes y evalua alternativas como la bicicleta.'
  };

  // HU08: alerta si la lectura supera en mas de 20% el promedio de las demas
  // lecturas del servicio Y alcanza el umbral alto de la zona Y el usuario
  // tiene activadas las alertas de ese servicio.
  function revisarAnomalia(consumo, usuario) {
    const otras = listar('consumos').filter(function (c) {
      return c.usuarioId === consumo.usuarioId && c.recurso === consumo.recurso && c.id !== consumo.id;
    });
    if (!otras.length) return null;                               // primera lectura

    const promedio = otras.reduce(function (a, c) { return a + c.valor; }, 0) / otras.length;
    const umbralAlto = umbralesDe(consumo.recurso, usuario.hogar.zona).umbralAlto;
    if (!(consumo.valor > promedio * 1.2 && consumo.valor >= umbralAlto)) return null;

    if (!preferenciasDe(usuario.id)['notif' + consumo.recurso]) return null;

    const exceso = Math.round((consumo.valor - promedio) / promedio * 100);
    return agregar('notificaciones', {
      usuarioId: usuario.id,
      recurso: consumo.recurso,
      titulo: 'Alerta de ' + consumo.recurso,
      mensaje: 'Tu consumo de ' + consumo.recurso + ' de ' + (MESES.indexOf(consumo.mes) + 1) + '/' + consumo.anio +
               ' fue ' + consumo.valor + ' ' + UNIDADES[consumo.recurso] + ', ' + exceso +
               '% por encima de tu promedio (' + Math.round(promedio) + ').',
      detalle: CONSEJO_ALERTA[consumo.recurso],
      leida: false,
      fecha: new Date().toISOString()
    }, 'not');
  }

  // EP08 / EP45: registrar lectura. Devuelve { ok, mensaje | consumo, alertaGenerada }.
  function registrarConsumo(d) {
    const error = validarConsumo(d, null);
    if (error) return { ok: false, mensaje: error };

    const usuario = obtener('usuarios', d.usuarioId);
    const valor = Number(Number(d.valor).toFixed(2));
    const consumo = agregar('consumos', {
      usuarioId: d.usuarioId,
      recurso: d.recurso,
      anio: Number(d.anio),
      mes: d.mes,
      valor: valor,
      costoEstimado: calcularCosto(d.recurso, valor, usuario),
      fechaRegistro: new Date().toISOString().slice(0, 10)
    }, 'con');

    const alerta = revisarAnomalia(consumo, usuario);
    return { ok: true, consumo: consumo, alertaGenerada: !!alerta, alerta: alerta };
  }

  // EP10 / EP46: corregir lectura (se recalcula el costo).
  function actualizarConsumo(id, cambios) {
    const actual = obtener('consumos', id);
    if (!actual) return { ok: false, mensaje: 'La lectura ya no existe.' };
    const d = Object.assign({}, actual, cambios);
    const error = validarConsumo(d, id);
    if (error) return { ok: false, mensaje: error };

    d.anio = Number(d.anio);
    d.valor = Number(Number(d.valor).toFixed(2));
    d.costoEstimado = calcularCosto(d.recurso, d.valor, obtener('usuarios', d.usuarioId));
    return { ok: true, consumo: actualizar('consumos', id, d) };
  }

  /* ---------------------------------------------------------------------
     13. AUTENTICACION (HU02)
     Cada intento fallido suma 1; al quinto la cuenta se bloquea y solo el
     administrador puede desbloquearla (HU16). La cuenta admin no se bloquea
     por intentos, para que la demostracion no quede sin administrador.
     --------------------------------------------------------------------- */

  function autenticar(usuario, contrasena) {
    const usuarios = listar('usuarios');
    const u = usuarios.find(function (x) { return x.usuario === usuario; });
    if (!u) return { ok: false, motivo: 'credenciales' };
    if (u.activo === false) return { ok: false, motivo: 'bloqueado', usuario: u };

    if (u.contrasena !== contrasena) {
      if (u.rol === 'admin') return { ok: false, motivo: 'credenciales' };
      u.intentosFallidos = (u.intentosFallidos || 0) + 1;
      if (u.intentosFallidos >= MAX_INTENTOS) u.activo = false;
      guardarTabla('usuarios', usuarios);
      return u.activo
        ? { ok: false, motivo: 'credenciales', intentos: u.intentosFallidos }
        : { ok: false, motivo: 'bloqueado', recienBloqueado: true, usuario: u };
    }

    if (u.intentosFallidos) {                        // HU02 CA4
      u.intentosFallidos = 0;
      guardarTabla('usuarios', usuarios);
    }
    return { ok: true, usuario: u };
  }

  function autenticarAdmin(usuario, contrasena) {
    const resultado = autenticar(usuario, contrasena);
    if (!resultado.ok) return resultado;
    if (resultado.usuario.rol !== 'admin') {
      return { ok: false, motivo: 'permisos', usuario: resultado.usuario };
    }
    return resultado;
  }

  /* ---------------------------------------------------------------------
     14. API PUBLICA
     --------------------------------------------------------------------- */

  return {
    // constantes
    get ZONAS() { return nombresZonas(); },
    RECURSOS: RECURSOS,
    UNIDADES: UNIDADES,
    MESES: MESES,
    SEGMENTOS: SEGMENTOS,
    FACTOR_CO2: FACTOR_CO2,
    ANIO_MINIMO: ANIO_MINIMO,
    MAX_INTENTOS: MAX_INTENTOS,
    ADMIN_DEMO: { usuario: ADMIN_POR_DEFECTO.usuario, contrasena: ADMIN_POR_DEFECTO.contrasena },

    // ciclo de vida
    inicializar: inicializar,
    reiniciar: function () {
      Object.keys(K).forEach(function (k) { localStorage.removeItem(K[k]); });
      inicializar();
    },

    // CRUD
    listar: listar,
    obtener: obtener,
    agregar: agregar,
    actualizar: actualizar,
    eliminar: eliminar,
    guardarTabla: guardarTabla,

    // auditoria
    registrarAuditoria: registrarAuditoria,

    // estadisticas del panel
    distribucionConsumo: distribucionConsumo,
    carenciasPorZona: carenciasPorZona,
    resumenPorZona: resumenPorZona,
    serieMensualPorZona: serieMensualPorZona,
    indicadores: indicadores,
    umbralesDe: umbralesDe,
    promedioUsuario: promedioUsuario,

    // reglas compartidas
    periodoDe: periodoDe,
    calcularCosto: calcularCosto,
    costoDe: costoDe,
    preferenciasDe: preferenciasDe,
    registrarConsumo: registrarConsumo,
    actualizarConsumo: actualizarConsumo,

    // autenticacion
    autenticar: autenticar,
    autenticarAdmin: autenticarAdmin,

    // utilidades
    nuevoId: nuevoId,
    ahora: ahora
  };

})();

if (typeof window !== 'undefined') window.EcoData = EcoData;
