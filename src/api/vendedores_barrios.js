// ===============================
// FILE: src/api/vendedores_barrios.js
// ===============================
import http from './http';
import { listBarrios as listBarriosApi } from './barrios'; // helper opcional

// Global: listado con filtros
export async function listVendedorBarrios(params = {}) {
  return http.get('/vendedor_barrios', { params }).then((r) => r.data);
}

// Por vendedor
export async function listVendedorBarriosPorVendedor(vendedorId, params = {}) {
  return http
    .get(`/vendedores/${vendedorId}/barrios`, { params })
    .then((r) => r.data);
}

// Crear asignación (vigente por defecto)
export async function createVendedorBarrio(vendedorId, payload) {
  try {
    const { data } = await http.post(
      `/vendedores/${vendedorId}/barrios`,
      payload
    );
    return data;
  } catch (e) {
    if (e.response) {
      // El backend respondió (409, 400, etc.)
      throw (
        e.response.data || { code: 'HTTP_ERROR', mensajeError: 'Error HTTP' }
      );
    }
    // No hubo respuesta (down, CORS, timeout)
    throw {
      code: 'NETWORK',
      mensajeError: 'No se pudo conectar con el servidor'
    };
  }
}

// Cerrar asignación (poner fecha hasta)
export async function closeVendedorBarrio(vendedorId, asigId, body = {}) {
  // body: { hasta? }
  return http
    .patch(`/vendedores/${vendedorId}/barrios/${asigId}/cerrar`, body)
    .then((r) => r.data);
}

// Cambiar estado activo/inactivo de la asignación
export async function patchVendedorBarrioEstado(vendedorId, asigId, estado) {
  return http
    .patch(`/vendedores/${vendedorId}/barrios/${asigId}/estado`, { estado })
    .then((r) => r.data);
}

// Eliminar asignación
export async function deleteVendedorBarrio(vendedorId, asigId) {
  return http
    .delete(`/vendedores/${vendedorId}/barrios/${asigId}`)
    .then((r) => r.data);
}

/* ===========================
 * NUEVO: Bulk assign
 * POST /vendedor_barrios/bulk
 * body: {
 *   vendedor_ids: number[],               // requerido (uno o varios)
 *   barrio_ids?: number[], barrio_id?: number, // al menos uno
 *   asignado_desde?: string|Date,
 *   asignado_hasta?: string|Date,         // si es futuro, backend la ignora (queda NULL)
 *   estado?: 'activo'|'inactivo'
 * }
 * =========================== */
export async function bulkAssignVendedorBarrios(payload) {
  try {
    const { data } = await http.post('/vendedor_barrios/bulk', payload);
    return data; // { summary, inserted, skipped }
  } catch (e) {
    if (e.response) {
      throw e.response.data || { code: 'HTTP_ERROR', mensajeError: 'Error HTTP' };
    }
    throw { code: 'NETWORK', mensajeError: 'No se pudo conectar con el servidor' };
  }
}

/* =========================================
 * Bulk por filtros de geografía
 * - Resuelve barrio_ids con /barrios y luego llama al bulk
 * args: {
 *   vendedor_ids: number[],            // requerido
 *   ciudad_id?: number,
 *   localidad_id?: number,
 *   estado_barrios?: 'activa'|'inactiva'|'todas' // default 'activa'
 *   asignado_desde?: string|Date,
 *   asignado_hasta?: string|Date,
 *   estado_asignacion?: 'activo'|'inactivo'
 * }
 * ========================================= */
export async function bulkAssignPorFiltros({
  vendedor_ids,
  ciudad_id,
  localidad_id,
  estado_barrios = 'activa',
  asignado_desde,
  asignado_hasta,
  estado_asignacion = 'activo'
}) {
  // 1) Traer barrios por filtros
  const params = {
    page: 1,
    limit: 10000,
    orderBy: 'nombre',
    orderDir: 'ASC'
  };
  if (estado_barrios === 'activa') params.estado = 'activa';
  if (estado_barrios === 'inactiva') params.estado = 'inactiva';
  if (ciudad_id) params.ciudad_id = ciudad_id;
  if (localidad_id) params.localidad_id = localidad_id;

  const resp = await listBarriosApi(params);
  const list = Array.isArray(resp) ? resp : resp?.data || [];
  const barrio_ids = list.map((b) => Number(b.id)).filter((n) => Number.isFinite(n));

  if (!Array.isArray(vendedor_ids) || vendedor_ids.length === 0) {
    throw { code: 'BAD_REQUEST', mensajeError: 'Faltan vendedor_ids' };
  }
  if (barrio_ids.length === 0) {
    throw { code: 'BAD_REQUEST', mensajeError: 'No hay barrios para los filtros seleccionados' };
  }

  // 2) Ejecutar bulk
  return bulkAssignVendedorBarrios({
    vendedor_ids,
    barrio_ids,
    asignado_desde,
    asignado_hasta,
    estado: estado_asignacion
  });
}