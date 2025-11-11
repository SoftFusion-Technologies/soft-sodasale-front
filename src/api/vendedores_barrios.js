// ===============================
// FILE: src/api/vendedores_barrios.js
// ===============================
import http from './http';

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
