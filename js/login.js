const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. Verificar si ya hay sesión al abrir
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        await checkRoleAndRedirect(session.user.id);
    }
});

// 2. Manejar el click en "Iniciar Sesión"
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btnLog');
    const alertBox = document.getElementById('errorMsg');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // UI Loading
    btn.textContent = "Verificando..."; btn.disabled = true;
    alertBox.style.display = 'none';

    try {
        // A. Login con Supabase
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        
        if (error) throw error;

        // B. Si pasa, verificar ROL en la base de datos
        await checkRoleAndRedirect(data.session.user.id);

    } catch (err) {
        console.error("Login error:", err);
        alertBox.textContent = "Error: Credenciales incorrectas o usuario no registrado.";
        alertBox.style.display = 'block';
        btn.textContent = "Iniciar Sesión"; btn.disabled = false;
    }
});

// 3. Función Cerebro: ¿A dónde te mando?
async function checkRoleAndRedirect(userId) {
    // Consultar tabla 'profiles' que creamos en el Paso 1
    const { data: profile, error } = await sb
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        // Si el usuario existe en Auth pero no en la tabla profiles (puede pasar si se borró la tabla)
        // Lo mandamos al portal cliente por seguridad y para que no se trabe
        console.warn("Perfil no encontrado, asumiendo cliente.");
        window.location.href = "client_portal.html";
        return;
    }

    console.log("Rol detectado:", profile.role);

    // LÓGICA DE DIRECCIONAMIENTO
    if (['admin', 'supervisor', 'technician'].includes(profile.role)) {
        // Si eres Staff, vas al Panel de Control
        window.location.href = "dashboard.html"; 
    } else {
        // Si eres Cliente (o cualquier otro), vas al Portal de Servicio
        window.location.href = "client_portal.html"; 
    }
}
