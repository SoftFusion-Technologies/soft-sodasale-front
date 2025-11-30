// ===============================
// FILE: src/api/cobranzasClientes.js
// ===============================

import http from './http';
const toQS = (params = {}) => {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  return entries.length
    ? `?${new URLSearchParams(Object.fromEntries(entries)).toString()}`
    : '';
};

export const createCobranzaCliente = async (payload) => {
  const { data } = await http.post(`/cobranzas-clientes`, payload);
  return data;
};

//  NUEVO: lista solo clientes con deuda fiado (usa /ventas/deudores-fiado)
export const listClientesConDeudaFiado = async () => {
  const { data } = await http.get('/ventas/deudores-fiado');
  // data = [{ cliente_id, nombre, documento, telefono, email, total_pendiente, ... }]
  return data;
};

// GET /cobranzas-clientes (listado paginado + filtros)
export async function listCobranzasClientes(params = {}) {
  const { data } = await http.get(`/cobranzas-clientes${toQS(params)}`);
  return data; // { data, meta }
}

// GET /cobranzas-clientes/:id (detalle con aplicaciones)
export async function getCobranzaCliente(id) {
  const { data } = await http.get(`/cobranzas-clientes/${id}`);
  return data;
}