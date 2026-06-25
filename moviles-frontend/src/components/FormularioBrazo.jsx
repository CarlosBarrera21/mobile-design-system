import { useState } from 'react'
import { brazoService, colganteService, hiloService } from '../services/api'

const LONGITUDES_FIBONACCI = [7, 11, 18, 29, 47, 76, 123]

// ─── Helper: profundidad máxima recursiva de un sub-árbol ────────────────────
const calcularProfundidadMax = async (brazoId, movilId) => {
  const res = await colganteService.obtenerPorBrazo(brazoId, movilId)
  const colgantes = res.data
  let maxProf = 0
  for (const c of colgantes) {
    const largoHilo = c.hilo?.largo ?? 0
    if (c.objetoHijo) {
      maxProf = Math.max(maxProf, largoHilo + c.objetoHijo.largo)
    } else if (c.brazoHijo) {
      const subProf = await calcularProfundidadMax(c.brazoHijo.id, movilId)
      maxProf = Math.max(maxProf, largoHilo + subProf)
    }
  }
  return maxProf
}

// ─── Helper: alcance horizontal de un brazo desde su centro ─────────────────
const calcularAlcanceDerecho = (brazoId, colgantes) => {
  const cols = colgantes.filter(c => c.brazoPadre?.id === brazoId)
  if (!cols.length) return 0
  const brazoLong = cols[0].brazoPadre?.longitud ?? 0
  let reach = brazoLong / 2
  for (const c of cols) {
    if (c.lado === 'derecho') {
      const dp = c.distanciaPivote ?? 0
      if (c.objetoHijo) {
        reach = Math.max(reach, dp + (c.objetoHijo.ancho / 2.0) + 1.0)
      } else if (c.brazoHijo) {
        reach = Math.max(reach, dp + calcularAlcanceDerecho(c.brazoHijo.id, colgantes))
      }
    }
  }
  return reach
}

const calcularAlcanceIzquierdo = (brazoId, colgantes) => {
  const cols = colgantes.filter(c => c.brazoPadre?.id === brazoId)
  if (!cols.length) return 0
  const brazoLong = cols[0].brazoPadre?.longitud ?? 0
  let reach = brazoLong / 2
  for (const c of cols) {
    if (c.lado === 'izquierdo') {
      const dp = c.distanciaPivote ?? 0
      if (c.objetoHijo) {
        reach = Math.max(reach, dp + (c.objetoHijo.ancho / 2.0) + 1.0)
      } else if (c.brazoHijo) {
        reach = Math.max(reach, dp + calcularAlcanceIzquierdo(c.brazoHijo.id, colgantes))
      }
    }
  }
  return reach
}

const lMinFibonacci = (lMin) => {
  const longMin = Math.ceil(lMin)
  const fibs = LONGITUDES_FIBONACCI.filter(l => l >= longMin)
  return fibs.length > 0 ? fibs : [LONGITUDES_FIBONACCI[LONGITUDES_FIBONACCI.length - 1]]
}

// ─── SelectorChipsHilo: chips igual que longitud del brazo ───────────────────
// minLargo: longitud mínima del hilo para no colisionar (se muestra como chip especial)
// checkFn: fn(hilo) => bool — true si el hilo cumple restricción
function SelectorChipsHilo({ label, value, onChange, hilos, onHiloCreado, minLargo, checkFn }) {
  const [creandoNuevo, setCreandoNuevo] = useState(false)
  const [nuevoLargo, setNuevoLargo] = useState(minLargo ? String(Math.ceil(minLargo) + 1) : '')
  const [guardandoHilo, setGuardandoHilo] = useState(false)
  const [errorHilo, setErrorHilo] = useState('')

  const crearHilo = async () => {
    const largo = parseFloat(nuevoLargo)
    if (!largo || largo <= 0) { setErrorHilo('Largo inválido'); return }
    setGuardandoHilo(true); setErrorHilo('')
    try {
      const res = await hiloService.crear({ largo })
      const hiloNuevo = res.data
      onHiloCreado(hiloNuevo)
      onChange(String(hiloNuevo.id))
      setCreandoNuevo(false)
    } catch (e) {
      setErrorHilo('❌ ' + (e.response?.data?.message || e.message))
    } finally {
      setGuardandoHilo(false)
    }
  }

  // Ordenar hilos por largo ascendente
  const hilosOrdenados = [...hilos].sort((a, b) => a.largo - b.largo)
  const idSeleccionado = parseInt(value)
  const hiloSel = hilos.find(h => h.id === idSeleccionado)
  const cumple = hiloSel && checkFn ? checkFn(hiloSel) : true

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>{label}</label>

      {/* Info del mínimo */}
      {minLargo != null && (
        <div style={{ fontSize: '11px', background: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '6px', padding: '4px 8px', color: '#1565c0' }}>
          🧵 Mínimo para no colisionar: <strong>{minLargo.toFixed(1)}cm</strong>
        </div>
      )}

      {/* Chips de hilos disponibles */}
      {!creandoNuevo ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {hilosOrdenados.map(h => {
              const esSeleccionado = h.id === idSeleccionado
              const esCumple = checkFn ? checkFn(h) : true
              const esMenorAlMin = minLargo != null && h.largo < minLargo
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => onChange(String(h.id))}
                  title={esMenorAlMin ? `⚠ Este hilo (${h.largo}cm) es menor al mínimo (${minLargo?.toFixed(1)}cm)` : `Hilo #${h.id} — ${h.largo}cm`}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    borderRadius: '20px',
                    border: esSeleccionado
                      ? `2px solid ${esCumple ? '#1976d2' : '#f57c00'}`
                      : `1px solid ${esMenorAlMin ? '#ffb74d' : '#bbb'}`,
                    background: esSeleccionado
                      ? (esCumple ? '#e0f0ff' : '#fff3e0')
                      : (esMenorAlMin ? '#fff8e1' : '#f5f5f5'),
                    cursor: 'pointer',
                    fontWeight: esSeleccionado ? 'bold' : 'normal',
                    color: esMenorAlMin && !esSeleccionado ? '#e65100' : 'inherit'
                  }}
                >
                  {h.largo}cm {esMenorAlMin ? '⚠' : (esCumple && esSeleccionado ? '✓' : '')}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setCreandoNuevo(true)}
              style={{
                padding: '5px 12px', fontSize: '12px', borderRadius: '20px',
                border: '1px dashed #4CAF50', background: '#f1f8e9',
                cursor: 'pointer', color: '#2e7d32'
              }}
            >
              ➕ Nuevo
            </button>
          </div>
          {value && !cumple && (
            <small style={{ color: '#e65100' }}>
              ⚠ El hilo seleccionado ({hiloSel?.largo}cm) no cumple la restricción mínima
            </small>
          )}
          {!value && (
            <small style={{ color: '#999' }}>Selecciona un hilo</small>
          )}
        </>
      ) : (
        <div style={{
          border: '1px dashed #4CAF50', borderRadius: '8px',
          padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 'bold' }}>
            ➕ Nuevo hilo {minLargo ? `(mínimo: ${minLargo.toFixed(1)}cm)` : ''}
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="number" min="1" step="0.5"
              value={nuevoLargo}
              onChange={e => setNuevoLargo(e.target.value)}
              placeholder={`Ej: ${minLargo ? Math.ceil(minLargo) + 1 : 10}`}
              style={{
                flex: 1, padding: '6px', borderRadius: '6px',
                border: '1px solid #a5d6a7', fontSize: '13px'
              }}
            />
            <span style={{ fontSize: '12px', color: '#666' }}>cm</span>
          </div>
          {errorHilo && <small style={{ color: 'red' }}>{errorHilo}</small>}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setCreandoNuevo(false)} style={{
              flex: 1, padding: '5px', borderRadius: '6px',
              border: '1px solid #bbb', background: '#f5f5f5',
              cursor: 'pointer', fontSize: '12px'
            }}>✖ Cancelar</button>
            <button onClick={crearHilo} disabled={guardandoHilo || !nuevoLargo}
              style={{
                flex: 2, padding: '5px', borderRadius: '6px', border: 'none',
                background: guardandoHilo ? '#ccc' : '#4CAF50',
                color: 'white', cursor: guardandoHilo ? 'not-allowed' : 'pointer', fontSize: '12px'
              }}>
              {guardandoHilo ? '⏳ Creando...' : '✅ Crear y usar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SelectorHilo (reservado — no usado actualmente) ───────────────────────────
function SelectorHilo({ label, value, onChange, hilos, onHiloCreado, minLargoRecomendado, checkFn }) {
  const [creandoNuevo, setCreandoNuevo] = useState(false)
  const [nuevoLargo, setNuevoLargo] = useState(
    minLargoRecomendado ? String(Math.ceil(minLargoRecomendado) + 1) : ''
  )
  const [guardandoHilo, setGuardandoHilo] = useState(false)
  const [errorHilo, setErrorHilo] = useState('')

  const crearHilo = async () => {
    const largo = parseFloat(nuevoLargo)
    if (!largo || largo <= 0) { setErrorHilo('Largo inválido'); return }
    setGuardandoHilo(true); setErrorHilo('')
    try {
      const res = await hiloService.crear({ largo })
      const hiloNuevo = res.data
      onHiloCreado(hiloNuevo)
      onChange(String(hiloNuevo.id))
      setCreandoNuevo(false)
    } catch (e) {
      setErrorHilo('❌ ' + (e.response?.data?.message || e.message))
    } finally {
      setGuardandoHilo(false)
    }
  }

  const hiloSeleccionado = hilos.find(h => h.id === parseInt(value))
  const cumple = hiloSeleccionado && checkFn ? checkFn(hiloSeleccionado) : true

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '12px', color: '#666' }}>{label}</label>
      {!creandoNuevo ? (
        <>
          <select value={value} onChange={e => {
            if (e.target.value === '__nuevo__') { setCreandoNuevo(true); return }
            onChange(e.target.value)
          }}
            style={{
              padding: '6px', borderRadius: '6px', fontSize: '13px',
              border: `1px solid ${value && !cumple ? '#ffb74d' : '#ccc'}`
            }}>
            <option value="">-- Selecciona --</option>
            {hilos.map(h => (
              <option key={h.id} value={h.id}>
                Hilo #{h.id} ({h.largo}cm){checkFn ? (checkFn(h) ? ' ✓' : ' ⚠') : ''}
              </option>
            ))}
            <option value="__nuevo__">➕ Crear hilo nuevo...</option>
          </select>
          {minLargoRecomendado != null && (
            <small style={{ color: '#888' }}>
              Recomendado: &gt; <strong>{minLargoRecomendado.toFixed(1)}cm</strong>
            </small>
          )}
        </>
      ) : (
        <div style={{
          border: '1px dashed #4CAF50', borderRadius: '8px',
          padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px'
        }}>
          <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 'bold' }}>
            ➕ Nuevo hilo {minLargoRecomendado ? `(recomendado > ${minLargoRecomendado.toFixed(1)}cm)` : ''}
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="number" min="1" step="0.5"
              value={nuevoLargo}
              onChange={e => setNuevoLargo(e.target.value)}
              placeholder={`Ej: ${minLargoRecomendado ? Math.ceil(minLargoRecomendado) + 1 : 10}`}
              style={{
                flex: 1, padding: '6px', borderRadius: '6px',
                border: '1px solid #a5d6a7', fontSize: '13px'
              }}
            />
            <span style={{ fontSize: '12px', color: '#666' }}>cm</span>
          </div>
          {errorHilo && <small style={{ color: 'red' }}>{errorHilo}</small>}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setCreandoNuevo(false)} style={{
              flex: 1, padding: '5px', borderRadius: '6px',
              border: '1px solid #bbb', background: '#f5f5f5',
              cursor: 'pointer', fontSize: '12px'
            }}>✖ Cancelar</button>
            <button onClick={crearHilo} disabled={guardandoHilo || !nuevoLargo}
              style={{
                flex: 2, padding: '5px', borderRadius: '6px', border: 'none',
                background: guardandoHilo ? '#ccc' : '#4CAF50',
                color: 'white', cursor: guardandoHilo ? 'not-allowed' : 'pointer', fontSize: '12px'
              }}>
              {guardandoHilo ? '⏳ Creando...' : '✅ Crear y usar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Paso 1: Selección de los 2 objetos ──────────────────────────────────────
function PasoSeleccionObjetos({ objetos, onSugerencia }) {
  const [obj1Id, setObj1Id] = useState('')
  const [obj2Id, setObj2Id] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const calcular = async () => {
    if (!obj1Id || !obj2Id) { setError('Selecciona los 2 objetos'); return }
    setCargando(true); setError('')
    try {
      const res = await brazoService.sugerirMinimo(obj1Id, obj2Id)
      onSugerencia(res.data, parseInt(obj1Id), parseInt(obj2Id))
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data || e.message
      setError('❌ Error al calcular: ' + (typeof msg === 'object' ? JSON.stringify(msg) : msg))
    } finally {
      setCargando(false)
    }
  }

  const obj1 = objetos.find(o => o.id === parseInt(obj1Id))
  const obj2 = objetos.find(o => o.id === parseInt(obj2Id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
        Selecciona los 2 objetos del nivel más bajo del móvil:
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        {[
          { label: 'Objeto 1', id: obj1Id, setId: setObj1Id, obj: obj1 },
          { label: 'Objeto 2', id: obj2Id, setId: setObj2Id, obj: obj2 }
        ].map(({ label, id, setId, obj }) => (
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>{label}</label>
            <select value={id} onChange={e => setId(e.target.value)}
              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px' }}>
              <option value="">-- Selecciona --</option>
              {objetos.map(o => (
                <option key={o.id} value={o.id}>{o.nombre} ({o.peso}g, ancho {o.ancho}cm)</option>
              ))}
            </select>
            {obj && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#388e3c' }}>
                {obj.imagenBase64
                  ? <img src={obj.imagenBase64} alt={obj.nombre}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #e57373' }} />
                  : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e57373', flexShrink: 0 }} />
                }
                <span>radio: {((obj.ancho / 2) + 1).toFixed(2)}cm</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {error && <small style={{ color: 'red' }}>{error}</small>}
      <button onClick={calcular} disabled={cargando || !obj1Id || !obj2Id}
        style={{
          padding: '8px', borderRadius: '6px', border: 'none',
          background: (!obj1Id || !obj2Id) ? '#ccc' : '#1976d2',
          color: 'white', cursor: (!obj1Id || !obj2Id) ? 'not-allowed' : 'pointer', fontSize: '13px'
        }}>
        {cargando ? '⏳ Calculando...' : '📐 Calcular brazo mínimo'}
      </button>
    </div>
  )
}

// ─── Paso 2: Mostrar sugerencia, elegir longitud Fibonacci y guardar ──────────
// MODIFICADO: hilos ahora son chips con mínimo calculado
function PasoConfigurar({ sugerencia, obj1Id, obj2Id, objetos, hilos, onHiloCreado, movilId, onGuardado, onVolver }) {
  const [longitudElegida, setLongitudElegida] = useState(null)
  const [hiloIzqId, setHiloIzqId] = useState('')
  const [hiloDerId, setHiloDerId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const obj1 = objetos.find(o => o.id === obj1Id)
  const obj2 = objetos.find(o => o.id === obj2Id)
  const izqObj = obj1.peso >= obj2.peso ? obj1 : obj2
  const derObj = obj1.peso >= obj2.peso ? obj2 : obj1

  const longMin = Math.ceil(sugerencia.longitudMinima)
  const longitudesMostradas = LONGITUDES_FIBONACCI.filter(l => l >= longMin)
  const longActual = longitudElegida ?? (longitudesMostradas.length > 0 ? longitudesMostradas[0] : null)

  const w1 = izqObj.peso
  const w2 = derObj.peso
  const W = longActual
  const distIzq = (longActual * (w2 + W / 2) / (w1 + w2 + W)).toFixed(4)
  const distDer = (longActual - parseFloat(distIzq)).toFixed(4)

  // Hilo mínimo: margen NFZ (0.5cm × 2) + proporción del objeto para evitar solapamiento visual
  const minHiloIzq = Math.max(1, Math.ceil(izqObj.largo * 0.2))
  const minHiloDer = Math.max(1, Math.ceil(derObj.largo * 0.2))

  const guardar = async () => {
    if (!longActual || !hiloIzqId || !hiloDerId) return
    setGuardando(true); setError('')
    try {
      const brazoRes = await brazoService.crear({
        nombre: `Brazo ${longActual}cm`, longitud: longActual, peso: longActual, posX: 0, posY: 0
      })
      const brazoNuevo = brazoRes.data
      await Promise.all([
        colganteService.crear({
          movilPadreId: movilId, brazoPadreId: brazoNuevo.id,
          objetoHijoId: izqObj.id, hiloId: parseInt(hiloIzqId),
          lado: 'izquierdo', distanciaPivote: parseFloat(distIzq)
        }),
        colganteService.crear({
          movilPadreId: movilId, brazoPadreId: brazoNuevo.id,
          objetoHijoId: derObj.id, hiloId: parseInt(hiloDerId),
          lado: 'derecho', distanciaPivote: parseFloat(distDer)
        })
      ])
      onGuardado({ brazoId: brazoNuevo.id, brazo: brazoNuevo })
    } catch (e) {
      setError('❌ ' + (e.response?.data?.message || e.message))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
        <strong>📐 Longitud mínima del brazo: {sugerencia.longitudMinima}cm</strong>
        <div style={{ marginTop: '6px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span>⬅ <strong>{izqObj.nombre}</strong> ({izqObj.peso}g) — radio {sugerencia.obj1Izquierdo ? sugerencia.radioObj1 : sugerencia.radioObj2}cm</span>
          <span>➡ <strong>{derObj.nombre}</strong> ({derObj.peso}g) — radio {sugerencia.obj1Izquierdo ? sugerencia.radioObj2 : sugerencia.radioObj1}cm</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', color: '#666' }}>Longitud del brazo (mínimo {sugerencia.longitudMinima}cm):</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {longitudesMostradas.map(l => (
            <button key={l} type="button" onClick={() => setLongitudElegida(l)}
              style={{
                padding: '5px 14px', fontSize: '12px', borderRadius: '20px',
                border: longActual === l ? '2px solid #1976d2' : '1px solid #bbb',
                background: longActual === l ? '#e0f0ff' : '#f5f5f5',
                cursor: 'pointer', fontWeight: longActual === l ? 'bold' : 'normal'
              }}>
              {l}cm
            </button>
          ))}
        </div>
        {longitudesMostradas.length === 0 && (
          <small style={{ color: '#e65100' }}>
            ⚠️ Ninguna longitud Fibonacci alcanza {sugerencia.longitudMinima.toFixed(1)}cm — usa el brazo más grande disponible ({LONGITUDES_FIBONACCI[LONGITUDES_FIBONACCI.length-1]}cm)
          </small>
        )}
      </div>

      <div style={{ background: '#fff8e1', border: '1px solid #ffe082', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
        ⚖️ Equilibrio: <strong>{izqObj.nombre} ({w1}g)</strong> × {distIzq}cm
        = <strong>{derObj.nombre} ({w2}g)</strong> × {distDer}cm
      </div>

      {/* NUEVO: Chips de hilo con mínimo calculado */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <SelectorChipsHilo
          label={`⬅ Hilo izquierdo (${izqObj.nombre})`}
          value={hiloIzqId}
          onChange={setHiloIzqId}
          hilos={hilos}
          onHiloCreado={onHiloCreado}
          minLargo={minHiloIzq}
          checkFn={h => h.largo >= minHiloIzq}
        />
        <SelectorChipsHilo
          label={`➡ Hilo derecho (${derObj.nombre})`}
          value={hiloDerId}
          onChange={setHiloDerId}
          hilos={hilos}
          onHiloCreado={onHiloCreado}
          minLargo={minHiloDer}
          checkFn={h => h.largo >= minHiloDer}
        />
      </div>

      {error && <small style={{ color: 'red' }}>{error}</small>}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onVolver} style={{
          flex: 1, padding: '8px', borderRadius: '6px',
          border: '1px solid #bbb', background: '#f5f5f5', cursor: 'pointer', fontSize: '13px'
        }}>← Volver</button>
        <button onClick={guardar} disabled={guardando || !hiloIzqId || !hiloDerId}
          style={{
            flex: 2, padding: '8px', borderRadius: '6px', border: 'none',
            background: (!hiloIzqId || !hiloDerId) ? '#ccc' : '#4CAF50',
            color: 'white', cursor: (!hiloIzqId || !hiloDerId) ? 'not-allowed' : 'pointer', fontSize: '13px'
          }}>
          {guardando ? '⏳ Guardando...' : '✅ Guardar nivel'}
        </button>
      </div>
    </div>
  )
}

// ─── Sub-formulario: crear Brazo C con 2 objetos ──────────────────────────────
// MODIFICADO: hilos ahora son chips con mínimo calculado
function FormularioBrazoC({ objetos, hilos, movilId, onCreado, onCancelar, onHiloCreado }) {
  const [obj3Id, setObj3Id] = useState('')
  const [obj4Id, setObj4Id] = useState('')
  const [hiloObj3Id, setHiloObj3Id] = useState('')
  const [hiloObj4Id, setHiloObj4Id] = useState('')
  const [longitudElegida, setLongitudElegida] = useState(null)
  const [sugerencia, setSugerencia] = useState(null)
  const [calculando, setCalculando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const obj3 = objetos.find(o => o.id === parseInt(obj3Id))
  const obj4 = objetos.find(o => o.id === parseInt(obj4Id))

  const calcular = async () => {
    if (!obj3Id || !obj4Id) return
    setCalculando(true); setError('')
    try {
      const res = await brazoService.sugerirMinimo(obj3Id, obj4Id)
      const s = res.data
      const longMin = Math.ceil(s.longitudMinima)
      const lMins = LONGITUDES_FIBONACCI.filter(l => l >= longMin)
      if (lMins.length > 0) {
        setLongitudElegida(lMins[0])
      }
      setSugerencia({ ...s, longitudesMostradas: lMins })
    } catch (e) {
      setError('❌ ' + (e.response?.data?.message || e.message))
    } finally {
      setCalculando(false)
    }
  }

  const guardar = async () => {
    if (!longitudElegida || !hiloObj3Id || !hiloObj4Id) return
    setGuardando(true); setError('')
    try {
      const L = longitudElegida
      const W = L
      const w3 = obj3.peso
      const w4 = obj4.peso
      const izqObj = w3 >= w4 ? obj3 : obj4
      const derObj = w3 >= w4 ? obj4 : obj3
      const hiloIzqId = w3 >= w4 ? parseInt(hiloObj3Id) : parseInt(hiloObj4Id)
      const hiloDerId = w3 >= w4 ? parseInt(hiloObj4Id) : parseInt(hiloObj3Id)
      const distIzq = parseFloat((L * (derObj.peso + W / 2) / (izqObj.peso + derObj.peso + W)).toFixed(4))
      const distDer = parseFloat((L - distIzq).toFixed(4))

      const brazoRes = await brazoService.crear({
        nombre: `Brazo ${L}cm`, longitud: L, peso: L, posX: 0, posY: 0
      })
      const brazoC = brazoRes.data
      await Promise.all([
        colganteService.crear({
          movilPadreId: movilId, brazoPadreId: brazoC.id,
          objetoHijoId: izqObj.id, hiloId: hiloIzqId,
          lado: 'izquierdo', distanciaPivote: distIzq
        }),
        colganteService.crear({
          movilPadreId: movilId, brazoPadreId: brazoC.id,
          objetoHijoId: derObj.id, hiloId: hiloDerId,
          lado: 'derecho', distanciaPivote: distDer
        })
      ])
      onCreado({ brazoC })
    } catch (e) {
      setError('❌ ' + (e.response?.data?.message || e.message))
    } finally {
      setGuardando(false)
    }
  }

  const lActual = longitudElegida ?? sugerencia?.longitudesMostradas?.[0]
  const distPreview = sugerencia && lActual && obj3 && obj4 ? (() => {
    const izqObj = obj3.peso >= obj4.peso ? obj3 : obj4
    const derObj = obj3.peso >= obj4.peso ? obj4 : obj3
    const W = lActual
    const dI = (lActual * (derObj.peso + W / 2) / (izqObj.peso + derObj.peso + W)).toFixed(4)
    return { izqObj, derObj, dI, dD: (lActual - parseFloat(dI)).toFixed(4) }
  })() : null

  return (
    <div style={{ border: '1px dashed #90caf9', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#1565c0' }}>
        🔵 Brazo C — selecciona los 2 objetos que cuelgan de él
      </p>

      <div style={{ display: 'flex', gap: '10px' }}>
        {[
          { label: 'Objeto 3', id: obj3Id, setId: (v) => { setObj3Id(v); setSugerencia(null) } },
          { label: 'Objeto 4', id: obj4Id, setId: (v) => { setObj4Id(v); setSugerencia(null) } }
        ].map(({ label, id, setId }) => (
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>{label}</label>
            <select value={id} onChange={e => setId(e.target.value)}
              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px' }}>
              <option value="">-- Selecciona --</option>
              {objetos.map(o => (
                <option key={o.id} value={o.id}>{o.nombre} ({o.peso}g, ancho {o.ancho}cm)</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <button onClick={calcular} disabled={calculando || !obj3Id || !obj4Id}
        style={{
          padding: '7px', borderRadius: '6px', border: 'none',
          background: (!obj3Id || !obj4Id) ? '#ccc' : '#1976d2',
          color: 'white', cursor: (!obj3Id || !obj4Id) ? 'not-allowed' : 'pointer', fontSize: '13px'
        }}>
        {calculando ? '⏳ Calculando...' : '📐 Calcular Brazo C mínimo'}
      </button>

      {sugerencia && (
        <>
          <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
            <strong>📐 Longitud mínima Brazo C: {sugerencia.longitudMinima}cm</strong>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {sugerencia.longitudesMostradas.map(l => (
              <button key={l} type="button" onClick={() => setLongitudElegida(l)}
                style={{
                  padding: '5px 14px', fontSize: '12px', borderRadius: '20px',
                  border: lActual === l ? '2px solid #1976d2' : '1px solid #bbb',
                  background: lActual === l ? '#e0f0ff' : '#f5f5f5',
                  cursor: 'pointer', fontWeight: lActual === l ? 'bold' : 'normal'
                }}>
                {l}cm
              </button>
            ))}
          </div>

          {distPreview && (
            <div style={{ background: '#fff8e1', border: '1px solid #ffe082', padding: '8px', borderRadius: '8px', fontSize: '13px' }}>
              ⚖️ ⬅ <strong>{distPreview.izqObj.nombre} ({distPreview.izqObj.peso}g)</strong> × {distPreview.dI}cm
              = ➡ <strong>{distPreview.derObj.nombre} ({distPreview.derObj.peso}g)</strong> × {distPreview.dD}cm
            </div>
          )}

          {/* NUEVO: Chips de hilo con mínimo calculado */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <SelectorChipsHilo
              label={`🧵 Hilo ${obj3?.nombre ?? 'Obj 3'}`}
              value={hiloObj3Id}
              onChange={setHiloObj3Id}
              hilos={hilos}
              onHiloCreado={onHiloCreado}
              minLargo={1}
              checkFn={h => h.largo >= 1}
            />
            <SelectorChipsHilo
              label={`🧵 Hilo ${obj4?.nombre ?? 'Obj 4'}`}
              value={hiloObj4Id}
              onChange={setHiloObj4Id}
              hilos={hilos}
              onHiloCreado={onHiloCreado}
              minLargo={1}
              checkFn={h => h.largo >= 1}
            />
          </div>

          {error && <small style={{ color: 'red' }}>{error}</small>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onCancelar} style={{
              flex: 1, padding: '7px', borderRadius: '6px',
              border: '1px solid #bbb', background: '#f5f5f5', cursor: 'pointer', fontSize: '13px'
            }}>✖ Cancelar</button>
            <button onClick={guardar} disabled={guardando || !hiloObj3Id || !hiloObj4Id || !lActual}
              style={{
                flex: 2, padding: '7px', borderRadius: '6px', border: 'none',
                background: (!hiloObj3Id || !hiloObj4Id) ? '#ccc' : '#1976d2',
                color: 'white', cursor: (!hiloObj3Id || !hiloObj4Id) ? 'not-allowed' : 'pointer', fontSize: '13px'
              }}>
              {guardando ? '⏳ Creando Brazo C...' : '✅ Crear Brazo C'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Paso 3: Nivel guardado — opción A (objeto) o B (brazo C) ─────────────────
function PasoNivelGuardado({ brazoActualId, brazoActual, objetos, hilos, colgantes, movilId, nivel, onGuardado, onHiloCreado }) {
  const [agregandoNivel, setAgregandoNivel] = useState(false)
  const [modoLado, setModoLado] = useState(null)

  const [objetoNuevoId, setObjetoNuevoId] = useState('')
  const [hiloObjNuevoId, setHiloObjNuevoId] = useState('')
  const [hiloBrazoAntId, setHiloBrazoAntId] = useState('')

  const [brazoC, setBrazoC] = useState(null)
  const [hiloBrazoCId, setHiloBrazoCId] = useState('')
  const [hiloBrazoAntBId, setHiloBrazoAntBId] = useState('')

  const [resultadoCalculo, setResultadoCalculo] = useState(null)
  const [longitudElegida, setLongitudElegida] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setModoLado(null)
    setObjetoNuevoId(''); setHiloObjNuevoId(''); setHiloBrazoAntId('')
    setBrazoC(null); setHiloBrazoCId(''); setHiloBrazoAntBId('')
    setResultadoCalculo(null); setLongitudElegida(null); setError('')
  }

  const calcularOpcionA = async () => {
    if (!objetoNuevoId) { setError('Selecciona el objeto primero'); return }
    setCargando(true); setError('')
    try {
      const ptRes = await brazoService.pesoTotal(brazoActualId)
      const wA = ptRes.data > 0 ? ptRes.data : (brazoActual?.peso ?? 1)
      const objNuevo = objetos.find(o => o.id === parseInt(objetoNuevoId))
      const w2 = objNuevo.peso
      const radioObjNuevo = (objNuevo.ancho / 2.0) + 1.0
      const derechoReach = calcularAlcanceDerecho(brazoActualId, colgantes)
      const izquierdoReach = calcularAlcanceIzquierdo(brazoActualId, colgantes)
      const brazoActualEsIzquierdo = wA >= w2

      const MARGEN_NFZ = 1.0
      let lMinPorObjeto, lMinSinColision
      // Con peso del brazo (W = L):
      //   d_der = L·(wA + L/2)/(wA + w2 + L) >= radioObjNuevo  [si brazoA izquierda, objeto derecha]
      //   d_izq = L·(w2 + L/2)/(wA + w2 + L) >= radioObjNuevo  [si brazoA derecha, objeto izquierda]
      // Se resuelve la cuadrática: L >= r - w + sqrt((w - r)² + 2·r·(wA + w2))
      if (brazoActualEsIzquierdo) {
        const w = wA, r = radioObjNuevo
        lMinPorObjeto = r - w + Math.sqrt(Math.pow(w - r, 2) + 2.0 * r * (wA + w2))
        lMinSinColision = derechoReach + radioObjNuevo + MARGEN_NFZ
      } else {
        const w = w2, r = radioObjNuevo
        lMinPorObjeto = r - w + Math.sqrt(Math.pow(w - r, 2) + 2.0 * r * (wA + w2))
        lMinSinColision = izquierdoReach + radioObjNuevo + MARGEN_NFZ
      }
      let lMin = Math.max(lMinPorObjeto, lMinSinColision, 1)
      if (!isFinite(lMin) || isNaN(lMin)) lMin = 1

      // smallest hilo for brazo anterior that clears the new object's vertical drop
      const hilosBrazoAntCandidatos = hilos.filter(h => h.largo > objNuevo.largo).sort((a, b) => a.largo - b.largo)
      const hiloSugBrazoAnt = hilosBrazoAntCandidatos[0] ?? hilos.slice().sort((a, b) => b.largo - a.largo)[0]
      const largoHiloBrazoAnt = hiloSugBrazoAnt?.largo ?? 0
      const minHiloBrazoNecesario = objNuevo.largo + 1

      const lMins = lMinFibonacci(lMin)
      setLongitudElegida(lMins[0])

      if (largoHiloBrazoAnt <= objNuevo.largo) {
        if (hiloSugBrazoAnt) setHiloBrazoAntId(String(hiloSugBrazoAnt.id))
        setResultadoCalculo({
          modo: 'objeto', lMin: Math.ceil(lMin), lMins,
          wA, w2, objNuevo, radioObjNuevo,
          derechoReach,
          brazoActualEsIzquierdo: wA >= w2,
          hiloSugBrazoAnt, hiloSugObjNuevo: null,
          maxLargoObjNuevo: 0,
          minHiloBrazoNecesario,
          lMinPorObjeto, lMinSinColision
        })
        setError(
          `⚠️ El hilo del brazo anterior (${largoHiloBrazoAnt}cm) es demasiado corto. ` +
          `Con un objeto de largo ${objNuevo.largo}cm vertical necesitas un hilo de brazo > ${minHiloBrazoNecesario}cm. ` +
          `Crea un hilo nuevo en el selector.`
        )
        return
      }

      const maxLargoObjNuevo = largoHiloBrazoAnt - objNuevo.largo
      const hiloSugObjNuevo = hilos.filter(h => h.largo < maxLargoObjNuevo).sort((a, b) => b.largo - a.largo)[0]
        ?? hilos.slice().sort((a, b) => a.largo - b.largo)[0]

      if (hiloSugBrazoAnt) setHiloBrazoAntId(String(hiloSugBrazoAnt.id))
      if (hiloSugObjNuevo) setHiloObjNuevoId(String(hiloSugObjNuevo.id))
      setResultadoCalculo({
        modo: 'objeto', lMin: Math.ceil(lMin), lMins,
        wA, w2, objNuevo, radioObjNuevo,
        derechoReach,
        brazoActualEsIzquierdo: wA >= w2,
        hiloSugBrazoAnt, hiloSugObjNuevo, maxLargoObjNuevo,
        minHiloBrazoNecesario,
        lMinPorObjeto, lMinSinColision
      })
    } catch (e) {
      setError('❌ ' + e.message)
    } finally {
      setCargando(false)
    }
  }

  const calcularOpcionB = async () => {
    if (!brazoC) { setError('Primero crea el Brazo C'); return }
    setCargando(true); setError('')
    try {
      const [resWA, resWC] = await Promise.all([
        brazoService.pesoTotal(brazoActualId),
        brazoService.pesoTotal(brazoC.id)
      ])
      const wA = resWA.data > 0 ? resWA.data : (brazoActual?.peso ?? 1)
      const wC = resWC.data > 0 ? resWC.data : (brazoC?.peso ?? 1)
      const derechoReachA = calcularAlcanceDerecho(brazoActualId, colgantes)
      const izquierdoReachA = calcularAlcanceIzquierdo(brazoActualId, colgantes)
      const derechoReachC = calcularAlcanceDerecho(brazoC.id, colgantes)
      const izquierdoReachC = calcularAlcanceIzquierdo(brazoC.id, colgantes)
      const brazoAEsIzquierdo = wA >= wC

      const MARGEN_NFZ = 1.0
      let lMinSinColision
      if (brazoAEsIzquierdo) {
        lMinSinColision = derechoReachA + izquierdoReachC + MARGEN_NFZ
      } else {
        lMinSinColision = derechoReachC + izquierdoReachA + MARGEN_NFZ
      }

      let lMin = Math.max(lMinSinColision, 1)
      if (!isFinite(lMin) || isNaN(lMin)) lMin = 1

      const [profA, profC] = await Promise.all([
        calcularProfundidadMax(brazoActualId, movilId),
        calcularProfundidadMax(brazoC.id, movilId)
      ])

      const hiloSugBrazoA = hilos.filter(h => h.largo > profA).sort((a, b) => a.largo - b.largo)[0]
        ?? hilos.slice().sort((a, b) => b.largo - a.largo)[0]
      const hiloSugBrazoC = hilos.filter(h => h.largo > profC).sort((a, b) => a.largo - b.largo)[0]
        ?? hilos.slice().sort((a, b) => b.largo - a.largo)[0]

      if (hiloSugBrazoA) setHiloBrazoAntBId(String(hiloSugBrazoA.id))
      if (hiloSugBrazoC) setHiloBrazoCId(String(hiloSugBrazoC.id))

      const lMins = lMinFibonacci(lMin)
      setLongitudElegida(lMins[0])
      setResultadoCalculo({
        modo: 'brazo', lMin: Math.ceil(lMin), lMins,
        wA, wC, brazoAEsIzquierdo: wA >= wC,
        hiloSugBrazoA, hiloSugBrazoC,
        profA, profC, minLargoParaA: profA, minLargoParaC: profC,
        lMinSinColision
      })
    } catch (e) {
      setError('❌ ' + e.message)
    } finally {
      setCargando(false)
    }
  }

  const advertenciaY = (() => {
    if (!resultadoCalculo) return null
    if (resultadoCalculo.modo === 'objeto') {
      const hiloObj = hilos.find(h => h.id === parseInt(hiloObjNuevoId))
      const hiloBrazo = hilos.find(h => h.id === parseInt(hiloBrazoAntId))
      if (!hiloObj || !hiloBrazo) return null
      const yObj = hiloObj.largo + resultadoCalculo.objNuevo.largo
      if (yObj >= hiloBrazo.largo)
        return `⚠️ Colisión vertical: objeto nuevo baja ${yObj.toFixed(2)}cm, brazo anterior a ${hiloBrazo.largo}cm. Hilo objeto < ${(hiloBrazo.largo - resultadoCalculo.objNuevo.largo).toFixed(2)}cm o hilo brazo > ${yObj.toFixed(2)}cm.`
    }
    if (resultadoCalculo.modo === 'brazo') {
      const hiloA = hilos.find(h => h.id === parseInt(hiloBrazoAntBId))
      const hiloC = hilos.find(h => h.id === parseInt(hiloBrazoCId))
      if (!hiloA || !hiloC) return null
      const warnings = []
      if (hiloA.largo <= resultadoCalculo.profA)
        warnings.push(`⚠️ Hilo Brazo A muy corto: sus objetos bajan ${resultadoCalculo.profA.toFixed(1)}cm pero el hilo mide ${hiloA.largo}cm. Usa un hilo > ${resultadoCalculo.profA.toFixed(1)}cm.`)
      if (hiloC.largo <= resultadoCalculo.profC)
        warnings.push(`⚠️ Hilo Brazo C muy corto: sus objetos bajan ${resultadoCalculo.profC.toFixed(1)}cm pero el hilo mide ${hiloC.largo}cm. Usa un hilo > ${resultadoCalculo.profC.toFixed(1)}cm.`)
      return warnings.length > 0 ? warnings.join(' | ') : null
    }
    return null
  })()

  const guardarNivelSuperior = async () => {
    if (!resultadoCalculo || guardadoExitoso || advertenciaY) return
    const L = longitudElegida ?? resultadoCalculo.lMins[0]
    setGuardando(true); setError('')
    try {
      const brazoRes = await brazoService.crear({
        nombre: `Brazo ${L}cm`, longitud: L, peso: L, posX: 0, posY: 0
      })
      const brazoB = brazoRes.data
      let colganteIzq, colganteDer

      if (resultadoCalculo.modo === 'objeto') {
        const { wA, w2, objNuevo, brazoActualEsIzquierdo } = resultadoCalculo
        const W = L
        const distIzq = brazoActualEsIzquierdo
          ? parseFloat((L * (w2 + W / 2) / (wA + w2 + W)).toFixed(4))
          : parseFloat((L * (wA + W / 2) / (wA + w2 + W)).toFixed(4))
        const distDer = parseFloat((L - distIzq).toFixed(4))
        colganteIzq = {
          movilPadreId: movilId, brazoPadreId: brazoB.id, lado: 'izquierdo', distanciaPivote: distIzq,
          hiloId: brazoActualEsIzquierdo ? parseInt(hiloBrazoAntId) : parseInt(hiloObjNuevoId),
          brazoHijoId: brazoActualEsIzquierdo ? brazoActualId : null,
          objetoHijoId: brazoActualEsIzquierdo ? null : objNuevo.id
        }
        colganteDer = {
          movilPadreId: movilId, brazoPadreId: brazoB.id, lado: 'derecho', distanciaPivote: distDer,
          hiloId: brazoActualEsIzquierdo ? parseInt(hiloObjNuevoId) : parseInt(hiloBrazoAntId),
          brazoHijoId: brazoActualEsIzquierdo ? null : brazoActualId,
          objetoHijoId: brazoActualEsIzquierdo ? objNuevo.id : null
        }
      } else {
        const { wA, wC, brazoAEsIzquierdo } = resultadoCalculo
        const W = L
        const distIzq = brazoAEsIzquierdo
          ? parseFloat((L * (wC + W / 2) / (wA + wC + W)).toFixed(4))
          : parseFloat((L * (wA + W / 2) / (wA + wC + W)).toFixed(4))
        const distDer = parseFloat((L - distIzq).toFixed(4))
        colganteIzq = {
          movilPadreId: movilId, brazoPadreId: brazoB.id, lado: 'izquierdo', distanciaPivote: distIzq,
          hiloId: brazoAEsIzquierdo ? parseInt(hiloBrazoAntBId) : parseInt(hiloBrazoCId),
          brazoHijoId: brazoAEsIzquierdo ? brazoActualId : brazoC.id,
          objetoHijoId: null
        }
        colganteDer = {
          movilPadreId: movilId, brazoPadreId: brazoB.id, lado: 'derecho', distanciaPivote: distDer,
          hiloId: brazoAEsIzquierdo ? parseInt(hiloBrazoCId) : parseInt(hiloBrazoAntBId),
          brazoHijoId: brazoAEsIzquierdo ? brazoC.id : brazoActualId,
          objetoHijoId: null
        }
      }

      await Promise.all([colganteService.crear(colganteIzq), colganteService.crear(colganteDer)])
      setGuardadoExitoso(true)
      onGuardado({ brazoId: brazoB.id, brazo: brazoB })
    } catch (e) {
      setError('❌ ' + (e.response?.data?.message || e.message))
    } finally {
      setGuardando(false)
    }
  }

  const lActual = longitudElegida ?? resultadoCalculo?.lMins?.[0]
  const distPreviewA = resultadoCalculo?.modo === 'objeto' && lActual ? (() => {
    const { wA, w2, brazoActualEsIzquierdo } = resultadoCalculo
    const W = lActual
    const dI = brazoActualEsIzquierdo
      ? (lActual * (w2 + W / 2) / (wA + w2 + W)).toFixed(4)
      : (lActual * (wA + W / 2) / (wA + w2 + W)).toFixed(4)
    return { brazoActualEsIzquierdo, wA, w2, dI, dD: (lActual - parseFloat(dI)).toFixed(4) }
  })() : null
  const distPreviewB = resultadoCalculo?.modo === 'brazo' && lActual ? (() => {
    const { wA, wC, brazoAEsIzquierdo } = resultadoCalculo
    const W = lActual
    const dI = brazoAEsIzquierdo
      ? (lActual * (wC + W / 2) / (wA + wC + W)).toFixed(4)
      : (lActual * (wA + W / 2) / (wA + wC + W)).toFixed(4)
    return { brazoAEsIzquierdo, wA, wC, dI, dD: (lActual - parseFloat(dI)).toFixed(4) }
  })() : null

  const puedeGuardar = !guardando && !guardadoExitoso && lActual &&
    (resultadoCalculo?.modo === 'objeto'
      ? (hiloObjNuevoId && hiloBrazoAntId)
      : (hiloBrazoCId && hiloBrazoAntBId)
    ) && !advertenciaY

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
        ✅ Nivel {nivel} guardado — Brazo: <strong>{brazoActual?.nombre} ({brazoActual?.longitud}cm)</strong>
      </div>

      {guardadoExitoso ? (
        <div style={{ fontSize: '13px', color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '8px' }}>
          ⏳ Subiendo al nivel {nivel + 1}...
        </div>
      ) : !agregandoNivel ? (
        <button onClick={() => setAgregandoNivel(true)} style={{
          padding: '8px', borderRadius: '6px', border: '1px dashed #1976d2',
          background: '#f0f8ff', color: '#1976d2', cursor: 'pointer', fontSize: '13px'
        }}>
          ➕ Agregar nivel superior
        </button>
      ) : (
        <div style={{ borderLeft: '3px solid #90caf9', paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#555', fontWeight: 'bold' }}>
            Nivel {nivel + 1} — ¿Qué va al otro lado del brazo anterior?
          </p>

          {!modoLado && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setModoLado('objeto')} style={{
                flex: 1, padding: '12px', borderRadius: '8px',
                border: '2px solid #1976d2', background: '#e3f2fd',
                cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#1565c0'
              }}>🪆 Un objeto</button>
              <button onClick={() => setModoLado('brazo')} style={{
                flex: 1, padding: '12px', borderRadius: '8px',
                border: '2px solid #7b1fa2', background: '#f3e5f5',
                cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', color: '#6a1b9a'
              }}>🔀 Otro brazo con 2 objetos</button>
            </div>
          )}

          {/* ── OPCIÓN A ── */}
          {modoLado === 'objeto' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => { setModoLado(null); resetForm() }}
                style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '12px' }}>
                ← Cambiar opción
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#666' }}>🪆 Objeto del otro lado</label>
                <select value={objetoNuevoId}
                  onChange={e => { setObjetoNuevoId(e.target.value); setResultadoCalculo(null); setLongitudElegida(null); setHiloObjNuevoId(''); setHiloBrazoAntId('') }}
                  style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '13px' }}>
                  <option value="">-- Selecciona --</option>
                  {objetos.map(o => (
                    <option key={o.id} value={o.id}>{o.nombre} ({o.peso}g, ancho {o.ancho}cm)</option>
                  ))}
                </select>
              </div>
              <button onClick={calcularOpcionA} disabled={cargando || !objetoNuevoId}
                style={{
                  padding: '8px', borderRadius: '6px', border: 'none',
                  background: !objetoNuevoId ? '#ccc' : '#1976d2',
                  color: 'white', cursor: !objetoNuevoId ? 'not-allowed' : 'pointer', fontSize: '13px'
                }}>
                {cargando ? '⏳ Calculando...' : '📐 Calcular brazo y hilos mínimos'}
              </button>

              {resultadoCalculo?.modo === 'objeto' && (
                <>
                  <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                    <strong>📐 Longitud mínima: {resultadoCalculo.lMin}cm</strong>
                    <div style={{ marginTop: '4px', color: '#555', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>↔ Por radio objeto ({resultadoCalculo.radioObjNuevo.toFixed(2)}cm): mín {resultadoCalculo.lMinPorObjeto.toFixed(2)}cm</span>
                      <span>↔ Sin colisión horizontal: mín {resultadoCalculo.lMinSinColision.toFixed(2)}cm</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {resultadoCalculo.lMins.map(l => (
                      <button key={l} type="button" onClick={() => setLongitudElegida(l)}
                        style={{
                          padding: '5px 14px', fontSize: '12px', borderRadius: '20px',
                          border: lActual === l ? '2px solid #1976d2' : '1px solid #bbb',
                          background: lActual === l ? '#e0f0ff' : '#f5f5f5',
                          cursor: 'pointer', fontWeight: lActual === l ? 'bold' : 'normal'
                        }}>{l}cm</button>
                    ))}
                  </div>
                  {distPreviewA && (
                    <div style={{ background: '#fff8e1', border: '1px solid #ffe082', padding: '8px', borderRadius: '8px', fontSize: '13px' }}>
                      {resultadoCalculo.brazoActualEsIzquierdo
                        ? <>⚖️ ⬅ <strong>Brazo anterior ({resultadoCalculo.wA.toFixed(1)}g)</strong> × {distPreviewA.dI}cm = ➡ <strong>{resultadoCalculo.objNuevo.nombre} ({resultadoCalculo.w2}g)</strong> × {distPreviewA.dD}cm</>
                        : <>⚖️ ⬅ <strong>{resultadoCalculo.objNuevo.nombre} ({resultadoCalculo.w2}g)</strong> × {distPreviewA.dI}cm = ➡ <strong>Brazo anterior ({resultadoCalculo.wA.toFixed(1)}g)</strong> × {distPreviewA.dD}cm</>
                      }
                    </div>
                  )}
                  <div style={{ background: '#e3f2fd', border: '1px solid #90caf9', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                    <strong>🧵 Hilos sugeridos:</strong>
                    <div style={{ marginTop: '6px', color: '#555', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span>📌 Hilo brazo anterior: <strong style={{ color: '#1565c0' }}>{resultadoCalculo.hiloSugBrazoAnt ? `Hilo #${resultadoCalculo.hiloSugBrazoAnt.id} (${resultadoCalculo.hiloSugBrazoAnt.largo}cm)` : '⚠️ No disponible'}</strong> — debe ser &gt; {resultadoCalculo.objNuevo.largo.toFixed(2)}cm (largo objeto)</span>
                      <span>📌 Hilo objeto nuevo: <strong style={{ color: '#1565c0' }}>{resultadoCalculo.hiloSugObjNuevo ? `Hilo #${resultadoCalculo.hiloSugObjNuevo.id} (${resultadoCalculo.hiloSugObjNuevo.largo}cm)` : '⚠️ No disponible'}</strong> — debe ser &lt; {resultadoCalculo.maxLargoObjNuevo.toFixed(2)}cm</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                  <SelectorChipsHilo
                    label="🧵 Hilo brazo anterior"
                    value={hiloBrazoAntId}
                    onChange={setHiloBrazoAntId}
                    hilos={hilos}
                    onHiloCreado={onHiloCreado}
                    minLargo={resultadoCalculo.minHiloBrazoNecesario}
                    checkFn={h => h.largo > resultadoCalculo.objNuevo.largo}
                  />
                  <SelectorChipsHilo
                    label="🧵 Hilo objeto nuevo"
                    value={hiloObjNuevoId}
                    onChange={setHiloObjNuevoId}
                    hilos={hilos}
                    onHiloCreado={onHiloCreado}
                    minLargo={null}
                    checkFn={h => {
                      const hB = hilos.find(hh => hh.id === parseInt(hiloBrazoAntId))
                      return hB ? h.largo < hB.largo - resultadoCalculo.objNuevo.largo : true
                    }}
                  />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── OPCIÓN B ── */}
          {modoLado === 'brazo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => { setModoLado(null); resetForm() }}
                style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontSize: '12px' }}>
                ← Cambiar opción
              </button>
              {!brazoC ? (
                <FormularioBrazoC
                  objetos={objetos} hilos={hilos} movilId={movilId}
                  onCreado={(data) => { setBrazoC(data.brazoC); setResultadoCalculo(null) }}
                  onCancelar={() => { setModoLado(null); resetForm() }}
                  onHiloCreado={onHiloCreado}
                />
              ) : (
                <>
                  <div style={{ background: '#ede7f6', border: '1px solid #b39ddb', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                    ✅ Brazo C creado: <strong>{brazoC.nombre} ({brazoC.longitud}cm)</strong>
                    <button onClick={() => { setBrazoC(null); setResultadoCalculo(null); setHiloBrazoCId(''); setHiloBrazoAntBId('') }}
                      style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#7b1fa2', cursor: 'pointer', fontSize: '12px' }}>
                      ✎ Cambiar
                    </button>
                  </div>
                  <button onClick={calcularOpcionB} disabled={cargando}
                    style={{
                      padding: '8px', borderRadius: '6px', border: 'none',
                      background: cargando ? '#ccc' : '#7b1fa2',
                      color: 'white', cursor: cargando ? 'not-allowed' : 'pointer', fontSize: '13px'
                    }}>
                    {cargando ? '⏳ Calculando Brazo B...' : '📐 Calcular Brazo B (nivel superior)'}
                  </button>

                  {resultadoCalculo?.modo === 'brazo' && (
                    <>
                      <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                        <strong>📐 Longitud mínima Brazo B: {resultadoCalculo.lMin}cm</strong>
                        <div style={{ marginTop: '4px', color: '#555', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span>↔ Sin colisión horizontal: mín {resultadoCalculo.lMinSinColision.toFixed(2)}cm</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {resultadoCalculo.lMins.map(l => (
                          <button key={l} type="button" onClick={() => setLongitudElegida(l)}
                            style={{
                              padding: '5px 14px', fontSize: '12px', borderRadius: '20px',
                              border: lActual === l ? '2px solid #7b1fa2' : '1px solid #bbb',
                              background: lActual === l ? '#f3e5f5' : '#f5f5f5',
                              cursor: 'pointer', fontWeight: lActual === l ? 'bold' : 'normal'
                            }}>{l}cm</button>
                        ))}
                      </div>
                      {distPreviewB && (
                        <div style={{ background: '#fff8e1', border: '1px solid #ffe082', padding: '8px', borderRadius: '8px', fontSize: '13px' }}>
                          {distPreviewB.brazoAEsIzquierdo
                            ? <>⚖️ ⬅ <strong>Brazo A ({distPreviewB.wA.toFixed(1)}g)</strong> × {distPreviewB.dI}cm = ➡ <strong>Brazo C ({distPreviewB.wC.toFixed(1)}g)</strong> × {distPreviewB.dD}cm</>
                            : <>⚖️ ⬅ <strong>Brazo C ({distPreviewB.wC.toFixed(1)}g)</strong> × {distPreviewB.dI}cm = ➡ <strong>Brazo A ({distPreviewB.wA.toFixed(1)}g)</strong> × {distPreviewB.dD}cm</>
                          }
                        </div>
                      )}
                      <div style={{ background: '#e3f2fd', border: '1px solid #90caf9', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                        <strong>🧵 Hilos sugeridos (anti-colisión vertical):</strong>
                        <div style={{ marginTop: '6px', color: '#555', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span>↕ Prof. máxima sub-árbol A: <strong>{resultadoCalculo.profA.toFixed(2)}cm</strong></span>
                          <span>↕ Prof. máxima sub-árbol C: <strong>{resultadoCalculo.profC.toFixed(2)}cm</strong></span>
                          <span>📌 Hilo Brazo A: <strong style={{ color: '#1565c0' }}>{resultadoCalculo.hiloSugBrazoA ? `Hilo #${resultadoCalculo.hiloSugBrazoA.id} (${resultadoCalculo.hiloSugBrazoA.largo}cm)` : '⚠️ No disponible'}</strong> — debe ser &gt; {resultadoCalculo.minLargoParaA.toFixed(2)}cm</span>
                          <span>📌 Hilo Brazo C: <strong style={{ color: '#1565c0' }}>{resultadoCalculo.hiloSugBrazoC ? `Hilo #${resultadoCalculo.hiloSugBrazoC.id} (${resultadoCalculo.hiloSugBrazoC.largo}cm)` : '⚠️ No disponible'}</strong> — debe ser &gt; {resultadoCalculo.minLargoParaC.toFixed(2)}cm</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <SelectorChipsHilo
                          label="🧵 Hilo del Brazo A"
                          value={hiloBrazoAntBId}
                          onChange={setHiloBrazoAntBId}
                          hilos={hilos}
                          onHiloCreado={onHiloCreado}
                          minLargo={resultadoCalculo.minLargoParaA}
                          checkFn={h => h.largo > resultadoCalculo.minLargoParaA}
                        />
                        <SelectorChipsHilo
                          label="🧵 Hilo del Brazo C"
                          value={hiloBrazoCId}
                          onChange={setHiloBrazoCId}
                          hilos={hilos}
                          onHiloCreado={onHiloCreado}
                          minLargo={resultadoCalculo.minLargoParaC}
                          checkFn={h => h.largo > resultadoCalculo.minLargoParaC}
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {advertenciaY && (
            <div style={{ background: '#fff3e0', border: '1px solid #ffb74d', padding: '8px', borderRadius: '6px', fontSize: '12px', color: '#e65100' }}>
              {advertenciaY}
            </div>
          )}

          {error && <small style={{ color: 'red' }}>{error}</small>}

          {resultadoCalculo && (
            <button onClick={guardarNivelSuperior} disabled={!puedeGuardar}
              style={{
                padding: '8px', borderRadius: '6px', border: 'none',
                background: !puedeGuardar ? '#ccc' : '#4CAF50',
                color: 'white', cursor: !puedeGuardar ? 'not-allowed' : 'pointer', fontSize: '13px'
              }}>
              {guardando ? '⏳ Guardando...' : guardadoExitoso ? '✅ Guardado' : '✅ Guardar nivel superior'}
            </button>
          )}

          <button onClick={() => { setAgregandoNivel(false); resetForm() }}
            style={{
              padding: '6px', borderRadius: '6px', border: '1px solid #bbb',
              background: '#f5f5f5', cursor: 'pointer', fontSize: '12px', color: '#666'
            }}>
            ✖ Cancelar
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function FormularioBrazo({ movilId, objetos, hilos, colgantes, onGuardado }) {
  const [paso, setPaso] = useState('seleccion')
  const [sugerencia, setSugerencia] = useState(null)
  const [obj1Id, setObj1Id] = useState(null)
  const [obj2Id, setObj2Id] = useState(null)
  const [brazoBaseId, setBrazoBaseId] = useState(null)
  const [brazoBase, setBrazoBase] = useState(null)
  const [nivelActual, setNivelActual] = useState(1)
  const [hilosLocales, setHilosLocales] = useState(hilos)

  const agregarHilo = (hiloNuevo) => {
    setHilosLocales(prev => [...prev, hiloNuevo])
  }

  const handleSugerencia = (data, o1, o2) => {
    setSugerencia(data); setObj1Id(o1); setObj2Id(o2); setPaso('configurar')
  }

  const handleNivelGuardado = ({ brazoId, brazo }) => {
    setBrazoBaseId(brazoId); setBrazoBase(brazo)
    setNivelActual(prev => prev + 1); setPaso('niveles'); onGuardado()
  }

  const resetear = () => {
    setPaso('seleccion'); setSugerencia(null); setObj1Id(null); setObj2Id(null)
    setBrazoBaseId(null); setBrazoBase(null); setNivelActual(1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '6px', fontSize: '12px' }}>
        {['seleccion', 'configurar', 'niveles'].map((p, i) => (
          <span key={p} style={{
            padding: '3px 10px', borderRadius: '20px',
            background: paso === p ? '#1976d2' : '#eee',
            color: paso === p ? 'white' : '#888'
          }}>
            {i + 1}. {p === 'seleccion' ? 'Objetos' : p === 'configurar' ? 'Brazo' : 'Niveles'}
          </span>
        ))}
        {paso !== 'seleccion' && (
          <button onClick={resetear} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: '#e53935', cursor: 'pointer', fontSize: '12px'
          }}>↩ Reiniciar</button>
        )}
      </div>

      {paso === 'seleccion' && (
        <PasoSeleccionObjetos objetos={objetos} onSugerencia={handleSugerencia} />
      )}
      {paso === 'configurar' && sugerencia && (
        <PasoConfigurar
          sugerencia={sugerencia} obj1Id={obj1Id} obj2Id={obj2Id}
          objetos={objetos} hilos={hilosLocales} movilId={movilId}
          onHiloCreado={agregarHilo}
          onGuardado={handleNivelGuardado} onVolver={() => setPaso('seleccion')}
        />
      )}
      {paso === 'niveles' && (
        <PasoNivelGuardado
          key={nivelActual}
          brazoActualId={brazoBaseId} brazoActual={brazoBase}
          objetos={objetos} hilos={hilosLocales}
          colgantes={colgantes}
          movilId={movilId} nivel={nivelActual}
          onGuardado={handleNivelGuardado}
          onHiloCreado={agregarHilo}
        />
      )}
    </div>
  )
}
