// src/api/ciudades.js
import http from './http';

// Listado con paginación + filtros
export async function listCiudades(params = {}) {
  const { data } = await http.get('/geo/ciudades', { params });
  return data; // { data: [], meta: {...} }
}

// Crear
export async function createCiudad(body) {
  const { data } = await http.post('/geo/ciudades', body);
  return data;
}

// Actualizar
export async function updateCiudad(id, body) {
  const { data } = await http.put(`/geo/ciudades/${id}`, body);
  return data;
}

// Patch de estado ('activa' | 'inactiva')
export async function patchCiudadEstado(id, estado) {
  const { data } = await http.patch(`/geo/ciudades/${id}/estado`, { estado });
  return data;
}

// Eliminar

export async function deleteCiudad(id) {
  const resp = await http.delete(`/geo/ciudades/${id}`);
  // axios con 204 deja data = '' => normalizamos
  return resp?.data ?? { ok: true };
}
