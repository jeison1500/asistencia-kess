import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2';
import NavBar from '../components/NavBar';

const RegisterAttendance: React.FC = () => {
  const [cedula, setCedula] = useState<string>('');
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [descansoTrabajado, setDescansoTrabajado] = useState<boolean>(false); // ✅ nuevo estado

  const handleRegister = async () => {
    if (!cedula.trim()) {
      Swal.fire("Error", "La cédula del empleado es obligatoria.", "error");
      return;
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    if (tipo === 'entrada') {
      const hour = now.getHours();
      const minutes = now.getMinutes();
      if (hour < 7 || (hour === 7 && minutes < 30)) {
        Swal.fire("Error", "Solo se permite registrar la entrada después de las 07:30 AM.", "error");
        return;
      }

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

      // ✅ Insertar nuevo registro con descanso_trabajado
      const { error } = await supabase.from('asistencia').insert([
        { cedula, entrada: nowIso, descanso_trabajado: descansoTrabajado }
      ]);
      if (error) {
        Swal.fire("Error", error.message, "error");
      } else {
        Swal.fire("Éxito", "Entrada registrada.", "success");
        setCedula('');
        setTipo('entrada');
        setDescansoTrabajado(false); // ✅ limpiar checkbox
      }
    } else if (tipo === 'salida') {
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
      const { error } = await supabase
        .from('asistencia')
        .update({ salida: nowIso })
        .eq('id', record.id);

      if (error) {
        Swal.fire("Error", error.message, "error");
      } else {
        Swal.fire("Éxito", "Salida registrada.", "success");
        setCedula('');
        setTipo('entrada');
        setDescansoTrabajado(false);
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

      {/* ✅ Nuevo checkbox para descanso trabajado */}
      {tipo === 'entrada' && (
        <label>
          <input
            type="checkbox"
            checked={descansoTrabajado}
            onChange={(e) => setDescansoTrabajado(e.target.checked)}
          />
          ¿Trabaja en su día de descanso? SOLO REDES
        </label>
      )}

      <button onClick={handleRegister}>Registrar Asistencia</button>
    </div>
  );
};

export default RegisterAttendance;
