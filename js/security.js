// CONEXIÓN CENTRALIZADA (Para no repetir en todos lados)
const SUPABASE_URL_SEC = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_KEY_SEC = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 
// Usamos una variable global para que no choque con otros scripts
const sb_security = supabase.createClient(SUPABASE_URL_SEC, SUPABASE_KEY_SEC);

let inactivityTimer;
const TIME_LIMIT = 10 * 60 * 1000; // 10 Minutos en milisegundos

// Función que se ejecuta si el usuario se duerme
async function forceLogout() {
    console.warn("Tiempo de inactividad alcanzado. Cerrando sesión...");
    alert("🔒 Por tu seguridad, la sesión se cerró tras 10 minutos de inactividad.");
    
    await sb_security.auth.signOut();
    
    // Borrar cualquier rastro local
    localStorage.clear(); 
    sessionStorage.clear();
    
    // Mandar al login
    window.location.href = "index.html";
}

// Función para reiniciar el reloj (si mueves el mouse, no te saca)
function resetTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(forceLogout, TIME_LIMIT);
}

// Escuchar eventos de actividad humana
window.onload = resetTimer;
document.onmousemove = resetTimer;
document.onkeypress = resetTimer;
document.onclick = resetTimer;
document.ontouchstart = resetTimer; // Para celular/tablet
document.onscroll = resetTimer;

// Revisión inicial: ¿Tengo sesión? Si no, fuera.
(async () => {
    const { data: { session } } = await sb_security.auth.getSession();
    if (!session) {
        // Si no hay sesión y NO estamos en el login, sacar.
        if (!window.location.href.includes("index.html")) {
            window.location.href = "index.html";
        }
    }
})();
