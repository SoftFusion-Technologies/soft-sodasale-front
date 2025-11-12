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

/**
 * Bulk de barrios (una sola URL):
 * POST /geo/barrios/bulk
 * Body: { localidad_id, items, dryRun }
 *
 * - localidad_id: number (obligatorio)
 * - items: string[] | { nombre, estado? }[] (obligatorio)
 * - dryRun: boolean (opcional, default false)
 * - signal: AbortController.signal (opcional)
 */
export async function bulkBarrios({
  localidad_id,
  items,
  dryRun = false,
  signal
} = {}) {
  const lidNum = Number.parseInt(localidad_id, 10);
  if (!Number.isFinite(lidNum) || lidNum <= 0) {
    throw new Error('localidad_id inválido');
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('items debe ser un array con al menos 1 elemento');
  }

  const { data } = await http.post(
    '/geo/barrios/bulk',
    { localidad_id: lidNum, items, dryRun },
    { signal }
  );
  return data; // { message, meta, creadas, omitidas }
}
export function bulkBarriosPreview(args) {
  return bulkBarrios({ ...args, dryRun: true });
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
