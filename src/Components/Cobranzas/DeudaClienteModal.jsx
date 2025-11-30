// src/Components/Cobranzas/DeudaClienteModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertTriangle, Clock, BadgeDollarSign } from 'lucide-react';
import { FaInstagram, FaGlobe, FaWhatsapp, FaLinkedin } from 'react-icons/fa';

import { getCxcDeudaCliente } from '../../api/cxc';
import { createCobranzaCliente } from '../../api/cobranzasClientes';
import {
  backdropV,
  panelV,
  formContainerV,
  fieldV
} from '../../ui/animHelpers';

import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

function formatMoneyARS(value = 0) {
  return value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  });
}

function formatFecha(fechaISO) {
  if (!fechaISO) return '—';
  const d = new Date(fechaISO);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
}

export default function DeudaClienteModal({
  open,
  onClose,
  clienteId,
  onVerVenta // opcional: callback para abrir el detalle de venta
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null); // { cliente, total_deuda, ventas_pendientes }
  const [error, setError] = useState(null);

  // 👉 estados para COBRAR
  const [cobros, setCobros] = useState({}); // { [ventaId]: monto }
  const [observaciones, setObservaciones] = useState('');
  const [savingCobro, setSavingCobro] = useState(false);

  // Fetch cuando se abre
  useEffect(() => {
    if (!open || !clienteId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const resp = await getCxcDeudaCliente(clienteId);
        if (!cancelled) {
          setData(resp);
          // reset cobros y observaciones cada vez que cargamos la deuda
          setCobros({});
          setObservaciones('');
        }
      } catch (err) {
        console.error('Error cargando deuda cliente:', err);
        if (!cancelled) {
          setError(
            err?.response?.data?.mensajeError ||
              'No se pudo obtener la deuda del cliente.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, clienteId]);

  const ventasPendientes = data?.ventas_pendientes || [];

  const resumen = useMemo(() => {
    if (!ventasPendientes.length) {
      return {
        cantidadVentas: 0,
        maxDiasAtraso: 0,
        totalDeuda: data?.total_deuda || 0
      };
    }

    const cantidadVentas = ventasPendientes.length;
    const maxDiasAtraso = ventasPendientes.reduce(
      (max, v) => Math.max(max, Number(v.dias_atraso || 0)),
      0
    );

    return {
      cantidadVentas,
      maxDiasAtraso,
      totalDeuda: data?.total_deuda || 0
    };
  }, [ventasPendientes, data?.total_deuda]);

  // Total que el usuario decidió cobrar ahora
  const totalCobrarAhora = useMemo(() => {
    if (!ventasPendientes.length) return 0;
    return ventasPendientes.reduce((acc, v) => {
      const val = Number(cobros[v.id] || 0);
      return acc + (Number.isFinite(val) ? val : 0);
    }, 0);
  }, [ventasPendientes, cobros]);

  const saldoPostCobro = useMemo(() => {
    const diff = (resumen.totalDeuda || 0) - totalCobrarAhora;
    return diff > 0 ? diff : 0;
  }, [resumen.totalDeuda, totalCobrarAhora]);

  const handleClose = () => {
    if (loading || savingCobro) return;
    onClose?.();
  };

  const handleChangeCobro = (ventaId, valorStr) => {
    let raw = (valorStr || '').replace(',', '.');
    let n = Number(raw);
    if (!Number.isFinite(n) || n < 0) n = 0;

    const venta = ventasPendientes.find((v) => v.id === ventaId);
    const max = Number(venta?.saldo || 0);
    if (n > max) n = max;

    setCobros((prev) => ({
      ...prev,
      [ventaId]: n
    }));
  };

  const handleCobrarTodo = () => {
    const next = {};
    ventasPendientes.forEach((v) => {
      const saldo = Number(v.saldo || 0);
      if (saldo > 0) {
        next[v.id] = saldo;
      }
    });
    setCobros(next);
  };

  const handleRegistrarCobranza = async () => {
    if (!clienteId) return;
    if (!ventasPendientes.length) return;

    const total = totalCobrarAhora;
    if (!total || total <= 0.009) return;

    // armamos aplicaciones
    const aplicaciones = ventasPendientes
      .map((v) => {
        const monto = Number(cobros[v.id] || 0);
        return {
          venta_id: v.id,
          monto_aplicado: Number.isFinite(monto) ? monto : 0
        };
      })
      .filter((a) => a.monto_aplicado > 0);

    if (!aplicaciones.length) return;

    const payload = {
      cliente_id: clienteId,
      vendedor_id: null, // luego podés enchufar user logueado
      fecha: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      total_cobrado: Number(total.toFixed(2)),
      observaciones: observaciones?.trim() || null,
      aplicaciones
    };

    const clienteNombre = data?.cliente?.nombre || 'el cliente seleccionado';
    const totalFmt = formatMoneyARS(total);
    const cantVentas = aplicaciones.length;

    // 🔹 1) SweetAlert de confirmación
    const result = await Swal.fire({
      title: 'Confirmar cobranza',
      html: `
      <div style="text-align:left; font-size: 13px;">
        <p>Vas a registrar una cobranza para <b>${clienteNombre}</b>.</p>
        <p>Monto a cobrar: <b>${totalFmt}</b></p>
        <p>Aplicada en <b>${cantVentas}</b> venta(s) fiado.</p>
        ${
          observaciones?.trim()
            ? `<p>Observaciones:<br/><i>${observaciones
                .trim()
                .replace(/</g, '&lt;')}</i></p>`
            : ''
        }
      </div>
    `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar cobranza',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      focusCancel: true
    });

    if (!result.isConfirmed) {
      return; // usuario canceló
    }

    try {
      setSavingCobro(true);
      setError(null);

      // 🔹 2) Registrar en backend
      const resp = await createCobranzaCliente(payload);

      // 🔹 3) Recargar la deuda del cliente
      const nuevaDeuda = await getCxcDeudaCliente(clienteId);
      setData(nuevaDeuda);
      setCobros({});
      setObservaciones('');

      const saldoRestante = Number(nuevaDeuda?.total_deuda || 0);
      const saldoFmt = formatMoneyARS(saldoRestante);

      // 🔹 4) SweetAlert de éxito
      await Swal.fire({
        title: 'Cobranza registrada',
        icon: 'success',
        html: `
        <div style="text-align:left; font-size: 13px;">
          <p>Se registró correctamente la cobranza ${
            resp?.id ? `<b>#${resp.id}</b>` : ''
          } para <b>${clienteNombre}</b>.</p>
          <p>Monto cobrado: <b>${totalFmt}</b></p>
          <p>Saldo restante del cliente: <b>${saldoFmt}</b></p>
        </div>
      `,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#10b981'
      });
    } catch (err) {
      console.error('Error registrando cobranza:', err);
      const msg =
        err?.response?.data?.mensajeError ||
        'No se pudo registrar la cobranza.';

      setError(msg);

      // 🔹 SweetAlert de error
      await Swal.fire({
        title: 'Error al registrar la cobranza',
        icon: 'error',
        text: msg,
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSavingCobro(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4"
          variants={backdropV}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            variants={panelV}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-[94vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh]
                       overflow-hidden rounded-3xl border border-emerald-300/30
                       bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-emerald-950/90
                       shadow-[0_0_40px_rgba(16,185,129,0.55)]"
          >
            {/* Cerrar */}
            <button
              onClick={handleClose}
              disabled={loading || savingCobro}
              className="absolute top-3 right-3 z-50 inline-flex h-9 w-9 items-center justify-center rounded-xl
                         bg-white/5 border border-white/15 hover:bg-white/10 transition disabled:opacity-40"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5 text-emerald-50" />
            </button>

            <div className="relative z-10 p-4 sm:p-6 md:p-8">
              {/* Header */}
              <motion.div
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="mb-4 sm:mb-6"
              >
                <motion.div
                  variants={fieldV}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/50 mb-2">
                      <AlertTriangle className="h-4 w-4 text-emerald-300" />
                      <span className="text-[11px] font-semibold text-emerald-100 tracking-wide uppercase">
                        Cliente con deuda
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-emerald-50">
                      {data?.cliente?.nombre || 'Cliente'}
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
                      DNI/CUIT:{' '}
                      <span className="font-medium">
                        {data?.cliente?.documento || '—'}
                      </span>
                      {data?.cliente?.telefono && (
                        <>
                          {' · Tel: '}
                          <span className="font-medium">
                            {data.cliente.telefono}
                          </span>
                        </>
                      )}
                    </p>
                    {data?.cliente?.email && (
                      <p className="text-xs sm:text-sm text-emerald-100/80">
                        Email:{' '}
                        <span className="font-medium">
                          {data.cliente.email}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Total deuda grande */}
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[11px] uppercase tracking-widest text-emerald-200/70">
                      Deuda total
                    </span>
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-300/60 px-3.5 py-2.5 shadow-lg">
                      <BadgeDollarSign className="h-6 w-6 text-emerald-200" />
                      <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-50">
                        {formatMoneyARS(resumen.totalDeuda)}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-100/80">
                      {resumen.cantidadVentas} venta(s) pendientes
                    </span>
                  </div>
                </motion.div>

                {/* KPIs mini */}
                <motion.div
                  variants={fieldV}
                  className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm"
                >
                  <div className="rounded-2xl border border-emerald-500/40 bg-slate-950/70 px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-300" />
                      <span className="text-emerald-100/85">
                        Venta más vieja
                      </span>
                    </div>
                    <span className="font-semibold text-emerald-50">
                      {ventasPendientes.length
                        ? formatFecha(
                            ventasPendientes[ventasPendientes.length - 1]?.fecha
                          )
                        : '—'}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/40 bg-slate-950/70 px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-300" />
                      <span className="text-emerald-100/85">
                        Máx. días de atraso
                      </span>
                    </div>
                    <span className="font-semibold text-emerald-50">
                      {resumen.maxDiasAtraso} día(s)
                    </span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Contenido principal */}
              <motion.div
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {/* Mensajes de estado */}
                {loading && (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-8 w-8 rounded-full border-2 border-emerald-300/70 border-t-transparent animate-spin" />
                  </div>
                )}

                {error && !loading && (
                  <div className="rounded-2xl border border-red-500/60 bg-red-500/10 px-3 py-2.5 text-xs sm:text-sm text-red-100">
                    {error}
                  </div>
                )}

                {!loading && !error && !ventasPendientes.length && (
                  <div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/10 px-3 py-3 text-xs sm:text-sm text-emerald-50 text-center">
                    Este cliente no tiene ventas pendientes. 👌
                  </div>
                )}

                {/* Tabla de ventas pendientes */}
                {!loading && !error && ventasPendientes.length > 0 && (
                  <motion.div variants={fieldV}>
                    <h4 className="text-sm sm:text-base font-semibold text-emerald-50 mb-2 flex items-center justify-between gap-2">
                      <span>Detalle de ventas fiadas pendientes</span>
                      <button
                        type="button"
                        onClick={handleCobrarTodo}
                        className="text-[11px] sm:text-xs px-3 py-1 rounded-full border border-emerald-400/60
                                   text-emerald-50 bg-slate-950/70 hover:bg-emerald-500/15 transition"
                      >
                        Cobrar todo
                      </button>
                    </h4>
                    <div className="rounded-2xl border border-emerald-400/40 bg-slate-950/70 overflow-hidden">
                      <div className="max-h-[38vh] overflow-y-auto">
                        <table className="min-w-full text-xs sm:text-sm">
                          <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm">
                            <tr className="text-emerald-100/80">
                              <th className="px-3 py-2 text-left font-medium">
                                Venta
                              </th>
                              <th className="px-3 py-2 text-left font-medium">
                                Fecha
                              </th>
                              <th className="px-3 py-2 text-right font-medium">
                                Total
                              </th>
                              <th className="px-3 py-2 text-right font-medium">
                                Cobrado
                              </th>
                              <th className="px-3 py-2 text-right font-medium">
                                Saldo
                              </th>
                              <th className="px-3 py-2 text-right font-medium">
                                Cobrar ahora
                              </th>
                              <th className="px-3 py-2 text-center font-medium">
                                Atraso
                              </th>
                              <th className="px-3 py-2 text-center font-medium">
                                Acción
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {ventasPendientes.map((v) => (
                              <tr
                                key={v.id}
                                className="border-t border-emerald-500/15 hover:bg-emerald-500/5 transition"
                              >
                                <td className="px-3 py-2 whitespace-nowrap text-emerald-50">
                                  #{v.id}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-emerald-100/90">
                                  {formatFecha(v.fecha)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-emerald-50">
                                  {formatMoneyARS(v.total_venta || 0)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-emerald-100/85">
                                  {formatMoneyARS(v.cobrado || 0)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-emerald-50 font-semibold">
                                  {formatMoneyARS(v.saldo || 0)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      cobros[v.id] === undefined
                                        ? ''
                                        : cobros[v.id]
                                    }
                                    onChange={(e) =>
                                      handleChangeCobro(v.id, e.target.value)
                                    }
                                    className="w-24 rounded-lg bg-slate-900/80 border border-emerald-500/40 px-2 py-1
                                               text-right text-emerald-50 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400/70"
                                  />
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center text-emerald-100/85">
                                  {v.dias_atraso} día(s)
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                  <button
                                    type="button"
                                    onClick={() => onVerVenta?.(v.id)}
                                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-[11px] sm:text-xs
                                               bg-emerald-500/80 hover:bg-emerald-400 text-slate-950 font-semibold transition"
                                  >
                                    Ver venta
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Resumen de cobro + observaciones */}
                {!loading && !error && ventasPendientes.length > 0 && (
                  <motion.div variants={fieldV} className="space-y-3 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-[11px] text-emerald-100/80 uppercase tracking-wide">
                          Monto a cobrar ahora
                        </p>
                        <p className="text-lg sm:text-xl font-bold text-emerald-50">
                          {formatMoneyARS(totalCobrarAhora)}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[11px] text-emerald-100/70">
                          Saldo estimado luego del cobro
                        </p>
                        <p className="text-sm font-semibold text-emerald-100">
                          {formatMoneyARS(saldoPostCobro)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] sm:text-xs text-emerald-100/80 mb-1">
                        Observaciones del cobro (opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        className="w-full rounded-2xl bg-slate-950/70 border border-emerald-500/40 px-3 py-2 text-xs sm:text-sm
                                   text-emerald-50 resize-y focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                        placeholder="Ej: Cobro en efectivo en reparto 2, saldo parcial de ventas #7 y #11..."
                      />
                    </div>
                  </motion.div>
                )}

                {/* Footer acciones + redes SoftFusion */}
                <motion.div
                  variants={fieldV}
                  className="mt-4 flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-row gap-2">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading || savingCobro}
                        className="px-4 py-2 rounded-xl border border-emerald-400/50 text-emerald-50 text-sm
                                   bg-slate-950/70 hover:bg-slate-900 transition disabled:opacity-50"
                      >
                        Cerrar
                      </button>

                      {ventasPendientes.length > 0 && (
                        <button
                          type="button"
                          onClick={handleRegistrarCobranza}
                          disabled={
                            savingCobro || loading || totalCobrarAhora <= 0
                          }
                          className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-sm font-semibold
                                     hover:bg-emerald-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {savingCobro
                            ? 'Registrando cobranza…'
                            : 'Registrar cobranza'}
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] sm:text-xs text-emerald-100/80 text-right">
                      Recordá registrar las cobranzas para mantener actualizada
                      la cuenta corriente del cliente.
                    </p>
                  </div>

                  {/* Redes SoftFusion */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-3">
                    <a
                      href="https://www.instagram.com/softfusiontechnologies/"
                      target="_blank"
                      rel="noreferrer"
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-white/5 border border-white/20
                                 hover:bg-white/15 hover:scale-105 transition"
                      title="Instagram SoftFusion"
                    >
                      <FaInstagram className="text-lg text-emerald-100" />
                    </a>
                    <a
                      href="https://softfusion.com.ar/"
                      target="_blank"
                      rel="noreferrer"
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-white/5 border border-white/20
                                 hover:bg-white/15 hover:scale-105 transition"
                      title="Web SoftFusion"
                    >
                      <FaGlobe className="text-lg text-emerald-100" />
                    </a>
                    <a
                      href="https://wa.me/5493815430503"
                      target="_blank"
                      rel="noreferrer"
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-white/5 border border-white/20
                                 hover:bg-white/15 hover:scale-105 transition"
                      title="WhatsApp SoftFusion"
                    >
                      <FaWhatsapp className="text-lg text-emerald-100" />
                    </a>
                    <a
                      href="https://www.linkedin.com/in/soft-fusionsa/"
                      target="_blank"
                      rel="noreferrer"
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-white/5 border border-white/20
                                 hover:bg-white/15 hover:scale-105 transition"
                      title="LinkedIn SoftFusion"
                    >
                      <FaLinkedin className="text-lg text-emerald-100" />
                    </a>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
