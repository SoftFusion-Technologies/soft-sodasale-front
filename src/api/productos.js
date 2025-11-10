// src/api/productos.js
// cliente API para Productos

import http from './http';

// Arma querystring ignorando null/undefined/''
const toQS = (params = {}) => {
  const clean = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    clean[k] = v;
  }
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : '';
};

/**
 * Listado de productos con filtros y paginación (page/limit, offset/limit o keyset)
 * Ej: listProductos({ q: 'Agua', estado: 'activo', presentacion: 'pack', page: 1, limit: 18 })
 */
export async function listProductos(params = {}) {
  const { data } = await http.get(`/productos${toQS(params)}`);
  return data; // puede ser array o { data, meta } según tu backend
}

/**
 * Alta de producto
 * payload esperado: { nombre, codigo_sku, presentacion, pack_cantidad, unidad_medida, contenido, barra_ean13, iva_porcentaje, estado, notas }
 */
export async function createProducto(payload) {
  const { data } = await http.post('/productos', payload);
  return data;
}

/**
 * Update de producto por ID
 */
export async function updateProducto(id, payload) {
  const { data } = await http.put(`/productos/${id}`, payload);
  return data;
}

/**
 * Cambiar estado (activar/desactivar) — PATCH /productos/:id/estado
 * Ej: patchProductoEstado(5, { estado: 'inactivo' })
 */
export async function patchProductoEstado(id, payload) {
  const { data } = await http.patch(`/productos/${id}/estado`, payload);
  return data;
}

/**
 * Eliminar producto
 * - Borrado duro: deleteProducto(id, { hard: 1 })
 * - Si tu backend permite otras flags (ej. forzar), las pasás en opts.
 */
export async function deleteProducto(id, opts = {}) {
  const { data } = await http.delete(`/productos/${id}${toQS(opts)}`);
  return data;
}

export default {
  listProductos,
  createProducto,
  updateProducto,
  patchProductoEstado,
  deleteProducto
};
