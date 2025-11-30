// ===============================
// FILE: src/api/repartosDias.js
// ===============================
import http from './http';

/** Listado genérico de repartos_dias */
export async function listRepartosDias(params = {}) {
  const { data } = await http.get('/repartos-dias', { params });
  return data;
}

/** Lista de días/turnos de un reparto */
export async function listDiasDeReparto(repartoId, params = {}) {
  const { data } = await http.get('/repartos-dias', {
    params: {
      reparto_id: repartoId,
      ...params
    }
  });
  return data;
}

/** Crear día/turno para un reparto */
export async function createRepartoDia(body) {
  const { data } = await http.post('/repartos-dias', body);
  return data;
}

/** Actualizar registro (por si más adelante quieres editar turno) */
export async function updateRepartoDia(id, body) {
  const { data } = await http.put(`/repartos-dias/${id}`, body);
  return data;
}

/** Eliminar un día/turno concreto */
export async function deleteRepartoDia(id) {
  const resp = await http.delete(`/repartos-dias/${id}`);
  return resp?.data ?? { ok: true };
}
