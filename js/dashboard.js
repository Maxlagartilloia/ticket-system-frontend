const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function init() {
    // 1. Verificar sesión
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return window.location.href = "index.html";
    
    // Mostrar usuario
    document.getElementById('userDisplay').textContent = session.user.email;

    // 2. Cargar KPIs (Manejo de errores mejorado)
    safeCount('tickets', 'openTickets', { status: 'open' });
    safeCount('tickets', 'inProgress', { status: 'in_progress' });
    safeCount('institutions', 'institutions');
    safeCount('equipment', 'equipment');
}

async function safeCount(table, elementId, filter = null) {
    const el = document.getElementById(elementId);
    try {
        let query = sb.from(table).select('*', { count: 'exact', head: true });
        if (filter) query = query.match(filter);
        
        const { count, error } = await query;
        
        if (error) {
            console.warn(`Error contando ${table}:`, error.message);
            el.textContent = "0"; // Fallback elegante
        } else {
            el.textContent = count || 0;
        }
    } catch (err) {
        console.error("Error crítico:", err);
        el.textContent = "-";
    }
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await sb.auth.signOut();
    window.location.href = "index.html";
});

document.addEventListener("DOMContentLoaded", init);
