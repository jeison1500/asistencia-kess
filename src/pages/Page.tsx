import React from 'react';
import NavBar from '../components/NavBar';

const Page: React.FC = () => {
  return (
    <div className="container">
      <h1>Gestión de Empleados</h1>
      <NavBar />
      <p>Bienvenido a la aplicación de registro de empleados y asistencia.</p>
    </div>
  );
};

export default Page;
