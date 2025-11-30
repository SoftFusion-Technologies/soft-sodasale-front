// ===============================
// FILE: src/api/repartosClientes.js
// ===============================
import http from './http';

/** Lista clientes asignados a un reparto */
export async function listClientesDeReparto(repartoId, params = {}) {
  if (!repartoId) {
    throw new Error('repartoId es requerido');
  }

  const merged = {
    // filtros/paginación que ya le venías pasando
    ...params,
    reparto_id: repartoId,
    withCliente: 1, // para que incluya info del cliente si tu controlador lo soporta
    withReparto: 0
  };

  try {
    const { data } = await http.get('/repartos-clientes', {
      params: merged
    });
    // backend: { data: [...], meta: {...} }
    return data;
  } catch (err) {
    // Si más adelante tu backend devuelve NOT_FOUND cuando no haya nada, lo tratamos como lista vacía.
    if (
      err?.code === 'NOT_FOUND' ||
      (err?.code === 'NETWORK' && err?.details?.status === 404)
    ) {
      const lim = merged.limit ? Number(merged.limit) || 50 : 50;
      return {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: lim,
          totalPages: 1,
          hasPrev: false,
          hasNext: false
        }
      };
    }

    // Otros errores: realmente algo anda mal
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
