// ===============================
// FILE: src/api/cxc.js
// ===============================

import http from './http';

export const getCxcDeudaCliente = async (clienteId) => {
  const { data } = await http.get(`/cxc/clientes/${clienteId}/deuda`);
  return data; // { cliente, total_deuda, ventas_pendientes }
};
