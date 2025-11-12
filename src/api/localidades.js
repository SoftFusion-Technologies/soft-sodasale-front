// src/api/localidades.js
import http from './http';

// Listado con paginación + filtros
export async function listLocalidades(params = {}) {
  const { data } = await http.get('/geo/localidades', { params });
  return data; // { data: [], meta: {...} }
}

// Crear
export async function createLocalidad(body) {
  const { data } = await http.post('/geo/localidades', body);
  return data;
}


/* ===============================
   BULK localidades
   - items: array de strings o objetos { nombre, estado? }
   - dryRun: true = preview sin insertar
   - pathVariant: 'default' | 'city'
     * 'default' → POST /geo/localidades/bulk  (usa ciudad_id en body)
     * 'city'    → POST /geo/ciudades/:ciudad_id/localidades/bulk
   - signal: AbortController?.signal (opcional)
   =============================== */
export async function bulkLocalidades({
  ciudad_id,
  items,
  dryRun = false,
  pathVariant = 'default',
  signal
} = {}) {
  const cidNum = Number.parseInt(ciudad_id, 10);
  if (!Number.isFinite(cidNum) || cidNum <= 0) {
    throw new Error('ciudad_id inválido');
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('items debe ser un array con al menos 1 elemento');
  }

  const path =
    pathVariant === 'city'
      ? `/geo/ciudades/${cidNum}/localidades/bulk`
      : '/geo/localidades/bulk';

  const body =
    pathVariant === 'city'
      ? { items, dryRun } // ciudad en la URL
      : { ciudad_id: cidNum, items, dryRun }; // ciudad en el body

  const { data } = await http.post(path, body, { signal });
  return data; // { message, meta, creadas, omitidas } en éxito
}

// Atajo para preview (dryRun)
export function bulkLocalidadesPreview(args) {
  return bulkLocalidades({ ...args, dryRun: true });
}

// Actualizar
export async function updateLocalidad(id, body) {
  const { data } = await http.put(`/geo/localidades/${id}`, body);
  return data;
}

// Patch de estado ('activa' | 'inactiva')
export async function patchLocalidadEstado(id, estado) {
  const { data } = await http.patch(`/geo/localidades/${id}/estado`, {
    estado
  });
  return data;
}

// Eliminar
export async function deleteLocalidad(id) {
  const { data } = await http.delete(`/geo/localidades/${id}`);
  return data;
}
