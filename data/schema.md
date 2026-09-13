# `public_snapshot.json` — qué significa cada campo

Una versión por `schema`. Subí el número cuando cambie la FORMA del archivo;
los commits viejos se leen con la versión que declaran.

## `schema: 1`

### Raíz
| campo | qué es |
|---|---|
| `schema` | versión de este documento que aplica al archivo |
| `generated_at` | cuándo se armó el snapshot (hora local del runner) |
| `sesion` | fecha de la sesión de mercado a la que corresponden los datos |
| `slot` | qué corrida lo generó: `0830` `0935` `1200` `1430` `1530` `1605`. `1605` es el cierre; el resto es media rueda |

### `veredicto`
| campo | qué es |
|---|---|
| `score` / `max` | puntaje de confluencia sobre 124 |
| `label`, `bias` | etiqueta y sesgo calculados por el stack |
| `estado_veto` | líneas exactas del estado del VETO. Puede decir que un veto **no se pudo evaluar**, que no es lo mismo que haber pasado |
| `estado_datos` | presente sólo cuando algo **no se midió**. Si está, lo que nombre no se puede leer como número |
| `divergencias` | desacuerdos entre capas del score, si los hay |

El desglose por capa no se publica.

### `regimen`
`gex` (`valor` y `signo`, o `null` si no se midió), `spot_spx`, `zero_gamma`,
`distancia_pct` (spot contra zero gamma, en %), y `vix` con el régimen vigente
según el watcher (`regimen`, `desde`, `direccion`, `ratio`, `cambio_en`).

### `niveles`
- **`futuros`** — `ES` y `NQ`, igual que en el brief: `formato` dice si van en
  tres bloques (`resistencias` / pivote / `soportes`) o en `lista_plana` por
  precio descendente. `banderas` trae los avisos de estructura. `basis` incluye
  el contrato y si quedó fuera de rango. `origen_sin_dato` marca que la cadena
  de la que se derivan vino vacía.
- **`tickers`** — `SPX`, `SPY`, `QQQ`: `spot`, `zero_gamma`, `call_wall`,
  `put_wall`, expected move ±1σ y `expiry`. `sin_dato: true` significa que todo
  lo derivado de la cadena sale `null`; el `spot` sobrevive porque se mide
  aparte.

No se publica GEX por strike.

### `briefs`
Texto completo del brief `AM` y del `PM` de la sesión, tal como se publicaron.
`null` si todavía no existe — a media mañana no hay PM.

### `stale_flags`
Banderas sobre el **dato y el mercado**, no sobre la infraestructura:
`flow_stale`, `spot_sintetico`, `iv_sintetica`, `zero_gamma_fuera_de_span`,
`cadena_vacia`, `basis_fuera_de_rango`, `basis_fuera_de_rth`,
`expiraciones_no_adyacentes`.

`true` = pasa. `false` = no pasa. `null` = **no se pudo determinar**, que es un
tercer estado y no un `false`.
