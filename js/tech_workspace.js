const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');
let currentUser = null;
let activeTicketId = null;
let ticketToStart = null; 

document.addEventListener("DOMContentLoaded", init);

async function init() {
    // Verificar sesión
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return window.location.href = 'index.html';
    
    // Cargar nombre del técnico
    const { data: profile } = await sb.from('profiles').select('full_name').eq('id', session.user.id).single();
    document.getElementById('techName').textContent = profile?.full_name || 'Técnico';
    currentUser = session.user;

    loadTickets();
}

async function loadTickets() {
    // 1. Buscar Ticket EN CURSO (Lo que ya empecé y no he terminado)
    // Usamos el nombre correcto de campo: description (en vez de title)
    const { data: active } = await sb.from('tickets')
        .select('*, institutions(name), equipment(model, serial_number)')
        .eq('technician_id', currentUser.id) // Ojo: campo technician_id, no assigned_to
        .eq('status', 'in_progress')
        .maybeSingle();

    const activeZone = document.getElementById('activeZone');

    if (active) {
        activeTicketId = active.id;
        activeZone.innerHTML = `
            <div class="active-job-card">
                <div class="job-id">Orden #${active.id.substring(0,8)}</div>
                <div class="job-title">${active.description || 'Sin descripción'}</div>
                <hr style="border:0; border-top:1px solid #eee; margin:15px 0;">
                
                <div class="info-row"><div class="info-icon"><i class="fas fa-building"></i></div><div class="info-text">${active.institutions?.name || 'Cliente'}</div></div>
                <div class="info-row"><div class="info-icon"><i class="fas fa-print"></i></div><div class="info-text">${active.equipment?.model || 'Equipo'}</div></div>
                <div class="info-row"><div class="info-icon"><i class="fas fa-barcode"></i></div><div class="info-text">${active.equipment?.serial_number || 'S/N'}</div></div>
                
                <button class="btn-big btn-finish" onclick="openModal('auditModal')">
                    <i class="fas fa-check-circle"></i> FINALIZAR TRABAJO
                </button>
            </div>
        `;
    } else {
        activeTicketId = null;
        activeZone.innerHTML = `
            <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; border: 2px dashed #cbd5e1; color: #94a3b8;">
                <i class="fas fa-mug-hot" style="font-size: 30px; margin-bottom: 10px;"></i><br>
                Sin órdenes activas
            </div>`;
    }

    // 2. Cargar PENDIENTES (Asignados a mí pero aún 'open')
    const { data: pending } = await sb.from('tickets')
        .select('*, institutions(name)')
        .eq('technician_id', currentUser.id)
        .in('status', ['open']) // Solo los que están abiertos
        .order('priority', { ascending: false }); // Urgentes primero

    document.getElementById('pendingCount').textContent = pending?.length || 0;
    const pContainer = document.getElementById('pendingContainer');
    pContainer.innerHTML = '';

    pending?.forEach(t => {
        let badge = t.priority === 'Alta' ? '<span style="color:#ef4444; font-weight:bold;">🔥 URGENTE</span>' : `<span style="color:#64748b;">${t.priority}</span>`;
        
        pContainer.innerHTML += `
            <div class="pending-card">
                <div>
                    <div style="font-weight:700; color:#334155;">#${t.id.substring(0,6)}...</div>
                    <div style="font-size:14px; margin-top:4px;">${t.description.substring(0,40)}...</div>
                    <div style="font-size:13px; color:#64748b; margin-top:4px;">${t.institutions?.name}</div>
                    <div style="font-size:11px; margin-top:5px;">${badge}</div>
                </div>
                <button class="pending-btn" onclick="askToStart('${t.id}')">INICIAR ▶</button>
            </div>`;
    });
}

// --- GESTIÓN DE MODALES ---
window.openModal = (id) => document.getElementById(id).style.display = 'flex';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';

window.showMsg = (title, text, type = 'success') => {
    const icon = document.getElementById('msgIcon');
    icon.innerHTML = type === 'success' ? '<i class="fas fa-check-circle" style="color:#16a34a;"></i>' : '<i class="fas fa-times-circle" style="color:#ef4444;"></i>';
    document.getElementById('msgTitle').innerText = title;
    document.getElementById('msgText').innerText = text;
    openModal('msgModal');
}

// --- LÓGICA DE NEGOCIO ---

// 1. INTENTO DE INICIO
window.askToStart = (id) => {
    if (activeTicketId) {
        showMsg("Ocupado", "Ya tienes una orden en curso. Termínala primero.", "error");
        return;
    }
    ticketToStart = id; 
    openModal('startModal');
}

// 2. CONFIRMAR INICIO
window.confirmStartJob = async () => {
    closeModal('startModal');
    
    // Cambiamos estado a 'in_progress'
    const { error } = await sb.from('tickets').update({
        status: 'in_progress'
        // Podríamos guardar tech_arrival_at si creamos ese campo en la BD, por ahora solo status
    }).eq('id', ticketToStart);

    if (error) showMsg("Error", error.message, "error");
    else {
        loadTickets();
    }
}

// 3. FINALIZAR ORDEN (Auditoría)
document.getElementById('auditForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const diagnosis = document.getElementById('auditDiagnosis').value;
    const action = document.getElementById('auditAction').value;
    const parts = document.getElementById('auditParts').value;
    const counter = document.getElementById('auditCounter').value;

    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = "Guardando..."; btn.disabled = true;

    // Concatenamos el reporte técnico en la descripción para que quede en el historial
    // (O idealmente en campos separados si la BD los tiene, aquí aseguramos que se guarde todo)
    const finalReport = ` || [REPORTE TÉCNICO] DIAGNÓSTICO: ${diagnosis}. ACCIÓN: ${action}. REPUESTOS: ${parts}. CONTADOR: ${counter}.`;

    // Primero traemos la descripción original
    const { data: currentTicket } = await sb.from('tickets').select('description').eq('id', activeTicketId).single();
    const newDesc = (currentTicket?.description || '') + finalReport;

    const { error } = await sb.from('tickets').update({
        status: 'closed',
        closed_at: new Date(), // Vital para KPIs
        description: newDesc
        // Si tu tabla tiene columnas 'final_meter_reading', etc., agrégalas aquí.
        // Por seguridad, lo guardo todo en description para que no se pierda nada.
    }).eq('id', activeTicketId);

    if (error) {
        showMsg("Error", error.message, "error");
        btn.innerHTML = "TERMINAR ORDEN"; btn.disabled = false;
    } else {
        closeModal('auditModal');
        e.target.reset();
        showMsg("¡Excelente!", "La orden ha sido cerrada y auditada correctamente.");
        loadTickets();
    }
});

window.logout = async () => {
    await sb.auth.signOut();
    window.location.href = 'index.html';
}
