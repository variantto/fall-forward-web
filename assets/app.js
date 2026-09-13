/* ==========================================================================
   Fall Forward — sitio público. Vanilla, sin frameworks y sin CDN.

   REGLAS QUE VIENEN DEL STACK, no del frontend, y que acá se respetan igual:
   - Un campo `null` SE DICE ("SIN DATO"). Nunca un cero, nunca un guion
     suelto, nunca una sección que desaparece en silencio. Un hueco que se
     esconde es peor que un hueco declarado.
   - El `formato` de los niveles viene RESUELTO desde el backend. Acá no se
     reordena ni se recalcula nada: si dice `lista_plana` es porque el pivote
     no separa resistencias de soportes y el molde de tres bloques ordenaría
     mal.
   - La frescura es información de primera línea. Si los datos no son de la
     última corrida, se dice arriba y con lugar propio.
   ========================================================================== */

'use strict';

var URL_DATOS = 'data/public_snapshot.json';

/* ── helpers ─────────────────────────────────────────────────────────────── */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** El marcador de hueco. Una sola función para que se vea SIEMPRE igual. */
function sinDato() { return '<span class="sin-dato">SIN DATO</span>'; }

/** Número en formato local (7.656,98). Devuelve null si no hay dato —
 *  el llamador decide cómo declararlo, acá no se inventa un 0. */
function num(v, dec) {
  if (v === null || v === undefined || v === '') return null;
  var n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  if (!isFinite(n)) return null;
  return n.toLocaleString('es-AR', {
    minimumFractionDigits: dec == null ? 2 : dec,
    maximumFractionDigits: dec == null ? 2 : dec
  });
}

function val(v, dec, sufijo) {
  var s = num(v, dec);
  return s === null ? sinDato() : esc(s) + (sufijo || '');
}

/** Magnitudes en dólares: $-1,4B / $-132M. */
function dinero(v) {
  if (v === null || v === undefined) return null;
  var n = Number(v), abs = Math.abs(n);
  if (!isFinite(n)) return null;
  if (abs >= 1e9) return (n / 1e9).toLocaleString('es-AR', { maximumFractionDigits: 2 }) + 'B';
  if (abs >= 1e6) return (n / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 0 }) + 'M';
  return n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

/** "hace 2 horas" / "hace 32 h". En lenguaje humano, no un ISO crudo. */
function hace(min) {
  if (min == null || !isFinite(min)) return null;
  if (min < 1)   return 'recién';
  if (min < 60)  return 'hace ' + Math.round(min) + ' min';
  var h = min / 60;
  if (h < 48)    return 'hace ' + (h < 10 ? h.toFixed(1).replace('.', ',') : Math.round(h)) + ' h';
  return 'hace ' + Math.round(h / 24) + ' días';
}

var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
             'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function fechaLarga(iso) {
  if (!iso) return null;
  var p = String(iso).split('-');
  if (p.length < 3) return null;
  return parseInt(p[2], 10) + ' de ' + MESES[parseInt(p[1], 10) - 1];
}

/* ── colores por tipo de nivel (WEBAPP_CONTEXT §Design System) ───────────── */

/* El orden IMPORTA: una etiqueta fusionada como "Max GEX / Put wall" tiene que
   resolver a UN color, y el primero que matchea gana. Se prueba de lo más
   específico a lo más genérico. */
var COLORES = [
  [/zero\s*gamma|pivote/i, 'var(--zg)'],
  [/vol\s*trigger/i,       'var(--vt)'],
  [/call\s*wall/i,         'var(--call)'],
  [/put\s*wall/i,          'var(--put)'],
  [/max\s*gex/i,           'var(--maxgex)'],
  [/spot/i,                'var(--spot)'],
  [/em\s|^em|±|σ/i,        'var(--em)']
];

function colorDe(etiqueta) {
  for (var i = 0; i < COLORES.length; i++) {
    if (COLORES[i][0].test(etiqueta)) return COLORES[i][1];
  }
  return 'var(--em)';
}

/* ── niveles ─────────────────────────────────────────────────────────────── */

/* Los niveles llegan como strings ya armados por el backend ("Call wall
   29,612.59"). Se parte etiqueta/número para poder colorear y para reformatear
   el número al formato local — el backend los escribe con coma de miles y
   punto decimal, que en un sitio en español se lee mal. El VALOR no se toca:
   sólo su representación. */
function filaNivel(texto) {
  var s = String(texto).trim();
  var m = s.match(/(-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?)\s*\)?\s*$/);
  var etiqueta = m ? s.slice(0, m.index).trim() : s;
  var precio = m ? num(m[1]) : null;

  var esSpot = /spot/i.test(etiqueta);
  etiqueta = etiqueta.replace(/^\(/, '').replace(/[:\-–]\s*$/, '').trim();

  var clases = 'lvl' + (esSpot ? ' is-spot' : '');
  return '<div class="' + clases + '" style="border-left-color:' + colorDe(etiqueta) + '">' +
           '<span class="n">' + esc(etiqueta) + '</span>' +
           '<span class="p">' + (precio === null ? sinDato() : esc(precio)) + '</span>' +
         '</div>';
}

function bloqueInstrumento(nombre, d) {
  if (!d) {
    return '<div class="instr"><h3>' + esc(nombre) + '</h3>' +
           '<div class="instr-flag">Sin niveles publicados para ' + esc(nombre) +
           ' en esta corrida.</div></div>';
  }

  var h = '<div class="instr"><h3>' + esc(nombre);
  if (d.expiry) h += '<span class="sub">exp ' + esc(d.expiry) + '</span>';
  h += '</h3>';

  /* Banderas ARRIBA de los niveles: es lo que hay que ver antes de mirar un
     precio, no después. */
  (d.banderas || []).forEach(function (b) {
    h += '<div class="instr-flag">' + esc(b) + '</div>';
  });
  if (d.basis && d.basis.fuera_de_rango) {
    h += '<div class="instr-flag">' + esc(d.basis.fuera_de_rango) + '</div>';
  }
  if (d.origen_sin_dato) {
    h += '<div class="instr-flag">La cadena de opciones de la que se derivan ' +
         'estos niveles vino vacía: tomalos con esa reserva.</div>';
  }

  if (d.formato === 'tres_bloques') {
    if ((d.resistencias || []).length) {
      h += '<div class="lvl-group">RESISTENCIAS</div>';
      d.resistencias.forEach(function (l) { h += filaNivel(l); });
    }
    h += '<div class="lvl-group">PIVOTE (ZERO GAMMA)</div>';
    h += d.pivote_zero_gamma == null
       ? '<div class="lvl is-pivot" style="border-left-color:var(--zg)">' +
         '<span class="n">Zero gamma</span><span class="p">' + sinDato() + '</span></div>'
       : filaNivel('Zero gamma ' + d.pivote_zero_gamma);
    if ((d.soportes || []).length) {
      h += '<div class="lvl-group">SOPORTES</div>';
      d.soportes.forEach(function (l) { h += filaNivel(l); });
    }
  } else {
    /* lista_plana: el pivote NO queda en el medio. Va tal cual viene, por
       precio descendente, con el spot intercalado donde el backend lo puso. */
    h += '<div class="lvl-group">POR PRECIO</div>';
    (d.niveles_por_precio || []).forEach(function (l) { h += filaNivel(l); });
  }

  if (d.basis && d.basis.valor != null) {
    h += '<div class="row" style="padding-top:10px">' +
           '<span class="k">Basis ' + esc(d.basis.contrato || '') + '</span>' +
           '<span class="v">' + val(d.basis.valor) +
           (d.basis.rth_warning ? '<small>capturado fuera de rueda</small>' : '') +
         '</span></div>';
  }
  return h + '</div>';
}

function tablaTickers(t) {
  if (!t) return '';
  var filas = '';
  ['SPX', 'SPY', 'QQQ'].forEach(function (tk) {
    var d = t[tk];
    if (!d) {
      filas += '<tr><td>' + tk + '</td><td colspan="5">' + sinDato() + '</td></tr>';
      return;
    }
    filas += '<tr><td>' + tk + '</td>' +
      '<td>' + val(d.spot) + '</td>' +
      '<td>' + val(d.zero_gamma) + '</td>' +
      '<td>' + val(d.call_wall) + '</td>' +
      '<td>' + val(d.put_wall) + '</td>' +
      '<td>' + val(d.expected_move_1sigma) + '</td></tr>';
  });
  return '<div class="card"><div class="tickers-wrap"><table class="tickers">' +
    '<tr><th>Ticker</th><th>Spot</th><th>Zero γ</th><th>Call wall</th>' +
    '<th>Put wall</th><th>EM 1σ</th></tr>' + filas +
    '</table></div></div>';
}

/* ── markdown mínimo ─────────────────────────────────────────────────────── */

/* Renderer propio, deliberadamente chico. Los briefs usan exactamente cuatro
   cosas: líneas en negrita como título, **negrita** inline, bullets con "- " y
   párrafos sueltos. Traer una librería de markdown por CDN para eso sería
   cargar decenas de KB y una dependencia externa para cubrir un subconjunto
   que entra en 25 líneas. Se escapa ANTES de formatear: el texto viene de un
   modelo y nunca se inserta crudo. */
function md(texto) {
  var lineas = esc(texto).split('\n');
  var out = '', lista = false;

  function cerrarLista() { if (lista) { out += '</ul>'; lista = false; } }

  for (var i = 0; i < lineas.length; i++) {
    var l = lineas[i].trim();
    if (!l) { cerrarLista(); continue; }

    l = l.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    if (/^[-·•]\s+/.test(l)) {
      if (!lista) { out += '<ul>'; lista = true; }
      out += '<li>' + l.replace(/^[-·•]\s+/, '') + '</li>';
    } else {
      cerrarLista();
      out += '<p>' + l + '</p>';
    }
  }
  cerrarLista();
  return out;
}

/** Primer párrafo con texto, para el estado colapsado. */
function primerParrafo(texto) {
  var lineas = String(texto).split('\n');
  for (var i = 0; i < lineas.length; i++) {
    var l = lineas[i].trim().replace(/\*\*/g, '').replace(/^[-·•]\s+/, '');
    if (l.length > 30) return l.length > 180 ? l.slice(0, 177) + '…' : l;
  }
  return 'Brief completo.';
}

function bloqueBrief(slot, texto) {
  if (!texto) return '';   /* a las 09:35 no hay PM: la sección no sale */
  return '<details class="brief"><summary>' +
           '<div class="brief-head">' +
             '<span class="brief-slot">BRIEF ' + esc(slot) + '</span>' +
             '<span class="brief-toggle"></span>' +
           '</div>' +
           '<div class="brief-peek">' + esc(primerParrafo(texto)) + '</div>' +
         '</summary>' +
         '<div class="brief-body">' + md(texto) + '</div></details>';
}

/* ── secciones ───────────────────────────────────────────────────────────── */

function cabecera(d) {
  var f = d.frescura || {};
  var edadArchivo = d.generated_at
    ? (Date.now() - new Date(d.generated_at).getTime()) / 60000 : null;
  var esCierre = d.slot === '1605';
  var cuando = (esCierre ? 'Cierre del ' : 'Rueda del ') + (fechaLarga(d.sesion) || '—');
  var viejo = f.dentro_de_ventana === false;

  var h = '<div class="brand"><h1>Fall Forward</h1>' +
          '<span class="tag">La lectura del día</span></div>' +
          '<div class="freshness' + (viejo ? ' is-stale' : '') + '">' +
            '<span class="dot"></span>' + esc(cuando);
  var rel = hace(edadArchivo);
  if (rel) h += ' · ' + esc(rel);
  h += '</div>';

  /* Datos viejos: se dice arriba, con lugar propio y en números. */
  if (viejo && f.artefacto_mas_viejo_min != null) {
    h += '<div class="stale-banner"><b>Esta lectura no es de la última corrida.</b> ' +
         'Los datos con los que está armada son de ' +
         esc(hace(f.artefacto_mas_viejo_min)) +
         ', no de hace unos minutos. Sirve para ver qué se publicó, no para operar ahora.</div>';
  } else if (f.dentro_de_ventana == null) {
    h += '<div class="stale-banner">No se pudo determinar qué tan frescos son ' +
         'los datos de esta lectura.</div>';
  }
  return h;
}

function veredicto(v) {
  if (!v) {
    return '<div class="section-title">Veredicto</div>' +
           '<div class="card">Esta corrida no publicó veredicto. ' + sinDato() + '</div>';
  }
  var h = '<div class="section-title">Veredicto</div>';

  /* ARRIBA del score, con peso de bandera. El orden es el del brief: qué NO se
     midió, después el estado del veto, después los desacuerdos. */
  (v.estado_datos || []).forEach(function (l) {
    h += '<div class="flag flag-datos"><span class="flag-label">SIN DATO</span>' +
         esc(l.replace(/^SIN DATO\s*[—-]\s*/, '')) + '</div>';
  });
  (v.estado_veto || []).forEach(function (l) {
    h += '<div class="flag flag-veto"><span class="flag-label">VETO</span>' + esc(l) + '</div>';
  });
  (v.divergencias || []).forEach(function (l) {
    h += '<div class="flag flag-div"><span class="flag-label">DIVERGENCIA</span>' +
         esc(l) + '</div>';
  });

  var pct = v.score != null && v.max ? Math.max(0, Math.min(100, v.score / v.max * 100)) : 0;

  /* EL NÚMERO NO LLEVA EL COLOR DEL BIAS. El score es una MAGNITUD —cuánta
     confluencia hay— y el bias es una DIRECCIÓN: son dos ejes distintos y
     pintarlos del mismo color los funde en uno. Un 110/124 bearish en rojo
     gigante con la barra casi llena se lee como un medidor de alarma al tope,
     cuando lo que dice es "señal fuerte". El número va neutro, la barra va
     indigo de marca porque mide fuerza, y el color de dirección vive SOLO en
     la etiqueta del bias, que es donde significa algo. */
  var dir = /BEAR/i.test(v.bias || '') ? 'var(--put)'
          : /BULL/i.test(v.bias || '') ? 'var(--call)' : 'var(--text-dim)';

  h += '<div class="card"><div class="verdict">' +
         '<div class="score">' +
           (v.score == null ? sinDato() : esc(v.score)) +
           '<span class="of">/' + esc(v.max || 124) + '</span></div>' +
         '<div class="meta">' +
           '<div class="label" style="color:' + dir + '">' +
             (v.label ? esc(v.label) : sinDato()) + '</div>' +
           '<div class="bias">Sesgo calculado: ' +
             (v.bias ? esc(v.bias) : 'sin dato') + '</div>' +
         '</div></div>' +
         '<div class="gauge"><span style="width:' + pct.toFixed(1) + '%"></span></div>' +
         '<div class="gauge-note">Confluencia medida, no dirección. ' +
           'La dirección es el sesgo de arriba.</div>' +
       '</div>';
  return h;
}

function regimen(r) {
  var h = '<div class="section-title">Régimen</div><div class="card"><div class="rows">';

  var gex = r && r.gex;
  h += '<div class="row"><span class="k">GEX neto</span><span class="v">' +
       (gex && gex.valor != null
         ? '<span style="color:' + (gex.signo === 'positivo' ? 'var(--call)' : 'var(--put)') +
           '">$' + esc(dinero(gex.valor)) + '</span><small>' +
           (gex.signo === 'positivo' ? 'dealers amortiguan' : 'dealers amplifican') + '</small>'
         : sinDato()) +
       '</span></div>';

  h += '<div class="row"><span class="k">Spot SPX</span><span class="v">' +
       val(r && r.spot_spx) + '</span></div>';

  h += '<div class="row"><span class="k">Zero gamma</span><span class="v">' +
       (r && r.zero_gamma != null
         ? val(r.zero_gamma) + (r.distancia_pct != null
             ? '<small>spot ' + (r.distancia_pct >= 0 ? 'arriba' : 'abajo') + ' ' +
               esc(num(Math.abs(r.distancia_pct), 2)) + '%</small>'
             : '')
         : sinDato()) +
       '</span></div>';

  var vix = r && r.vix;
  h += '<div class="row"><span class="k">Régimen VIX</span><span class="v">' +
       (vix && vix.regimen
         ? esc(vix.regimen) + '<small>' +
           (vix.desde ? 'desde ' + esc(vix.desde) : '') +
           (vix.ratio != null ? ' · ratio ' + esc(num(vix.ratio, 4)) : '') + '</small>'
         : sinDato()) +
       '</span></div>';

  return h + '</div></div>';
}

function pro() {
  return '<div class="section-title">Acceso completo</div>' +
    '<div class="pro"><h3>Lo que sigue detrás de esta pantalla</h3>' +
    '<p>Esta página es la lectura del día. El acceso completo abre el detalle ' +
    'que hay debajo de ella:</p><ul>' +
    '<li>GEX por strike, con el perfil completo y el punto donde se da vuelta</li>' +
    '<li>Flujo institucional: premium neto, delta imbalance y bloques</li>' +
    '<li>Volatilidad: VEX, CHEX, skew 25Δ y la prima de riesgo</li>' +
    '<li>Histórico de score y niveles, sesión por sesión</li>' +
    '<li>Alertas cuando el régimen cambia, sin tener que mirar</li>' +
    '</ul><div class="soon">En preparación</div></div>';
}

function pie() {
  return '<footer><div class="links">' +
    '<a href="#" data-link="discord">Comunidad en Discord</a>' +
    '<a href="#" data-link="tradingview">Indicador de TradingView</a>' +
    '</div><div class="disclaimer">Los niveles son referencias, no objetivos. ' +
    'Nada de lo publicado acá es una recomendación de inversión.</div></footer>';
}

/* ── render ──────────────────────────────────────────────────────────────── */

function render(d) {
  var n = d.niveles || {};
  var f = n.futuros || {};
  var b = d.briefs || {};

  document.getElementById('app').innerHTML =
    cabecera(d) +
    veredicto(d.veredicto) +
    regimen(d.regimen) +
    '<div class="section-title">Niveles</div>' +
    '<div class="card">' + bloqueInstrumento('ES', f.ES) +
                           bloqueInstrumento('NQ', f.NQ) + '</div>' +
    tablaTickers(n.tickers) +
    (b.AM || b.PM ? '<div class="section-title">Los briefs del día</div>' : '') +
    bloqueBrief('AM', b.AM) + bloqueBrief('PM', b.PM) +
    pro() + pie();
}

/* Nunca una pantalla en blanco. */
function errorDeCarga(motivo) {
  document.getElementById('app').innerHTML =
    '<div class="brand"><h1>Fall Forward</h1>' +
    '<span class="tag">La lectura del día</span></div>' +
    '<div class="error" style="margin-top:16px"><b>No se pudieron cargar los datos.</b>' +
    'La lectura de hoy no está disponible en este momento. No es que el mercado ' +
    'esté neutro ni que no haya nada que mostrar: la página no pudo leer el archivo. ' +
    'Probá recargar en unos minutos.<br><br><code>' + esc(motivo) + '</code></div>' +
    pie();
}

/* `cache: no-store` frena el caché del NAVEGADOR. El del CDN lo resuelve Pages,
   que purga en cada deploy — por eso el fetch es RELATIVO y no contra
   raw.githubusercontent.com, donde el TTL es de 5 min y el cache-busting por
   query string NO funciona (medido: con ?t= distinto sigue dando HIT). */
fetch(URL_DATOS, { cache: 'no-store' })
  .then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  })
  .then(render)
  .catch(function (e) { errorDeCarga(e && e.message ? e.message : String(e)); });
