// src/api/localidades.js
import http from './http';

// Listado con paginación + filtros
export async function listLocalidades(params = {}) {
  const { data } = await http.get('/geo/localidades', { params });
  return data; // { data: [], meta: {...} }
}

// Crear
export async function createLocalidad(body) {
  const { data } = await http.post('/geo/localidades', body);
  return data;
}

// Actualizar
export async function updateLocalidad(id, body) {
  const { data } = await http.put(`/geo/localidades/${id}`, body);
  return data;
}

// Patch de estado ('activa' | 'inactiva')
export async function patchLocalidadEstado(id, estado) {
  const { data } = await http.patch(`/geo/localidades/${id}/estado`, {
    estado
  });
  return data;
}

// Eliminar
export async function deleteLocalidad(id) {
  const { data } = await http.delete(`/geo/localidades/${id}`);
  return data;
}
