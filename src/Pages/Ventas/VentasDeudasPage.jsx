// ===============================
// FILE: src/Pages/Ventas/VentasDeudasPage.jsx
// ===============================
/*
 * Programador: Benjamin Orellana
 * Fecha: 14 / 11 / 2025
 * Versión: 1.2
 *
 * Descripción:
 *  Gestión de Deudas (ventas tipo 'fiado' o 'a_cuenta'):
 *  - Filtros por texto (cliente), vendedor, tipo, estado, fechas
 *  - Filtros geográficos (ciudad, localidad, barrio) según el cliente
 *  - Listado de ventas con badge de tipo/estado
 *  - KPIs arriba: total adeudado, cantidad de ventas, ticket promedio
 */

import React, { useEffect, useMemo, useState } from 'react';
import NavbarStaff from '../Dash/NavbarStaff';
import '../../Styles/staff/dashboard.css';
import '../../Styles/staff/background.css';
import { useAuth } from '../../AuthContext';
import ParticlesBackground from '../../Components/ParticlesBackground';
import { motion } from 'framer-motion';
import ButtonBack from '../../Components/ButtonBack';
import { FaUser, FaUserTie, FaSearch, FaFilter } from 'react-icons/fa';

import { listVentas } from '../../api/ventas';
import { listVendedores } from '../../api/vendedores';
import { listCiudades } from '../../api/ciudades';
import { listLocalidades } from '../../api/localidades';
import { listBarrios } from '../../api/barrios';
import SearchableSelect from '../../Components/Common/SearchableSelect';
import { moneyAR } from '../../utils/money';

// Util formatear fecha
const fmtFecha = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Badges compartidos
const badgeTipoClasses = {
  contado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  fiado: 'bg-amber-50 text-amber-700 border-amber-200',
  a_cuenta: 'bg-cyan-50 text-cyan-700 border-cyan-200'
};

const badgeEstadoClasses = {
  confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  anulada: 'bg-rose-50 text-rose-700 border-rose-200'
};

const VentasDeudasPage = () => {
  const { userLevel } = useAuth(); // por si después limitás acceso

  // --------- Filtros ---------
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('fiado'); // 'fiado' | 'a_cuenta'
  const [estado, setEstado] = useState('confirmada'); // normalmente deudas = confirmada

  // ❗ AHORA guardamos IDs numéricos, no objetos
  const [vendedorId, setVendedorId] = useState(null);
  const [ciudadId, setCiudadId] = useState(null);
  const [localidadId, setLocalidadId] = useState(null);
  const [barrioId, setBarrioId] = useState(null);

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const [error, setError] = useState('');

  // Listas para selects
  const [vendedores, setVendedores] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [barrios, setBarrios] = useState([]);

  // Datos
  const [ventas, setVentas] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasPrev: false,
    hasNext: false
  });
  const [loading, setLoading] = useState(false);

  // --------- Carga inicial de vendedores ---------
  useEffect(() => {
    (async () => {
      try {
        const res = await listVendedores({ estado: 'activo', limit: 200 });
        const arr = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        setVendedores(arr);
      } catch (err) {
        console.error('Error cargando vendedores:', err);
      }
    })();
  }, []);

  // Ciudades
  useEffect(() => {
    (async () => {
      try {
        const res = await listCiudades({ estado: 'activa', limit: 200 });
        const arr = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        setCiudades(arr);
      } catch (err) {
        console.error('Error cargando ciudades:', err);
      }
    })();
  }, []);

  // Localidades cuando cambia ciudadId
  useEffect(() => {
    if (!ciudadId) {
      setLocalidades([]);
      setLocalidadId(null);
      setBarrios([]);
      setBarrioId(null);
      return;
    }
    (async () => {
      try {
        const res = await listLocalidades({
          ciudad_id: ciudadId,
          estado: 'activa',
          limit: 200
        });
        const arr = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        setLocalidades(arr);
        setLocalidadId(null);
        setBarrios([]);
        setBarrioId(null);
      } catch (err) {
        console.error('Error cargando localidades:', err);
      }
    })();
  }, [ciudadId]);

  // Barrios cuando cambia localidadId
  useEffect(() => {
    if (!localidadId) {
      setBarrios([]);
      setBarrioId(null);
      return;
    }
    (async () => {
      try {
        const res = await listBarrios({
          localidad_id: localidadId,
          estado: 'activa',
          limit: 300
        });
        const arr = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        setBarrios(arr);
        setBarrioId(null);
      } catch (err) {
        console.error('Error cargando barrios:', err);
      }
    })();
  }, [localidadId]);

  // --------- Fetch ventas (deudas) ---------
  const fetchVentas = async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const params = {
        q: q || undefined,
        tipo: tipo || undefined, // fiado / a_cuenta
        estado: estado || undefined, // confirmada / anulada
        vendedor_id: vendedorId || undefined,
        desde: fechaDesde || undefined,
        hasta: fechaHasta || undefined,
        // Geografía
        ciudad_id: ciudadId || undefined,
        localidad_id: localidadId || undefined,
        barrio_id: barrioId || undefined,
        page,
        limit: 20
      };

      console.log('Params de búsqueda (deudas):', params);

      const res = await listVentas(params);
      const rows = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      const metaRes = res?.meta || {};

      setVentas(rows);
      setMeta({
        total: metaRes.total ?? rows.length,
        page: metaRes.page ?? page,
        limit: metaRes.limit ?? 20,
        totalPages: metaRes.totalPages ?? 1,
        hasPrev: metaRes.hasPrev ?? page > 1,
        hasNext:
          metaRes.hasNext ??
          (metaRes.total ? page * (metaRes.limit ?? 20) < metaRes.total : false)
      });
    } catch (err) {
      console.error('Error listando ventas:', err);
      setError('No se pudieron cargar las ventas.');
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchVentas(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuscar = () => {
    fetchVentas(1);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > meta.totalPages) return;
    fetchVentas(nextPage);
  };

  // --------- KPIs calculados en front ---------
  const kpis = useMemo(() => {
    if (!ventas || ventas.length === 0) {
      return {
        totalDeudas: 0,
        cantidad: 0,
        ticketPromedio: 0
      };
    }
    const totalDeudas = ventas.reduce(
      (acc, v) => acc + Number(v.total_neto || 0),
      0
    );
    const cantidad = ventas.length;
    const ticketPromedio = cantidad > 0 ? totalDeudas / cantidad : 0;
    return { totalDeudas, cantidad, ticketPromedio };
  }, [ventas]);

  return (
    <>
      <NavbarStaff />
      <section className="relative w-full min-h-screen bg-white">
        {/* Fondo tipo ventas / caja */}
        <div className="min-h-screen bg-gradient-to-b from-[#1b1b2f] via-[#3b1f3f] to-[#b53a1d]">
          <ParticlesBackground />
          <ButtonBack />

          {/* Título + descripción */}
          <div className="text-center pt-24 px-4">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl titulo uppercase font-bold text-white mb-3 drop-shadow-md"
            >
              Gestión de Deudas
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-sm sm:text-base text-gray-200/80 max-w-2xl mx-auto"
            >
              Visualizá rápidamente las ventas pendientes de cobro por fiado o a
              cuenta, filtrá por vendedor, geografía y fechas, y analizá los
              montos adeudados.
            </motion.p>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
            {/* KPIs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-white/40 p-4 flex flex-col">
                <span className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                  Total adeudado
                </span>
                <span className="text-2xl font-semibold text-gray-900">
                  {moneyAR(kpis.totalDeudas)}
                </span>
              </div>

              <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-white/40 p-4 flex flex-col">
                <span className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                  Cantidad de ventas
                </span>
                <span className="text-2xl font-semibold text-gray-900">
                  {kpis.cantidad}
                </span>
              </div>

              <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-white/40 p-4 flex flex-col">
                <span className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                  Ticket promedio
                </span>
                <span className="text-2xl font-semibold text-gray-900">
                  {moneyAR(kpis.ticketPromedio)}
                </span>
              </div>
            </motion.div>

            {/* Filtros */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-2xl bg-white/95 backdrop-blur-xl border border-white/40 p-4 sm:p-5 space-y-4"
            >
              <div className="flex items-center gap-2 text-gray-700 mb-1">
                <FaFilter className="text-xs" />
                <span className="text-sm font-semibold">Filtros</span>
              </div>

              {/* Primera fila: texto, tipo, estado, vendedor */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Búsqueda texto */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Buscar (cliente / doc / email)
                  </label>
                  <div className="relative">
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/60 focus:border-transparent"
                      placeholder="Ej: Benjamín, 20-4384..."
                    />
                    <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Tipo
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800
                               focus:outline-none focus:ring-2 focus:ring-orange-400/60 focus:border-transparent"
                  >
                    <option value="fiado">Fiado</option>
                    <option value="a_cuenta">A cuenta</option>
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Estado
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800
                               focus:outline-none focus:ring-2 focus:ring-orange-400/60 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="anulada">Anulada</option>
                  </select>
                </div>

                {/* Vendedor */}
                <div className="relative z-30">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Vendedor
                  </label>
                  <SearchableSelect
                    items={vendedores}
                    value={vendedorId}
                    onChange={(val) => {
                      console.log('Vendedor seleccionado:', val);
                      setVendedorId(val || null);
                    }}
                    placeholder="Todos"
                    getOptionLabel={(v) => v?.nombre || ''}
                    getOptionValue={(v) => v?.id}
                    getOptionSearchText={(v) =>
                      [v?.nombre || '', v?.email || ''].join(' ')
                    }
                    portal
                    portalZIndex={3000}
                    dropdownMaxHeight="40vh"
                    menuPlacement="bottom"
                  />
                </div>
              </div>

              {/* Segunda fila: Ciudad / Localidad / Barrio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Ciudad */}
                <div className="relative z-20">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Ciudad
                  </label>
                  <SearchableSelect
                    items={ciudades}
                    value={ciudadId}
                    onChange={(val) => {
                      console.log('Ciudad seleccionada:', val);
                      setCiudadId(val || null);
                    }}
                    placeholder="Todas"
                    getOptionLabel={(c) => c?.nombre || ''}
                    getOptionValue={(c) => c?.id}
                    getOptionSearchText={(c) => c?.nombre || ''}
                    portal
                    portalZIndex={2800}
                    dropdownMaxHeight="40vh"
                    menuPlacement="bottom"
                  />
                </div>

                {/* Localidad */}
                <div className="relative z-10">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Localidad
                  </label>
                  <SearchableSelect
                    items={localidades}
                    value={localidadId}
                    onChange={(val) => {
                      console.log('Localidad seleccionada:', val);
                      setLocalidadId(val || null);
                    }}
                    placeholder={
                      ciudadId ? 'Todas' : 'Seleccioná una ciudad primero'
                    }
                    disabled={!ciudadId}
                    getOptionLabel={(l) => l?.nombre || ''}
                    getOptionValue={(l) => l?.id}
                    getOptionSearchText={(l) => l?.nombre || ''}
                    portal
                    portalZIndex={2800}
                    dropdownMaxHeight="40vh"
                    menuPlacement="bottom"
                  />
                </div>

                {/* Barrio */}
                <div className="relative z-10">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Barrio
                  </label>
                  <SearchableSelect
                    items={barrios}
                    value={barrioId}
                    onChange={(val) => {
                      console.log('Barrio seleccionado:', val);
                      setBarrioId(val || null);
                    }}
                    placeholder={
                      localidadId ? 'Todos' : 'Seleccioná una localidad'
                    }
                    disabled={!localidadId}
                    getOptionLabel={(b) => b?.nombre || ''}
                    getOptionValue={(b) => b?.id}
                    getOptionSearchText={(b) => b?.nombre || ''}
                    portal
                    portalZIndex={2800}
                    dropdownMaxHeight="40vh"
                    menuPlacement="bottom"
                  />
                </div>
              </div>

              {/* Rango fechas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800
                               focus:outline-none focus:ring-2 focus:ring-orange-400/60 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800
                               focus:outline-none focus:ring-2 focus:ring-orange-400/60 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleBuscar}
                    className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500
                               text-white text-sm font-semibold px-4 py-2.5 shadow-md hover:brightness-110 transition disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? 'Buscando…' : 'Aplicar filtros'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Tabla de deudas */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="rounded-2xl bg-white/95 backdrop-blur-xl border border-white/40 p-4 sm:p-5"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                  Ventas con deuda ({meta.total} registros)
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50/90 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        ID
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Fecha
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Cliente
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Vendedor
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Tipo
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Estado
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-600">
                        Total neto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-gray-500"
                        >
                          No hay deudas para los filtros seleccionados.
                        </td>
                      </tr>
                    )}

                    {ventas.map((v) => (
                      <tr
                        key={v.id}
                        className="border-b border-gray-100 hover:bg-orange-50/40 transition"
                      >
                        <td className="px-4 py-2 text-gray-700">#{v.id}</td>
                        <td className="px-4 py-2 text-gray-700">
                          {fmtFecha(v.fecha)}
                        </td>

                        {/* Cliente */}
                        <td className="px-4 py-2 text-gray-800">
                          <div className="flex items-center gap-2">
                            <FaUser className="text-gray-400 text-xs" />
                            <div className="flex flex-col leading-tight">
                              <span className="font-medium">
                                {v.cliente?.nombre || '—'}
                              </span>
                              {v.cliente?.documento && (
                                <span className="text-[11px] text-gray-500">
                                  {v.cliente.documento}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Vendedor */}
                        <td className="px-4 py-2 text-gray-800">
                          <div className="flex items-center gap-2">
                            <FaUserTie className="text-gray-400 text-xs" />
                            <span className="font-medium">
                              {v.vendedor?.nombre || '—'}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${
                              badgeTipoClasses[v.tipo] ||
                              'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {v.tipo}
                          </span>
                        </td>

                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${
                              badgeEstadoClasses[v.estado] ||
                              'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {v.estado}
                          </span>
                        </td>

                        <td className="px-4 py-2 text-right font-semibold text-gray-900">
                          {moneyAR(v.total_neto || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación simple */}
              {meta.totalPages > 1 && (
                <div className="mt-4 flex justify-end items-center gap-2 text-xs sm:text-sm">
                  <button
                    type="button"
                    onClick={() => handlePageChange(meta.page - 1)}
                    disabled={!meta.hasPrev}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700
                               disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    Anterior
                  </button>
                  <span className="text-gray-600">
                    Página {meta.page} de {meta.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePageChange(meta.page + 1)}
                    disabled={!meta.hasNext}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700
                               disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default VentasDeudasPage;
