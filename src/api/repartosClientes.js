// ===============================
// FILE: src/api/repartosClientes.js
// ===============================
import http from './http';

/** Lista clientes asignados a un reparto */
export async function listClientesDeReparto(repartoId, params = {}) {
  if (!repartoId) throw new Error('repartoId es requerido');

  const merged = {
    estado: 'activo',      // default: NO traer inactivos
    ...params,             // si params.estado viene, pisa el default
    reparto_id: repartoId,
    withCliente: 1,
    withReparto: 0
  };

  try {
    const { data } = await http.get('/repartos-clientes', { params: merged });
    return data;
  } catch (err) {
    if (
      err?.code === 'NOT_FOUND' ||
      (err?.code === 'NETWORK' && err?.details?.status === 404)
    ) {
      const lim = merged.limit ? Number(merged.limit) || 50 : 50;
      return {
        data: [],
        meta: { total: 0, page: 1, limit: lim, totalPages: 1, hasPrev: false, hasNext: false }
      };
    }
    throw err;
  }
}

/** Asignación masiva de clientes a un reparto */
export async function asignarClientesReparto(repartoId, body) {
  const { data } = await http.post(
    `/repartos/${repartoId}/asignar-clientes`,
    body
  );
  return data;
}

/** Eliminar una asignación reparto_cliente */
export async function deleteRepartoCliente(id) {
  const resp = await http.delete(`/repartos-clientes/${id}`);
  return resp?.data ?? { ok: true };
}
