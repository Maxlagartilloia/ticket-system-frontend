// ==========================================
// CONEXIÓN MAESTRA A SUPABASE
// ==========================================

// 1. Credenciales del Proyecto (Copiadas de tu consola)
const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; // Tu Anon Key pública

// 2. Verificar que la librería existe (Evita pantalla blanca)
if (typeof supabase === 'undefined') {
    console.error('CRÍTICO: La librería @supabase/supabase-js no se ha cargado. Revisa tu HTML.');
    alert("Error del sistema: Librería de conexión no encontrada.");
}

// 3. Crear e Inicializar Cliente
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 4. Exportar para uso global (Opcional, pero útil para debug)
window.sb = sb;

console.log("✅ Sistema Conectado a Supabase CopierMaster");
