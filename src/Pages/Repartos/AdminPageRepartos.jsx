// src/Pages/Repartos/AdminPageRepartos.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import NavbarStaff from '../Dash/NavbarStaff';
import '../../Styles/staff/dashboard.css';
import '../../Styles/staff/background.css';
import { useAuth } from '../../AuthContext';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ButtonBack from '../../Components/ButtonBack';
import { motion } from 'framer-motion';
import {
  FaTruck,
  FaUsers,
  FaCalendarAlt,
  FaMapMarkedAlt
} from 'react-icons/fa';

const repartosLinks = [
  {
    to: '/dashboard/geografia/repartos/listado',
    label: 'Repartos',
    icon: <FaTruck />
  },
  {
    to: '/dashboard/geografia/repartos/equipos',
    label: 'Equipos de reparto',
    icon: <FaUsers />
  },
  {
    to: '/dashboard/repartos/dias',
    label: 'Días y turnos',
    icon: <FaCalendarAlt />
  }
  // Más adelante podrías agregar:
  // { to: '/dashboard/repartos/asignar-clientes', label: 'Asignar clientes', icon: <FaMapMarkedAlt /> }
];

const AdminPageRepartos = () => {
  const { userLevel } = useAuth(); // por si necesitás permisos/roles más adelante

  return (
    <>
      <NavbarStaff />
      <section className="relative w-full min-h-screen bg-white">
        {/* 🎨 Gradiente "agua/logística" */}
        <div className="min-h-screen bg-gradient-to-b from-[#001219] via-[#005f73] to-[#0a9396]">
          <ParticlesBackground />
          <ButtonBack />

          <div className="text-center pt-24 px-4">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl titulo uppercase font-bold text-white mb-4 drop-shadow-md"
            >
              Gestión de repartos
            </motion.h1>
            <p className="text-white/85 max-w-2xl mx-auto text-sm sm:text-base">
              Organizá las zonas de reparto, equipos de choferes y días de
              visita a clientes para optimizar la logística de agua y soda.
            </p>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-center">
              {repartosLinks.map(({ to, label, icon }, index) => (
                <Link
                  to={typeof to === 'string' ? to : to.pathname}
                  state={typeof to === 'object' ? to.state || {} : {}}
                  key={label}
                  className="flex justify-center"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-white/90 backdrop-blur-xl shadow-lg hover:shadow-cyan-400/80 transition-all duration-300 text-gray-800 font-semibold text-lg rounded-2xl w-full max-w-xs p-6 flex flex-col items-center justify-center border border-white/20 hover:scale-[1.03] gap-3"
                  >
                    <span className="text-4xl text-cyan-600">{icon}</span>
                    <span className="text-center">{label}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AdminPageRepartos;
