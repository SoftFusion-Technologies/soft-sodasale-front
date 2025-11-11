// src/Components/Geografia/CiudadFormModal.jsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  backdropV,
  panelV,
  formContainerV,
  fieldV
} from '../../ui/animHelpers';

export default function CiudadFormModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState({
    nombre: '',
    provincia: 'Tucumán',
    estado: 'activa' // 'activa' | 'inactiva'
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (open) {
      setForm({
        nombre: initial?.nombre || '',
        provincia: initial?.provincia || 'Tucumán',
        estado: initial?.estado || 'activa'
      });
    }
  }, [open, initial]);

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
    if (!form.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    try {
      setSaving(true);
      await onSubmit(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

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
                {isEdit ? 'Editar Ciudad' : 'Nueva Ciudad'}
              </motion.h3>

              <motion.form
                onSubmit={submit}
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="space-y-5 sm:space-y-6"
              >
                <motion.div variants={fieldV}>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Nombre <span className="text-cyan-300">*</span>
                  </label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handle}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    placeholder="Concepción"
                  />
                </motion.div>

                <motion.div variants={fieldV}>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Provincia
                  </label>
                  <input
                    name="provincia"
                    value={form.provincia}
                    onChange={handle}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    placeholder="Tucumán"
                  />
                </motion.div>

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
