# Fall Forward — sitio público

La **lectura del día** del stack de gamma/GEX de Fall Forward: veredicto,
régimen, niveles de ES/NQ y SPX/SPY/QQQ, y los dos briefs completos (AM y PM)
tal como se publicaron.

Esto **no es un GEX viewer**. No competimos en datos en vivo — hay productos
que hacen eso mejor, con miles de tickers y refresco de segundos. Lo que hay
acá es un juicio, en español, sobre lo que muestran los números del día.

## Cómo funciona

Es un sitio **estático**. No hay backend, no hay base de datos y no hay API
paga detrás: el stack corre en una máquina propia seis veces por día y publica
un único JSON a este repo. El frontend lo lee y lo dibuja.

```
index.html            el sitio
assets/               js y css
data/
  public_snapshot.json   ← lo escribe una MÁQUINA, 6 veces por día
  schema.md              ← qué significa cada campo
```

**`data/` lo escribe un proceso automático.** No lo edites a mano: la corrida
siguiente lo sobrescribe. Cada commit sobre ese archivo viene de
`web_publisher.py` y su mensaje dice de qué sesión y de qué horario es.

## El historial es a propósito

Cada corrida deja un commit, así que el historial de este repo es el registro
completo de todo lo que publicamos: cada score, cada nivel, con fecha de commit
que no se puede editar después.

Eso es deliberado. Para alguien que enseña, poder decir *"acá está todo lo que
dije, sin retoques"* vale más que reservarse una serie de números. `git log
--oneline` se lee como el diario de lo publicado:

```
snapshot 2026-09-11 1605 — score 54/124 🔴 BEARISH BIAS
snapshot 2026-09-11 1530 — score 51/124 🔴 BEARISH BIAS
```

## Cuando algo falta

El JSON declara sus propios huecos. Si la cadena de opciones vino vacía, si no
hubo zero gamma, si el basis quedó fuera de rango o si un chequeo no se pudo
evaluar, el snapshot lo dice con todas las letras en vez de rellenar con un
valor plausible. Un cero exacto donde nunca hay un cero **no** es un dato: es
un dato que falta, y así se muestra.
