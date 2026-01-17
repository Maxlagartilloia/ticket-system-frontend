const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');
let currentUser = null;
let activeTicketId = null;

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
    // 1. Buscar si ya tengo un ticket "EN PROCESO" (Solo puedo tener uno a la vez)
    const { data: active } = await sb.from('tickets')
        .select('*, institutions(name), equipment(model, serial_number)')
        .eq('assigned_to', currentUser.id)
        .eq('status', 'in_progress')
        .maybeSingle();

    const activeZone = document.getElementById('activeZone');

    if (active) {
        activeTicketId = active.id;
        // RENDERIZAR TARJETA GIGANTE
        activeZone.innerHTML = `
            <div class="active-job-card">
                <div class="job-header">
                    <span class="job-id">Ticket #${active.id}</span>
                    <div class="job-title">${active.title}</div>
                </div>
                
                <div class="info-row">
                    <div class="info-icon"><i class="fas fa-building"></i></div>
                    <div class="info-text">${active.institutions?.name}</div>
                </div>
                <div class="info-row">
                    <div class="info-icon"><i class="fas fa-map-marker-alt"></i></div>
                    <div class="info-text">En Sitio</div>
                </div>
                <div class="info-row">
                    <div class="info-icon"><i class="fas fa-print"></i></div>
                    <div class="info-text">${active.equipment?.model} <span style="color:#64748b;">(S/N: ${active.equipment?.serial_number})</span></div>
                </div>
                <div class="info-row">
                    <div class="info-icon"><i class="fas fa-clock"></i></div>
                    <div class="info-text">Inicio: ${new Date(active.tech_arrival_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>

                <button class="btn-big btn-finish" onclick="openAuditModal()">
                    <i class="fas fa-flag-checkered"></i> FINALIZAR TRABAJO
                </button>
            </div>
        `;
    } else {
        activeTicketId = null;
        activeZone.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; background: white; border-radius: 12px; border: 2px dashed #cbd5e1; color: #94a3b8;">
                <i class="fas fa-coffee" style="font-size: 40px; margin-bottom: 15px; opacity: 0.5;"></i><br>
                No tienes órdenes activas.<br>Dale "Iniciar" a una de abajo.
            </div>`;
    }

    // 2. Cargar Lista de Pendientes
    const { data: pending } = await sb.from('tickets')
        .select('*, institutions(name)')
        .eq('assigned_to', currentUser.id)
        .in('status', ['open', 'assigned']) // Abiertos o asignados
        .order('priority', { ascending: false });

    document.getElementById('pendingCount').textContent = pending?.length || 0;
    const pContainer = document.getElementById('pendingContainer');
    pContainer.innerHTML = '';

    if (!pending || pending.length === 0) {
        pContainer.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px;">Todo limpio por hoy ✅</div>';
        return;
    }

    pending.forEach(t => {
        let priorityBadge = t.priority === 'high' ? '<span style="color:#ef4444; font-weight:bold;">🔥 URGENTE</span>' : '';
        
        pContainer.innerHTML += `
            <div class="pending-card">
                <div class="pending-info">
                    <div style="font-weight:700; color:#334155; font-size:15px;">#${t.id} - ${t.title}</div>
                    <div style="font-size:13px; color:#64748b;">${t.institutions?.name}</div>
                    <div style="font-size:11px; margin-top:5px;">${priorityBadge}</div>
                </div>
                <button class="pending-btn" onclick="startJob(${t.id})">INICIAR ▶</button>
            </div>
        `;
    });
}

// --- ACCIONES ---

// 1. INICIAR (Marcar llegada)
window.startJob = async (id) => {
    if (activeTicketId) {
        alert("⚠️ Termina tu orden actual antes de iniciar otra.");
        return;
    }
    if (!confirm("¿Confirmas que ya estás en el sitio y vas a empezar a trabajar?")) return;

    // Actualizamos estado y hora de llegada
    await sb.from('tickets').update({
        status: 'in_progress',
        tech_arrival_at: new Date().toISOString()
    }).eq('id', id);

    loadTickets();
}

// 2. ABRIR MODAL AUDITORÍA
window.openAuditModal = () => {
    document.getElementById('auditModal').style.display = 'flex';
}

window.closeAuditModal = () => {
    document.getElementById('auditModal').style.display = 'none';
}

// 3. GUARDAR AUDITORÍA Y CERRAR TICKET
document.getElementById('auditForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const diagnosis = document.getElementById('auditDiagnosis').value;
    const action = document.getElementById('auditAction').value;
    const parts = document.getElementById('auditParts').value;
    const counter = document.getElementById('auditCounter').value;

    if (!counter || counter <= 0) {
        alert("El contador es obligatorio para cerrar la orden.");
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = "Guardando..."; btn.disabled = true;

    // ACTUALIZACIÓN MAESTRA EN BASE DE DATOS
    const { error } = await sb.from('tickets').update({
        status: 'resolved', // Resuelto
        tech_departure_at: new Date().toISOString(), // Hora de salida
        technical_diagnosis: diagnosis,
        action_taken: action,
        spare_parts_used: parts,
        final_meter_reading: parseInt(counter), // Guardar contador como número
        resolution_notes: `DIAGNÓSTICO: ${diagnosis} | ACCIÓN: ${action}` // Resumen para vista rápida
    }).eq('id', activeTicketId);

    if (error) {
        alert("Error al guardar: " + error.message);
        btn.innerHTML = originalText; btn.disabled = false;
    } else {
        alert("✅ Orden Cerrada y Auditada Correctamente.");
        closeAuditModal();
        e.target.reset();
        loadTickets(); // Refrescar pantalla
    }
});

// Logout
window.logout = async () => {
    await sb.auth.signOut();
    window.location.href = 'index.html';
}
