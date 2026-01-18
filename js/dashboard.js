const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

async function initDashboard() {
    // 1. Verificar Sesión
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        window.location.href = "index.html";
        return;
    }

    // 2. Cargar Nombre del Usuario (Auditoría: Identificación clara)
    loadUserProfile(session.user.id, session.user.email);

    // 3. Cargar KPIs (Evidencia de Operatividad)
    loadKPIs();
}

// Función para obtener nombre real
async function loadUserProfile(userId, email) {
    try {
        const { data: profile, error } = await sb
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();

        const nameEl = document.getElementById('userName');
        
        if (profile && profile.full_name) {
            nameEl.textContent = profile.full_name; // Ej: Alex Loor
        } else {
            nameEl.textContent = email; // Fallback al email si no hay nombre
        }
    } catch (err) {
        console.error("Error cargando perfil:", err);
    }
}

// Función centralizada de carga de contadores
async function loadKPIs() {
    // Tickets Abiertos
    safeCount('tickets', 'openTickets', { status: 'open' });
    
    // Tickets En Proceso
    safeCount('tickets', 'inProgress', { status: 'in_progress' });
    
    // Clientes (Instituciones)
    safeCount('institutions', 'institutions');
    
    // Equipos (Solo los instalados para ser más exactos, o todos si prefieres inventario total)
    // Aquí contamos TODOS los del inventario
    safeCount('equipment', 'equipment'); 
}

// Función auxiliar segura
async function safeCount(table, elementId, filter = null) {
    const el = document.getElementById(elementId);
    try {
        let query = sb.from(table).select('*', { count: 'exact', head: true });
        if (filter) query = query.match(filter);
        
        const { count, error } = await query;
        
        if (error) throw error;
        el.textContent = count || 0;
        
    } catch (err) {
        console.error(`Error contando ${table}:`, err);
        el.textContent = "0";
    }
}

// --- GESTIÓN DE MODAL Y CONTRASEÑA ---

window.openProfileModal = () => {
    document.getElementById('profileModal').style.display = 'flex';
}

window.closeProfileModal = () => {
    document.getElementById('profileModal').style.display = 'none';
}

// Lógica de cambio de contraseña
document.getElementById('passForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = document.getElementById('newPass').value;
    const p2 = document.getElementById('confPass').value;
    const btn = e.target.querySelector('.btn-confirm');
    const originalText = btn.innerHTML;

    if (p1.length < 6) return alert("⚠️ La contraseña debe tener al menos 6 caracteres.");
    if (p1 !== p2) return alert("⚠️ Las contraseñas no coinciden.");

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'; 
    btn.disabled = true;

    const { error } = await sb.auth.updateUser({ password: p1 });

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("✅ Contraseña actualizada correctamente.");
        closeProfileModal();
        e.target.reset();
    }
    btn.innerHTML = originalText; 
    btn.disabled = false;
});

// Botón Salir
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await sb.auth.signOut();
    window.location.href = "index.html";
});

// Inicializar al cargar
document.addEventListener("DOMContentLoaded", initDashboard);
