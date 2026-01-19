const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');
let currentUserRole = null;

document.addEventListener("DOMContentLoaded", async () => {
    await checkMyRole();
    loadTechnicians();
});

// 1. VERIFICAR MI ROL
async function checkMyRole() {
    const { data: { user } } = await sb.auth.getUser();
    if(user) {
        const { data } = await sb.from('profiles').select('role').eq('id', user.id).single();
        currentUserRole = data?.role;
    }
}

// 2. CARGAR PERSONAL (Versión Blindada)
async function loadTechnicians() {
    const grid = document.getElementById('techGrid');
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center;">Cargando...</div>';
    
    // A. Traer perfiles (Esto debería funcionar siempre gracias al SQL del Paso 1)
    const { data: profiles, error } = await sb.from('profiles').select('*').order('full_name');
    
    if(error) {
        console.error("Error perfiles:", error);
        grid.innerHTML = '<div style="color:red; text-align:center;">Error cargando personal.</div>';
        return;
    }

    if(!profiles || profiles.length === 0) {
        grid.innerHTML = '<div style="text-align:center; padding:20px;">No se encontraron técnicos registrados.</div>';
        return;
    }

    // B. Intentar traer Tickets para estadísticas (Si falla por permisos, no rompe la app)
    let tickets = [];
    try {
        const { data: t } = await sb.from('tickets').select('technician_id, status');
        if(t) tickets = t;
    } catch (e) {
        console.warn("No se pudieron cargar estadísticas de tickets (posible restricción de permisos).");
    }

    grid.innerHTML = '';
    
    profiles.forEach(p => {
        // Calcular Stats (seguro contra fallos)
        const myTickets = tickets.filter(t => t.technician_id === p.id);
        const active = myTickets.filter(t => t.status !== 'closed').length;
        const closed = myTickets.filter(t => t.status === 'closed').length;

        // Estilos
        const isSup = p.role === 'supervisor';
        const roleClass = isSup ? 'role-supervisor' : 'role-technician';
        const roleLabel = isSup ? 'SUPERVISOR' : 'TÉCNICO';
        const icon = isSup ? 'fa-user-tie' : 'fa-screwdriver-wrench';

        // Botón cambio de rol (Solo Jefes)
        let actionBtn = '';
        if (currentUserRole === 'supervisor') {
            const nextRole = isSup ? 'technician' : 'supervisor';
            const btnIcon = isSup ? 'fa-arrow-down' : 'fa-arrow-up';
            actionBtn = `
                <div class="card-actions">
                    <button class="btn-mini" onclick="toggleRole('${p.id}', '${nextRole}')">
                        <i class="fas ${btnIcon}"></i>
                    </button>
                </div>`;
        }

        grid.innerHTML += `
            <div class="tech-card">
                ${actionBtn}
                <div class="avatar-circle"><i class="fas ${icon}"></i></div>
                <div style="font-weight:700; font-size:16px; color:#1e293b; margin-bottom:5px;">${p.full_name || 'Sin Nombre'}</div>
                <div style="font-size:12px; color:#64748b; margin-bottom:10px;">${p.email}</div>
                <span class="role-badge ${roleClass}">${roleLabel}</span>
                <div class="tech-stats">
                    <div class="stat-item"><div class="stat-val" style="color:#ef4444;">${active}</div><div class="stat-lbl">Activos</div></div>
                    <div class="stat-item"><div class="stat-val" style="color:#10b981;">${closed}</div><div class="stat-lbl">Cerrados</div></div>
                    <div class="stat-item"><div class="stat-val">${myTickets.length}</div><div class="stat-lbl">Total</div></div>
                </div>
            </div>`;
    });
}

// 3. CAMBIAR ROL
window.toggleRole = async (userId, newRole) => {
    if(!confirm(`¿Cambiar rol a ${newRole}?`)) return;
    await sb.from('profiles').update({ role: newRole }).eq('id', userId);
    loadTechnicians();
}
