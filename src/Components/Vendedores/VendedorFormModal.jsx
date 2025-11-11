// src/Components/Vendedores/VendedorFormModal.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  backdropV,
  panelV,
  formContainerV,
  fieldV
} from '../../ui/animHelpers';

export default function VendedorFormModal({
  open,
  onClose,
  onSubmit,
  initial
}) {
  const [form, setForm] = useState({
    nombre: '',
    documento: '',
    email: '',
    telefono: '',
    estado: 'activo',
    notas: ''
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  useEffect(() => {
    if (!open) return;
    setForm({
      nombre: initial?.nombre || '',
      documento: initial?.documento || '',
      email: initial?.email || '',
      telefono: initial?.telefono || '',
      estado: initial?.estado || 'activo',
      notas: initial?.notas || ''
    });
  }, [open, initial]);

  const canSave = useMemo(() => form.nombre.trim().length > 1, [form.nombre]);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'estado' && type === 'checkbox') {
      setForm((f) => ({ ...f, estado: checked ? 'activo' : 'inactivo' }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    try {
      setSaving(true);
      await onSubmit({
        nombre: form.nombre.trim(),
        documento: form.documento?.trim() || null,
        email: form.email?.trim() || null,
        telefono: form.telefono?.trim() || null,
        estado: form.estado,
        notas: form.notas?.trim() || null
      });
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
                {isEdit ? 'Editar Vendedor' : 'Nuevo Vendedor'}
              </motion.h3>

              <motion.form
                onSubmit={submit}
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="space-y-5 sm:space-y-6"
              >
                {/* Nombre */}
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
                    placeholder="Nombre y apellido"
                  />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Documento */}
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Documento
                    </label>
                    <input
                      name="documento"
                      value={form.documento}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                      placeholder="CUIT/CUIL o DNI"
                    />
                  </motion.div>

                  {/* Teléfono */}
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Teléfono
                    </label>
                    <input
                      name="telefono"
                      value={form.telefono}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                      placeholder="+54 9 ..."
                    />
                  </motion.div>

                  {/* Email */}
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                      placeholder="correo@dominio.com"
                    />
                  </motion.div>

                  {/* Estado (toggle) */}
                  <motion.div variants={fieldV} className="flex items-end">
                    <label className=" inline-flex items-center gap-3 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        name="estado"
                        checked={form.estado === 'activo'}
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
                        {form.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </label>
                  </motion.div>
                </div>

                {/* Notas */}
                <motion.div variants={fieldV}>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Notas
                  </label>
                  <textarea
                    name="notas"
                    value={form.notas}
                    onChange={handle}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    placeholder="Observaciones internas"
                  />
                </motion.div>

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
                    disabled={!canSave || saving}
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
