// ===============================
// FILE: src/api/ventas_detalles.js
// ===============================

import http from './http';

/**
 * Listar ítems (detalle) de una venta
 * GET /ventas/:ventaId/items
 */
export async function listVentaItems(ventaId) {
  const { data } = await http.get(`/ventas/${ventaId}/items`);
  return data; // { data: items[] }
}

/**
 * Agregar ítems a una venta
 *
 * Acepta:
 * - payload = { producto_id, cantidad, precio_unit }
 * - o payload = [{...}, {...}]
 * - o payload = { items: [{...}, {...}] }
 *
 * POST /ventas/:ventaId/items
 */
export async function addVentaItems(ventaId, payload) {
  const { data } = await http.post(`/ventas/${ventaId}/items`, payload);
  return data; // { data: items[] } (detalle completo actualizado)
}

/**
 * Actualizar un ítem puntual de la venta
 *
 * PUT /ventas/:ventaId/items/:itemId
 */
export async function updateVentaItem(ventaId, itemId, payload) {
  const { data } = await http.put(
    `/ventas/${ventaId}/items/${itemId}`,
    payload
  );
  return data; // { data: items[] }
}

/**
 * Eliminar un ítem puntual de la venta
 *
 * DELETE /ventas/:ventaId/items/:itemId
 */
export async function deleteVentaItem(ventaId, itemId) {
  const res = await http.delete(`/ventas/${ventaId}/items/${itemId}`);
  if (res.status === 204) {
    return { ok: true, message: 'Ítem eliminado correctamente.' };
  }
  return {
    ok: true,
    ...(res.data || {}),
    message: res.data?.message || 'Ítem eliminado correctamente.'
  };
}

/**
 * Reemplazar completamente el detalle de una venta
 *
 * Acepta:
 * - payload = [{ producto_id, cantidad, precio_unit }, ...]
 * - o payload = { items: [...] }
 *
 * POST /ventas/:ventaId/items/replace
 */
export async function replaceVentaItems(ventaId, payload) {
  const { data } = await http.post(`/ventas/${ventaId}/items/replace`, payload);
  return data; // { data: items[] }
}

export default {
  listVentaItems,
  addVentaItems,
  updateVentaItem,
  deleteVentaItem,
  replaceVentaItems
};
