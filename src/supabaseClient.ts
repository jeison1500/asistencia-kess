

import { createClient } from "@supabase/supabase-js";


const supabaseUrl = "https://btzikssxfsyromamepgj.supabase.co"; // Reemplaza con tu URL de Supabase
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0emlrc3N4ZnN5cm9tYW1lcGdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNzQ3MjMsImV4cCI6MjA1NTg1MDcyM30.eKXGVYA4paeeWjEctp2OROjLJX9NlOK2NRB1OPVA_DQ"; // Reemplaza con tu clave anónima


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Mantiene la sesión activa
    autoRefreshToken: true, // Actualiza automáticamente el token de autenticación
    detectSessionInUrl: true,
  },

  
});




