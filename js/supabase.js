// ==========================================
// CONEXIÓN MAESTRA A SUPABASE (PROYECTO NUEVO)
// ==========================================

// 1. Credenciales del Proyecto (Actualizadas)
const SUPABASE_URL = 'https://nyjfxoeqrineniitkkuz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TOOKrJsEhCvp7GGbxzuKrg_ulABKga_'; // Tu Anon Key pública

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
