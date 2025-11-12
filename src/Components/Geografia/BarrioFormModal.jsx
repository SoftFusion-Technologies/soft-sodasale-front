// src/Components/Geografia/BarrioFormModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ListPlus, Eye, CheckCircle2 } from 'lucide-react';
import {
  backdropV,
  panelV,
  formContainerV,
  fieldV
} from '../../ui/animHelpers';
import { listCiudades } from '../../api/ciudades';
import { listLocalidades } from '../../api/localidades';
import { bulkBarrios, bulkBarriosPreview } from '../../api/barrios';

export default function BarrioFormModal({ open, onClose, onSubmit, initial, fetchData }) {
  const [form, setForm] = useState({
    ciudad_id: '',
    localidad_id: '',
    nombre: '',
    estado: 'activa'
  });
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const [ciudades, setCiudades] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [multi, setMulti] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [preview, setPreview] = useState(null); // { meta, crear, omitidas }
  const isEdit = !!initial?.id;

  // Carga de ciudades (picker)
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const resp = await listCiudades({
          estado: 'activa',
          page: 1,
          limit: 500,
          orderBy: 'nombre',
          orderDir: 'ASC'
        });
        setCiudades(Array.isArray(resp) ? resp : resp?.data || []);
      } catch {
        setCiudades([]);
      }
    })();
  }, [open]);

  // Inicializar form al abrir
  useEffect(() => {
    if (!open) return;
    const ciudadId =
      initial?.localidad?.ciudad_id ??
      initial?.ciudad_id ??
      initial?.ciudad?.id ??
      '';
    setForm({
      ciudad_id: ciudadId,
      localidad_id: initial?.localidad_id ?? initial?.localidad?.id ?? '',
      nombre: initial?.nombre || '',
      estado: initial?.estado || 'activa'
    });
    setMulti(false);
    setBulkText('');
    setPreview(null);
    setSaving(false);
    setPreviewing(false);
  }, [open, initial]);

  // Cargar localidades dependientes
  useEffect(() => {
    const load = async () => {
      if (!form.ciudad_id) {
        setLocalidades([]);
        setForm((f) => ({ ...f, localidad_id: '' }));
        return;
      }
      try {
        const resp = await listLocalidades({
          ciudad_id: form.ciudad_id,
          estado: 'activa',
          page: 1,
          limit: 500,
          orderBy: 'nombre',
          orderDir: 'ASC'
        });
        const arr = Array.isArray(resp) ? resp : resp?.data || [];
        setLocalidades(arr);

        // si la localidad actual no pertenece a la ciudad seleccionada, limpiar
        const stillValid = arr.some(
          (l) => String(l.id) === String(form.localidad_id)
        );
        if (!stillValid) {
          setForm((f) => ({ ...f, localidad_id: '' }));
        }
      } catch {
        setLocalidades([]);
      }
    };
    load(); // eslint-disable-next-line
  }, [form.ciudad_id]);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'estado' && type === 'checkbox') {
      setForm((f) => ({ ...f, estado: checked ? 'activa' : 'inactiva' }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const submitSingle = async (e) => {
    e.preventDefault();
    if (!String(form.ciudad_id).trim())
      return alert('La ciudad es obligatoria');
    if (!String(form.localidad_id).trim())
      return alert('La localidad es obligatoria');
    if (!form.nombre.trim())
      return alert('El nombre del barrio es obligatorio');

    try {
      setSaving(true);
      await onSubmit({
        ciudad_id: Number(form.ciudad_id),
        localidad_id: Number(form.localidad_id),
        nombre: form.nombre.trim(),
        estado: form.estado
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // ====== MODO BULK ======
  const itemsFromBulk = useMemo(() => {
    const lines = String(bulkText)
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    // Si el switch de estado está en "inactiva", aplicarlo como default a cada línea
    if (form.estado === 'inactiva') {
      return lines.map((nombre) => ({ nombre, estado: 'inactiva' }));
    }
    // Si no, dejar strings y el backend pone 'activa' por defecto
    return lines;
  }, [bulkText, form.estado]);

  const doPreviewBulk = async () => {
    if (!String(form.ciudad_id).trim())
      return alert('La ciudad es obligatoria');
    if (!String(form.localidad_id).trim())
      return alert('La localidad es obligatoria');
    if (itemsFromBulk.length === 0)
      return alert('Ingresá al menos un barrio (uno por línea).');

    try {
      setPreviewing(true);
      const res = await bulkBarriosPreview({
        localidad_id: Number(form.localidad_id),
        items: itemsFromBulk
      });
      setPreview(res);
    } finally {
      setPreviewing(false);
    }
  };

  const doCreateBulk = async () => {
    if (!String(form.ciudad_id).trim())
      return alert('La ciudad es obligatoria');
    if (!String(form.localidad_id).trim())
      return alert('La localidad es obligatoria');
    if (itemsFromBulk.length === 0)
      return alert('Ingresá al menos un barrio (uno por línea).');

    try {
      setSaving(true);
      await bulkBarrios({
        localidad_id: Number(form.localidad_id),
        items: itemsFromBulk
      });
      onClose();
      fetchData()
    } finally {
      setSaving(false);
    }
  };

  const title = useMemo(
    () => (isEdit ? 'Editar Barrio' : 'Nuevo Barrio'),
    [isEdit]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          variants={backdropV}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            variants={panelV}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-[92vw] sm:max-w-xl md:max-w-2xl
                       max-h-[85vh] overflow-y-auto overscroll-contain
                       rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl"
          >
            <button
              onClick={onClose}
              className="absolute z-50 top-2.5 right-2.5 inline-flex h-9 w-9 items-center justify-center rounded-lg
                         bg-white/5 border border-white/10 hover:bg-white/10 transition"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5 text-gray-200" />
            </button>

            <div className="relative z-10 p-5 sm:p-6 md:p-8">
              <motion.h3
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-5"
              >
                {title}
              </motion.h3>

              {/* Toggle creación múltiple (no disponible en edición) */}
              {!isEdit && (
                <motion.div
                  variants={fieldV}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <label className="inline-flex items-center gap-3 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={multi}
                      onChange={() => {
                        setMulti((m) => !m);
                        setPreview(null);
                      }}
                    />
                    <span
                      className="relative inline-flex h-6 w-11 items-center rounded-full
                                 bg-white/10 peer-checked:bg-cyan-500/70 transition-colors duration-200"
                      aria-hidden
                    >
                      <span
                        className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow
                                   peer-checked:translate-x-5 transition-transform duration-200"
                      />
                    </span>
                    <span className="text-sm text-gray-200 flex items-center gap-2">
                      <ListPlus className="h-4 w-4 opacity-80" />
                      Creación múltiple
                    </span>
                  </label>
                </motion.div>
              )}

              <motion.form
                onSubmit={multi ? (e) => e.preventDefault() : submitSingle}
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="space-y-5 sm:space-y-6"
              >
                {/* Ciudad */}
                <motion.div variants={fieldV}>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Ciudad <span className="text-cyan-300">*</span>
                  </label>
                  <select
                    name="ciudad_id"
                    value={form.ciudad_id}
                    onChange={handle}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                               focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                  >
                    <option value="">Seleccionar…</option>
                    {ciudades.map((c) => (
                      <option className="text-black" key={c.id} value={c.id}>
                        {c.nombre} {c.provincia ? `(${c.provincia})` : ''}
                      </option>
                    ))}
                  </select>
                </motion.div>

                {/* Localidad (dependiente) */}
                <motion.div variants={fieldV}>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Localidad <span className="text-cyan-300">*</span>
                  </label>
                  <select
                    name="localidad_id"
                    value={form.localidad_id}
                    onChange={handle}
                    disabled={!form.ciudad_id}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                               disabled:opacity-60 disabled:cursor-not-allowed
                               focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                  >
                    <option value="">
                      {form.ciudad_id
                        ? 'Seleccionar…'
                        : 'Elegí primero una ciudad'}
                    </option>
                    {localidades.map((l) => (
                      <option className="text-black" key={l.id} value={l.id}>
                        {l.nombre}
                      </option>
                    ))}
                  </select>
                </motion.div>

                {/* Nombre o bloque múltiple */}
                {!multi ? (
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Nombre del barrio <span className="text-cyan-300">*</span>
                    </label>
                    <input
                      name="nombre"
                      value={form.nombre}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                      placeholder="San Martín, Belgrano, etc."
                    />
                  </motion.div>
                ) : (
                  <motion.div variants={fieldV} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="block text-sm font-medium text-gray-200">
                        Barrios (uno por línea){' '}
                        <span className="text-cyan-300">*</span>
                      </label>
                      <span className="text-xs text-gray-300/70">
                        {itemsFromBulk.length} líneas
                      </span>
                    </div>
                    <textarea
                      value={bulkText}
                      onChange={(e) => {
                        setBulkText(e.target.value);
                        if (preview) setPreview(null);
                      }}
                      rows={8}
                      placeholder={`Ejemplo:\nSan Martín\nBelgrano\nSan Cayetano`}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent
                                 min-h-[160px] max-h-[40vh]"
                    />
                    {preview && (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-gray-200">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Eye className="h-4 w-4 opacity-80" />
                          <span className="font-medium">Preview (dry-run)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div className="rounded-lg bg-white/5 p-2">
                            Solicitadas:{' '}
                            <span className="font-semibold">
                              {preview?.meta?.solicitadas ?? 0}
                            </span>
                          </div>
                          <div className="rounded-lg bg-white/5 p-2">
                            Válidas:{' '}
                            <span className="font-semibold">
                              {preview?.meta?.validas ?? 0}
                            </span>
                          </div>
                          <div className="rounded-lg bg-white/5 p-2">
                            A crear:{' '}
                            <span className="font-semibold">
                              {preview?.meta?.aCrear ?? 0}
                            </span>
                          </div>
                        </div>

                        {Array.isArray(preview?.omitidas) &&
                          preview.omitidas.length > 0 && (
                            <div className="mt-3">
                              <div className="text-xs mb-1 opacity-80">
                                Omitidas ({preview.omitidas.length}):
                              </div>
                              <ul className="space-y-1 max-h-28 overflow-auto pr-1">
                                {preview.omitidas.slice(0, 30).map((o, i) => (
                                  <li
                                    key={`${o.nombre}-${i}`}
                                    className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1"
                                  >
                                    <span className="truncate">{o.nombre}</span>
                                    <span className="text-[11px] opacity-70">
                                      {o.motivo}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              {preview.omitidas.length > 30 && (
                                <div className="text-[11px] opacity-60 mt-1">
                                  +{preview.omitidas.length - 30} más…
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Estado (único o default para bulk) */}
                <motion.label
                  variants={fieldV}
                  className="inline-flex items-center gap-3 select-none cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="estado"
                    checked={form.estado === 'activa'}
                    onChange={handle}
                    className="peer sr-only"
                  />
                  <span
                    className="relative inline-flex h-6 w-11 items-center rounded-full
                               bg-white/10 peer-checked:bg-emerald-500/70 transition-colors duration-200"
                    aria-hidden
                  >
                    <span
                      className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow
                                 peer-checked:translate-x-5 transition-transform duration-200"
                    />
                  </span>
                  <span className="text-sm text-gray-200">
                    {multi
                      ? `Estado por defecto: ${
                          form.estado === 'activa' ? 'Activa' : 'Inactiva'
                        }`
                      : form.estado === 'activa'
                      ? 'Activa'
                      : 'Inactiva'}
                  </span>
                </motion.label>

                {/* Acciones */}
                <motion.div
                  variants={fieldV}
                  className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1"
                >
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-white/10 text-gray-200 hover:bg-white/10 transition"
                  >
                    Cancelar
                  </button>

                  {!multi ? (
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold
                                 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    >
                      {saving
                        ? 'Guardando…'
                        : isEdit
                        ? 'Guardar cambios'
                        : 'Crear'}
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={doPreviewBulk}
                        disabled={previewing || saving}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-cyan-400/40 text-cyan-200
                                   hover:bg-cyan-400/10 disabled:opacity-60 disabled:cursor-not-allowed transition"
                      >
                        <Eye className="h-4 w-4" />
                        {previewing ? 'Previsualizando…' : 'Previsualizar'}
                      </button>
                      <button
                        type="button"
                        onClick={doCreateBulk}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold
                                   hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {saving ? 'Creando…' : 'Crear en bloque'}
                      </button>
                    </div>
                  )}
                </motion.div>
              </motion.form>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-gray-400/70 via-gray-200/70 to-gray-400/70 opacity-40 rounded-b-2xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
