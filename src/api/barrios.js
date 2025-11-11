// src/api/barrios.js
import http from './http';

// GET /geo/barrios  (q, estado, ciudad_id, localidad_id, page, limit, orderBy, orderDir)
export async function listBarrios(params = {}) {
  const { data } = await http.get('/geo/barrios', { params });
  return data; // { data: [], meta: {...} } o array plano
}

// POST /geo/barrios
export async function createBarrio(body) {
  const { data } = await http.post('/geo/barrios', body);
  return data;
}

// PUT /geo/barrios/:id
export async function updateBarrio(id, body) {
  const { data } = await http.put(`/geo/barrios/${id}`, body);
  return data;
}

// PATCH /geo/barrios/:id/estado
export async function patchBarrioEstado(id, estado) {
  const { data } = await http.patch(`/geo/barrios/${id}/estado`, { estado });
  return data;
}

// DELETE /geo/barrios/:id
export async function deleteBarrio(id) {
  const resp = await http.delete(`/geo/barrios/${id}`);
  return resp?.data ?? { ok: true }; // tolera 204 No Content
}

export default {
  listBarrios,
  createBarrio,
  updateBarrio,
  patchBarrioEstado,
  deleteBarrio
};
