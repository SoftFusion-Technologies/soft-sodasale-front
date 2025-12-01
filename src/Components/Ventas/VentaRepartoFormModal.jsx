// FILE: src/Components/Ventas/VentaRepartoFormModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingCart,
  CalendarDays,
  BadgeDollarSign,
  Truck,
  Trash2
} from 'lucide-react';

import {
  backdropV,
  panelV,
  formContainerV,
  fieldV
} from '../../ui/animHelpers';

import { useAuth } from '../../AuthContext';
import { listRepartos } from '../../api/repartos';
import { listClientesDeReparto } from '../../api/repartosClientes';
import { listProductos } from '../../api/productos';
import { listVendedores } from '../../api/vendedores';
import { createVentasRepartoMasiva } from '../../api/ventas';

import { showErrorSwal, showWarnSwal, showSuccessSwal } from '../../ui/swal';

function todayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Saca precio de venta desde el producto
function getPrecioVenta(prod) {
  if (!prod) return 0;
  if (prod.precio_venta != null) return Number(prod.precio_venta) || 0;
  if (prod.pre_prod != null) return Number(prod.pre_prod) || 0;
  return 0;
}

export default function VentaRepartoFormModal({
  open,
  onClose,
  onCreated, // callback al terminar
  initialReparto // opcional: reparto preseleccionado
}) {
  const { user } = useAuth?.() || {};

  const [saving, setSaving] = useState(false);

  // Repartos
  const [repartos, setRepartos] = useState([]);
  const [repartoId, setRepartoId] = useState(initialReparto?.id || '');
  const repartoSelected = useMemo(
    () =>
      repartos.find((r) => Number(r.id) === Number(repartoId)) ||
      initialReparto ||
      null,
    [repartos, repartoId, initialReparto]
  );

  // Clientes del reparto
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);

  // Clientes excluidos SOLO en este modal (no persiste)
  const [clientesExcluidos, setClientesExcluidos] = useState([]);

  const clientesVisibles = useMemo(
    () =>
      (clientes || []).filter((c) => !clientesExcluidos.includes(Number(c.id))),
    [clientes, clientesExcluidos]
  );

  const [aCuentaPorCliente, setACuentaPorCliente] = useState({});

  const handleACuentaChange = (clienteId, rawValue) => {
    const str = String(rawValue ?? '').replace(',', '.');
    const num = Number(str);

    setACuentaPorCliente((prev) => ({
      ...prev,
      [clienteId]: Number.isFinite(num) && num >= 0 ? num : 0
    }));
  };

  const handleOcultarCliente = (clienteId) => {
    const idNum = Number(clienteId);
    setClientesExcluidos((prev) =>
      prev.includes(idNum) ? prev : [...prev, idNum]
    );
  };

  useEffect(() => {
    if (!open) return;
    setClientesExcluidos([]);
  }, [open, repartoId]);

  // Productos
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);

  // Vendedores
  const [vendedores, setVendedores] = useState([]);
  const [loadingVendedores, setLoadingVendedores] = useState(false);
  const [vendedorId, setVendedorId] = useState(user?.id || ''); // id seleccionado

  // Datos generales de la venta
  const [fecha, setFecha] = useState(todayISODate());
  const [tipoVenta, setTipoVenta] = useState('fiado'); // contado | fiado | a_cuenta
  const [observaciones, setObservaciones] = useState('');

  // Cantidades por cliente-producto: { `${clienteId}-${productoId}`: number }
  const [cantidades, setCantidades] = useState({});

  // Reseteo general al abrir/cerrar
  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setFecha(todayISODate());
    setTipoVenta('fiado');
    setObservaciones('');
    setCantidades({});
    setVendedorId(user?.id || ''); //  default = usuario logueado
  }, [open, user]);

  // Cargar repartos cuando se abre
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const resp = await listRepartos({
          estado: 'activo',
          page: 1,
          limit: 300,
          orderBy: 'nombre',
          orderDir: 'ASC'
        });
        const data = Array.isArray(resp) ? resp : resp?.data || [];
        setRepartos(data);
        if (!repartoId && initialReparto?.id) {
          setRepartoId(initialReparto.id);
        }
      } catch (err) {
        console.error('Error cargando repartos:', err);
        setRepartos([]);
        await showErrorSwal({
          title: 'Error',
          text: 'No se pudieron cargar los repartos.'
        });
      }
    })();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar clientes del reparto
  useEffect(() => {
    if (!open) return;
    if (!repartoSelected?.id) {
      setClientes([]);
      return;
    }
    (async () => {
      setLoadingClientes(true);
      try {
        const resp = await listClientesDeReparto(repartoSelected.id, {
          page: 1,
          limit: 500
        });
        const rows = resp?.data || resp || [];
        const cli = rows.map((rc) => rc.cliente || rc);
        setClientes(cli);
      } catch (err) {
        console.error('Error cargando clientes de reparto:', err);
        setClientes([]);
        await showErrorSwal({
          title: 'Error',
          text: 'No se pudieron cargar los clientes del reparto.'
        });
      } finally {
        setLoadingClientes(false);
      }
    })();
  }, [open, repartoSelected?.id]);

  // Cargar productos
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingProductos(true);
      try {
        const resp = await listProductos({
          estado: 'activo',
          page: 1,
          limit: 200,
          orderBy: 'nombre',
          orderDir: 'ASC'
        });
        const data = Array.isArray(resp) ? resp : resp?.data || [];
        setProductos(data);
      } catch (err) {
        console.error('Error cargando productos:', err);
        setProductos([]);
        await showErrorSwal({
          title: 'Error',
          text: 'No se pudieron cargar los productos.'
        });
      } finally {
        setLoadingProductos(false);
      }
    })();
  }, [open]);

  // Cargar vendedores
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingVendedores(true);
      try {
        const resp = await listVendedores({
          estado: 'activo',
          page: 1,
          limit: 300,
          orderBy: 'nombre',
          orderDir: 'ASC'
        });
        let data = Array.isArray(resp) ? resp : resp?.data || [];

        // Aseguramos que el user actual esté en la lista si viene de otro lado
        if (user?.id && !data.some((v) => Number(v.id) === Number(user.id))) {
          data = [
            {
              id: user.id,
              nombre: user.nombre || user.name || 'Usuario actual',
              email: user.email,
              estado: 'activo'
            },
            ...data
          ];
        }
        setVendedores(data);
      } catch (err) {
        console.error('Error cargando vendedores:', err);
        setVendedores([]);
        await showErrorSwal({
          title: 'Error',
          text: 'No se pudieron cargar los vendedores.'
        });
      } finally {
        setLoadingVendedores(false);
      }
    })();
  }, [open, user]);

  const handleClose = () => {
    if (saving) return;
    onClose?.();
  };

  const handleCantidadChange = (clienteId, productoId, value) => {
    const num = Number(value);
    const clean = !Number.isFinite(num) || num < 0 ? '' : num;
    const key = `${clienteId}-${productoId}`;
    setCantidades((prev) => ({
      ...prev,
      [key]: clean
    }));
  };

  // Subtotales por cliente y total general
  const subtotalesPorCliente = useMemo(() => {
    const map = {};
    for (const cli of clientesVisibles || []) {
      let subtotal = 0;
      for (const prod of productos || []) {
        const key = `${cli.id}-${prod.id}`;
        const cant = Number(cantidades[key] || 0);
        if (!cant || cant <= 0) continue;
        const precio = getPrecioVenta(prod);
        subtotal += cant * precio;
      }
      map[cli.id] = Number(subtotal.toFixed(2));
    }
    return map;
  }, [clientesVisibles, productos, cantidades]);

  const totalGeneral = useMemo(
    () =>
      Object.values(subtotalesPorCliente).reduce(
        (acc, v) => acc + (Number(v) || 0),
        0
      ),
    [subtotalesPorCliente]
  );

  const totalGeneralConACuenta = useMemo(() => {
    return (clientesVisibles || []).reduce((acc, cli) => {
      const subtotalCli = subtotalesPorCliente[cli.id] ?? 0;
      const aCuentaCli = Number(aCuentaPorCliente[cli.id] ?? 0);
      const saldoCli = Math.max(0, subtotalCli - aCuentaCli);
      return acc + saldoCli;
    }, 0);
  }, [clientesVisibles, subtotalesPorCliente, aCuentaPorCliente]);

  const ciudadNombre =
    repartoSelected?.ciudad?.nombre || repartoSelected?.ciudad_nombre || '—';

  const tipoVentaLabel = {
    contado: 'Contado',
    fiado: 'Fiado',
    a_cuenta: 'A cuenta'
  }[tipoVenta];

  const vendedorSeleccionado =
    vendedores.find((v) => Number(v.id) === Number(vendedorId)) || null;

  const vendedorNombreUI =
    vendedorSeleccionado?.nombre ||
    user?.nombre ||
    user?.name ||
    'Seleccioná un vendedor';

  // Construir payload y enviar
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!repartoSelected?.id) {
      return showWarnSwal({
        title: 'Falta reparto',
        text: 'Seleccioná un reparto para continuar.'
      });
    }

    const vendedorIdNum = Number(vendedorId);
    if (!Number.isFinite(vendedorIdNum) || vendedorIdNum <= 0) {
      return showWarnSwal({
        title: 'Vendedor requerido',
        text: 'Seleccioná un vendedor para registrar las ventas.'
      });
    }

    // Armamos items por cliente con al menos una línea
    const items = [];
    for (const cli of clientesVisibles || []) {
      const lineas = [];
      for (const prod of productos || []) {
        const key = `${cli.id}-${prod.id}`;
        const cant = Number(cantidades[key] || 0);
        if (!cant || cant <= 0) continue;
        const precio_unit = getPrecioVenta(prod);
        lineas.push({
          producto_id: prod.id,
          cantidad: cant,
          precio_unit
        });
      }

      if (lineas.length > 0) {
        const aCuentaRaw = Number(aCuentaPorCliente[cli.id] ?? 0);
        const monto_a_cuenta =
          Number.isFinite(aCuentaRaw) && aCuentaRaw > 0 ? aCuentaRaw : 0;

        items.push({
          cliente_id: cli.id,
          monto_a_cuenta, //  NUEVO: se manda al backend
          lineas
        });
      }
    }

    if (!items.length) {
      return showWarnSwal({
        title: 'Sin productos',
        text: 'No cargaste cantidades para ningún cliente.'
      });
    }

    const payload = {
      reparto_id: repartoSelected.id,
      fecha: `${fecha}T00:00:00`,
      tipo: tipoVenta, // contado | fiado | a_cuenta (para este caso, "fiado")
      vendedor_id: vendedorIdNum,
      observaciones: observaciones?.trim() || null,
      items
    };

    console.log(
      '[REPARTO-MASIVA] Payload enviado:',
      JSON.stringify(payload, null, 2)
    );

    try {
      setSaving(true);
      const resp = await createVentasRepartoMasiva(payload);
      await showSuccessSwal({
        title: 'Ventas creadas',
        text:
          resp?.mensaje ||
          `Se generaron las ventas para ${items.length} cliente(s) del reparto.`
      });
      onCreated?.(resp);
      onClose?.();
    } catch (err) {
      console.error('Error creando ventas por reparto:', err);
      const { mensajeError, tips } = err || {};
      await showErrorSwal({
        title: 'No se pudieron crear las ventas',
        text: mensajeError || 'Ocurrió un error al guardar las ventas.',
        tips
      });
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
            onClick={handleClose}
          />
          <motion.div
            variants={panelV}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-[96vw] sm:max-w-5xl max-h-[92vh]
                       overflow-y-auto overscroll-contain rounded-3xl border border-teal-300/40
                       bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-teal-950/90
                       shadow-[0_0_45px_rgba(45,212,191,0.45)]"
          >
            {/* Botón cerrar */}
            <button
              onClick={handleClose}
              disabled={saving}
              className="sticky top-2.5 ml-auto mr-2.5 z-50 inline-flex h-9 w-9 items-center justify-center rounded-xl
                         bg-white/5 border border-white/15 hover:bg-white/10 transition disabled:opacity-40"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5 text-teal-50" />
            </button>

            <div className="relative z-10 px-4 pb-5 pt-1 sm:px-6 sm:pb-6 md:px-8">
              {/* Header */}
              <motion.div
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="mb-5 sm:mb-6"
              >
                <motion.h3
                  variants={fieldV}
                  className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-teal-50 flex flex-wrap items-center gap-2"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-500/20 border border-teal-300/40">
                    <ShoppingCart className="h-5 w-5 text-teal-300" />
                  </span>
                  Nueva venta por reparto
                  {repartoSelected?.nombre && (
                    <span className="text-teal-300 truncate">
                      “{repartoSelected.nombre}”
                    </span>
                  )}
                </motion.h3>

                {/* Info superior */}
                <motion.div
                  variants={fieldV}
                  className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs sm:text-sm text-teal-50/90"
                >
                  {/* Reparto select */}
                  <div className="flex flex-col gap-1">
                    <span className="uppercase text-[10px] tracking-widest text-teal-200/80">
                      Reparto
                    </span>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-teal-200 shrink-0" />
                      <select
                        value={repartoId}
                        onChange={(e) => setRepartoId(e.target.value)}
                        className="flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs sm:text-sm text-teal-50
                                   focus:outline-none focus:ring-2 focus:ring-teal-400/60"
                      >
                        <option value="">Seleccionar reparto…</option>
                        {repartos.map((r) => (
                          <option
                            key={r.id}
                            value={r.id}
                            className="text-black"
                          >
                            {r.nombre}{' '}
                            {r.ciudad_nombre ? `(${r.ciudad_nombre})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="text-[11px] text-teal-100/70">
                      Ciudad: {ciudadNombre}
                    </span>
                  </div>

                  {/* Fecha */}
                  <div className="flex flex-col gap-1">
                    <span className="uppercase text-[10px] tracking-widest text-teal-200/80">
                      Fecha de venta
                    </span>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-teal-200 shrink-0" />
                      <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs sm:text-sm text-teal-50
                                   focus:outline-none focus:ring-2 focus:ring-teal-400/60"
                      />
                    </div>
                  </div>

                  {/* Tipo de venta */}
                  <div className="flex flex-col gap-1">
                    <span className="uppercase text-[10px] tracking-widest text-teal-200/80">
                      Tipo de venta
                    </span>
                    <div className="inline-flex rounded-full bg-slate-950/70 border border-teal-500/40 p-1">
                      {[
                        { value: 'contado', label: 'Contado' },
                        { value: 'fiado', label: 'Fiado' },
                        { value: 'a_cuenta', label: 'A cuenta' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTipoVenta(opt.value)}
                          className={`px-3 py-1 text-[11px] rounded-full transition
                            ${
                              tipoVenta === opt.value
                                ? 'bg-teal-500 text-white shadow-sm'
                                : 'text-teal-100'
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] text-teal-100/75">
                      Seleccionado: {tipoVentaLabel}
                    </span>
                  </div>

                  {/* Vendedor + total  */}
                  <div className="flex flex-col gap-1">
                    <span className="uppercase text-[10px] tracking-widest text-teal-200/80">
                      Vendedor / Total estimado
                    </span>
                    <div className="flex items-center gap-2 mb-1">
                      <select
                        value={vendedorId}
                        onChange={(e) => setVendedorId(e.target.value)}
                        className="flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs sm:text-sm text-teal-50
                                   focus:outline-none focus:ring-2 focus:ring-teal-400/60"
                      >
                        <option value="">Seleccionar vendedor…</option>
                        {vendedores.map((v) => (
                          <option
                            key={v.id}
                            value={v.id}
                            className="text-black"
                          >
                            {v.nombre || v.name || v.email}
                          </option>
                        ))}
                      </select>
                      {loadingVendedores && (
                        <div className="h-5 w-5 rounded-full border-2 border-teal-300/60 border-t-transparent animate-spin" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-teal-100/80 truncate">
                        Vendedor:{' '}
                        <span className="font-medium">{vendedorNombreUI}</span>
                      </span>
                      <div className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-400/60 px-2.5 py-1">
                        <BadgeDollarSign className="h-4 w-4 text-emerald-300" />
                        <span className="text-xs font-semibold text-emerald-100">
                          ${totalGeneral.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Observaciones */}
                <motion.div variants={fieldV} className="mt-3">
                  <label className="block text-xs sm:text-sm font-medium text-teal-50 mb-1.5">
                    Observaciones generales
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs sm:text-sm text-teal-50
                               placeholder-teal-100/50 focus:outline-none focus:ring-2 focus:ring-teal-400/60"
                    placeholder="Notas generales de esta vuelta de reparto (opcional)…"
                  />
                </motion.div>
              </motion.div>

              {/* Layout principal: clientes + productos */}
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)]">
                  {/* Columna izquierda: clientes */}
                  <motion.div
                    variants={formContainerV}
                    initial="hidden"
                    animate="visible"
                    className="rounded-2xl border border-teal-500/30 bg-slate-900/70 backdrop-blur-md p-3 sm:p-4 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs uppercase tracking-widest text-teal-200/80">
                          Clientes del reparto
                        </div>
                        <div className="text-sm text-teal-50/90">
                          {clientesVisibles.length} cliente(s)
                        </div>
                      </div>
                      {loadingClientes && (
                        <div className="h-6 w-6 rounded-full border-2 border-teal-300/60 border-t-transparent animate-spin" />
                      )}
                    </div>

                    <div className="flex-1 min-h-[180px] max-h-[340px] overflow-y-auto space-y-2 pr-1">
                      {!clientesVisibles.length && !loadingClientes ? (
                        <div className="text-xs text-teal-100/70 italic">
                          Este reparto no tiene clientes seleccionados para esta
                          vuelta.
                        </div>
                      ) : (
                        clientesVisibles.map((cli) => (
                          <div
                            key={cli.id}
                            className="rounded-xl border border-teal-500/30 bg-slate-950/80 px-3 py-2 text-xs text-teal-50 flex flex-col gap-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-semibold truncate">
                                  {cli.nombre}
                                </div>
                                <div className="text-[11px] text-teal-100/70 truncate">
                                  {cli.documento && `DNI: ${cli.documento} · `}
                                  {cli.barrio?.nombre || '—'}
                                </div>
                              </div>

                              {/* Botón quitar cliente SOLO para esta vuelta */}
                              <button
                                type="button"
                                onClick={() => handleOcultarCliente(cli.id)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg
                       border border-red-500/40 bg-transparent hover:bg-red-500/10
                       text-red-200/80 transition"
                                title="Quitar de esta vuelta"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="text-[11px] text-teal-100/80">
                              Subtotal:{' '}
                              <span className="font-semibold text-emerald-300">
                                ${subtotalesPorCliente[cli.id]?.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>

                  {/* Columna derecha: matriz productos x clientes */}
                  <motion.div
                    variants={formContainerV}
                    initial="hidden"
                    animate="visible"
                    className="rounded-2xl border border-cyan-400/40 bg-slate-900/70 backdrop-blur-md p-3 sm:p-4 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs uppercase tracking-widest text-cyan-200/80">
                          Productos y cantidades
                        </div>
                        <div className="text-[11px] text-cyan-100/80">
                          Cargá las cantidades para cada cliente y producto.
                        </div>
                      </div>
                      {loadingProductos && (
                        <div className="h-6 w-6 rounded-full border-2 border-cyan-300/60 border-t-transparent animate-spin" />
                      )}
                    </div>

                    <div className="flex-1 min-h-[220px] max-h-[380px] overflow-y-auto rounded-xl border border-cyan-400/25 bg-slate-950/70 px-2 py-2">
                      {(!productos.length || !clientesVisibles.length) &&
                      !loadingProductos ? (
                        <div className="py-10 text-center text-xs text-cyan-100/75">
                          Necesitás al menos un cliente visible con productos
                          activos para cargar ventas.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {clientesVisibles.map((cli) => {
                            const subtotalCli =
                              subtotalesPorCliente[cli.id] ?? 0;
                            const aCuentaCli = Number(
                              aCuentaPorCliente[cli.id] ?? 0
                            );
                            const saldoCli = Math.max(
                              0,
                              subtotalCli - aCuentaCli
                            );

                            return (
                              <div
                                key={cli.id}
                                className="rounded-xl border border-cyan-500/35 bg-slate-950/70 px-3 py-2"
                              >
                                {/* Cabecera cliente + montos */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                  <div>
                                    <span className="text-xs sm:text-sm font-semibold text-cyan-50 truncate block">
                                      {cli.nombre}
                                    </span>
                                    <span className="text-[11px] text-cyan-100/80 block">
                                      Subtotal mercadería:{' '}
                                      <span className="font-semibold text-emerald-300">
                                        ${subtotalCli.toFixed(2)}
                                      </span>
                                    </span>
                                  </div>

                                  {/* Campo A cuenta */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-teal-100/80">
                                      A cuenta:
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={aCuentaCli || ''}
                                      onChange={(e) =>
                                        handleACuentaChange(
                                          cli.id,
                                          e.target.value
                                        )
                                      }
                                      className="w-24 rounded-lg border border-teal-400/60 bg-slate-950/90 px-2 py-1 text-[11px] text-teal-50
                       focus:outline-none focus:ring-1 focus:ring-teal-400/80"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>

                                {/* Saldo fiado (subtotal - a cuenta) */}
                                <div className="text-[11px] text-emerald-200 mb-2">
                                  Saldo fiado:{' '}
                                  <span className="font-semibold">
                                    ${saldoCli.toFixed(2)}
                                  </span>
                                </div>

                                {/* Grid de productos */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {productos.map((prod) => {
                                    const key = `${cli.id}-${prod.id}`;
                                    const value = cantidades[key] ?? '';
                                    const precio = getPrecioVenta(prod);
                                    return (
                                      <div
                                        key={prod.id}
                                        className="rounded-lg border border-cyan-400/30 bg-slate-950/80 px-2.5 py-2 flex flex-col gap-1.5"
                                      >
                                        <div className="text-[11px] font-medium text-cyan-50 truncate">
                                          {prod.nombre}
                                        </div>
                                        <div className="text-[11px] text-cyan-100/80">
                                          ${precio.toFixed(2)} c/u
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[11px] text-cyan-100/80">
                                            Cant:
                                          </span>
                                          <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={value}
                                            onChange={(e) =>
                                              handleCantidadChange(
                                                cli.id,
                                                prod.id,
                                                e.target.value
                                              )
                                            }
                                            className="w-20 rounded-lg border border-cyan-400/50 bg-slate-950/90 px-2 py-1 text-[11px] text-cyan-50
                             focus:outline-none focus:ring-1 focus:ring-cyan-400/70"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer mini + botón guardar */}
                    <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
                      <div className="text-xs text-cyan-100/80">
                        Total general (saldo fiado):{' '}
                        <span className="font-semibold text-emerald-300">
                          ${totalGeneralConACuenta.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleClose}
                          disabled={saving}
                          className="px-4 py-2 rounded-xl border border-slate-600 bg-slate-900/70 text-[12px] text-slate-100 hover:bg-slate-800/90 transition disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                                     bg-gradient-to-r from-teal-500 to-cyan-400 text-white text-[13px] font-semibold
                                     hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                          {saving ? 'Guardando…' : 'Crear ventas'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="mt-4 h-[3px] w-full rounded-full bg-gradient-to-r from-teal-400/60 via-cyan-300/70 to-teal-400/60 opacity-70" />
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
