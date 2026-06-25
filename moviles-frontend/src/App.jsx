import { useState, useEffect } from 'react'
import { movilService, objetoService, hiloService, colganteService, brazoService } from './services/api'
import FormularioMovil from './components/FormularioMovil'
import PlanoCartesiano from './components/Planocartesiano'
import FormularioBrazo from './components/FormularioBrazo'
import DetalleMovil from './components/DetalleMovil'
import './App.css'

function App() {
  const [moviles, setMoviles] = useState([])
  const [movilSeleccionado, setMovilSeleccionado] = useState(null)
  const [movilDetalle, setMovilDetalle] = useState(null)
  const [movilEditando, setMovilEditando] = useState(null)
  const [objetos, setObjetos] = useState([])
  const [hilos, setHilos] = useState([])
  const [colgantes, setColgantes] = useState([])
  const [brazos, setBrazos] = useState([])
  const [mostrarTodosMoviles, setMostrarTodosMoviles] = useState(false) // ✅ nuevo

  const [nombreObjeto, setNombreObjeto] = useState('')
  const [peso, setPeso] = useState('')
  const [largo, setLargo] = useState('')
  const [ancho, setAncho] = useState('')
  const [imagenObjeto, setImagenObjeto] = useState('')
  const [largoHilo, setLargoHilo] = useState('')

  const cargarMoviles   = () => movilService.obtenerTodos().then(res => setMoviles(res.data))
  const cargarObjetos   = () => objetoService.obtenerTodos().then(res => setObjetos(res.data))
  const cargarHilos     = () => hiloService.obtenerTodos().then(res => setHilos(res.data))
  const cargarColgantes = () => colganteService.obtenerTodos().then(res => setColgantes(res.data))
  const cargarBrazos    = () => brazoService.obtenerTodos().then(res => setBrazos(res.data))

  const cargarDetalle = async (id) => {
    try {
      const res = await movilService.obtenerDetalle(id)
      setMovilDetalle(res.data)
    } catch (e) {
      console.error('Error cargando detalle:', e)
      setMovilDetalle(null)
    }
  }

  const seleccionarMovil = (m) => {
    setMovilSeleccionado(m)
    cargarDetalle(m.id)
  }

  const eliminarMovil = async (id) => {
    if (!confirm('¿Eliminar este móvil y todos sus colgantes?')) return
    try {
      await movilService.eliminar(id)
      if (movilSeleccionado?.id === id) {
        setMovilSeleccionado(null)
        setMovilDetalle(null)
      }
      if (movilEditando?.id === id) setMovilEditando(null)
      cargarMoviles()
      cargarColgantes()
    } catch (e) {
      alert('❌ Error al eliminar: ' + (e.response?.data?.message || e.message))
    }
  }

  useEffect(() => {
    cargarMoviles()
    cargarObjetos()
    cargarHilos()
    cargarColgantes()
    cargarBrazos()
  }, [])

  const handleImagenObjeto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImagenObjeto(ev.target.result)
    reader.readAsDataURL(file)
  }

  const crearObjeto = async () => {
    if (!nombreObjeto || !peso || !largo || !ancho) return
    await objetoService.crear({
      nombre: nombreObjeto,
      peso: parseFloat(peso),
      largo: parseFloat(largo),
      ancho: parseFloat(ancho),
      posX: 0.0, posY: 0.0, radioColision: 0.0,
      imagenBase64: imagenObjeto || null
    })
    setNombreObjeto(''); setPeso(''); setLargo(''); setAncho('')
    setImagenObjeto('')
    cargarObjetos()
  }

  const crearHilo = async () => {
    if (!largoHilo) return
    const largoNum = parseFloat(largoHilo)
    if (isNaN(largoNum) || largoNum <= 0) {
      alert('❌ El largo del hilo debe ser un número positivo mayor a 0')
      return
    }
    const largoCeiling = Math.ceil(Math.abs(largoNum))
    await hiloService.crear({ largo: largoCeiling })
    setLargoHilo('')
    cargarHilos()
  }

  const onColganteGuardado = () => {
    cargarColgantes()
    cargarBrazos()
    if (movilSeleccionado) cargarDetalle(movilSeleccionado.id)
  }

  const LIMITE_MOVILES = 5

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px', alignItems: 'flex-start' }}>

      <div style={{ minWidth: '700px' }}>
        <h2>Móviles</h2>

        {movilEditando ? (
          <FormularioMovil
            movilEditar={movilEditando}
            onGuardado={() => { setMovilEditando(null); cargarMoviles() }}
            onCancelar={() => setMovilEditando(null)}
          />
        ) : (
          <FormularioMovil onGuardado={cargarMoviles} />
        )}

        {/* ── Lista colapsable ── */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {(mostrarTodosMoviles ? moviles : moviles.slice(0, LIMITE_MOVILES)).map(m => (
            <li key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 0', borderBottom: '1px solid #f0f0f0'
            }}>
              <span onClick={() => seleccionarMovil(m)} style={{
                cursor: 'pointer', flex: 1,
                fontWeight: movilSeleccionado?.id === m.id ? 'bold' : 'normal',
                color: movilSeleccionado?.id === m.id ? '#1976d2' : 'inherit'
              }}>
                {m.nombre}
              </span>
              <button onClick={() => setMovilEditando(m)} style={{
                background: 'none', border: '1px solid #1976d2', color: '#1976d2',
                borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '12px'
              }}>✏️ Editar</button>
              <button onClick={() => eliminarMovil(m.id)} style={{
                background: 'none', border: '1px solid #e53935', color: '#e53935',
                borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '12px'
              }}>🗑️ Eliminar</button>
            </li>
          ))}
        </ul>

        {moviles.length > LIMITE_MOVILES && (
          <button
            onClick={() => setMostrarTodosMoviles(v => !v)}
            style={{
              marginTop: '6px', background: 'none',
              border: '1px solid #ccc', borderRadius: '4px',
              padding: '4px 12px', cursor: 'pointer',
              fontSize: '12px', color: '#666', width: '100%'
            }}
          >
            {mostrarTodosMoviles
              ? '▲ Ver menos'
              : `▼ Ver ${moviles.length - LIMITE_MOVILES} más`}
          </button>
        )}

        <h2>Objetos</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <input placeholder="Nombre"     value={nombreObjeto} onChange={e => setNombreObjeto(e.target.value)} />
          <input placeholder="Peso (g)"   value={peso}  type="number" onChange={e => setPeso(e.target.value)} />
          <input placeholder="Largo (cm)" value={largo} type="number" onChange={e => setLargo(e.target.value)} />
          <input placeholder="Ancho (cm)" value={ancho} type="number" onChange={e => setAncho(e.target.value)} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: '#666' }}>Foto del objeto (opcional)</label>
            <input type="file" accept="image/*" onChange={handleImagenObjeto} style={{ fontSize: '12px' }} />
            {imagenObjeto && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={imagenObjeto} alt="preview"
                  style={{ width: '48px', height: '48px', objectFit: 'cover',
                           borderRadius: '50%', border: '2px solid #e57373' }} />
                <button onClick={() => setImagenObjeto('')}
                  style={{ background: 'none', border: 'none', color: '#e53935',
                           cursor: 'pointer', fontSize: '12px' }}>
                  ✕ quitar
                </button>
              </div>
            )}
          </div>

          <button onClick={crearObjeto}>Crear Objeto</button>
        </div>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {objetos.map(o => (
            <li key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '4px 0', borderBottom: '1px solid #f5f5f5' }}>
              {o.imagenBase64
                ? <img src={o.imagenBase64} alt={o.nombre}
                    style={{ width: '32px', height: '32px', objectFit: 'cover',
                             borderRadius: '50%', border: '1.5px solid #e57373' }} />
                : <div style={{ width: '32px', height: '32px', borderRadius: '50%',
                                background: '#e57373', flexShrink: 0 }} />
              }
              <span style={{ fontSize: '13px' }}>
                {o.nombre} — {o.peso}g | {o.largo}x{o.ancho}cm
              </span>
            </li>
          ))}
        </ul>

        <h2>Hilos</h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            placeholder="Largo (cm)"
            value={largoHilo}
            type="number"
            min="1"
            step="1"
            onChange={e => setLargoHilo(e.target.value)}
          />
          <button onClick={crearHilo}>Crear Hilo</button>
        </div>

        <h2>Crear Colgante</h2>
        {movilSeleccionado
          ? <FormularioBrazo
              movilId={movilSeleccionado.id}
              objetos={objetos}
              hilos={hilos}
              brazos={brazos}
              colgantes={colgantes}
              onGuardado={onColganteGuardado}
            />
          : <p style={{ color: '#888' }}>Selecciona un móvil para agregar colgantes</p>
        }
      </div>

      <div>
        <h2>Detalle del Móvil</h2>
        <DetalleMovil
          movil={movilSeleccionado}
          editable={!!movilEditando}
          objetos={objetos}
          hilos={hilos}
          brazos={brazos}
          onCambio={() => {
            cargarMoviles()
            cargarColgantes()
            cargarBrazos()
            if (movilSeleccionado) cargarDetalle(movilSeleccionado.id)
          }}
        />
      </div>

      <div>
        <h2>Plano Cartesiano</h2>
        <PlanoCartesiano movil={movilDetalle} />
      </div>

    </div>
  )
}

export default App