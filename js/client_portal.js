const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let userProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar Sesión
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return window.location.href = "index.html";

    // 2. Cargar Perfil del Usuario para saber su Institución
    const { data: profile, error } = await sb
        .from('profiles')
        .select('*, institutions(name)')
        .eq('id', session.user.id)
        .single();

    if (error || !profile) {
        alert("Error de perfil. Contacte a soporte.");
        return;
    }

    userProfile = profile;

    // Llenar datos en la barra superior
    document.getElementById('clientName').textContent = profile.full_name || session.user.email;
    document.getElementById('clientInst').textContent = profile.institutions?.name || "Cliente Particular";

    // 3. Cargar Departamentos de SU Institución
    await loadDepartments();
    // 4. Cargar sus Tickets
    await loadMyTickets();
});


async function loadDepartments() {
    // RLS: La base de datos ya filtra, pero aquí filtramos por UI también
    if (!userProfile.institution_id) return; 

    const { data } = await sb.from('departments')
        .select('*')
        .eq('institution_id', userProfile.institution_id);
        
    const sel = document.getElementById('deptSelect');
    data?.forEach(d => {
        sel.innerHTML += `<option value="${d.id}">${d.name}</option>`;
    });
}

window.loadEquip = async (deptId) => {
    const sel = document.getElementById('equipSelect');
    sel.innerHTML = '<option>Cargando...</option>'; sel.disabled = true;

    if (!deptId) return;

    const { data } = await sb.from('equipment')
        .select('*')
        .eq('department_id', deptId);

    sel.innerHTML = '<option value="">Seleccione Equipo...</option>';
    if (data.length === 0) sel.innerHTML = '<option value="">No hay equipos registrados aquí</option>';
    
    data?.forEach(e => {
        sel.innerHTML += `<option value="${e.id}">${e.model} (${e.serial_number})</option>`;
    });
    sel.disabled = false;
}

document.getElementById('newTicketForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userProfile.institution_id) {
        alert("Tu usuario no está vinculado a una institución. Contacta a CopierMaster.");
        return;
    }

    const btn = e.target.querySelector('button');
    const txt = btn.innerHTML;
    btn.innerHTML = "Enviando..."; btn.disabled = true;

    const payload = {
        institution_id: userProfile.institution_id,
        reported_by: userProfile.id,
        department_id: document.getElementById('deptSelect').value || null, // Si decides agregar este campo a tickets
        equipment_id: document.getElementById('equipSelect').value || null,
        title: document.getElementById('title').value,
        description: document.getElementById('desc').value,
        priority: document.querySelector('input[name="prio"]:checked').value,
        status: 'open'
    };

    const { error } = await sb.from('tickets').insert([payload]);

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("✅ Solicitud enviada exitosamente. Un técnico ha sido notificado.");
        e.target.reset();
        loadMyTickets();
    }
    btn.innerHTML = txt; btn.disabled = false;
});

async function loadMyTickets() {
    // La RLS (Seguridad) asegura que solo traiga mis tickets
    const { data } = await sb.from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

    const container = document.getElementById('ticketHistory');
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px;">No tienes tickets recientes.</div>';
        return;
    }

    data.forEach(t => {
        // Colores de estado
        let color = '#94a3b8'; // gris
        let label = 'Desconocido';
        
        if (t.status === 'open') { color = '#22c55e'; label = 'Abierto / Recibido'; }
        if (t.status === 'in_progress') { color = '#f59e0b'; label = 'Técnico Trabajando'; }
        if (t.status === 'resolved') { color = '#3b82f6'; label = 'Resuelto'; }
        if (t.status === 'closed') { color = '#64748b'; label = 'Cerrado'; }

        container.innerHTML += `
            <div class="ticket-history-item">
                <div>
                    <div style="font-weight:700; color:#334155; font-size:16px;">${t.title}</div>
                    <div style="font-size:13px; color:#64748b; margin-top:4px;">
                        #${t.id} • Reportado el ${new Date(t.created_at).toLocaleDateString()}
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="display:flex; align-items:center; font-size:13px; font-weight:600; color:${color};">
                        <span class="status-dot" style="background:${color}"></span> ${label}
                    </div>
                </div>
            </div>
        `;
    });
}

window.logout = async () => {
    await sb.auth.signOut();
    window.location.href = 'index.html';
}
