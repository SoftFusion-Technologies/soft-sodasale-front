// src/Components/Geografia/BarrioFormModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  backdropV,
  panelV,
  formContainerV,
  fieldV
} from '../../ui/animHelpers';
import { listCiudades } from '../../api/ciudades';
import { listLocalidades } from '../../api/localidades';

export default function BarrioFormModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState({
    ciudad_id: '',
    localidad_id: '',
    nombre: '',
    estado: 'activa'
  });
  const [saving, setSaving] = useState(false);

  const [ciudades, setCiudades] = useState([]);
  const [localidades, setLocalidades] = useState([]);
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
  }, [open, initial]);

  // Cargar localidades al elegir ciudad (o al editar, si viene con ciudad preseleccionada)
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

  const submit = async (e) => {
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
            className="relative w-full max-w-[92vw] sm:max-w-xl md:max-w-lg
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

              <motion.form
                onSubmit={submit}
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
                      <option className='text-black' key={c.id} value={c.id}>
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
                      <option className='text-black' key={l.id} value={l.id}>
                        {l.nombre}
                      </option>
                    ))}
                  </select>
                </motion.div>

                {/* Nombre */}
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

                {/* Estado */}
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
                    {form.estado === 'activa' ? 'Activa' : 'Inactiva'}
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
