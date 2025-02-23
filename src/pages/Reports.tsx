import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import NavBar from '../components/NavBar';
import Swal from 'sweetalert2';

interface Employee {
  cedula: string;
  nombre: string;
  apellido: string;
  numero_cuenta: string;
  tipo_cuenta: string;
  banco: string;
  salario_diario: number;
  salario_mensual: number;
  sede: string;
}

interface AttendanceRecord {
  id: number;
  entrada: string;
  // Relación con empleados a través de "cedula"
  empleados: Employee;
}

interface EmployeeSummary {
  employee: Employee;
  datesWorked: Set<string>;
  effectiveDays: number;
  computedPayment: number;
}

const Dashboard: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [sedeFilter, setSedeFilter] = useState<string>('TODAS');
  const [empleadoFilter, setEmpleadoFilter] = useState<string>(''); // Filtra por nombre, apellido o cédula
  const [summaryList, setSummaryList] = useState<EmployeeSummary[]>([]);
  const [totalPayroll, setTotalPayroll] = useState<number>(0);

  const handleFiltrar = async () => {
    if (!fechaInicio || !fechaFin) {
      Swal.fire("Error", "Por favor, ingrese las fechas de inicio y fin.", "error");
      return;
    }

    // Usamos una cadena de una sola línea en select para evitar problemas de formato
    const { data, error } = await supabase
      .from('asistencia')
      .select("id, entrada, empleados:empleados(cedula, nombre, apellido, numero_cuenta, tipo_cuenta, banco, salario_diario, salario_mensual, sede)")
      .gte('entrada', fechaInicio)
      .lte('entrada', fechaFin);

    if (error) {
      Swal.fire("Error", error.message, "error");
      return;
    }
    if (!data || !Array.isArray(data)) {
      Swal.fire("Error", "No se encontraron registros.", "error");
      return;
    }
    // Forzamos el tipado sin alterar la lógica
    const records = (data as unknown as AttendanceRecord[]) ?? [];

    // Agrupar registros por empleado (clave: cedula)
    const summaryMap: { [cedula: string]: EmployeeSummary } = {};
    records.forEach((record: AttendanceRecord) => {
      const emp = record.empleados;
      if (!emp) return; // Evita registros sin datos de empleado
      // Filtro por sede
      if (sedeFilter !== 'TODAS' && emp.sede.toUpperCase() !== sedeFilter.toUpperCase()) return;
      // Filtro por búsqueda de empleado (nombre, apellido o cédula)
      if (
        empleadoFilter &&
        !emp.nombre.toLowerCase().includes(empleadoFilter.toLowerCase()) &&
        !emp.apellido.toLowerCase().includes(empleadoFilter.toLowerCase()) &&
        !emp.cedula.includes(empleadoFilter)
      ) {
        return;
      }
      // Extraer solo la fecha (sin hora)
      const dateOnly = new Date(record.entrada).toLocaleDateString();
      if (!summaryMap[emp.cedula]) {
        summaryMap[emp.cedula] = {
          employee: emp,
          datesWorked: new Set<string>(),
          effectiveDays: 0,
          computedPayment: 0,
        };
      }
      summaryMap[emp.cedula].datesWorked.add(dateOnly);
    });

    // Procesar cada empleado para calcular días trabajados y pago
    const summaryArray: EmployeeSummary[] = [];
    for (const cedula in summaryMap) {
      const summary = summaryMap[cedula];
      const totalDays = summary.datesWorked.size;
      let payment = 0;
      if (summary.employee.sede.toUpperCase() !== 'REDES') {
        // Para sedes que no son de REDES: pago = salario_diario * días trabajados
        payment = summary.employee.salario_diario * totalDays;
        summary.effectiveDays = totalDays;
      } else {
        // Para empleados de REDES: separar la asistencia en dos quincenas
        let firstHalfCount = 0;  // días del 1 al 15
        let secondHalfCount = 0; // días del 16 en adelante
        summary.datesWorked.forEach(dateStr => {
          const d = new Date(dateStr);
          const day = d.getDate();
          if (day <= 15) firstHalfCount++;
          else secondHalfCount++;
        });
        // Primera quincena: si trabaja de 1 a 13 días, se paga proporcionalmente; si llega a 14 o más, se le paga 14 días.
        const firstHalfPayment =
          (summary.employee.salario_mensual / 30) *
          (firstHalfCount < 14 ? firstHalfCount : 14);
        // Segunda quincena: si trabaja de 1 a 14 días, se paga proporcionalmente; si alcanza 15 o más, se le paga 15 días.
        const secondHalfPayment =
          (summary.employee.salario_mensual / 30) *
          (secondHalfCount < 15 ? secondHalfCount : 15);
        payment = firstHalfPayment + secondHalfPayment;
        summary.effectiveDays = firstHalfCount + secondHalfCount;
      }
      summary.computedPayment = payment;
      summaryArray.push(summary);
    }

    // Calcular total de nómina
    const total = summaryArray.reduce((acc, curr) => acc + curr.computedPayment, 0);
    setSummaryList(summaryArray);
    setTotalPayroll(total);
  };

  return (
    <div className="container">
      <NavBar />
      <h2>Dashboard de Nómina</h2>
      <div style={{ marginBottom: '20px' }}>
        <label>
          Fecha Inicio:
          <input
            type="date"
            value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)}
          />
        </label>
        <label style={{ marginLeft: '10px' }}>
          Fecha Fin:
          <input
            type="date"
            value={fechaFin}
            onChange={e => setFechaFin(e.target.value)}
          />
        </label>
        <label style={{ marginLeft: '10px' }}>
          Sede:
          <select
            value={sedeFilter}
            onChange={e => setSedeFilter(e.target.value)}
          >
            <option value="TODAS">TODAS</option>
            <option value="METROCENTRO">METROCENTRO</option>
            <option value="NUESTRO ATLANTICO">NUESTRO ATLANTICO</option>
            <option value="REDES">REDES</option>
            <option value="CENTRO">CENTRO</option>
          </select>
        </label>
        <label style={{ marginLeft: '10px' }}>
          Empleado (Nombre, Apellido o Cédula):
          <input
            type="text"
            value={empleadoFilter}
            onChange={e => setEmpleadoFilter(e.target.value)}
          />
        </label>
        <button onClick={handleFiltrar} style={{ marginLeft: '10px' }}>
          Filtrar
        </button>
      </div>

      <h3>Detalle de Empleados</h3>
      {summaryList.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Número de Cuenta</th>
              <th>Tipo de Cuenta</th>
              <th>Banco</th>
              <th>Salario Diario</th>
              <th>Salario Mensual</th>
              <th>Días Trabajados</th>
              <th>Días Efectivos</th>
              <th>Pago Calculado</th>
            </tr>
          </thead>
          <tbody>
            {summaryList.map(summary => (
              <tr key={summary.employee.cedula}>
                <td>{summary.employee.nombre} {summary.employee.apellido}</td>
                <td>{summary.employee.numero_cuenta}</td>
                <td>{summary.employee.tipo_cuenta}</td>
                <td>{summary.employee.banco}</td>
                <td>{summary.employee.salario_diario.toLocaleString()}</td>
                <td>{summary.employee.salario_mensual.toLocaleString()}</td>
                <td>{summary.datesWorked.size}</td>
                <td>{summary.effectiveDays}</td>
                <td>${summary.computedPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No se encontraron registros con el filtro aplicado.</p>
      )}

      <h3>Total a Pagar de la Nómina: ${totalPayroll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
    </div>
  );
};

export default Dashboard;
