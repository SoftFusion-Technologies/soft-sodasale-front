// src/api/repartos.js
import http from './http';

// Listado con paginación + filtros
// GET /repartos?ciudad_id=&estado=&q=&page=&limit=&orderBy=&orderDir=
export async function listRepartos(params = {}) {
  const { data } = await http.get('/repartos', { params });
  return data; // { data: [], meta: {...} } o []
}

// Crear
export async function createReparto(body) {
  const { data } = await http.post('/repartos', body);
  return data;
}

// Actualizar
export async function updateReparto(id, body) {
  const { data } = await http.put(`/repartos/${id}`, body);
  return data;
}

// Patch de estado ('activo' | 'inactivo')
export async function patchRepartoEstado(id, estado) {
  const { data } = await http.patch(`/repartos/${id}/estado`, { estado });
  return data;
}

// Eliminar (hard por defecto; podrías usar ?soft=1 más adelante en backend)
export async function deleteReparto(id) {
  const resp = await http.delete(`/repartos/${id}`);
  return resp?.data ?? { ok: true };
}
