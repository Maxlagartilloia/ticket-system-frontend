const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. UX: Mostrar estado de carga
    const btn = document.getElementById('btnLog');
    // Guardamos el texto original del botón (generalmente está dentro de un span con id btnText)
    const btnTextSpan = document.getElementById('btnText');
    const originalText = btnTextSpan ? btnTextSpan.innerText : "Iniciar Sesión"; 
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
        const { data: profile, error: profileError } = await sb
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single();

        if (profileError) throw new Error("Error al obtener perfil de usuario.");

        // 4. REDIRECCIÓN SEGURA SEGÚN ROL
        const role = profile.role; // 'admin', 'supervisor', 'client', 'technician'

        if (role === 'admin' || role === 'supervisor') {
            window.location.href = 'dashboard.html'; // Vista completa de Supervisor
        } else if (role === 'client') {
            window.location.href = 'client_portal.html'; // Vista de Cliente
        } else if (role === 'technician') {
            // CORREGIDO: Ahora dirige al Espacio de Trabajo Simplificado
            window.location.href = 'tech_workspace.html'; 
        } else {
            // Por seguridad, si el rol no coincide, lo mandamos al portal de cliente o lanzamos error
            window.location.href = 'client_portal.html';
        }

    } catch (error) {
        // Manejo de errores visual
        console.error(error);
        btn.disabled = false;
        
        // Restaurar botón (asegurando mantener el span si existe)
        btn.innerHTML = `<span id="btnText">${originalText}</span>`;
        
        errorMsg.innerText = "Error: Credenciales incorrectas o usuario no registrado.";
        errorMsg.style.display = 'block';
    }
});
