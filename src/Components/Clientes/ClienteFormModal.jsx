// ===============================
// FILE: src/Components/Clientes/ClienteFormModal.jsx
// ===============================
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  backdropV,
  panelV,
  formContainerV,
  fieldV
} from '../../ui/animHelpers';

// APIs de catálogos (usadas dentro del modal)
import { listCiudades } from '../../api/ciudades';
import { listLocalidades } from '../../api/localidades';
import { listBarrios } from '../../api/barrios';

export default function ClienteFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  barrios: barriosProp = [], // opcional: si no vienen, los pedimos
  vendedores = []
}) {
  // ------- Form -------
  const [form, setForm] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    email: '',
    estado: 'activo',

    // Geografía (cascada)
    ciudad_id: '',
    localidad_id: '',
    barrio_id: '',

    // Domicilio
    direccion_calle: '',
    direccion_numero: '',
    direccion_piso_dpto: '',
    referencia: '',

    // Ubicación
    lat: '',
    lng: '',

    // Vendedor preferido
    vendedor_preferido_id: ''
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  // ------- Catálogos -------
  const [ciudades, setCiudades] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [barrios, setBarrios] = useState(barriosProp);

  // Si no nos pasaron barrios por props, los cargamos
  useEffect(() => {
    setBarrios(barriosProp);
  }, [barriosProp]);

  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        const [cRes, lRes] = await Promise.all([
          listCiudades({ orderBy: 'nombre', orderDir: 'ASC', limit: 1000 }),
          listLocalidades({ orderBy: 'nombre', orderDir: 'ASC', limit: 5000 })
        ]);

        setCiudades(Array.isArray(cRes) ? cRes : cRes?.data || []);
        setLocalidades(Array.isArray(lRes) ? lRes : lRes?.data || []);

        if (!barriosProp?.length) {
          const bRes = await listBarrios({
            orderBy: 'nombre',
            orderDir: 'ASC',
            limit: 10000
          });
          setBarrios(Array.isArray(bRes) ? bRes : bRes?.data || []);
        }
      } catch (e) {
        console.error('Error cargando catálogos:', e);
      }
    })();
  }, [open]); // eslint-disable-line

  // ------- Inicialización de edición -------
  useEffect(() => {
    if (!open) return;

    // Intenta deducir ciudad/localidad desde el barrio_id de initial
    const seed = {
      nombre: initial?.nombre || '',
      documento: initial?.documento || '',
      telefono: initial?.telefono || '',
      email: initial?.email || '',
      estado: initial?.estado || 'activo',

      ciudad_id: '',
      localidad_id: '',
      barrio_id: initial?.barrio_id ?? '',

      direccion_calle: initial?.direccion_calle || '',
      direccion_numero: initial?.direccion_numero || '',
      direccion_piso_dpto: initial?.direccion_piso_dpto || '',
      referencia: initial?.referencia || '',

      lat:
        initial?.lat === null || initial?.lat === undefined
          ? ''
          : String(initial.lat),
      lng:
        initial?.lng === null || initial?.lng === undefined
          ? ''
          : String(initial.lng),

      vendedor_preferido_id:
        initial?.vendedor_preferido_id == null
          ? ''
          : String(initial.vendedor_preferido_id)
    };

    // Si el include trae incGeo, usarlo directo
    const locIdFromInclude = initial?.barrio?.localidad?.id;
    const ciudadIdFromInclude = initial?.barrio?.localidad?.ciudad?.id;

    // Si no viene include, intentar resolver por catálogo (barrios -> localidad_id -> ciudad_id)
    let localidad_id = locIdFromInclude || '';
    let ciudad_id = ciudadIdFromInclude || '';

    if (!localidad_id || !ciudad_id) {
      const b = (barriosProp.length ? barriosProp : barrios).find(
        (x) => Number(x.id) === Number(seed.barrio_id)
      );
      if (b?.localidad_id) {
        localidad_id = b.localidad_id;
      }
      if (!ciudad_id && localidad_id) {
        const loc = (localidades.length ? localidades : []).find(
          (l) => Number(l.id) === Number(localidad_id)
        );
        if (loc?.ciudad_id) ciudad_id = loc.ciudad_id;
      }
    }

    setForm((f) => ({
      ...seed,
      ciudad_id: ciudad_id || '',
      localidad_id: localidad_id || ''
    }));
  }, [open, initial, barrios, localidades, barriosProp]); // eslint-disable-line

  // ------- Cascada (filtros derivados) -------
  const localidadesFiltradas = useMemo(() => {
    const cid = Number(form.ciudad_id) || null;
    if (!cid) return localidades;
    return localidades.filter((l) => Number(l.ciudad_id) === cid);
  }, [localidades, form.ciudad_id]);

  const barriosFiltrados = useMemo(() => {
    const lid = Number(form.localidad_id) || null;
    if (!lid) return [];
    return barrios.filter((b) => Number(b.localidad_id) === lid);
  }, [barrios, form.localidad_id]);

  // Al cambiar ciudad -> limpiar localidad y barrio
  const handleCiudad = (e) => {
    const val = e.target.value;
    setForm((f) => ({
      ...f,
      ciudad_id: val,
      localidad_id: '',
      barrio_id: ''
    }));
  };

  // Al cambiar localidad -> limpiar barrio
  const handleLocalidad = (e) => {
    const val = e.target.value;
    setForm((f) => ({
      ...f,
      localidad_id: val,
      barrio_id: ''
    }));
  };

  const handleBarrio = (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, barrio_id: val }));
  };

  // ------- Reglas de validación mínimas -------
  const canSave = useMemo(() => {
    const nombreOK = form.nombre.trim().length > 1;
    const barrioOK = String(form.barrio_id).trim() !== '';
    return nombreOK && barrioOK;
  }, [form.nombre, form.barrio_id]);

  // ------- Handler genérico -------
  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'estado' && type === 'checkbox') {
      setForm((f) => ({ ...f, estado: checked ? 'activo' : 'inactivo' }));
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  // ------- Submit -------
  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;

    const toNull = (v) => (v === '' || v === undefined ? null : v);
    const toNumOrNull = (v) => {
      if (v === '' || v === undefined || v === null) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    try {
      setSaving(true);
      await onSubmit({
        nombre: form.nombre.trim(),
        documento: form.documento?.trim() || null,
        telefono: form.telefono?.trim() || null,
        email: form.email?.trim() || null,
        estado: form.estado,

        barrio_id: Number(form.barrio_id), // el DDL exige barrio_id
        direccion_calle: toNull(form.direccion_calle?.trim()),
        direccion_numero: toNull(form.direccion_numero?.trim()),
        direccion_piso_dpto: toNull(form.direccion_piso_dpto?.trim()),
        referencia: toNull(form.referencia?.trim()),

        lat: toNumOrNull(form.lat),
        lng: toNumOrNull(form.lng),

        vendedor_preferido_id: toNumOrNull(form.vendedor_preferido_id)
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
            className="relative w-full max-w-[92vw] sm:max-w-xl md:max-w-3xl
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
                {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
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

                {/* Documento / Teléfono / Email / Estado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="DNI/CUIT"
                    />
                  </motion.div>

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

                  <motion.div variants={fieldV} className="flex items-end">
                    <label className="inline-flex items-center gap-3 select-none cursor-pointer">
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

                {/* Geografía (cascada) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Ciudad */}
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Ciudad
                    </label>
                    <select
                      name="ciudad_id"
                      value={form.ciudad_id}
                      onChange={handleCiudad}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    >
                      <option className="text-black" value="">
                        Seleccionar…
                      </option>
                      {ciudades.map((c) => (
                        <option className="text-black" key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  {/* Localidad (filtrada por ciudad) */}
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Localidad
                    </label>
                    <select
                      name="localidad_id"
                      value={form.localidad_id}
                      onChange={handleLocalidad}
                      disabled={!form.ciudad_id}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    >
                      <option className="text-black" value="">
                        {form.ciudad_id
                          ? 'Seleccionar…'
                          : '(Elegí ciudad primero)'}
                      </option>
                      {localidadesFiltradas.map((l) => (
                        <option className="text-black" key={l.id} value={l.id}>
                          {l.nombre}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  {/* Barrio (filtrado por localidad) */}
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Barrio <span className="text-cyan-300">*</span>
                    </label>
                    <select
                      name="barrio_id"
                      value={form.barrio_id}
                      onChange={handleBarrio}
                      disabled={!form.localidad_id}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    >
                      <option className="text-black" value="">
                        {form.localidad_id
                          ? 'Seleccionar…'
                          : '(Elegí localidad primero)'}
                      </option>
                      {barriosFiltrados.map((b) => (
                        <option className="text-black" key={b.id} value={b.id}>
                          {b.nombre}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                </div>

                {/* Vendedor preferido */}
                <motion.div variants={fieldV}>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Vendedor preferido
                  </label>
                  <select
                    name="vendedor_preferido_id"
                    value={form.vendedor_preferido_id}
                    onChange={handle}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                               focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                  >
                    <option className="text-black" value="">
                      (Sin asignar)
                    </option>
                    {vendedores.map((v) => (
                      <option className="text-black" key={v.id} value={v.id}>
                        {v.nombre}
                        {v.estado === 'inactivo' ? ' (inactivo)' : ''}
                      </option>
                    ))}
                  </select>
                </motion.div>

                {/* Dirección */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Calle
                    </label>
                    <input
                      name="direccion_calle"
                      value={form.direccion_calle}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                      placeholder="Ej: San Martín"
                    />
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Número
                    </label>
                    <input
                      name="direccion_numero"
                      value={form.direccion_numero}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                      placeholder="1234"
                    />
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Piso / Dpto
                    </label>
                    <input
                      name="direccion_piso_dpto"
                      value={form.direccion_piso_dpto}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                      placeholder="2° B"
                    />
                  </motion.div>
                </div>

                {/* Referencia */}
                <motion.div variants={fieldV}>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Referencia
                  </label>
                  <input
                    name="referencia"
                    value={form.referencia}
                    onChange={handle}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    placeholder="Frente a..., cerca de..."
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
