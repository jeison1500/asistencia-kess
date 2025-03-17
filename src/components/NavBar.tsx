import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css'; // Importa el archivo CSS aquí

const NavBar: React.FC = () => {
  return (
    <nav className="navbar">
      <ul>
        <li><Link to="/">Inicio</Link></li>
        <li><Link to="/register-employee">Registrar Empleado</Link></li>
        <li><Link to="/register-attendance">Registrar Asistencia</Link></li>
        <li><Link to="/register-discount">Registrar Descuento</Link></li>
        <li><Link to="/reports">Reportes</Link></li>
      </ul>
    </nav>
  );
};

export default NavBar;
