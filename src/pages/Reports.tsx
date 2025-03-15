import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import NavBar from '../components/NavBar';
import Swal from 'sweetalert2';
import "jspdf-autotable";
import './Dashboard.css';

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
  empleados: Employee;
}

interface EmployeeSummary {
  employee: Employee;
  datesWorked: Set<number>;
  effectiveDays: number;
  computedPayment: number;
  dailySalary: number;
  biweeklySalary: number;
}

const Dashboard: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [sedeFilter, setSedeFilter] = useState<string>('TODAS');
  const [empleadoFilter, setEmpleadoFilter] = useState('');
  const [summaryList, setSummaryList] = useState<EmployeeSummary[]>([]);
  const [totalPayroll, setTotalPayroll] = useState<number>(0);
  const [totalDaysWorked, setTotalDaysWorked] = useState<number>(0);

  const formatNumber = (num: number) => num.toLocaleString();

  const handleFiltrar = async () => {
    if (!fechaInicio || !fechaFin) {
      Swal.fire("Error", "Por favor, ingrese las fechas de inicio y fin.", "error");
      return;
    }

    const { data, error } = await supabase
      .from('asistencia')
      .select("id, entrada, empleados:empleados(cedula, nombre, apellido, numero_cuenta, tipo_cuenta, banco, salario_diario, salario_mensual, sede)")
      .gte('entrada', fechaInicio)
      .lte('entrada', fechaFin);

    if (error) {
      console.error("Error en la consulta de Supabase:", error.message);
      Swal.fire("Error", error.message, "error");
      return;
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      Swal.fire("Información", "No se encontraron registros para las fechas seleccionadas.", "info");
      setSummaryList([]);
      return;
    }

    const records = data as AttendanceRecord[];
    const summaryArray: EmployeeSummary[] = records.map(record => ({
      employee: record.empleados,
      datesWorked: new Set([new Date(record.entrada).getDate()]),
      effectiveDays: 1,
      computedPayment: record.empleados.salario_diario,
      dailySalary: record.empleados.salario_diario,
      biweeklySalary: Math.round(record.empleados.salario_mensual / 2),
    }));

    setSummaryList(summaryArray);
  };

  return (
    <div className="container">
      <NavBar />
      <h2>Dashboard de Nómina</h2>

      <div>
        <label>Fecha Inicio:
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
        </label>
        <label>Fecha Fin:
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
        </label>
        <button onClick={handleFiltrar}>Filtrar</button>
      </div>

      {summaryList.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Empleado</th><th>N° Cuenta</th><th>Banco</th><th>Días Trabajados</th><th>Valor Día</th><th>Valor Quincena</th><th>Pago</th>
            </tr>
          </thead>
          <tbody>
            {summaryList.map(summary => (
              <tr key={summary.employee.cedula}>
                <td>{summary.employee.nombre} {summary.employee.apellido}</td>
                <td>{summary.employee.numero_cuenta}</td>
                <td>{summary.employee.banco}</td>
                <td>{formatNumber(summary.effectiveDays)}</td>
                <td>${formatNumber(summary.dailySalary)}</td>
                <td>${formatNumber(summary.biweeklySalary)}</td>
                <td>${formatNumber(summary.computedPayment)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay datos disponibles. Realiza una búsqueda.</p>
      )}
    </div>
  );
};

export default Dashboard;
