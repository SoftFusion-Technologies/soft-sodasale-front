// src/Pages/Productos/ProductosCards.jsx
import React, { useEffect, useMemo, useState } from 'react';
import NavbarStaff from '../Dash/NavbarStaff';
import '../../Styles/staff/dashboard.css';
import '../../Styles/staff/background.css';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ButtonBack from '../../Components/ButtonBack';
import { motion } from 'framer-motion';
import { FaPlus, FaSearch } from 'react-icons/fa';

import ProductCard from '../../Components/Productos/ProductCard';
import ProductoFormModal from '../../Components/Productos/ProductoFormModal';
import ConfirmDialog from '../../Components/Common/ConfirmDialog';

import {
  listProductos,
  createProducto,
  updateProducto,
  patchProductoEstado,
  deleteProducto
} from '../../api/productos.js';

import {
  showErrorSwal,
  showWarnSwal,
  showSuccessSwal,
  showConfirmSwal
} from '../../ui/swal';

const useDebounce = (value, ms = 200) => {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDeb(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return deb;
};

export default function ProductosCards() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const dq = useDebounce(q);

  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'activos' | 'inactivos'
  const [filtroPresentacion, setFiltroPresentacion] = useState('todas'); // 'todas' | 'unidad' | 'pack'

  const [page, setPage] = useState(1);
  const limit = 18;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        q: dq || '',
        orderBy: 'nombre',
        orderDir: 'ASC'
      };

      if (filtroEstado === 'activos') params.estado = 'activo';
      if (filtroEstado === 'inactivos') params.estado = 'inactivo';
      if (filtroPresentacion === 'unidad' || filtroPresentacion === 'pack') {
        params.presentacion = filtroPresentacion;
      }

      const resp = await listProductos(params);

      // El backend puede devolver array plano o { data, meta }
      let apiRows = Array.isArray(resp) ? resp : resp?.data || [];
      let apiMeta = Array.isArray(resp) ? null : resp?.meta || null;

      // Normalizamos meta para el pager (que no falte hasPrev/hasNext)
      let normalized = null;
      if (apiMeta) {
        const lim = apiMeta.limit || limit;
        const pageNum =
          apiMeta.page ??
          (apiMeta.offset !== undefined
            ? Math.floor(apiMeta.offset / lim) + 1
            : 1);
        const totalPages =
          apiMeta.totalPages ??
          (apiMeta.total ? Math.ceil(apiMeta.total / lim) : undefined);
        const hasPrev =
          apiMeta.hasPrev ??
          (totalPages ? pageNum > 1 : (apiMeta.offset || 0) > 0);
        const hasNext =
          apiMeta.hasNext ?? (totalPages ? pageNum < totalPages : false);

        normalized = {
          ...apiMeta,
          page: pageNum,
          totalPages,
          hasPrev,
          hasNext
        };
      }

      setRows(apiRows);
      setMeta(normalized);
    } catch (e) {
      console.error(e);
      await showErrorSwal({
        title: 'Error',
        text: 'No se pudieron cargar los productos'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // eslint-disable-next-line
  }, [dq, filtroEstado, filtroPresentacion, page]);

  const onNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const onEdit = (item) => {
    setEditing(item);
    setModalOpen(true);
  };

  const onSubmit = async (form) => {
    try {
      if (editing?.id) {
        await updateProducto(editing.id, form);
        await showSuccessSwal({
          title: 'Guardado',
          text: 'Producto actualizado'
        });
      } else {
        await createProducto(form);
        await showSuccessSwal({ title: 'Creado', text: 'Producto creado' });
      }
      await fetchData();
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      const { code, mensajeError, tips } = err || {};
      if (code === 'DUPLICATE') {
        return showErrorSwal({
          title: 'SKU en uso',
          text: mensajeError || 'Ya existe un producto con ese SKU.',
          tips: tips?.length ? tips : ['Usá un SKU distinto.']
        });
      }
      if (code === 'MODEL_VALIDATION' || code === 'BAD_REQUEST') {
        return showWarnSwal({
          title: 'Datos inválidos',
          text: mensajeError || 'Revisá los campos del formulario.',
          tips
        });
      }
      if (code === 'NETWORK') {
        return showErrorSwal({
          title: 'Sin conexión',
          text: mensajeError,
          tips
        });
      }
      return showErrorSwal({
        title: 'No se pudo guardar',
        text: mensajeError || 'Ocurrió un error inesperado',
        tips
      });
    }
  };

  const onToggleActivo = async (item) => {
    const nextEstado =
      (item?.estado || '') === 'activo' ? 'inactivo' : 'activo';

    // Optimista (queda fachero y se siente rápido)
    setRows((r) =>
      r.map((x) => (x.id === item.id ? { ...x, estado: nextEstado } : x))
    );

    try {
      await patchProductoEstado(item.id, { estado: nextEstado });
      await showSuccessSwal({
        title: nextEstado === 'activo' ? 'Activado' : 'Desactivado',
        text: `Producto ${nextEstado === 'activo' ? 'activado' : 'desactivado'}`
      });
    } catch (err) {
      // Rollback si falló
      setRows((r) =>
        r.map((x) => (x.id === item.id ? { ...x, estado: item.estado } : x))
      );
      const { mensajeError, tips } = err || {};
      await showErrorSwal({
        title: 'No se pudo actualizar',
        text: mensajeError || 'Error al cambiar el estado',
        tips
      });
    }
  };

  const onAskDelete = (item) => {
    setToDelete(item);
    setConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    const item = toDelete;
    setConfirmOpen(false);

    const res = await showConfirmSwal({
      title: '¿Eliminar producto?',
      text: `Se eliminará "${item?.nombre}". Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar'
    });
    if (!res.isConfirmed) return;

    try {
      // Intento de borrado duro
      await deleteProducto(item.id, { hard: 1 });
      setRows((r) => r.filter((x) => x.id !== item.id));
      await showSuccessSwal({ title: 'Eliminado', text: 'Producto eliminado' });
    } catch (err) {
      // Si no se puede borrar, proponemos desactivar (soft-landing)
      const res2 = await showConfirmSwal({
        icon: 'warning',
        title: 'No se pudo eliminar',
        text: 'Este producto no puede borrarse ahora. ¿Deseás desactivarlo?',
        confirmText: 'Desactivar'
      });
      if (res2.isConfirmed) {
        try {
          await patchProductoEstado(item.id, { estado: 'inactivo' });
          setRows((r) =>
            r.map((x) => (x.id === item.id ? { ...x, estado: 'inactivo' } : x))
          );
          await showSuccessSwal({
            title: 'Desactivado',
            text: 'El producto fue desactivado.'
          });
        } catch (err2) {
          const { mensajeError: m2, tips: t2 } = err2 || {};
          await showErrorSwal({
            title: 'No se pudo desactivar',
            text: m2 || 'Error al desactivar',
            tips: t2
          });
        }
      }
    } finally {
      setToDelete(null);
    }
  };

  const Pager = useMemo(() => {
    if (!meta) return null;
    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!meta.hasPrev}
          className="px-3 py-2 rounded-xl border border-white/30 bg-white/70 hover:bg-white disabled:opacity-50"
        >
          ← Anterior
        </button>
        <span className="text-white/90 text-sm">
          Página {meta.page} {meta.totalPages ? `/ ${meta.totalPages}` : ''}
        </span>
        <button
          onClick={() => setPage((p) => (meta.hasNext ? p + 1 : p))}
          disabled={!meta.hasNext}
          className="px-3 py-2 rounded-xl border border-white/30 bg-white/70 hover:bg-white disabled:opacity-50"
        >
          Siguiente →
        </button>
      </div>
    );
  }, [meta]);

  return (
    <>
      <NavbarStaff />
      <section className="relative w-full min-h-screen bg-white">
        <div className="min-h-screen bg-gradient-to-b from-[#001219] via-[#003049] to-[#005f73]">
          <ParticlesBackground />
          <ButtonBack />

          <div className="text-center pt-24 px-4">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl titulo uppercase font-bold text-white mb-3 drop-shadow-md"
            >
              Productos
            </motion.h1>
            <p className="text-white/80">
              Gestioná productos.
            </p>
          </div>

          {/* Barra de acciones */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => {
                    setPage(1);
                    setQ(e.target.value);
                  }}
                  placeholder="Buscar por nombre o SKU…"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filtroEstado}
                  onChange={(e) => {
                    setPage(1);
                    setFiltroEstado(e.target.value);
                  }}
                  className="px-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="todos">Todos</option>
                  <option value="activos">Activos</option>
                  <option value="inactivos">Inactivos</option>
                </select>

                <select
                  value={filtroPresentacion}
                  onChange={(e) => {
                    setPage(1);
                    setFiltroPresentacion(e.target.value);
                  }}
                  className="px-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="todas">Todas</option>
                  <option value="unidad">Unidad</option>
                  <option value="pack">Pack</option>
                </select>

                <button
                  onClick={onNew}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700"
                >
                  <FaPlus /> Nuevo Producto
                </button>
              </div>
            </div>
          </div>

          {/* Grid de cards */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="h-10 w-10 border-4 border-white/50 border-t-teal-400 rounded-full animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center text-white/80 py-24">
                No hay productos con esos filtros.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {rows.map((it) => (
                  <ProductCard
                    key={it.id}
                    item={it}
                    onEdit={onEdit}
                    onToggleActivo={onToggleActivo}
                    onDelete={onAskDelete}
                    color={it.presentacion === 'pack' ? '#a21caf' : '#06b6d4'} // violeta para pack, cyan para unidad
                  />
                ))}
              </div>
            )}

            {Pager}
          </div>
        </div>
      </section>

      {/* Modales */}
      <ProductoFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={onSubmit}
        initial={editing}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar producto"
        message={
          toDelete ? `¿Seguro que desea eliminar "${toDelete.nombre}"?` : ''
        }
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
