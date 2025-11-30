// ===============================
// FILE: src/api/repartosUsuarios.js
// ===============================
import http from './http';

/** Listado genérico de repartos_usuarios */
export async function listRepartosUsuarios(params = {}) {
  const { data } = await http.get('/repartos-usuarios', { params });
  return data; // { data, meta, ... } o array plano según tu controller
}

/** Lista de usuarios asignados a un reparto concreto */
export async function listUsuariosDeReparto(repartoId, params = {}) {
  const { data } = await http.get('/repartos-usuarios', {
    params: {
      reparto_id: repartoId,
      ...params
    }
  });
  return data;
}

/** Crear asignación usuario ↔ reparto */
export async function createRepartoUsuario(body) {
  const { data } = await http.post('/repartos-usuarios', body);
  return data;
}

/** Actualizar asignación (por ej. cambiar rol) */
export async function updateRepartoUsuario(id, body) {
  const { data } = await http.put(`/repartos-usuarios/${id}`, body);
  return data;
}

/** Cambiar flag activo (PATCH /repartos-usuarios/:id/activo) */
export async function patchRepartoUsuarioActivo(id, activo) {
  const { data } = await http.patch(`/repartos-usuarios/${id}/activo`, {
    activo
  });
  return data;
}

/** Eliminar/quitar usuario del reparto (por defecto soft=1) */
export async function deleteRepartoUsuario(id, soft = true) {
  const resp = await http.delete(`/repartos-usuarios/${id}`, {
    params: soft ? { soft: 1 } : {}
  });
  return resp?.data ?? { ok: true };
}
