// ===============================
// FILE: src/api/cxc.js
// ===============================

import http from './http';

export const getCxcDeudaCliente = async (clienteId) => {
  const { data } = await http.get(`/cxc/clientes/${clienteId}/deuda`);
  return data;
  // {
  //   cliente: { ... },
  //   total_deuda: number,
  //   saldo_previo_total: number,
  //   saldos_previos: [{ id, fecha, monto, descripcion }],
  //   ventas_pendientes: [{ id, fecha, tipo, total_venta, cobrado, saldo, dias_atraso }]
  // }
};
