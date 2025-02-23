import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2';
import NavBar from '../components/NavBar';

const RegisterAttendance: React.FC = () => {
  const [cedula, setCedula] = useState<string>('');
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');

  const handleRegister = async () => {
    if (!cedula.trim()) {
      Swal.fire("Error", "La cédula del empleado es obligatoria.", "error");
      return;
    }
    
    // Obtener la fecha actual y calcular inicio y fin del día
    const now = new Date();
    const nowIso = now.toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    if (tipo === 'entrada') {
      // Verificar si ya existe una entrada para el mismo día
      const { data: existingEntries, error: queryError } = await supabase
        .from('asistencia')
        .select('*')
        .eq('cedula', cedula)
        .gte('entrada', startOfDay)
        .lte('entrada', endOfDay);
      
      if (queryError) {
        Swal.fire("Error", queryError.message, "error");
        return;
      }
      
      if (existingEntries && existingEntries.length > 0) {
        Swal.fire("Error", "Ya se ha registrado una entrada hoy.", "error");
        return;
      }
      
      // Insertar nuevo registro de entrada
      const { error } = await supabase.from('asistencia').insert([
        { cedula, entrada: nowIso }
      ]);
      if (error) {
        Swal.fire("Error", error.message, "error");
      } else {
        Swal.fire("Éxito", "Entrada registrada.", "success");
        // Limpiar el formulario
        setCedula('');
        setTipo('entrada');
      }
    } else if (tipo === 'salida') {
      // Verificar si ya existe una salida registrada hoy
      const { data: existingExits, error: queryExitError } = await supabase
        .from('asistencia')
        .select('*')
        .eq('cedula', cedula)
        .gte('entrada', startOfDay)
        .lte('entrada', endOfDay)
        .not('salida', 'is', null);
      
      if (queryExitError) {
        Swal.fire("Error", queryExitError.message, "error");
        return;
      }
      
      if (existingExits && existingExits.length > 0) {
        Swal.fire("Error", "Ya se ha registrado una salida hoy.", "error");
        return;
      }
      
      // Buscar la entrada pendiente (sin salida) para el día
      const { data: pendingEntries, error: pendingError } = await supabase
        .from('asistencia')
        .select('*')
        .eq('cedula', cedula)
        .gte('entrada', startOfDay)
        .lte('entrada', endOfDay)
        .is('salida', null)
        .order('entrada', { ascending: false })
        .limit(1);
      
      if (pendingError) {
        Swal.fire("Error", pendingError.message, "error");
        return;
      }
      
      if (!pendingEntries || pendingEntries.length === 0) {
        Swal.fire("Error", "No se encontró un registro de entrada pendiente para hoy.", "error");
        return;
      }
      
      const record = pendingEntries[0];
      // Actualizar el registro para agregar la salida
      const { error } = await supabase
        .from('asistencia')
        .update({ salida: nowIso })
        .eq('id', record.id);
      
      if (error) {
        Swal.fire("Error", error.message, "error");
      } else {
        Swal.fire("Éxito", "Salida registrada.", "success");
        // Limpiar el formulario
        setCedula('');
        setTipo('entrada');
      }
    }
  };

  return (
    <div className="container">
      <NavBar />
      <h2>Registro de Asistencia</h2>
      <input
        type="text"
        placeholder="Cédula del Empleado"
        value={cedula}
        onChange={(e) => setCedula(e.target.value)}
      />
      <select value={tipo} onChange={(e) => setTipo(e.target.value as 'entrada' | 'salida')}>
        <option value="entrada">Entrada</option>
        <option value="salida">Salida</option>
      </select>
      <button onClick={handleRegister}>Registrar Asistencia</button>
    </div>
  );
};

export default RegisterAttendance;
