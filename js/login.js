// ==========================================
// LÓGICA DE LOGIN (Corregida y Limpia)
// ==========================================

// Nota: 'sb' viene cargado desde js/supabase.js. No lo redeclaramos aquí.

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. UI: Feedback de carga visual
    const btn = document.getElementById('btnLog');
    const errorMsg = document.getElementById('errorMsg');
    const originalText = btn.innerText; // Guardamos texto original "Iniciar Sesión"
    
    // Bloquear botón y mostrar spinner
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';
    errorMsg.style.display = 'none';

    // 2. CAPTURAR DATOS (¡Con .trim() para borrar espacios!)
    const email = document.getElementById('email').value.trim(); 
    const password = document.getElementById('password').value.trim();

    try {
        // Validación básica antes de enviar
        if (!email || !password) {
            throw new Error("Por favor, completa todos los campos.");
        }

        console.log("Intentando login en:", sb.supabaseUrl); // Para depurar en consola

        // 3. AUTENTICACIÓN (Login)
        const { data: authData, error: authError } = await sb.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        // 4. VERIFICACIÓN DE ROL (Seguridad)
        const { data: profile, error: profileError } = await sb
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single();

        // Si no hay perfil, lanzamos error aunque el login haya funcionado
        if (profileError || !profile) {
            throw new Error("Usuario autenticado pero sin perfil asignado.");
        }

        // 5. ENRUTAMIENTO (Router)
        const role = profile.role; 
        console.log("✅ Acceso concedido. Rol detectado:", role);

        if (role === 'supervisor') {
            window.location.href = 'dashboard.html';
        } else if (role === 'technician' || role === 'client') {
            window.location.href = 'tickets.html';
        } else {
            throw new Error("Rol de usuario no reconocido.");
        }

    } catch (error) {
        console.error("❌ Login Error:", error);
        
        // Restaurar botón
        btn.disabled = false;
        btn.innerText = "Iniciar Sesión"; // Texto manual para asegurar
        
        // Mensajes amigables para el humano
        let msg = "Credenciales incorrectas.";
        
        if(error.message.includes("Invalid login")) msg = "Usuario o contraseña incorrectos.";
        if(error.message.includes("Email not confirmed")) msg = "El correo no ha sido confirmado.";
        if(error.message.includes("network")) msg = "Error de conexión. Revisa tu internet.";
        
        errorMsg.innerText = `⚠️ ${msg}`;
        errorMsg.style.display = 'block';
    }
});
