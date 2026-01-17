const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // Si ya hay sesión, redirigir según rol
    const { data: { session } } = await sb.auth.getSession();
    if (session) await redirectUser(session.user.id);
});

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = "Verificando..."; btn.disabled = true;

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Login exitoso, ahora verificamos quién es
        await redirectUser(data.session.user.id);

    } catch (err) {
        alert("Error de acceso: " + err.message);
        btn.textContent = originalText; btn.disabled = false;
    }
});

async function redirectUser(userId) {
    // Consultamos el perfil para ver el ROL
    const { data: profile, error } = await sb
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        console.error("Error perfil:", error);
        // Si falla, lo mandamos al portal cliente por seguridad
        window.location.href = "client_portal.html"; 
        return;
    }

    console.log("Rol detectado:", profile.role);

    // EL CEREBRO DEL RUTEO
    if (profile.role === 'admin' || profile.role === 'supervisor' || profile.role === 'technician') {
        window.location.href = "dashboard.html"; // Panel de Control Completo
    } else {
        window.location.href = "client_portal.html"; // Portal Simplificado
    }
}
