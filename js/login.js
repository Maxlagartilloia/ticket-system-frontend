// CONEXIÓN MAESTRA (Verificada con tus capturas)
const sb = supabase.createClient(
    'https://esxojlfcjwtahkcrqxkd.supabase.co', 
    'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'
);

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. UI: Feedback de carga
    const btn = document.getElementById('btnLog');
    const errorMsg = document.getElementById('errorMsg');
    const originalText = btn.innerText;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';
    errorMsg.style.display = 'none';

    const email = document.getElementById('email').value.trim(); // Trim para evitar espacios fantasma
    const password = document.getElementById('password').value;

    try {
        // 2. AUTENTICACIÓN
        const { data: authData, error: authError } = await sb.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // 3. VERIFICACIÓN DE ROL (Seguridad)
        const { data: profile, error: profileError } = await sb
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profile) {
            throw new Error("Usuario autenticado pero sin perfil asignado.");
        }

        // 4. ENRUTAMIENTO INTELIGENTE (Según Documento Maestro)
        const role = profile.role; 
        console.log("Acceso concedido. Rol:", role);

        if (role === 'supervisor' || role === 'admin') {
            // El Jefe va al Dashboard General
            window.location.href = 'dashboard.html';
        } else if (role === 'technician') {
            // El Técnico va directo a trabajar (Help Desk)
            window.location.href = 'tickets.html';
        } else if (role === 'client') {
            // El Cliente va directo a ver sus tickets (Help Desk Filtrado)
            window.location.href = 'tickets.html';
        } else {
            // Rol desconocido (Seguridad)
            throw new Error("Rol de usuario no reconocido.");
        }

    } catch (error) {
        console.error("Login Error:", error);
        btn.disabled = false;
        btn.innerText = originalText;
        
        let msg = "Credenciales incorrectas.";
        // Mensajes amigables según el error
        if(error.message.includes("Invalid login")) msg = "Usuario o contraseña incorrectos.";
        if(error.message.includes("Email not confirmed")) msg = "El correo no ha sido confirmado.";
        if(error.message.includes("sin perfil")) msg = "Error de integridad de datos (Perfil no encontrado).";
        
        errorMsg.innerText = `Error: ${msg}`;
        errorMsg.style.display = 'block';
    }
});
