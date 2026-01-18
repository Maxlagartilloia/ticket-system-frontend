const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. UX: Mostrar estado de carga
    const btn = document.getElementById('btnLog');
    const originalText = document.getElementById('btnText').innerText;
    const errorMsg = document.getElementById('errorMsg');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';
    errorMsg.style.display = 'none';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // 2. Autenticación con Supabase
        const { data: authData, error: authError } = await sb.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // 3. OBTENER ROL (Vital para redirección)
        // Consultamos la tabla 'profiles' para saber quién es
        const { data: profile, error: profileError } = await sb
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single();

        if (profileError) throw new Error("Error al obtener perfil de usuario.");

        // 4. REDIRECCIÓN SEGURA SEGÚN ROL
        // Aquí cumplimos el requisito de separar las vistas
        const role = profile.role; // 'admin', 'client', 'technician'

        if (role === 'admin' || role === 'supervisor') {
            window.location.href = 'dashboard.html'; // Vista completa
        } else if (role === 'client') {
            window.location.href = 'client_portal.html'; // Vista de Auditoría y Reportes
        } else if (role === 'technician') {
            window.location.href = 'tickets.html'; // Vista operativa (o technician_workspace.html si lo creamos luego)
        } else {
            throw new Error("Rol de usuario no reconocido.");
        }

    } catch (error) {
        // Manejo de errores visual
        console.error(error);
        btn.disabled = false;
        btn.innerHTML = originalText;
        errorMsg.innerText = "Error: Credenciales incorrectas o usuario no registrado.";
        errorMsg.style.display = 'block';
    }
});
