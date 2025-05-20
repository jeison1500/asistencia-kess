import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Page from './pages/Page';
import RegisterEmployee from './pages/RegisterEmployee';
import RegisterAttendance from './pages/RegisterAttendance';
import RegisterDiscount from './pages/RegisterDiscount'; // <-- Importar aquí
import Reports from './pages/Reports';

const App: React.FC = () => {

    const isMobile = window.innerWidth < 768;

  if (isMobile) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Esta página no se puede abrir en dispositivos móviles</h2>
        <p>Por favor, accede desde un ordenador para una mejor experiencia.</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Page />} />
        <Route path="/register-employee" element={<RegisterEmployee />} />
        <Route path="/register-attendance" element={<RegisterAttendance />} />
        <Route path="/register-discount" element={<RegisterDiscount />} /> {/* Corregido */}
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
