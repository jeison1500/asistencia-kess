// Código completo corregido y funcional
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
  descanso_trabajado?: boolean;
}

interface AttendanceRecord {
  id: number;
  entrada: string;
  descanso_trabajado?: boolean; // ✅ ahora aquí, no en Employee
  empleados: Employee;
}

interface Discount {
  cedula: string;
  monto: number;
  fecha: string;
  tipo_descuento?: string;
}

interface EmployeeSummary {
  employee: Employee;
  datesWorked: Set<number>;
  effectiveDays: number;
  computedPayment: number;
  dailySalary: number;
  biweeklySalary: number;
  descuento?: number;
  descanso_trabajado?: boolean; // ✅ nuevo campo
  diasTarde?: string[]; // ✅ NUEVO
}

const Dashboard: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [sedeFilter, setSedeFilter] = useState<string>('TODAS');
  const [empleadoFilter, setEmpleadoFilter] = useState<string>('');
  const [summaryList, setSummaryList] = useState<EmployeeSummary[]>([]);
  const [totalPayroll, setTotalPayroll] = useState<number>(0);
  const [totalDaysWorked, setTotalDaysWorked] = useState<number>(0);
  const [descuentosTotales, setDescuentosTotales] = useState<{ cedula: string; nombre: string; apellido: string; total: number }[]>([]);
  const [descuentosDetalle, setDescuentosDetalle] = useState<Discount[]>([]);
  const [mostrarSoloDescuentos, setMostrarSoloDescuentos] = useState<boolean>(false);

  const formatNumber = (num: number) => num.toLocaleString();

  const handleResumenDescuentos = () => {
    setMostrarSoloDescuentos(true);
  };

  const handleMostrarTodo = () => {
    setMostrarSoloDescuentos(false);
  };

  const handleFiltrar = async () => {
    setMostrarSoloDescuentos(false);
    if (!fechaInicio || !fechaFin) {
      Swal.fire("Error", "Por favor, ingrese las fechas de inicio y fin.", "error");
      return;
    }

    const { data, error } = await supabase
    .from('asistencia')
    .select("id, entrada, descanso_trabajado, empleados:empleados(cedula, nombre, apellido, numero_cuenta, tipo_cuenta, banco, salario_diario, salario_mensual, sede)")
    .gte('entrada', fechaInicio)
    .lte('entrada', fechaFin);
  

    if (error) {
      Swal.fire("Error", error.message, "error");
      return;
    }

    const { data: descuentosData, error: errorDescuentos } = await supabase
      .from('descuentos_nomina')
      .select('cedula, monto, fecha, tipo_descuento')
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin);

    if (errorDescuentos) {
      Swal.fire("Error", "No se pudieron cargar los descuentos.", "error");
      return;
    }

    const descuentosPorEmpleado: { [cedula: string]: number } = {};
    (descuentosData as Discount[]).forEach(desc => {
      if (!descuentosPorEmpleado[desc.cedula]) {
        descuentosPorEmpleado[desc.cedula] = 0;
      }
      descuentosPorEmpleado[desc.cedula] += desc.monto;
    });

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
          descanso_trabajado: record.descanso_trabajado ?? false,// ✅ aquí guardamos el valor
          diasTarde: [] // ✅ inicializar
        };
      }
      
const horaEntrada = new Date(record.entrada);
const esDomingo = horaEntrada.getDay() === 0;

const horaLimite = new Date(horaEntrada);
const sede = emp.sede.toUpperCase();

if (sede === "REDES" || sede === "CENTRO") {
  horaLimite.setHours(8, 4, 59); // Hasta 08:04:59 AM
} else if (sede === "METROCENTRO" || sede === "NUESTRO ATLANTICO" || sede === "CARNAVAL") {
  horaLimite.setHours(10, 4, 59); // Hasta 10:04:59 AM
} else {
  horaLimite.setHours(23, 59, 59); // No aplica control
}

if (!esDomingo && horaEntrada > horaLimite) {
  summaryMap[emp.cedula].diasTarde!.push(horaEntrada.toLocaleDateString());
}

// if (horaEntrada > horaLimite) {
//   summaryMap[emp.cedula].diasTarde!.push(horaEntrada.toLocaleDateString());
// }


      if (emp.sede.toUpperCase() === "REDES" && dayOfMonth === 31) return;
      summaryMap[emp.cedula].datesWorked.add(dayOfMonth);
      if (record.descanso_trabajado) {
        summaryMap[emp.cedula].descanso_trabajado = true;
      }
      
    });

    const summaryArray: EmployeeSummary[] = [];
    let totalPayrollSum = 0;
    let totalDaysWorkedSum = 0;
    const resumenArray: { cedula: string; nombre: string; apellido: string; total: number }[] = [];

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
    
        const dailyRate = summary.employee.salario_mensual / 30;
    
        // ✅ Obtener descanso_trabajado desde algún registro
        const descanso = summary.descanso_trabajado ?? false;


    
        let firstHalfPayment = 0;
        let secondHalfPayment = 0;
    
        if (firstHalfDays >= 14) {
          firstHalfPayment = dailyRate * 15;
          if (descanso && firstHalfDays <= 15) {
            firstHalfPayment += dailyRate; // ✅ Día adicional
            summary.effectiveDays += 1; // ✅ sumamos un día adicional
          }
        } else {
          firstHalfPayment = firstHalfDays * dailyRate;
        }
    
        if (secondHalfDays >= 14) {
          secondHalfPayment = dailyRate * 15;
          if (descanso && secondHalfDays <= 15) {
            secondHalfPayment += dailyRate; // ✅ Día adicional
            summary.effectiveDays += 1; // ✅ sumamos otro día si aplica
          }
        } else {
          secondHalfPayment = secondHalfDays * dailyRate;
        }
    
        payment = firstHalfPayment + secondHalfPayment;
      }
    
      const descuento = descuentosPorEmpleado[cedula] || 0;
      summary.computedPayment = Math.round(payment - descuento);
      summary.descuento = descuento;
      totalPayrollSum += summary.computedPayment;
      totalDaysWorkedSum += summary.effectiveDays;
      summaryArray.push(summary);
      resumenArray.push({ cedula, nombre: summary.employee.nombre, apellido: summary.employee.apellido, total: descuento });
    }
    

    setSummaryList(summaryArray);
    setTotalPayroll(totalPayrollSum);
    setTotalDaysWorked(totalDaysWorkedSum);
    setDescuentosTotales(resumenArray);
    setDescuentosDetalle(descuentosData as Discount[]);
  };

    const mostrarDiasTarde = (nombre: string, apellido: string, fechas: string[]) => {
  if (fechas.length === 0) {
    Swal.fire('Sin tardanzas', `${nombre} ${apellido} no llegó tarde durante este período.`, 'info');
    return;
  }

  const contenido = fechas.map(d => `• ${d}`).join('<br>');
  Swal.fire({
    title: `Días tarde de ${nombre} ${apellido}`,
    html: contenido,
    icon: 'warning'
  });
};


  const mostrarDetalleDescuentos = (cedula: string, nombre: string, apellido: string) => {

  
    const detalles = descuentosDetalle.filter(d => d.cedula === cedula);
    if (detalles.length === 0) {
      Swal.fire('Sin descuentos', `No se encontraron descuentos para ${nombre} ${apellido}`, 'info');
      return;
    }
    const contenido = detalles.map(d => `• ${d.tipo_descuento || 'Tipo no especificado'} - $${formatNumber(d.monto)} (${d.fecha})`).join('<br>');
    Swal.fire({
      title: `Descuentos de ${nombre} ${apellido}`,
      html: contenido,
      icon: 'info'
    });
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
            <option value="CARNAVAL">CARNAVAL</option>
          </select>
        </label>
        <label>Buscar Empleado:
    <input
      type="text"
      value={empleadoFilter}
      onChange={(e) => setEmpleadoFilter(e.target.value)}
      placeholder="Nombre, apellido o cédula"
    />
  </label>

        <button onClick={handleFiltrar}>Filtrar</button>
        <button onClick={() => window.print()} style={{ marginLeft: '1rem' }}>Imprimir</button>
        <button onClick={handleResumenDescuentos} style={{ marginLeft: '1rem' }}>Resumen de Descuento</button>
        {mostrarSoloDescuentos && (
          <button onClick={handleMostrarTodo} style={{ marginLeft: '1rem' }}>Mostrar Todo</button>
        )}
      </div>

      {!mostrarSoloDescuentos && summaryList.length > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>Empleado</th><th>N° Cuenta</th><th>Banco</th><th>Días Trabajados</th><th>Días Tarde</th><th>Valor Día</th><th>Valor Quincena</th><th>Descuentos</th><th>Pago Final</th>
              </tr>
            </thead>
            <tbody>
              {summaryList.map(summary => (
                <tr key={summary.employee.cedula}>
                  <td>{summary.employee.nombre} {summary.employee.apellido}</td>
                  <td>{summary.employee.numero_cuenta}</td>
                  <td>{summary.employee.banco}</td>
                  <td>{formatNumber(summary.effectiveDays)}</td>
                   <td>
        {summary.diasTarde && summary.diasTarde.length > 0 ? (
          <button onClick={() => mostrarDiasTarde(summary.employee.nombre, summary.employee.apellido, summary.diasTarde!)}>
            {summary.diasTarde.length} día(s)
          </button>
        ) : '0'}
      </td>
                  <td>${formatNumber(summary.dailySalary)}</td>
                  <td>${formatNumber(summary.biweeklySalary)}</td>
                  <td>${formatNumber(summary.descuento || 0)}</td>
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
                <td></td>
                <td><strong>${formatNumber(totalPayroll)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </>
      )}

      {mostrarSoloDescuentos && descuentosTotales.length > 0 && (
        <>
          <h3>Resumen de Descuentos</h3>
          <table>
            <thead>
              <tr>
                <th>Cédula</th><th>Empleado</th><th>Total Descuentos</th><th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {descuentosTotales.map(d => (
                <tr key={d.cedula}>
                  <td>{d.cedula}</td>
                  <td>{d.nombre} {d.apellido}</td>
                  <td>${formatNumber(d.total)}</td>
                  <td>
                    <button onClick={() => mostrarDetalleDescuentos(d.cedula, d.nombre, d.apellido)}>
                      Descuento
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default Dashboard;
