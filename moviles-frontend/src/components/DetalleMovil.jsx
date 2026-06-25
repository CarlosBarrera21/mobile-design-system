import { useState, useEffect } from 'react'
import { movilService, colganteService } from '../services/api'

function SubColgantes({ brazoId, movilId, idsVisitados = [], editable, objetos, hilos, onCambio }) {
  const [subColgantes, setSubColgantes] = useState([])
  const [expandido, setExpandido] = useState(false)
  const [cargando, setCargando] = useState(false)

  const esCiclo = idsVisitados.includes(brazoId)
  const nuevosVisitados = [...idsVisitados, brazoId]

  useEffect(() => {
    if (!expandido || esCiclo) return
    let activo = true
    const cargar = async () => {
      setCargando(true)
      try {
        const res = await colganteService.obtenerPorBrazo(brazoId, movilId)
        if (activo) setSubColgantes(res.data)
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [expandido, brazoId, movilId, esCiclo])

  if (esCiclo) return (
    <small style={{ color: 'orange' }}>⚠️ Referencia circular detectada</small>
  )

  const eliminarColgante = async (colganteId) => {
    if (!confirm('¿Eliminar este colgante?')) return
    await colganteService.eliminar(colganteId)
    onCambio()
    setSubColgantes(prev => prev.filter(c => c.id !== colganteId))
  }

  const cambiarHilo = async (colganteId, hiloId) => {
    await colganteService.actualizar(colganteId, { hiloId: parseInt(hiloId) })
    onCambio()
    const res = await colganteService.obtenerPorBrazo(brazoId, movilId)
    setSubColgantes(res.data)
  }

  return (
    <div style={{ marginTop: '6px' }}>
      <button type="button" onClick={() => setExpandido(!expandido)}
        style={{
          background: 'none', border: '1px solid #90caf9',
          borderRadius: '6px', padding: '4px 10px',
          cursor: 'pointer', fontSize: '12px', color: '#1976d2'
        }}>
        {expandido ? '▲ Ocultar sub-colgantes' : '▼ Ver sub-colgantes del brazo hijo'}
      </button>

      {expandido && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {cargando && <small style={{ color: '#888' }}>⏳ Cargando...</small>}

          {!cargando && subColgantes.length === 0 && (
            <small style={{ color: '#888' }}>Sin colgantes registrados para este brazo</small>
          )}

          {!cargando && subColgantes.map(sc => (
            <div key={sc.id} style={{
              borderLeft: '3px solid #90caf9',
              fontSize: '12px',
              display: 'flex', flexDirection: 'column', gap: '2px',
              background: sc.lado === 'izquierdo' ? '#f0f4ff' : '#fff4f0',
              borderRadius: '0 6px 6px 0',
              padding: '8px 8px 8px 10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{sc.lado === 'izquierdo' ? '⬅' : '➡'} {sc.lado}</strong>
                <span style={{ color: '#888' }}>Colgante #{sc.id}</span>
              </div>
              <span>🔩 Brazo padre: <strong>{sc.brazoPadre?.nombre}</strong> ({sc.brazoPadre?.longitud}cm)</span>
              <span>📏 Pivote: <strong>{sc.distanciaPivote}cm</strong></span>
              {editable ? (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span>🧵 Hilo:</span>
                  <select value={sc.hilo?.id ?? ''} onChange={e => cambiarHilo(sc.id, e.target.value)}
                    style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    {hilos.map(h => (
                      <option key={h.id} value={h.id}>#{h.id} ({h.largo}cm)</option>
                    ))}
                  </select>
                  <button onClick={() => eliminarColgante(sc.id)}
                    style={{ background: 'none', border: '1px solid #e53935', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '11px', color: '#e53935' }}>
                    🗑️
                  </button>
                </div>
              ) : (
                <span>🧵 Hilo: <strong>#{sc.hilo?.id}</strong> ({sc.hilo?.largo}cm)</span>
              )}
              {sc.objetoHijo && (
                <span>🎨 Objeto: <strong>{sc.objetoHijo.nombre}</strong> ({sc.objetoHijo.peso}g)</span>
              )}
              {sc.brazoHijo && (
                <>
                  <span>📐 Brazo hijo: <strong>{sc.brazoHijo.nombre}</strong> ({sc.brazoHijo.longitud}cm)</span>
                  <SubColgantes
                    brazoId={sc.brazoHijo.id}
                    movilId={movilId}
                    idsVisitados={nuevosVisitados}
                    editable={editable}
                    objetos={objetos}
                    hilos={hilos}
                    onCambio={onCambio}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DetalleMovil({ movil, editable, objetos, hilos, brazos, onCambio }) {
  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [agregandoLado, setAgregandoLado] = useState(null)
  const [nuevoColganteLado, setNuevoColganteLado] = useState('izquierdo')
  const [nuevoColganteTipo, setNuevoColganteTipo] = useState('objeto')
  const [nuevoColganteHiloId, setNuevoColganteHiloId] = useState('')
  const [nuevoColganteObjetoId, setNuevoColganteObjetoId] = useState('')
  const [nuevoColganteBrazoId, setNuevoColganteBrazoId] = useState('')
  const [nuevoColganteDistancia, setNuevoColganteDistancia] = useState('')
  const [nuevoColganteError, setNuevoColganteError] = useState('')
  const [nuevoColganteGuardando, setNuevoColganteGuardando] = useState(false)

  useEffect(() => {
    if (!movil) { setDetalle(null); return }
    let activo = true
    const cargar = async () => {
      setCargando(true)
      try {
        const res = await movilService.obtenerDetalle(movil.id)
        if (activo) setDetalle(res.data)
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [movil])

  const recargar = async () => {
    if (!movil) return
    const res = await movilService.obtenerDetalle(movil.id)
    setDetalle(res.data)
    if (onCambio) onCambio()
  }

  if (!movil) return <p style={{ color: '#888' }}>Selecciona un móvil para ver su detalle</p>
  if (cargando) return <p>⏳ Cargando...</p>
  if (!detalle) return null

  const brazosHijo = new Set(
    detalle.colgantes
      .filter(c => c.brazoHijo !== null)
      .map(c => c.brazoHijo.id)
  )
  const colganteRaiz = detalle.colgantes.filter(c => !brazosHijo.has(c.brazoPadre.id))

  const eliminarColgante = async (colganteId) => {
    if (!confirm('¿Eliminar este colgante?')) return
    await colganteService.eliminar(colganteId)
    recargar()
  }

  const cambiarHilo = async (colganteId, hiloId) => {
    await colganteService.actualizar(colganteId, { hiloId: parseInt(hiloId) })
    recargar()
  }

  const agregarColgante = async () => {
    if (!nuevoColganteHiloId || !nuevoColganteDistancia) {
      setNuevoColganteError('Completa todos los campos'); return
    }
    if (nuevoColganteTipo === 'objeto' && !nuevoColganteObjetoId) {
      setNuevoColganteError('Selecciona un objeto'); return
    }
    if (nuevoColganteTipo === 'brazo' && !nuevoColganteBrazoId) {
      setNuevoColganteError('Selecciona un brazo'); return
    }
    setNuevoColganteGuardando(true); setNuevoColganteError('')
    try {
      const data = {
        brazoPadreId: colganteRaiz[0]?.brazoPadre?.id,
        movilPadreId: detalle.id,
        hiloId: parseInt(nuevoColganteHiloId),
        lado: nuevoColganteLado,
        distanciaPivote: parseFloat(nuevoColganteDistancia)
      }
      if (nuevoColganteTipo === 'objeto') data.objetoHijoId = parseInt(nuevoColganteObjetoId)
      else data.brazoHijoId = parseInt(nuevoColganteBrazoId)
      await colganteService.crear(data)
      setAgregandoLado(null)
      setNuevoColganteHiloId(''); setNuevoColganteObjetoId(''); setNuevoColganteBrazoId(''); setNuevoColganteDistancia('')
      recargar()
    } catch (e) {
      setNuevoColganteError('❌ ' + (e.response?.data?.message || e.message))
    } finally {
      setNuevoColganteGuardando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{ margin: 0 }}> {detalle.nombre}</h3>

      {colganteRaiz.length === 0
        ? <p style={{ color: '#888' }}>Sin colgantes aún</p>
        : colganteRaiz.map(c => (
          <div key={c.id} style={{
            border: '1px solid #ddd', borderRadius: '8px', padding: '12px',
            background: c.lado === 'izquierdo' ? '#f0f4ff' : '#fff4f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <strong>{c.lado === 'izquierdo' ? '⬅' : '➡'} {c.lado}</strong>
              <span style={{ fontSize: '12px', color: '#888' }}>Colgante #{c.id}</span>
            </div>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span>🔩 Brazo padre: <strong>{c.brazoPadre?.nombre}</strong> ({c.brazoPadre?.longitud}cm)</span>
              <span>📏 Distancia al pivote: <strong>{c.distanciaPivote}cm</strong></span>
              {editable ? (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>🧵 Hilo:</span>
                  <select value={c.hilo?.id ?? ''} onChange={e => cambiarHilo(c.id, e.target.value)}
                    style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    {hilos.map(h => (
                      <option key={h.id} value={h.id}>#{h.id} ({h.largo}cm)</option>
                    ))}
                  </select>
                  <button onClick={() => eliminarColgante(c.id)}
                    style={{ background: 'none', border: '1px solid #e53935', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '11px', color: '#e53935' }}>
                    🗑️ Eliminar
                  </button>
                </div>
              ) : (
                <span>🧵 Hilo: <strong>#{c.hilo?.id}</strong> ({c.hilo?.largo}cm)</span>
              )}
              {c.objetoHijo && (
                <span>🎨 Objeto: <strong>{c.objetoHijo.nombre}</strong> ({c.objetoHijo.peso}g)</span>
              )}
              {c.brazoHijo && (
                <>
                  <span>📐 Brazo hijo: <strong>{c.brazoHijo.nombre}</strong> ({c.brazoHijo.longitud}cm)</span>
                  <SubColgantes
                    brazoId={c.brazoHijo.id}
                    movilId={detalle.id}
                    idsVisitados={[]}
                    editable={editable}
                    objetos={objetos}
                    hilos={hilos}
                    onCambio={recargar}
                  />
                </>
              )}
            </div>
          </div>
        ))
      }

      {editable && (
        <div style={{ marginTop: '8px' }}>
          {agregandoLado ? (
            <div style={{
              border: '1px dashed #4CAF50', borderRadius: '8px',
              padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              <strong style={{ fontSize: '13px', color: '#2e7d32' }}>➕ Nuevo colgante</strong>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <select value={nuevoColganteLado} onChange={e => setNuevoColganteLado(e.target.value)}
                  style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}>
                  <option value="izquierdo">⬅ Izquierdo</option>
                  <option value="derecho">➡ Derecho</option>
                </select>
                <select value={nuevoColganteTipo} onChange={e => { setNuevoColganteTipo(e.target.value); setNuevoColganteObjetoId(''); setNuevoColganteBrazoId('') }}
                  style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}>
                  <option value="objeto">🎨 Objeto</option>
                  <option value="brazo">🔀 Brazo</option>
                </select>
                <select value={nuevoColganteHiloId} onChange={e => setNuevoColganteHiloId(e.target.value)}
                  style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}>
                  <option value="">🧵 Hilo</option>
                  {hilos.map(h => (
                    <option key={h.id} value={h.id}>Hilo #{h.id} ({h.largo}cm)</option>
                  ))}
                </select>
                {nuevoColganteTipo === 'objeto' && (
                  <select value={nuevoColganteObjetoId} onChange={e => setNuevoColganteObjetoId(e.target.value)}
                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}>
                    <option value="">🎨 Objeto</option>
                    {objetos.map(o => (
                      <option key={o.id} value={o.id}>{o.nombre} ({o.peso}g)</option>
                    ))}
                  </select>
                )}
                {nuevoColganteTipo === 'brazo' && (
                  <select value={nuevoColganteBrazoId} onChange={e => setNuevoColganteBrazoId(e.target.value)}
                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}>
                    <option value="">🔀 Brazo</option>
                    {brazos.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre} ({b.longitud}cm)</option>
                    ))}
                  </select>
                )}
                <input type="number" step="0.01" placeholder="Distancia (cm)" value={nuevoColganteDistancia}
                  onChange={e => setNuevoColganteDistancia(e.target.value)}
                  style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', width: '100px' }} />
              </div>
              {nuevoColganteError && <small style={{ color: 'red' }}>{nuevoColganteError}</small>}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setAgregandoLado(null)}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #bbb', background: '#f5f5f5', cursor: 'pointer', fontSize: '12px' }}>
                  ✖ Cancelar
                </button>
                <button onClick={agregarColgante} disabled={nuevoColganteGuardando}
                  style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: nuevoColganteGuardando ? '#ccc' : '#4CAF50', color: 'white', cursor: nuevoColganteGuardando ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
                  {nuevoColganteGuardando ? '⏳ Creando...' : '✅ Crear colgante'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAgregandoLado('nuevo')}
              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px dashed #4CAF50', background: '#f1f8e9', cursor: 'pointer', fontSize: '12px', color: '#2e7d32' }}>
              ➕ Agregar colgante
            </button>
          )}
        </div>
      )}
    </div>
  )
}
