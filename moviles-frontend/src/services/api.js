import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const movilService = {
  obtenerTodos:   ()           => api.get('/moviles'),
  obtenerPorId:   (id)         => api.get(`/moviles/${id}`),
  crear:          (data)       => api.post('/moviles', data),
  actualizar:     (id, data)   => api.put(`/moviles/${id}`, data),
  eliminar:       (id)         => api.delete(`/moviles/${id}`),
  obtenerDetalle: (id)         => api.get(`/moviles/${id}/detalle`)
}

export const brazoService = {
  obtenerTodos:   ()           => api.get('/brazos'),
  obtenerPorId:   (id)         => api.get(`/brazos/${id}`),
  crear:          (data)       => api.post('/brazos', data),
  actualizar:     (id, data)   => api.put(`/brazos/${id}`, data),
  eliminar:       (id)         => api.delete(`/brazos/${id}`),
  pesoTotal:      (id)         => api.get(`/brazos/${id}/peso-total`),
  sugerirMinimo:  (o1, o2)     => api.get(`/brazos/sugerir-minimo?obj1Id=${o1}&obj2Id=${o2}`) // ← NUEVO
}

export const objetoService = {
  obtenerTodos: ()           => api.get('/objetos'),
  obtenerPorId: (id)         => api.get(`/objetos/${id}`),
  crear:        (data)       => api.post('/objetos', data),
  actualizar:   (id, data)   => api.put(`/objetos/${id}`, data),
  eliminar:     (id)         => api.delete(`/objetos/${id}`)
}

export const hiloService = {
  obtenerTodos: ()           => api.get('/hilos'),
  obtenerPorId: (id)         => api.get(`/hilos/${id}`),
  crear:        (data)       => api.post('/hilos', data),
  actualizar:   (id, data)   => api.put(`/hilos/${id}`, data),
  eliminar:     (id)         => api.delete(`/hilos/${id}`)
}

export const colganteService = {
  obtenerTodos:    ()                 => api.get('/colgantes'),
  obtenerPorId:    (id)               => api.get(`/colgantes/${id}`),
  obtenerPorBrazo: (brazoId, movilId) => api.get(`/colgantes/brazo/${brazoId}?movilId=${movilId}`),
  crear:           (data)             => api.post('/colgantes', data),
  actualizar:      (id, data)         => api.put(`/colgantes/${id}`, data),
  eliminar:        (id)               => api.delete(`/colgantes/${id}`)
}