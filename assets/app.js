// Placeholder. El frontend real va acá.
// Nota para quien lo escriba: pedir el JSON con cache-busting, y si la carga
// falla, mostrar el ultimo snapshot bueno DICIENDO de cuando es -- nunca una
// pagina vacia y nunca un dato viejo sin fecha.
const URL_DATOS = 'data/public_snapshot.json';
fetch(`${URL_DATOS}?t=${Date.now()}`, { cache: 'no-store' })
  .then(r => r.json())
  .then(d => {
    document.getElementById('app').textContent =
      `${d.sesion} ${d.slot} — ${d.veredicto?.label ?? 'sin veredicto'}`;
  })
  .catch(() => {
    document.getElementById('app').textContent =
      'No se pudo cargar la lectura del día.';
  });
