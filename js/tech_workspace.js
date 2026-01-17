const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');
let currentUser = null;
let activeTicketId = null;

async function init() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return window.location.href = 'index.html';
    
    // Obtener nombre
    const { data: profile } = await sb.from('profiles').select('full_name').eq('id', session.user.id).single();
    document.getElementById('techName').textContent = profile?.full_name || 'Técnico';
    currentUser = session.user;

    loadTickets();
}

async function loadTickets() {
    // 1. Buscar ticket ACTIVO (Status = in_progress) asignado a mí
    const { data: active } = await sb.from('tickets')
        .select('*, institutions(name), equipment(model, serial_number)')
        .eq('assigned_to', currentUser.id)
        .eq('status', 'in_progress')
        .maybeSingle();

    const activeZone = document.getElementById('activeZone');

    if (active) {
        activeTicketId = active.id;
        // RENDERIZAR TARJETA DE TRABAJO ACTIVO
        activeZone.innerHTML = `
            <div class="active-job-card">
                <div class="job-header">
                    <span class="job-id">#${active.id} - ${active.title}</span>
                    <span class="job-status">EN PROCESO ⏳</span>
                </div>
                <div class="job-detail-row"><i class="fas fa-building"></i> ${active.institutions?.name}</div>
                <div class="job-detail-row"><i class="fas fa-print"></i> ${active.equipment?.model} (${active.equipment?.serial_number})</div>
                <div class="job-detail-row"><i class="fas fa-clock"></i> Llegada: ${new Date(active.tech_arrival_at).toLocaleTimeString()}</div>
                
                <div class="action-grid">
                    <button class="big-btn" style="background:#ef4444; grid-column: span 2;" onclick="openReportModal()">
                        <i class="fas fa-flag-checkered" style="font-size:20px;"></i> TERMINAR Y CERRAR
                    </button>
                </div>
            </div>`;
    } else {
        // Si no hay activo, mostrar mensaje vacío
        activeTicketId = null;
        activeZone.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #94a3b8; background: white; border-radius: 8px; border: 1px dashed #cbd5e1;">
                <i class="fas fa-mug-hot" style="font-size: 40px; margin-bottom: 15px; opacity: 0.5;"></i><br>
                No tienes trabajo activo. Selecciona uno pendiente.
            </div>`;
    }

    // 2. Cargar Pendientes (Status = assigned u open)
    const { data: pending } = await sb.from('tickets')
        .select('*, institutions(name)')
        .eq('assigned_to', currentUser.id)
        .in('status', ['open', 'assigned'])
        .order('priority', { ascending: false }); // Urgentes primero

    document.getElementById('pendingCount').textContent = pending?.length || 0;
    const pContainer = document.getElementById('pendingContainer');
    pContainer.innerHTML = '';

    pending?.forEach(t => {
        const isHigh = t.priority === 'high' || t.priority === 'critical';
        const iconColor = isHigh ? '#ef4444' : '#2563eb';
        
        pContainer.innerHTML += `
            <div class="pending-item">
                <div>
                    <div style="font-weight:700; color:#334155;">#${t.id} - ${t.title}</div>
                    <div style="font-size:13px; color:#64748b;">${t.institutions?.name}</div>
                </div>
                <button onclick="startJob(${t.id})" style="background:${iconColor}; color:white; border:none; padding:8px 15px; border-radius:6px; font-weight:600; cursor:pointer;">
                    ${isHigh ? 'URGENTE 🔥' : 'Iniciar ▶'}
                </button>
            </div>`;
    });
}

// INICIAR TRABAJO (Check-In)
window.startJob = async (id) => {
    if (activeTicketId) {
        alert("Ya tienes un trabajo en curso. Termínalo antes de iniciar otro.");
        return;
    }
    if (!confirm("¿Confirmar que has llegado al sitio y vas a iniciar la reparación?")) return;

    const { error } = await sb.from('tickets').update({
        status: 'in_progress',
        tech_arrival_at: new Date().toISOString()
    }).eq('id', id);

    if (error) alert("Error: " + error.message);
    else loadTickets();
}

// FINALIZAR TRABAJO (Check-Out)
window.openReportModal = () => {
    document.getElementById('reportModal').style.display = 'flex';
}

window.confirmCheckout = async () => {
    const notes = document.getElementById('closeNote').value;
    const parts = document.getElementById('closeParts').value;
    
    if (!notes) { alert("Debes ingresar el diagnóstico."); return; }

    const { error } = await sb.from('tickets').update({
        status: 'resolved',
        tech_departure_at: new Date().toISOString(),
        resolution_notes: notes,
        spare_parts_used: parts // Guarda texto simple o JSON según configures
    }).eq('id', activeTicketId);

    if (error) {
        alert("Error al cerrar: " + error.message);
    } else {
        alert("✅ Orden cerrada correctamente.");
        document.getElementById('reportModal').style.display = 'none';
        loadTickets();
    }
}

window.logout = async () => {
    await sb.auth.signOut();
    window.location.href = 'index.html';
}

document.addEventListener("DOMContentLoaded", init);
