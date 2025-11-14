// ===============================
// FILE: src/Components/Ventas/VentaFormModal.jsx
// ===============================
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import {
  backdropV,
  panelV,
  formContainerV,
  fieldV
} from '../../ui/animHelpers';

import { listCiudades } from '../../api/ciudades';
import { listClientes } from '../../api/clientes';
import { listProductos } from '../../api/productos';
import SearchableSelect from '../Common/SearchableSelect';

export default function VentaFormModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    fecha: new Date(),
    ciudad_id: '',
    cliente_id: '',
    vendedor_id: '',
    tipo: 'fiado', // contado | fiado | a_cuenta
    observaciones: ''
  });

  const [saving, setSaving] = useState(false);

  // Catálogos
  const [ciudades, setCiudades] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  // Selección actual
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [vendedorLabel, setVendedorLabel] = useState('');

  // Items (detalle)
  const [items, setItems] = useState([
    { producto_id: '', producto: null, cantidad: '', precio_unit: '' }
  ]);

  // ---------- Helpers ----------
  const resetState = () => {
    setForm({
      fecha: new Date(),
      ciudad_id: '',
      cliente_id: '',
      vendedor_id: '',
      tipo: 'fiado',
      observaciones: ''
    });
    setSelectedCliente(null);
    setVendedorLabel('');
    setItems([
      { producto_id: '', producto: null, cantidad: '', precio_unit: '' }
    ]);
  };

  // Formateo de fecha para mostrar (bloqueada)
  const fechaLabel = useMemo(() => {
    const d = form.fecha instanceof Date ? form.fecha : new Date(form.fecha);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }, [form.fecha]);

  // Total calculado (preview)
  const totalNeto = useMemo(() => {
    return items.reduce((acc, it) => {
      const cant = Number(it.cantidad);
      const pu = Number(it.precio_unit);
      if (!Number.isFinite(cant) || !Number.isFinite(pu)) return acc;
      return acc + cant * pu;
    }, 0);
  }, [items]);

  const totalLabel = useMemo(
    () =>
      totalNeto.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
    [totalNeto]
  );

  // Puede guardar: cliente + vendedor + al menos un ítem válido
  const canSave = useMemo(() => {
    const cliId = Number(form.cliente_id);
    const vendId = Number(form.vendedor_id);

    const hasCliente = Number.isFinite(cliId) && cliId > 0;
    const hasVendedor = Number.isFinite(vendId) && vendId > 0;

    const hasItemsValidos =
      Array.isArray(items) &&
      items.some((it) => {
        const pid = Number(it.producto_id ?? it.productoId ?? it.id_producto);
        const cant = Number(it.cantidad ?? it.qty ?? it.cant);
        return (
          Number.isFinite(pid) && pid > 0 && Number.isFinite(cant) && cant > 0
        );
      });

    return hasCliente && hasVendedor && hasItemsValidos;
  }, [form.cliente_id, form.vendedor_id, items]);

    /* descomentar para seguimiento
  useEffect(() => {
    const cliId = Number(form.cliente_id);
    const vendId = Number(form.vendedor_id);
    const hasCliente = Number.isFinite(cliId) && cliId > 0;
    const hasVendedor = Number.isFinite(vendId) && vendId > 0;
    const hasItemsValidos =
      Array.isArray(items) &&
      items.some((it) => {
        const pid = Number(it.producto_id ?? it.productoId);
        const cant = Number(it.cantidad ?? it.qty);
        return pid > 0 && cant > 0;
      });

    console.log('canSave deps =>', {
      form,
      items,
      hasCliente,
      hasVendedor,
      hasItemsValidos
    });
  }, [form, items]);
*/
  // ---------- Carga de catálogos al abrir ----------
  useEffect(() => {
    if (!open) return;
    resetState();

    (async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          listCiudades({ orderBy: 'nombre', orderDir: 'ASC', limit: 1000 }),
          listProductos({
            orderBy: 'created_at',
            orderDir: 'DESC',
            limit: 1000
          })
        ]);

        const ciuds = Array.isArray(cRes) ? cRes : cRes?.data || [];
        const prods = Array.isArray(pRes?.data) ? pRes.data : pRes || [];

        setCiudades(ciuds);
        setProductos(prods);
      } catch (err) {
        console.error('Error cargando catálogos para venta:', err);
      }
    })();
  }, [open]);

  // Cargar clientes al elegir ciudad
  useEffect(() => {
    if (!open) return;
    if (!form.ciudad_id) {
      setClientes([]);
      setSelectedCliente(null);
      setVendedorLabel('');
      setForm((f) => ({
        ...f,
        cliente_id: '',
        vendedor_id: ''
      }));
      return;
    }

    (async () => {
      try {
        const cRes = await listClientes({
          ciudad_id: form.ciudad_id,
          estado: 'activo',
          limit: 1000
        });
        const cls = Array.isArray(cRes?.data) ? cRes.data : cRes || [];
        setClientes(cls);
      } catch (err) {
        console.error('Error cargando clientes por ciudad:', err);
      }
    })();
  }, [open, form.ciudad_id]);

  // ---------- Handlers de campos simples ----------
  const handleTipo = (tipo) =>
    setForm((f) => ({
      ...f,
      tipo
    }));

  const handleObservaciones = (e) => {
    const { value } = e.target;
    setForm((f) => ({ ...f, observaciones: value }));
  };

  const handleCiudad = (e) => {
    const val = e.target.value;
    setForm((f) => ({
      ...f,
      ciudad_id: val
    }));
  };

  // ---------- Cliente & vendedor ----------
  const handleClienteChange = (cliOrId) => {
    if (!cliOrId) {
      setSelectedCliente(null);
      setVendedorLabel('');
      setForm((f) => ({
        ...f,
        cliente_id: '',
        vendedor_id: ''
      }));
      return;
    }

    const cli =
      typeof cliOrId === 'object'
        ? cliOrId
        : clientes.find((c) => c.id === Number(cliOrId));

    if (!cli) {
      setSelectedCliente(null);
      setVendedorLabel('Sin vendedor asignado');
      setForm((f) => ({
        ...f,
        cliente_id: Number(cliOrId) || '',
        vendedor_id: ''
      }));
      return;
    }

    setSelectedCliente(cli);
    setForm((f) => ({
      ...f,
      cliente_id: cli.id,
      vendedor_id: cli.vendedor_preferido_id || '' // <- acá se setea
    }));

    if (cli.vendedor_preferido?.nombre) {
      setVendedorLabel(cli.vendedor_preferido.nombre);
    } else if (cli.vendedor_preferido_id) {
      setVendedorLabel(`Vendedor ID: ${cli.vendedor_preferido_id}`);
    } else {
      setVendedorLabel('Sin vendedor asignado');
    }
  };

  // ---------- Items (detalle) ----------
  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? {
              ...it,
              [field]: value
            }
          : it
      )
    );
  };

  const handleProductoChange = (index, prodOrId) => {
    setItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        const id =
          typeof prodOrId === 'object' ? prodOrId.id : Number(prodOrId) || '';

        return {
          ...row,
          producto_id: id
        };
      })
    );
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { producto_id: '', producto: null, cantidad: '', precio_unit: '' }
    ]);
  };

  const removeItemRow = (index) => {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index)
    );
  };

  // ---------- Submit ----------
  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;

    const fechaPayload =
      form.fecha instanceof Date ? form.fecha.toISOString() : form.fecha;

    // Normalizamos items
    const itemsPayload = items
      .filter((it) => Number(it.producto_id) > 0 && Number(it.cantidad) > 0)
      .map((it) => ({
        producto_id: Number(it.producto_id),
        cantidad: Number(it.cantidad),
        precio_unit:
          it.precio_unit === '' || it.precio_unit === null
            ? 0
            : Number(it.precio_unit)
      }));

    try {
      setSaving(true);
      await onSubmit({
        // Cabecera de venta
        venta: {
          cliente_id: Number(form.cliente_id),
          vendedor_id: Number(form.vendedor_id),
          fecha: fechaPayload,
          tipo: form.tipo,
          observaciones: form.observaciones?.trim() || null
        },
        // Detalle
        items: itemsPayload
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // ---------- Render ----------
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
            className="relative w-full max-w-[92vw] sm:max-w-2xl md:max-w-4xl
                       max-h-[90vh] overflow-y-auto overscroll-contain
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
                Nueva Venta
              </motion.h3>

              <motion.form
                onSubmit={submit}
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="space-y-5 sm:space-y-6"
              >
                {/* Fecha (solo lectura) */}
                <motion.div variants={fieldV}>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Fecha
                  </label>
                  <input
                    value={fechaLabel}
                    readOnly
                    disabled
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-3.5 py-3 text-gray-200
                               cursor-not-allowed"
                  />
                  <p className="mt-1 text-[11px] text-gray-300/70">
                    La fecha se toma automáticamente (no editable).
                  </p>
                </motion.div>

                {/* Ciudad + Cliente + Vendedor */}
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
                    <p className="mt-1 text-[11px] text-gray-300/70">
                      Usamos la ciudad para filtrar los clientes (ej. Monteros).
                    </p>
                  </motion.div>

                  {/* Cliente (SearchableSelect) */}
                  <motion.div variants={fieldV} className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Cliente <span className="text-cyan-300">*</span>
                    </label>
                    <SearchableSelect
                      items={clientes}
                      value={form.cliente_id}
                      onChange={handleClienteChange}
                      getOptionLabel={(c) =>
                        c ? `${c.nombre} (${c.documento || 's/ doc'})` : ''
                      }
                      getOptionValue={(c) => c.id}
                    />

                    {selectedCliente && (
                      <p className="mt-1 text-[11px] text-gray-300/80">
                        {selectedCliente.direccion_calle
                          ? `Dirección: ${selectedCliente.direccion_calle} ${
                              selectedCliente.direccion_numero || ''
                            } - ${selectedCliente.barrio?.nombre || ''}`
                          : ''}
                      </p>
                    )}
                  </motion.div>
                </div>

                {/* Vendedor asociado (solo lectura, desde cliente) */}
                <motion.div variants={fieldV}>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Vendedor asignado
                  </label>
                  <input
                    value={vendedorLabel || 'Sin vendedor asociado al cliente…'}
                    readOnly
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-gray-200
                               placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-transparent"
                    placeholder="Sin vendedor asociado"
                  />
                  {/* <p className="mt-1 text-[11px] text-gray-300/70">
                    Se toma automáticamente del campo{' '}
                    <span className="font-semibold">
                      vendedor_preferido del cliente
                    </span>
                    .
                  </p> */}
                </motion.div>

                {/* Tipo de venta */}
                <motion.div variants={fieldV}>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Tipo de venta
                  </label>
                  <div className="inline-flex rounded-xl bg-white/5 border border-white/10 p-1">
                    {[
                      { key: 'contado', label: 'Contado' },
                      { key: 'fiado', label: 'Fiado' },
                      { key: 'a_cuenta', label: 'A cuenta' }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleTipo(opt.key)}
                        className={`px-3.5 py-1.5 text-sm rounded-lg transition
                          ${
                            form.tipo === opt.key
                              ? 'bg-cyan-500 text-white shadow'
                              : 'text-gray-200 hover:bg-white/10'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Observaciones */}
                <motion.div variants={fieldV}>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    name="observaciones"
                    value={form.observaciones}
                    onChange={handleObservaciones}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    placeholder="Notas internas de la operación (opcional)"
                  />
                </motion.div>

                {/* Detalle de productos */}
                <motion.div variants={fieldV} className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-200">
                      Productos de la venta
                    </span>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm
                                 bg-emerald-500/80 hover:bg-emerald-500 text-white font-medium transition"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar ítem
                    </button>
                  </div>

                  <div className="space-y-2">
                    {items.map((it, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3
                                   items-center bg-white/5 rounded-xl border border-white/10 p-3"
                      >
                        {/* Producto */}

                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium text-gray-200 mb-2">
                            Producto <span className="text-cyan-300">*</span>
                          </label>
                          <SearchableSelect
                            label=""
                            items={productos}
                            value={it.producto_id}
                            onChange={(prod) =>
                              handleProductoChange(index, prod)
                            }
                            placeholder="Producto…"
                            getOptionLabel={(p) =>
                              p
                                ? `${p.nombre} ${
                                    p.codigo_sku ? `(${p.codigo_sku})` : ''
                                  }`
                                : ''
                            }
                            getOptionValue={(p) => p?.id}
                            getOptionSearchText={(p) =>
                              [
                                p?.nombre || '',
                                p?.codigo_sku || '',
                                p?.barra_ean13 || ''
                              ].join(' ')
                            }
                          />
                        </div>

                        {/* Cantidad */}
                        <div>
                          <label className="block text-[11px] font-medium text-gray-300 mb-1">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={it.cantidad}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                'cantidad',
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-white
                                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent text-sm"
                            placeholder="0"
                          />
                        </div>

                        {/* Precio unitario */}
                        <div>
                          <label className="block text-[11px] font-medium text-gray-300 mb-1">
                            Precio unitario ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.precio_unit}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                'precio_unit',
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-white
                                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent text-sm"
                            placeholder="0.00"
                          />
                        </div>

                        {/* Botón eliminar */}
                        <div className="flex justify-end items-center">
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            disabled={items.length === 1}
                            className="inline-flex items-center justify-center rounded-full p-2
                                       border border-red-500/60 text-red-400 hover:bg-red-500/10
                                       disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-end pt-2">
                    <div className="text-right">
                      <p className="text-xs text-gray-300/80">Total estimado</p>
                      <p className="text-lg font-semibold text-emerald-300">
                        $ {totalLabel}
                      </p>
                    </div>
                  </div>
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
                    {saving ? 'Guardando…' : 'Confirmar venta'}
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
