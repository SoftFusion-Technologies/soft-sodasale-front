// API: Vendedores
import http from './http';

// QS helper local para evitar dependencias
const toQS = (params = {}) => {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  return entries.length
    ? `?${new URLSearchParams(Object.fromEntries(entries)).toString()}`
    : '';
};

export async function listVendedores(params = {}) {
  const { data } = await http.get(`/vendedores${toQS(params)}`);
  return data; // puede venir {data, meta} o array
}

export async function createVendedor(payload) {
  const { data } = await http.post('/vendedores', payload);
  return data;
}

export async function updateVendedor(id, payload) {
  const { data } = await http.put(`/vendedores/${id}`, payload);
  return data;
}

export async function patchVendedorEstado(id, body = {}) {
  const { data } = await http.patch(`/vendedores/${id}/estado`, body);
  return data;
}

export async function deleteVendedor(id, opts = { hard: 1 }) {
  const res = await http.delete(`/vendedores/${id}${toQS(opts)}`);
  if (res.status === 204)
    return { ok: true, message: 'Se borró correctamente.' };
  return {
    ok: true,
    ...(res.data || {}),
    message: res.data?.message || 'Se borró correctamente.'
  };
}

export default {
  listVendedores,
  createVendedor,
  updateVendedor,
  patchVendedorEstado,
  deleteVendedor
};
