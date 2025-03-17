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
  const [empleadoFilter, setEmpleadoFilter] = useState<string>('');
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
      Swal.fire("Error", error.message, "error");
      return;
    }
    if (!data || !Array.isArray(data)) {
      Swal.fire("Error", "No se encontraron registros.", "error");
      return;
    }

    const records = (data as unknown as AttendanceRecord[]) ?? [];
    const summaryMap: { [cedula: string]: EmployeeSummary } = {};

    records.forEach((record: AttendanceRecord) => {
      const emp = record.empleados;
      if (!emp) return;
      if (sedeFilter !== 'TODAS' && emp.sede.toUpperCase() !== sedeFilter.toUpperCase()) return;
      if (
        empleadoFilter &&
        !emp.nombre.toLowerCase().includes(empleadoFilter.toLowerCase()) &&
        !emp.apellido.toLowerCase().includes(empleadoFilter.toLowerCase()) &&
        !emp.cedula.includes(empleadoFilter)
      ) {
        return;
      }
      const dayOfMonth = new Date(record.entrada).getDate();

      if (!summaryMap[emp.cedula]) {
        summaryMap[emp.cedula] = {
          employee: emp,
          datesWorked: new Set<number>(),
          effectiveDays: 0,
          computedPayment: 0,
          dailySalary: Math.round(emp.salario_diario),
          biweeklySalary: Math.round(emp.salario_mensual / 2),
        };
      }

      if (emp.sede.toUpperCase() === "REDES" && dayOfMonth === 31) return;

      summaryMap[emp.cedula].datesWorked.add(dayOfMonth);
    });

    const summaryArray: EmployeeSummary[] = [];
    let totalPayrollSum = 0;
    let totalDaysWorkedSum = 0;

    for (const cedula in summaryMap) {
      const summary = summaryMap[cedula];
      summary.effectiveDays = summary.datesWorked.size;
      let payment = summary.effectiveDays * summary.dailySalary;

      if (summary.employee.sede.toUpperCase() === "REDES") {
        let firstHalfDays = 0;
        let secondHalfDays = 0;

        summary.datesWorked.forEach(day => {
          if (day <= 15) firstHalfDays++;
          else secondHalfDays++;
        });

        let firstHalfPayment =
          firstHalfDays >= 14
            ? summary.biweeklySalary / 2
            : firstHalfDays * (summary.employee.salario_mensual / 30);

        let secondHalfPayment =
          secondHalfDays >= 15
            ? summary.biweeklySalary / 2
            : secondHalfDays * (summary.employee.salario_mensual / 30);

        payment = firstHalfPayment + secondHalfPayment;
      }

      summary.computedPayment = Math.round(payment);
      totalPayrollSum += summary.computedPayment;
      totalDaysWorkedSum += summary.effectiveDays;
      summaryArray.push(summary);
    }

    setSummaryList(summaryArray);
    setTotalPayroll(totalPayrollSum);
    setTotalDaysWorked(totalDaysWorkedSum);
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
        <label>Sede:
          <select value={sedeFilter} onChange={e => setSedeFilter(e.target.value)}>
            <option value="TODAS">TODAS</option>
            <option value="METROCENTRO">METROCENTRO</option>
            <option value="NUESTRO ATLANTICO">NUESTRO ATLANTICO</option>
            <option value="REDES">REDES</option>
            <option value="CENTRO">CENTRO</option>
          </select>
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
          <tfoot>
            <tr>
              <td colSpan={3}><strong>Total:</strong></td>
              <td><strong>{formatNumber(totalDaysWorked)}</strong></td>
              <td></td>
              <td></td>
              <td><strong>${formatNumber(totalPayroll)}</strong></td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p>No hay datos disponibles. Realiza una búsqueda.</p>
      )}
    </div>
  );
};

export default Dashboard;