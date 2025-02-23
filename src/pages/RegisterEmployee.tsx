import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2';
import NavBar from '../components/NavBar';

interface EmployeeFormData {
  nombre: string;
  apellido: string;
  cedula: string;
  cargo: string;
  sede: string;
  fecha_ingreso: string;
  numero_cuenta: string;
  tipo_cuenta: string;
  banco: string;
  salario_diario: string;
  salario_mensual: string;
}

const RegisterEmployee: React.FC = () => {
  const [formData, setFormData] = useState<EmployeeFormData>({
    nombre: '',
    apellido: '',
    cedula: '',
    cargo: 'ADMINISTRADOR',
    sede: 'METROCENTRO',
    fecha_ingreso: '',
    numero_cuenta: '',
    tipo_cuenta: '',
    banco: '',
    salario_diario: '',
    salario_mensual: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async () => {
    // Verifica que todos los campos estén completos
    if (
      !formData.nombre ||
      !formData.apellido ||
      !formData.cedula ||
      !formData.fecha_ingreso ||
      !formData.numero_cuenta ||
      !formData.tipo_cuenta ||
      !formData.banco ||
      !formData.salario_diario ||
      !formData.salario_mensual
    ) {
      Swal.fire("Error", "Complete todos los campos obligatorios.", "error");
      return;
    }

    // Convertir los valores de salario a números (sin tomar en cuenta puntos ni comas)
    // Se espera que el usuario ingrese solo dígitos.
    const dailyVal = parseInt(formData.salario_diario.trim(), 10);
    const monthlyVal = parseInt(formData.salario_mensual.trim(), 10);

    // Validar que exactamente uno de los dos salarios sea mayor que 0.
    if ((dailyVal > 0 && monthlyVal > 0) || (dailyVal === 0 && monthlyVal === 0)) {
      Swal.fire(
        "Error",
        "Debe ingresar el salario en solo uno de los campos: Si es salario diario, el salario mensual debe ser 0; si es salario mensual, el salario diario debe ser 0.",
        "error"
      );
      return;
    }

    // Inserción en la base de datos
    const { error } = await supabase.from('empleados').insert([
      {
        nombre: formData.nombre,
        apellido: formData.apellido,
        cedula: formData.cedula,
        cargo: formData.cargo,
        sede: formData.sede,
        fecha_ingreso: formData.fecha_ingreso,
        numero_cuenta: formData.numero_cuenta,
        tipo_cuenta: formData.tipo_cuenta,
        banco: formData.banco,
        salario_diario: dailyVal,
        salario_mensual: monthlyVal
      }
    ]);

    if (error) {
      Swal.fire("Error", error.message, "error");
    } else {
      Swal.fire("Éxito", "Empleado registrado.", "success");
      // Limpiar el formulario
      setFormData({
        nombre: '',
        apellido: '',
        cedula: '',
        cargo: 'ADMINISTRADOR',
        sede: 'METROCENTRO',
        fecha_ingreso: '',
        numero_cuenta: '',
        tipo_cuenta: '',
        banco: '',
        salario_diario: '',
        salario_mensual: ''
      });
    }
  };

  return (
    <div className="container">
      <NavBar />
      <h2>Crear Empleado</h2>
      <input 
        type="text" 
        placeholder="Nombre" 
        name="nombre" 
        value={formData.nombre} 
        onChange={handleChange} 
      />
      <input 
        type="text" 
        placeholder="Apellido" 
        name="apellido" 
        value={formData.apellido} 
        onChange={handleChange} 
      />
      <input 
        type="text" 
        placeholder="Cédula" 
        name="cedula" 
        value={formData.cedula} 
        onChange={handleChange} 
      />
      
      <select name="cargo" value={formData.cargo} onChange={handleChange}>
        <option value="ADMINISTRADOR">ADMINISTRADOR</option>
        <option value="ASESOR">ASESOR</option>
        <option value="BODEGUERO">BODEGUERO</option>
      </select>
      
      <select name="sede" value={formData.sede} onChange={handleChange}>
        <option value="METROCENTRO">METROCENTRO</option>
        <option value="NUESTRO ATLANTICO">NUESTRO ATLANTICO</option>
        <option value="REDES">REDES</option>
        <option value="CENTRO">CENTRO</option>
      </select>
      
      <input 
        type="date" 
        name="fecha_ingreso" 
        value={formData.fecha_ingreso} 
        onChange={handleChange} 
      />
      <input 
        type="text" 
        placeholder="Número de cuenta" 
        name="numero_cuenta" 
        value={formData.numero_cuenta} 
        onChange={handleChange} 
      />
      <input 
        type="text" 
        placeholder="Tipo de cuenta" 
        name="tipo_cuenta" 
        value={formData.tipo_cuenta} 
        onChange={handleChange} 
      />
      <input 
        type="text" 
        placeholder="Banco" 
        name="banco" 
        value={formData.banco} 
        onChange={handleChange} 
      />
      
      {/* Instrucción para los campos de salario */}
      <p style={{ fontSize: '0.9rem', color: '#555' }}>
        Ingrese el valor del salario sin puntos ni comas. Si es salario diario, ingrese 0 en el campo de salario mensual; si es salario mensual, ingrese 0 en el campo de salario diario.
      </p>
      
      <input 
        type="text" 
        placeholder="Salario Diario" 
        name="salario_diario" 
        value={formData.salario_diario} 
        onChange={handleChange} 
      />
      <input 
        type="text" 
        placeholder="Salario Mensual" 
        name="salario_mensual" 
        value={formData.salario_mensual} 
        onChange={handleChange} 
      />
      
      <button onClick={handleRegister}>Registrar Empleado</button>
    </div>
  );
};

export default RegisterEmployee;
