// ===============================
// FILE: src/Components/Repartos/RepartoAsignarUsuariosModal.jsx
// ===============================
/*
 * Modal para asignar usuarios (chofer/ayudante/supervisor) a un reparto.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaUser,
  FaUserTie,
  FaUserCog,
  FaUserPlus,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import { X } from 'lucide-react';

import SearchableSelect from '../Common/SearchableSelect';

import { listUsuarios } from '../../api/usuarios';
import {
  listUsuariosDeReparto,
  createRepartoUsuario,
  updateRepartoUsuario,
  patchRepartoUsuarioActivo,
  deleteRepartoUsuario
} from '../../api/repartosUsuarios';

import {
  showErrorSwal,
  showWarnSwal,
  showSuccessSwal,
  showConfirmSwal
} from '../../ui/swal';

const backdropV = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const panelV = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 12 }
};

const roles = [
  { value: 'chofer', label: 'Chofer', icon: <FaUserTie /> },
  { value: 'ayudante', label: 'Ayudante', icon: <FaUser /> },
  { value: 'supervisor', label: 'Supervisor', icon: <FaUserCog /> }
];

const rolLabel = (v) => roles.find((r) => r.value === v)?.label || v || '—';

export default function RepartoAsignarUsuariosModal({
  open,
  onClose,
  reparto
}) {
  const repartoId = reparto?.id || null;

  const [usuariosOptions, setUsuariosOptions] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  const [asignaciones, setAsignaciones] = useState([]);
  const [loadingAsignaciones, setLoadingAsignaciones] = useState(false);

  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [rol, setRol] = useState('chofer');
  const [saving, setSaving] = useState(false);

  // Load usuarios activos
  const fetchUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const data = await listUsuarios({
        page: 1,
        limit: 200,
        pageSize: 200,
        estado: 'activo',
        orderBy: 'nombre',
        orderDir: 'ASC'
      });

      const list = data?.data || data || [];
      setUsuariosOptions(list);

      //  Si solo hay un usuario (ej: Admin), lo preseleccionamos
      if (list.length === 1) {
        setSelectedUsuario(list[0]);
      }
    } catch (err) {
      console.error('RepartoAsignarUsuariosModal fetchUsuarios error:', err);
      await showErrorSwal({
        title: 'Error',
        text: 'No se pudieron cargar los usuarios.'
      });
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // Load asignaciones existentes
  const fetchAsignaciones = async () => {
    if (!repartoId) return;
    setLoadingAsignaciones(true);
    try {
      const data = await listUsuariosDeReparto(repartoId, {
        page: 1,
        limit: 200,
        pageSize: 200,
        withUsuario: 1,
        orderBy: 'rol',
        orderDir: 'ASC'
      });
      setAsignaciones(data.data || data || []);
    } catch (err) {
      console.error(
        'RepartoAsignarUsuariosModal fetchAsignaciones error:',
        err
      );
      await showErrorSwal({
        title: 'Error',
        text: 'No se pudieron cargar los usuarios del reparto.'
      });
    } finally {
      setLoadingAsignaciones(false);
    }
  };

  // Reset y fetch cuando abre / cambia reparto
  useEffect(() => {
    if (!open || !repartoId) return;
    setSelectedUsuario(null);
    setRol('chofer');
    fetchUsuarios();
    fetchAsignaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, repartoId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!repartoId) return;

    //  Soportamos ambas formas:
    // - selectedUsuario = { id, nombre, ... }
    // - selectedUsuario = 123  (solo id)
    const usuarioId =
      typeof selectedUsuario === 'number'
        ? selectedUsuario
        : selectedUsuario?.id;

    if (!usuarioId) {
      return showWarnSwal({
        title: 'Falta usuario',
        text: 'Seleccioná un usuario para asignar.'
      });
    }

    try {
      setSaving(true);
      await createRepartoUsuario({
        reparto_id: repartoId,
        usuario_id: usuarioId,
        rol
      });
      await showSuccessSwal({
        title: 'Asignado',
        text: 'Usuario asignado al reparto.'
      });

      // Limpiamos el formulario
      setSelectedUsuario(null);
      setRol('chofer');
      await fetchAsignaciones();
    } catch (err) {
      console.error('onSubmit asignar usuario error:', err);
      const { code, mensajeError, tips } = err || {};

      if (code === 'DUPLICATE') {
        return showWarnSwal({
          title: 'Ya asignado',
          text:
            mensajeError ||
            'Ese usuario ya está asignado a este reparto. Podés cambiar su rol en la lista de abajo.',
          tips
        });
      }

      if (code === 'MODEL_VALIDATION' || code === 'BAD_REQUEST') {
        return showWarnSwal({
          title: 'Datos inválidos',
          text: mensajeError || 'Revisá los datos antes de guardar.',
          tips
        });
      }

      return showErrorSwal({
        title: 'No se pudo asignar',
        text: mensajeError || 'Ocurrió un error al asignar el usuario.',
        tips
      });
    } finally {
      setSaving(false);
    }
  };

  const onChangeRol = async (asig, nuevoRol) => {
    if (!nuevoRol || nuevoRol === asig.rol) return;
    try {
      // Optimista
      setAsignaciones((prev) =>
        prev.map((a) => (a.id === asig.id ? { ...a, rol: nuevoRol } : a))
      );
      await updateRepartoUsuario(asig.id, { rol: nuevoRol });
    } catch (err) {
      console.error('onChangeRol error:', err);
      setAsignaciones((prev) =>
        prev.map((a) => (a.id === asig.id ? { ...a, rol: asig.rol } : a))
      );
      const { mensajeError, tips } = err || {};
      await showErrorSwal({
        title: 'No se pudo actualizar el rol',
        text: mensajeError || 'Ocurrió un error al cambiar el rol.',
        tips
      });
    }
  };

  const onToggleActivo = async (asig) => {
    const next = asig.activo ? 0 : 1;
    try {
      setAsignaciones((prev) =>
        prev.map((a) => (a.id === asig.id ? { ...a, activo: next } : a))
      );
      await patchRepartoUsuarioActivo(asig.id, next);
    } catch (err) {
      console.error('onToggleActivo error:', err);
      setAsignaciones((prev) =>
        prev.map((a) => (a.id === asig.id ? { ...a, activo: asig.activo } : a))
      );
      const { mensajeError, tips } = err || {};
      await showErrorSwal({
        title: 'No se pudo cambiar el estado',
        text: mensajeError || 'Ocurrió un error al cambiar el estado.',
        tips
      });
    }
  };

  const onRemove = async (asig) => {
    const res = await showConfirmSwal({
      title: 'Quitar del reparto',
      text: `¿Quitar al usuario "${
        asig.usuario?.nombre ?? 'Usuario'
      }" de este reparto?`,
      confirmText: 'Sí, quitar'
    });
    if (!res || (typeof res === 'object' && !res.isConfirmed)) return;

    try {
      await deleteRepartoUsuario(asig.id, true);
      await showSuccessSwal({
        title: 'Quitado',
        text: 'Usuario quitado del reparto.'
      });
      await fetchAsignaciones();
    } catch (err) {
      console.error('onRemove error:', err);
      const { mensajeError, tips } = err || {};
      await showErrorSwal({
        title: 'No se pudo quitar',
        text: mensajeError || 'Ocurrió un error al quitar el usuario.',
        tips
      });
    }
  };

  const titulo = useMemo(() => reparto?.nombre || 'Reparto', [reparto?.nombre]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          variants={backdropV}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            variants={panelV}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15
                       bg-gradient-to-b from-[#001219]/95 via-[#003049]/95 to-[#001219]/98 shadow-2xl"
          >
            {/* Cerrar */}
            <button
              onClick={onClose}
              className="z-10 absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full
                         bg-white/10 border border-white/20 hover:bg-white/20 text-white transition"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-white/10 relative">
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_#38bdf8,_transparent_55%)]" />
              <div className="relative">
                <div className="text-[11px] uppercase tracking-[0.2em] text-teal-200/80 flex items-center gap-2">
                  <FaUserCog className="text-xs" />
                  Asignar usuarios al reparto
                </div>
                <h2 className="mt-1 text-xl sm:text-2xl font-bold text-white leading-tight">
                  {titulo}
                </h2>
                {reparto?.ciudad_nombre && (
                  <p className="mt-1 text-xs text-teal-100/80">
                    Ciudad: {reparto.ciudad_nombre}
                  </p>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="px-5 sm:px-7 py-4 space-y-5">
              {/* Formulario alta rápida */}
              <form
                onSubmit={onSubmit}
                className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md p-3.5 sm:p-4 space-y-3"
              >
                <div className="text-sm font-medium text-white/90 flex items-center gap-2 mb-1">
                  <FaUserPlus className="text-teal-300" />
                  Nueva asignación
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <SearchableSelect
                      label="Usuario / repartidor"
                      items={usuariosOptions}
                      value={selectedUsuario}
                      onChange={setSelectedUsuario}
                      placeholder={
                        loadingUsuarios
                          ? 'Cargando usuarios…'
                          : 'Buscar por nombre, email…'
                      }
                      disabled={loadingUsuarios}
                      getOptionLabel={(u) =>
                        `${u.nombre || 'Usuario'}${
                          u.email ? ` • ${u.email}` : ''
                        }`
                      }
                      getOptionValue={(u) => u.id}
                      //  CLAVE: que el menú salga en un portal por encima de todo
                      portal
                      portalZIndex={2300}
                      className="relative z-30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-teal-100 uppercase tracking-[0.16em] mb-2">
                      Rol
                    </label>
                    <select
                      value={rol}
                      onChange={(e) => setRol(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white
                                 focus:outline-none focus:ring-2 focus:ring-teal-400/60"
                    >
                      {roles.map((r) => (
                        <option className='text-black' key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-white/20 text-sm text-white/90 hover:bg-white/10 transition"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !selectedUsuario}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                               bg-gradient-to-r from-teal-500 to-sky-500 text-white border border-white/10
                               hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    <FaUserPlus className="text-xs" />
                    {saving ? 'Asignando…' : 'Asignar'}
                  </button>
                </div>
              </form>

              {/* Lista de asignaciones */}
              <div className="space-y-2 z-5">
                <div className="text-xs font-semibold text-teal-100 uppercase tracking-[0.16em]">
                  Usuarios asignados
                </div>

                {loadingAsignaciones ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="h-8 w-8 border-4 border-white/40 border-t-teal-400 rounded-full animate-spin" />
                  </div>
                ) : !asignaciones.length ? (
                  <div className="text-sm text-white/80 py-4">
                    Aún no hay usuarios asignados a este reparto.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {asignaciones.map((a) => {
                      const u = a.usuario || {};
                      const activo = !!a.activo;
                      return (
                        <div
                          key={a.id}
                          className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md px-3.5 py-3
                                     flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-full bg-white/90 text-slate-900 flex items-center justify-center text-sm font-bold">
                              {(u.nombre || 'U')[0]?.toUpperCase?.() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-[220px]">
                                  {u.nombre || 'Usuario'}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border
                                    ${
                                      activo
                                        ? 'bg-emerald-50/10 text-emerald-200 border-emerald-300/40'
                                        : 'bg-zinc-200/10 text-zinc-200 border-zinc-300/40'
                                    }`}
                                >
                                  {activo ? (
                                    <FaCheckCircle className="text-[10px]" />
                                  ) : (
                                    <FaTimesCircle className="text-[10px]" />
                                  )}
                                  {activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                              {u.email && (
                                <div className="text-[11px] text-teal-100/80">
                                  {u.email}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={a.rol}
                              onChange={(e) => onChangeRol(a, e.target.value)}
                              className="rounded-xl border border-white/20 bg-white/10 text-xs text-white px-2.5 py-1.5
                                         focus:outline-none focus:ring-2 focus:ring-teal-400/60"
                            >
                              {roles.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => onToggleActivo(a)}
                              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-white/20 text-white
                                         bg-white/10 hover:bg-white/20 transition"
                            >
                              {activo ? 'Desactivar' : 'Activar'}
                            </button>

                            <button
                              onClick={() => onRemove(a)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold
                                         bg-gradient-to-r from-rose-500/85 to-rose-600/95 text-white border border-white/15
                                         hover:brightness-110 transition"
                            >
                              <FaTrash className="text-[10px]" />
                              Quitar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
