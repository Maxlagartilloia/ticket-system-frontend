// ==========================================
// CONEXIÓN MAESTRA A SUPABASE (NUEVA)
// ==========================================

// ⚠️ IMPORTANTE: Como creaste un proyecto nuevo, tu URL también cambió.
// Ve a Supabase -> Project Settings -> API -> URL y pégala aquí abajo.
const SUPABASE_URL = 'AQUÍ_VA_TU_NUEVA_URL_DE_SUPABASE'; // Ej: https://xyzxyzxyz.supabase.co

// ✅ Esta es tu llave pública (Anon Key). Es seguro ponerla aquí.
const SUPABASE_KEY = 'sb_publishable_TOOKrJsEhCvp7GGbxzuKrg_ulABKga_';

// 2. Verificar que la librería existe (Evita pantalla blanca)
if (typeof supabase === 'undefined') {
    console.error('CRÍTICO: La librería @supabase/supabase-js no se ha cargado. Revisa tu HTML.');
    alert("Error del sistema: Librería de conexión no encontrada.");
}

// 3. Crear e Inicializar Cliente
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 4. Exportar para uso global
window.sb = sb;

console.log("✅ Sistema Conectado a Supabase CopierMaster (Nueva BD)");
