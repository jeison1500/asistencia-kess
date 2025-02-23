import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Page from './pages/Page';
import RegisterEmployee from './pages/RegisterEmployee';
import RegisterAttendance from './pages/RegisterAttendance';
import Reports from './pages/Reports';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Page />} />
        <Route path="/register-employee" element={<RegisterEmployee />} />
        <Route path="/register-attendance" element={<RegisterAttendance />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
