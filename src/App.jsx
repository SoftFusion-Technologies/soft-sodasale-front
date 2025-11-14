/*
 * Programador: Benjamin Orellana
 * Fecha Creación: 26 / 05 / 2025
 * Versión: 1.0
 *
 * Descripción:
 *  Este archivo (App.jsx) es el componente principal de la aplicación.
 *  Contiene la configuración de enrutamiento, carga de componentes asíncrona,
 *  y la lógica para mostrar un componente de carga durante la carga inicial.
 *  Además, incluye la estructura principal de la aplicación, como la barra de navegación,
 *  el pie de página y las diferentes rutas para las páginas de la aplicación.
 *
 * Tema: Configuración de la Aplicación Principal
 * Capa: Frontend
 * Contacto: benjamin.orellanaof@gmail.com || 3863531891
 */

import './App.css';
import {
  BrowserRouter as Router,
  Routes as Rutas,
  Route as Ruta
} from 'react-router-dom'; // IMPORTAMOS useLocation PARA OCULTAR COMPONENTES

import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';

import Home from './Pages/Home';
import Footer from './Components/Footer';

import LoginForm from './Components/login/LoginForm';
import AdminPage from './Pages/Dash/AdminPage';
import LocalesGet from './Pages/MetodosGets/LocalesGet';
import UsuariosGet from './Pages/MetodosGets/UsuariosGet';
import ProductosCards from './Pages/Productos/ProductosCards';
import CiudadesCards from './Pages/Geografia/CiudadesCards';
import AdminPageGeografia from './Pages/Geografia/AdminPageGeografia';
import LocalidadesCards from './Pages/Geografia/LocalidadesCards';
import BarriosCards from './Pages/Geografia/BarriosCards';
import AdminPageVendedores from './Pages/Vendedores/AdminPageVendedores';
import VendedoresCards from './Pages/Vendedores/VendedoresCards';
import VendedorBarriosCards from './Pages/Vendedores/VendedorBarriosCards';
import ClientesCards from './Pages/Clientes/ClientesCards';
import AdminPageVentas from './Pages/Ventas/AdminPageVentas';
import VentasHistorialPage from './Pages/Ventas/VentasHistorialPage';
function AppContent() {
  return (
    <>
      <div className="w-full min-h-screen overflow-x-hidden bg-[#1f3636]">
        <Rutas>
          <Ruta path="/" element={<Home />} />
          {/* componentes del staff y login INICIO */}
          <Ruta path="/login" element={<LoginForm />} />
          <Ruta
            path="/dashboard"
            element={
              <ProtectedRoute>
                {' '}
                <AdminPage />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/usuarios"
            element={
              <ProtectedRoute>
                {' '}
                <UsuariosGet />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/locales"
            element={
              <ProtectedRoute>
                {' '}
                <LocalesGet />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/productos"
            element={
              <ProtectedRoute>
                {' '}
                <ProductosCards />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/geografia"
            element={
              <ProtectedRoute>
                {' '}
                <AdminPageGeografia />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/geografia/ciudades"
            element={
              <ProtectedRoute>
                {' '}
                <CiudadesCards />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/geografia/localidades"
            element={
              <ProtectedRoute>
                {' '}
                <LocalidadesCards />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/geografia/barrios"
            element={
              <ProtectedRoute>
                {' '}
                <BarriosCards />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/vendedores"
            element={
              <ProtectedRoute>
                {' '}
                <AdminPageVendedores />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/vendedores/vendedores"
            element={
              <ProtectedRoute>
                {' '}
                <VendedoresCards />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/vendedores/vendedores_barrios"
            element={
              <ProtectedRoute>
                {' '}
                <VendedorBarriosCards />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/clientes"
            element={
              <ProtectedRoute>
                {' '}
                <ClientesCards />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/ventas"
            element={
              <ProtectedRoute>
                {' '}
                <AdminPageVentas />{' '}
              </ProtectedRoute>
            }
          />
          <Ruta
            path="/dashboard/ventas/ventas"
            element={
              <ProtectedRoute>
                {' '}
                <VentasHistorialPage />{' '}
              </ProtectedRoute>
            }
          />
        </Rutas>
        <Footer></Footer>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
