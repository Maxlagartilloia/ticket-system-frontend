// CONEXIÓN A SUPABASE
const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function init() {
    // 1. Verificar Sesión
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        window.location.href = "index.html";
        return;
    }

    // Mostrar correo del usuario
    document.getElementById('userEmail').textContent = session.user.email;

    // 2. Cargar Contadores (Con manejo de errores para que no se quede cargando)
    safeCount('tickets', 'openTickets', { status: 'open' });
    safeCount('tickets', 'inProgress', { status: 'in_progress' });
    safeCount('institutions', 'institutions');
    safeCount('equipment', 'equipment');
}

// Función segura: Si falla, pone 0
async function safeCount(table, elementId, filter = null) {
    const el = document.getElementById(elementId);
    try {
        let query = sb.from(table).select('*', { count: 'exact', head: true });
        if (filter) query = query.match(filter);
        
        const { count, error } = await query;
        
        if (error) {
            console.error(`Error contando ${table}:`, error);
            el.textContent = "0"; // En caso de error, mostrar 0
        } else {
            el.textContent = count || 0;
        }
    } catch (err) {
        console.error("Error crítico JS:", err);
        el.textContent = "0";
    }
}

// Botón Salir
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await sb.auth.signOut();
    window.location.href = "index.html";
});

// Iniciar al cargar
document.addEventListener("DOMContentLoaded", init);
