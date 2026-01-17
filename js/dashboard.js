// ==========================================
// DASHBOARD LOGIC - COPIERMASTER (SUPABASE VERSION)
// ==========================================

// 1. CONFIGURACIÓN
const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 

// Inicializamos cliente
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================================
// 1. AUTH GUARD (Protección)
// ================================
async function checkAuth() {
    // Verificamos sesión REAL en Supabase
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // Si no hay sesión, va para afuera
        window.location.href = "index.html";
        return;
    }

    // Mostrar el correo del usuario en la pantalla
    const userRoleDisplay = document.getElementById("userRoleDisplay");
    if (userRoleDisplay) {
        userRoleDisplay.textContent = session.user.email;
    }
}

// ================================
// 2. CARGAR ESTADÍSTICAS
// ================================
async function loadDashboardStats() {
    try {
        console.log("Consultando base de datos...");

        // A. Contar Tickets Abiertos
        const { count: openCount } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open');

        // B. Contar Tickets Cerrados
        const { count: closedCount } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'closed');

        // C. Contar Instituciones
        const { count: instCount } = await supabase
            .from('institutions')
            .select('*', { count: 'exact', head: true });

        // ACTUALIZAR EL HTML (Si es null pone 0)
        // Asegúrate que estos IDs existan en tu HTML
        const elOpen = document.getElementById("openTickets");
        const elClosed = document.getElementById("resolvedToday") || document.getElementById("resolvedTickets");
        const elInst = document.getElementById("institutions");

        if (elOpen) elOpen.textContent = openCount || 0;
        if (elClosed) elClosed.textContent = closedCount || 0;
        if (elInst) elInst.textContent = instCount || 0;

    } catch (error) {
        console.error("Error cargando dashboard:", error);
    }
}

// ================================
// 3. LOGOUT
// ================================
async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = "index.html";
}

// Vincula el botón de logout si existe
const logoutBtn = document.getElementById("logoutBtn");
if(logoutBtn) logoutBtn.addEventListener("click", handleLogout);

// INICIALIZAR
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    loadDashboardStats();
});
