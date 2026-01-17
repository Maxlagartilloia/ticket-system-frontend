// ==========================================
// DASHBOARD LOGIC (SUPABASE V2)
// ==========================================

// 1. TUS CLAVES (No las borres)
const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================================
// 1. VERIFICAR SESIÓN
// ================================
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = "index.html";
        return;
    }
    // Mostrar email en el saludo
    const emailDisplay = document.getElementById("userEmailDisplay");
    if(emailDisplay) emailDisplay.textContent = session.user.email;
}

// ================================
// 2. CARGAR MÉTRICAS
// ================================
async function loadDashboardStats() {
    try {
        console.log("Iniciando carga de métricas...");

        // A. OPEN TICKETS
        const { count: openCount, error: errOpen } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open');

        // B. IN PROGRESS TICKETS
        // Nota: Asegúrate que en tu base de datos usas 'in_progress' o 'open'
        const { count: progressCount, error: errProg } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'in_progress'); 

        // C. INSTITUTIONS (Aquí es donde se te quedaba pegado)
        const { count: instCount, error: errInst } = await supabase
            .from('institutions')
            .select('*', { count: 'exact', head: true });

        // D. USERS
        const { count: userCount, error: errUser } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // -- ACTUALIZAR HTML --
        updateCounter("openTickets", openCount, errOpen);
        updateCounter("inProgress", progressCount, errProg);
        updateCounter("institutions", instCount, errInst);
        updateCounter("totalUsers", userCount, errUser);

    } catch (globalError) {
        console.error("Error crítico en Dashboard:", globalError);
    }
}

// Función auxiliar para actualizar texto y quitar clase 'loading'
function updateCounter(elementId, value, error) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.classList.remove("loading-text"); // Quitar estilo gris de carga
    
    if (error) {
        console.error(`Error cargando ${elementId}:`, error.message);
        el.textContent = "-"; // Mostrar guion si falla
        el.style.color = "red";
    } else {
        el.textContent = value || 0; // Mostrar 0 si es null
    }
}

// ================================
// 3. CERRAR SESIÓN
// ================================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = "index.html";
});

// ================================
// INICIALIZACIÓN
// ================================
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    loadDashboardStats();
});
