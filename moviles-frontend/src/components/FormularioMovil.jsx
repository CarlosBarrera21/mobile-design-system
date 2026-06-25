import { useState } from 'react'
import { movilService } from '../services/api'

export default function FormularioMovil({ onGuardado, movilEditar = null, onCancelar = null }) {
  const [nombre, setNombre] = useState(movilEditar?.nombre || '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (movilEditar) {
      await movilService.actualizar(movilEditar.id, { nombre, posX: movilEditar.posX || 0, posY: movilEditar.posY || 0 })
    } else {
      await movilService.crear({ nombre, posX: 0, posY: 0 })
    }
    setNombre('')
    onGuardado()
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
      <input
        type="text"
        placeholder="Nombre del móvil"
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        required
        style={{ padding: '5px' }}
      />
      <button type="submit">
        {movilEditar ? '💾 Guardar' : '+ Crear Móvil'}
      </button>
      {movilEditar && onCancelar && (
        <button type="button" onClick={onCancelar}
          style={{ background: '#eee', border: '1px solid #ccc', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>
          ✕ Cancelar
        </button>
      )}
    </form>
  )
}