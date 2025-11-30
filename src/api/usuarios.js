import http from './http';

export async function listUsuarios(params = {}) {
  const { data } = await http.get('/usr@@soft', { params });
  return data; // { data, meta }
}
