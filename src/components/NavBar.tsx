import React from 'react';
import { useNavigate } from 'react-router-dom';

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
      <button onClick={() => navigate('/register-employee')}>Crear Empleado</button>
      <button onClick={() => navigate('/register-attendance')}>Registrar Asistencia</button>
      <button onClick={() => navigate('/reports')}>Reportes</button>
    </div>
  );
};

export default NavBar;
