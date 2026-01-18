// CONEXIÓN CENTRALIZADA
const SUPABASE_URL_SEC = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_KEY_SEC = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 
const sb_security = supabase.createClient(SUPABASE_URL_SEC, SUPABASE_KEY_SEC);

let inactivityTimer;
const TIME_LIMIT = 10 * 60 * 1000; // 10 Minutos

// Función de logout forzado
async function forceLogout() {
    console.warn("Tiempo de inactividad alcanzado.");
    await sb_security.auth.signOut();
    localStorage.clear(); 
    sessionStorage.clear();
    window.location.href = "index.html";
}

function resetTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(forceLogout, TIME_LIMIT);
}

// Eventos de actividad
window.onload = resetTimer;
document.onmousemove = resetTimer;
document.onkeypress = resetTimer;
document.onclick = resetTimer;
document.ontouchstart = resetTimer; 
document.onscroll = resetTimer;

// Protección de Rutas
(async () => {
    const { data: { session } } = await sb_security.auth.getSession();
    const path = window.location.pathname;
    const page = path.split("/").pop();
    
    // Páginas públicas
    const publicPages = ['index.html', 'register.html', '']; 

    if (!session) {
        // Si no hay sesión y NO es página pública -> Login
        if (!publicPages.includes(page)) {
            window.location.href = "index.html";
        }
    } else {
        // Si hay sesión y estoy en Login -> Redirigir según rol
        if (page === 'index.html' || page === '') {
            const { data: profile } = await sb_security.from('profiles').select('role').eq('id', session.user.id).single();
            if (profile?.role === 'technician') window.location.href = 'tech_workspace.html';
            else if (profile?.role === 'client') window.location.href = 'client_portal.html';
            else window.location.href = 'dashboard.html';
        }
    }
})();
