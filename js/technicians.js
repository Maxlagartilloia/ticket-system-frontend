const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');
let currentUserRole = null;

document.addEventListener("DOMContentLoaded", async () => {
    await checkMyRole(); // Para saber si puedo editar a otros
    loadTechnicians();
});

// 1. VERIFICAR MI PROPIO ROL (Seguridad Visual)
async function checkMyRole() {
    const { data: { user } } = await sb.auth.getUser();
    if(user) {
        const { data } = await sb.from('profiles').select('role').eq('id', user.id).single();
        currentUserRole = data?.role;
    }
}

// 2. CARGAR PERSONAL Y SUS ESTADÍSTICAS
async function loadTechnicians() {
    const grid = document.getElementById('techGrid');
    
    // A. Traer perfiles
    const { data: profiles, error } = await sb.from('profiles').select('*').order('full_name');
    if(error) return console.error(error);

    // B. Traer Tickets para calcular carga de trabajo
    const { data: tickets } = await sb.from('tickets').select('technician_id, status');

    grid.innerHTML = '';
    
    profiles.forEach(p => {
        // Calcular Stats
        const myTickets = tickets.filter(t => t.technician_id === p.id);
        const active = myTickets.filter(t => t.status !== 'closed').length;
        const closed = myTickets.filter(t => t.status === 'closed').length;

        // Estilos según rol
        const isSup = p.role === 'supervisor';
        const roleClass = isSup ? 'role-supervisor' : 'role-technician';
        const roleLabel = isSup ? 'SUPERVISOR' : 'TÉCNICO';
        const icon = isSup ? 'fa-user-tie' : 'fa-screwdriver-wrench';

        // Botón de cambio de rol (Solo si soy Supervisor)
        let actionBtn = '';
        if (currentUserRole === 'supervisor') {
            const nextRole = isSup ? 'technician' : 'supervisor';
            const tooltip = isSup ? 'Degradar a Técnico' : 'Ascender a Supervisor';
            const btnIcon = isSup ? 'fa-arrow-down' : 'fa-arrow-up';
            
            actionBtn = `
                <div class="card-actions">
                    <button class="btn-mini" title="${tooltip}" onclick="toggleRole('${p.id}', '${nextRole}')">
                        <i class="fas ${btnIcon}"></i>
                    </button>
                </div>`;
        }

        // Renderizar Tarjeta
        grid.innerHTML += `
            <div class="tech-card">
                ${actionBtn}
                <div class="avatar-circle">
                    <i class="fas ${icon}"></i>
                </div>
                <div style="font-weight:700; font-size:16px; color:#1e293b; margin-bottom:5px;">
                    ${p.full_name || 'Sin Nombre'}
                </div>
                <div style="font-size:12px; color:#64748b; margin-bottom:10px;">
                    ${p.email}
                </div>
                <span class="role-badge ${roleClass}">${roleLabel}</span>

                <div class="tech-stats">
                    <div class="stat-item">
                        <div class="stat-val" style="color:#ef4444;">${active}</div>
                        <div class="stat-lbl">Activos</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-val" style="color:#10b981;">${closed}</div>
                        <div class="stat-lbl">Cerrados</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-val">${myTickets.length}</div>
                        <div class="stat-lbl">Total</div>
                    </div>
                </div>
            </div>
        `;
    });
}

// 3. CAMBIAR ROL (Ascender/Degradar)
window.toggleRole = async (userId, newRole) => {
    if(!confirm(`¿Estás seguro de cambiar el rol a ${newRole.toUpperCase()}?`)) return;

    const { error } = await sb.from('profiles').update({ role: newRole }).eq('id', userId);
    
    if(error) alert("Error: " + error.message);
    else {
        // alert("Rol actualizado.");
        loadTechnicians(); // Recargar visualmente
    }
}
