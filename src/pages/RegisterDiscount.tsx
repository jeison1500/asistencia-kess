import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2';
import NavBar from '../components/NavBar';

const RegisterDiscount: React.FC = () => {
  const [empleados, setEmpleados] = useState<{ cedula: string; nombre: string; apellido: string }[]>([]);
  const [cedula, setCedula] = useState<string>('');
  const [tipoDescuento, setTipoDescuento] = useState<string>('');
  const [monto, setMonto] = useState<string>('');

  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        const { data, error } = await supabase.from('empleados').select('cedula, nombre, apellido');
        if (error) throw error;

        if (data && Array.isArray(data)) {
          setEmpleados(data);
        } else {
          setEmpleados([]);
        }
      } catch (error: any) {
        Swal.fire('Error', error.message, 'error');
      }
    };
    fetchEmpleados();
  }, []);

  const handleRegister = async () => {
    const parsedMonto = parseFloat(monto);
    if (!cedula || !tipoDescuento || isNaN(parsedMonto) || parsedMonto <= 0) {
      Swal.fire('Error', 'Todos los campos son obligatorios y el monto debe ser mayor a 0.', 'error');
      return;
    }

    // Validar que el empleado existe
    const empleadoExiste = empleados.some(emp => emp.cedula === cedula);
    if (!empleadoExiste) {
      Swal.fire('Error', 'El empleado seleccionado no es válido.', 'error');
      return;
    }

    try {
      const { error } = await supabase.from('descuentos_nomina').insert([
        {
          cedula,
          tipo_descuento: tipoDescuento,
          monto: parsedMonto,
          fecha: new Date().toISOString().split('T')[0],
        }
      ]);

      if (error) throw error;

      Swal.fire('Éxito', 'Descuento registrado correctamente.', 'success');
      setCedula('');
      setTipoDescuento('');
      setMonto('');
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  return (
    <div className="container">
      <NavBar />
      <h2>Registrar Descuento</h2>
      
      <label htmlFor="empleado">Selecciona un empleado:</label>
      <select id="empleado" value={cedula} onChange={(e) => setCedula(e.target.value)}>
        <option value="">Selecciona un empleado</option>
        {empleados.map(emp => (
          <option key={emp.cedula} value={emp.cedula}>{emp.nombre} {emp.apellido}</option>
        ))}
      </select>

      <label htmlFor="tipoDescuento">Tipo de descuento:</label>
      <select id="tipoDescuento" value={tipoDescuento} onChange={(e) => setTipoDescuento(e.target.value)}>
        <option value="">Selecciona un tipo de descuento</option>
        <option value="PRESTAMOS">PRESTAMOS</option>
        <option value="DESCUENTOS DE PRENDAS">DESCUENTOS DE PRENDAS</option>
        <option value="PRENDAS">PRENDAS</option>
        <option value="FLETES">FLETES</option>
        <option value="ABONOS A DESCUADRE DE CAJA">ABONOS A DESCUADRE DE CAJA</option>
      </select>

      <label htmlFor="monto">Monto:</label>
      <input 
        id="monto"
        type="number" 
        placeholder="Monto" 
        value={monto} 
        min="0"
        step="0.01"
        onChange={(e) => setMonto(e.target.value.replace(/[^0-9.]/g, ''))} 
      />

      <button onClick={handleRegister}>Registrar</button>
    </div>
  );
};

export default RegisterDiscount;
