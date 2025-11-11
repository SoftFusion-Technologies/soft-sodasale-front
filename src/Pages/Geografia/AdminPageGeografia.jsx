// src/Pages/Geografia/AdminPageGeografia.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import NavbarStaff from '../Dash/NavbarStaff';
import '../../Styles/staff/dashboard.css';
import '../../Styles/staff/background.css';
import { useAuth } from '../../AuthContext';
import ParticlesBackground from '../../Components/ParticlesBackground';
import { motion } from 'framer-motion';
import ButtonBack from '../../Components/ButtonBack';
import {
  FaCity,
  FaMap,
  FaMapMarkerAlt /* FaHome (opcional) */
} from 'react-icons/fa';

const geografiaLinks = [
  {
    to: '/dashboard/geografia/ciudades',
    label: 'Ciudades',
    icon: <FaCity />
  },
  {
    to: '/dashboard/geografia/localidades',
    label: 'Localidades',
    icon: <FaMap />
  },
  {
    to: '/dashboard/geografia/barrios',
    label: 'Barrios',
    icon: <FaMapMarkerAlt /> // o <FaHome />
  }
];

const AdminPageGeografia = () => {
  const { userLevel } = useAuth(); // por si necesitás permisos/roles más adelante

  return (
    <>
      <NavbarStaff />
      <section className="relative w-full min-h-screen bg-white">
        {/* 🎨 Gradiente teal/azul en vez de morado */}
        <div className="min-h-screen bg-gradient-to-b from-[#001219] via-[#003049] to-[#005f73]">
          <ParticlesBackground />
          <ButtonBack />
          <div className="text-center pt-24 px-4">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl titulo uppercase font-bold text-white mb-8 drop-shadow-md"
            >
              Gestión de área geográfica{' '}
            </motion.h1>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-center">
              {geografiaLinks.map(({ to, label, icon }, index) => (
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
                    className="bg-white/90 backdrop-blur-xl shadow-lg hover:shadow-teal-400 transition-all duration-300 text-gray-800 font-semibold text-lg rounded-2xl w-full max-w-xs p-6 flex flex-col items-center justify-center border border-white/20 hover:scale-[1.03] gap-3"
                  >
                    <span className="text-4xl text-teal-600">{icon}</span>
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

export default AdminPageGeografia;
