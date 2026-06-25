import { Stage, Layer, Line, Circle, Text, Rect, Image as KonvaImage, Ellipse } from 'react-konva'
import { useEffect, useRef, useState } from 'react'

const ANCHO             = 900
const ALTO              = 650
const ESCALA_BASE       = 20
const PASO_HILO_BASE    = 60
const NFZ_MARGIN_CM     = 0.5
const RADIO_OBJETO_PX   = 10

function calcularPaso(escala) {
  return Math.max(PASO_HILO_BASE * (escala / ESCALA_BASE), 25)
}

function ObjetoImagen({ src, x, y, radio }) {
  const [img, setImg] = useState(null)
  useEffect(() => {
    if (!src) return
    const image = new window.Image()
    image.src = src
    image.onload = () => setImg(image)
  }, [src])
  if (!img) return <Circle x={x} y={y} radius={radio} fill="#e57373" />
  return (
    <>
      <KonvaImage
        image={img}
        x={x - radio} y={y - radio}
        width={radio * 2} height={radio * 2}
        cornerRadius={radio}
      />
      <Circle x={x} y={y} radius={radio} stroke="#e57373" strokeWidth={2} fillEnabled={false} />
    </>
  )
}

function calcularLimites(colgantes, brazoPadreId, escala, paso) {
  const lim = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 }

  const visit = (padreId, ax, ay) => {
    const cols = colgantes.filter(c => c.brazoPadre?.id === padreId)
    if (!cols.length) return

    const izq     = cols.find(c => c.lado === 'izquierdo')
    const der     = cols.find(c => c.lado === 'derecho')
    const pivoteY = ay + paso
    const M       = NFZ_MARGIN_CM * escala

    lim.yMin = Math.min(lim.yMin, ay - M)

    // Both orientations
    for (const cfg of [{ a: izq, b: der }, { a: der, b: izq }]) {
      const oIzq = cfg.a
      const oDer = cfg.b

      const xIzq = oIzq ? ax - oIzq.distanciaPivote * escala : ax
      const xDer = oDer ? ax + oDer.distanciaPivote * escala : ax

      if (oIzq || oDer) {
        const bx = Math.min(xIzq, xDer)
        const bw = Math.abs(xDer - xIzq)
        lim.xMin = Math.min(lim.xMin, bx - M)
        lim.xMax = Math.max(lim.xMax, bx + bw + M)
      }

      ;[oIzq, oDer].forEach((lado, i) => {
        if (!lado) return
        const xPivote  = i === 0 ? xIzq : xDer
        const hiloFinY = pivoteY + (lado.hilo?.largo || 3) * escala

        lim.xMin = Math.min(lim.xMin, xPivote - M)
        lim.xMax = Math.max(lim.xMax, xPivote + M)

        if (lado.objetoHijo) {
          const obj = lado.objetoHijo
          const rcX = (obj.ancho / 2) * escala + M
          const rcY = (obj.largo / 2) * escala + M
          const cy  = hiloFinY + (obj.largo / 2) * escala
          lim.xMin = Math.min(lim.xMin, xPivote - rcX)
          lim.xMax = Math.max(lim.xMax, xPivote + rcX)
          lim.yMax = Math.max(lim.yMax, cy + rcY)
        } else if (lado.brazoHijo) {
          visit(lado.brazoHijo.id, xPivote, hiloFinY)
        }
      })
    }
  }

  visit(brazoPadreId, 0, 0)
  return lim
}

// ── NFZ shape collector ─────────────────────────────────────────────────────
// Merges normal + flipped orientations into a single combined NFZ.
// Hilos and brazos are merged into a single closed polygon per node.
// Objetos remain as separate ellipses.
// Deduplicates: if both orientations produce identical shapes (symmetric mobile)
// they are only included once.
function collectNFZShapes(colgantes, brazoPadreId, anclaX, anclaY, escala, paso) {
  const normal  = []
  const flipped = []

  const visit = (padreId, ax, ay, outNormal, outFlipped) => {
    const cols = colgantes.filter(c => c.brazoPadre?.id === padreId)
    if (!cols.length) return

    const pivoteY = ay + paso
    const M       = NFZ_MARGIN_CM * escala

    const izq = cols.find(c => c.lado === 'izquierdo')
    const der = cols.find(c => c.lado === 'derecho')

    for (const cfg of [{ a: izq, b: der, arr: outNormal }, { a: der, b: izq, arr: outFlipped }]) {
      const oIzq = cfg.a
      const oDer = cfg.b
      const arr  = cfg.arr

      const xIzq = oIzq ? ax - oIzq.distanciaPivote * escala : ax
      const xDer = oDer ? ax + oDer.distanciaPivote * escala : ax

      const hasLeft  = !!oIzq
      const hasRight = !!oDer

      // Combined outline: anchor hilo + brazo bar + child hilos
      // Rendered as individual overlapping rects with the same fill,
      // which looks like a single continuous figure.
      if (hasLeft || hasRight) {
        // Anchor hilo
        arr.push({ type: 'merged', x: ax - M, y: ay, w: M * 2, h: pivoteY - ay })

        // Brazo bar
        const bx = Math.min(xIzq, xDer) - M
        const bw = Math.abs(xDer - xIzq) + M * 2
        arr.push({ type: 'merged', x: bx, y: pivoteY - M, w: Math.max(bw, 1), h: M * 2 })

        // Child hilos
        if (hasRight) {
          const hFD = pivoteY + (oDer.hilo?.largo || 3) * escala
          if (hFD > pivoteY)
            arr.push({ type: 'merged', x: xDer - M, y: pivoteY, w: M * 2, h: hFD - pivoteY })
        }
        if (hasLeft) {
          const hFI = pivoteY + (oIzq.hilo?.largo || 3) * escala
          if (hFI > pivoteY)
            arr.push({ type: 'merged', x: xIzq - M, y: pivoteY, w: M * 2, h: hFI - pivoteY })
        }
      }

      // Children: objetos as ellipses, or recurse for child brazos
      ;[oIzq, oDer].forEach((lado, i) => {
        if (!lado) return
        const xPivote  = i === 0 ? xIzq : xDer
        const hiloFinY = pivoteY + (lado.hilo?.largo || 3) * escala

        if (lado.objetoHijo) {
          const obj = lado.objetoHijo
          const rcX = (obj.ancho / 2) * escala + M
          const rcY = (obj.largo / 2) * escala + M
          const cy  = hiloFinY + (obj.largo / 2) * escala
          arr.push({
            type: 'objeto',
            x: xPivote - rcX,
            y: cy - rcY,
            w: rcX * 2,
            h: rcY * 2
          })
        } else if (lado.brazoHijo) {
          visit(lado.brazoHijo.id, xPivote, hiloFinY, outNormal, outFlipped)
        }
      })
    }
  }

  visit(brazoPadreId, anclaX, anclaY, normal, flipped)

  // Deduplicate: merge flipped into normal, skipping shapes that already exist
  for (const f of flipped) {
    const isDup = normal.some(n => {
      if (n.type !== f.type) return false
      // merged (now uses x,y,w,h like objeto for dedup)
      return n.x === f.x && n.y === f.y && n.w === f.w && n.h === f.h
    })
    if (!isDup) normal.push(f)
  }

  return normal
}

function NFZShape({ shape, index, fill, stroke }) {
  const style = {
    fill, stroke, strokeWidth: 1.5,
    dash: [4, 3],
    opacity: 0.85
  }
  if (shape.type === 'objeto') {
    return (
      <Ellipse
        key={`nfz-${index}`}
        x={shape.x + shape.w / 2}
        y={shape.y + shape.h / 2}
        radiusX={shape.w / 2}
        radiusY={shape.h / 2}
        {...style}
      />
    )
  }
  return (
    <Rect
      key={`nfz-${index}`}
      x={shape.x} y={shape.y}
      width={shape.w} height={shape.h}
      cornerRadius={2}
      {...style}
    />
  )
}

function DibujarBrazo({ colgantes, brazoPadreId, anclaX, anclaY, escala, paso }) {
  const cols = colgantes.filter(c => c.brazoPadre?.id === brazoPadreId)
  if (!cols.length) return null

  const izq     = cols.find(c => c.lado === 'izquierdo')
  const der     = cols.find(c => c.lado === 'derecho')
  const pivoteY = anclaY + paso
  const xIzq    = izq ? anclaX - izq.distanciaPivote * escala : anclaX
  const xDer    = der ? anclaX + der.distanciaPivote * escala : anclaX

  const renderLado = (lado, xPivote) => {
    if (!lado) return null
    const hiloFinY   = pivoteY + (lado.hilo?.largo || 3) * escala
    const centroObjY = hiloFinY + RADIO_OBJETO_PX

    return (
      <>
        <Circle x={xPivote} y={pivoteY} radius={3} fill="#666" />
        <Line
          points={[xPivote, pivoteY, xPivote, hiloFinY]}
          stroke="#888" strokeWidth={1.5} dash={[4, 3]}
        />
        {lado.objetoHijo ? (
          <>
            {lado.objetoHijo.imagenBase64
              ? <ObjetoImagen
                  src={lado.objetoHijo.imagenBase64}
                  x={xPivote} y={centroObjY}
                  radio={RADIO_OBJETO_PX}
                />
              : <Circle x={xPivote} y={centroObjY} radius={RADIO_OBJETO_PX} fill="#e57373" />
            }
            <Text
              text={`${lado.objetoHijo.nombre}\n${lado.objetoHijo.peso}g`}
              x={xPivote - 24} y={centroObjY + RADIO_OBJETO_PX + 3}
              fill="#b71c1c" fontSize={10} align="center" width={48}
            />
          </>
        ) : lado.brazoHijo ? (
          <DibujarBrazo
            colgantes={colgantes}
            brazoPadreId={lado.brazoHijo.id}
            anclaX={xPivote}
            anclaY={hiloFinY}
            escala={escala}
            paso={paso}
          />
        ) : null}
      </>
    )
  }

  return (
    <>
      <Line
        points={[anclaX, anclaY, anclaX, pivoteY]}
        stroke="#888" strokeWidth={1.5} dash={[4, 3]}
      />
      <Line
        points={[xIzq, pivoteY, xDer, pivoteY]}
        stroke="#444" strokeWidth={3}
      />
      <Circle x={anclaX} y={pivoteY} radius={4} fill="#333" />
      {renderLado(izq, xIzq)}
      {renderLado(der, xDer)}
    </>
  )
}

export default function PlanoCartesiano({ movil }) {
  const colgantes   = movil?.colgantes || []
  const brazosHijo  = new Set(colgantes.map(c => c.brazoHijo?.id).filter(Boolean))
  const brazoPadres = [...new Set(colgantes.map(c => c.brazoPadre?.id).filter(Boolean))]
  const brazoRaizId = brazoPadres.find(id => !brazosHijo.has(id))

  const [zoom, setZoom] = useState(1)
  const [pos, setPos]   = useState({ x: 0, y: 0 })
  const [mouseCoord, setMouseCoord] = useState(null)
  const [mostrarNFZ, setMostrarNFZ] = useState(true)
  const stageRef        = useRef(null)

  const ZOOM_MIN    = 0.1
  const ZOOM_MAX    = 10
  const ZOOM_FACTOR = 1.15

  const screenToCartesian = (sx, sy) => {
    const lx = (sx - pos.x) / zoom
    const ly = (sy - pos.y) / zoom
    return {
      x: ((lx - origenX) / escala).toFixed(2),
      y: ((origenY - ly) / escala).toFixed(2),
    }
  }

  const handleWheel = (e) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const oldScale = zoom
    const pointer  = stage.getPointerPosition()
    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * ZOOM_FACTOR, ZOOM_MAX)
      : Math.max(oldScale / ZOOM_FACTOR, ZOOM_MIN)

    const newPos = {
      x: pointer.x - ((pointer.x - pos.x) / oldScale) * newScale,
      y: pointer.y - ((pointer.y - pos.y) / oldScale) * newScale,
    }

    setZoom(newScale)
    setPos(newPos)
  }

  const handleMouseMove = () => {
    const stage = stageRef.current
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    setMouseCoord(screenToCartesian(pointer.x, pointer.y))
  }

  const handleMouseLeave = () => setMouseCoord(null)

  const zoomIn    = () => setZoom(z => Math.min(z * ZOOM_FACTOR, ZOOM_MAX))
  const zoomOut   = () => setZoom(z => Math.max(z / ZOOM_FACTOR, ZOOM_MIN))
  const resetView = () => { setZoom(1); setPos({ x: 0, y: 0 }) }

  const PADDING = 60
  let escala = ESCALA_BASE
  let paso   = calcularPaso(ESCALA_BASE)

  if (brazoRaizId) {
    const limBase = calcularLimites(colgantes, brazoRaizId, ESCALA_BASE, calcularPaso(ESCALA_BASE))

    const anchoBase = Math.max(limBase.xMax - limBase.xMin, 1)
    const altoBase  = Math.max(limBase.yMax - limBase.yMin, 1)
    const factorX   = (ANCHO - PADDING * 2) / anchoBase
    const factorY   = (ALTO  - PADDING * 2) / altoBase
    const factor    = Math.min(factorX, factorY, 1)

    escala = ESCALA_BASE * factor
    paso   = calcularPaso(escala)
  }

  const limReal = brazoRaizId
    ? calcularLimites(colgantes, brazoRaizId, escala, paso)
    : { xMin: 0, xMax: 0, yMin: 0, yMax: 0 }

  const origenX = ANCHO / 2 - (limReal.xMin + limReal.xMax) / 2
  const origenY = ALTO  / 2 - (limReal.yMin + limReal.yMax) / 2

  // Collect merged NFZ shapes (normal + flipped combined, hilos+brazos merged)
  const nfzShapes = brazoRaizId
    ? collectNFZShapes(colgantes, brazoRaizId, origenX, origenY, escala, paso)
    : []

  const tickStep = escala < 8 ? 5 : escala < 14 ? 2 : 1
  const xMinVal  = Math.ceil( -origenX          / escala / tickStep) * tickStep
  const xMaxVal  = Math.floor((ANCHO - origenX) / escala / tickStep) * tickStep
  const yMinVal  = Math.ceil( -origenY          / escala / tickStep) * tickStep
  const yMaxVal  = Math.floor((ALTO  - origenY) / escala / tickStep) * tickStep

  const ticksX = []
  for (let v = xMinVal; v <= xMaxVal; v += tickStep) { if (v !== 0) ticksX.push(v) }
  const ticksY = []
  for (let v = yMinVal; v <= yMaxVal; v += tickStep) { if (v !== 0) ticksY.push(v) }

  return (
    <div>
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '6px',
        alignItems: 'center',
        userSelect: 'none'
      }}>
        <button onClick={zoomIn}    title="Acercar"           style={btnStyle}>🔍+</button>
        <button onClick={zoomOut}   title="Alejar"            style={btnStyle}>🔍−</button>
        <button onClick={resetView} title="Restablecer vista" style={btnStyle}>⟳ Reset</button>
        <button onClick={() => setMostrarNFZ(v => !v)}
          style={{...btnStyle, background: mostrarNFZ ? '#e8d5f5' : '#f5f5f5', borderColor: mostrarNFZ ? '#7b1fa2' : '#ccc'}}>
          {mostrarNFZ ? '🟣 NFZ ON' : '⚪ NFZ OFF'}
        </button>
        <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>
          <span style={{ color: '#7b1fa2' }}>■ NFZ</span>
          {' — Fusión (normal + volteado)'}
        </span>
        <span style={{ fontSize: 11, color: '#555', marginLeft: 'auto', fontFamily: 'monospace' }}>
          {mouseCoord ? `X: ${mouseCoord.x}  Y: ${mouseCoord.y}` : 'X: —  Y: —'}
        </span>
      </div>

      <Stage
        ref={stageRef}
        width={ANCHO}
        height={ALTO}
        scaleX={zoom}
        scaleY={zoom}
        x={pos.x}
        y={pos.y}
        draggable
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onDragEnd={e => setPos({ x: e.target.x(), y: e.target.y() })}
        style={{
          border: '1px solid #ccc',
          background: '#fafafa',
          cursor: 'grab',
          display: 'block'
        }}
      >
        <Layer>
          {/* Grid */}
          {ticksX.map(i => (
            <Line key={`vx${i}`}
              points={[origenX + i * escala, 0, origenX + i * escala, ALTO]}
              stroke="#eee" strokeWidth={1}
            />
          ))}
          {ticksY.map(i => (
            <Line key={`hy${i}`}
              points={[0, origenY + i * escala, ANCHO, origenY + i * escala]}
              stroke="#eee" strokeWidth={1}
            />
          ))}

          {/* Ejes */}
          <Line points={[0, origenY, ANCHO, origenY]} stroke="#aaa" strokeWidth={1.5} />
          <Line points={[origenX, 0, origenX, ALTO]}  stroke="#aaa" strokeWidth={1.5} />
          <Text text="X" x={ANCHO - 14} y={origenY + 5} fill="#999" fontSize={12} />
          <Text text="Y" x={origenX + 5} y={4}           fill="#999" fontSize={12} />
          <Text text="0" x={origenX + 4} y={origenY + 4} fill="#999" fontSize={10} />

          {/* Etiquetas de ejes */}
          {ticksX.map(i => (
            <Text key={`lx${i}`}
              text={String(i)}
              x={origenX + i * escala - (i < 0 ? 10 : 4)}
              y={origenY + 5}
              fill="#bbb" fontSize={9}
            />
          ))}
          {ticksY.map(i => (
            <Text key={`ly${i}`}
              text={String(-i)}
              x={origenX + 4}
              y={origenY + i * escala - 6}
              fill="#bbb" fontSize={9}
            />
          ))}

          {/* NFZ — merged (normal + flipped, hilos + brazos combinados) */}
          {mostrarNFZ && nfzShapes.map((shape, i) => (
            <NFZShape
              key={`nfz-${i}`}
              shape={shape}
              index={i}
              fill="rgba(123,31,162,0.07)"
              stroke="#7b1fa2"
            />
          ))}

          {/* Móvil */}
          {movil && (
            <>
              <Circle x={origenX} y={origenY} radius={6} fill="#1976d2" />
              <Text
                text={movil.nombre}
                x={origenX + 10} y={origenY - 16}
                fill="#1976d2" fontSize={13} fontStyle="bold"
              />
              {brazoRaizId && (
                <DibujarBrazo
                  colgantes={colgantes}
                  brazoPadreId={brazoRaizId}
                  anclaX={origenX}
                  anclaY={origenY}
                  escala={escala}
                  paso={paso}
                />
              )}
            </>
          )}
        </Layer>
      </Stage>
    </div>
  )
}

const btnStyle = {
  background: 'none',
  border: '1px solid #ccc',
  borderRadius: '4px',
  padding: '3px 10px',
  cursor: 'pointer',
  fontSize: '13px',
  color: '#444',
}
