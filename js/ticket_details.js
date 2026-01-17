const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');
const params = new URLSearchParams(window.location.search);
const ticketId = params.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    if(!ticketId) {
        // Si no hay ID, quizás es modo 'nuevo ticket manual' (no implementado aquí, volver)
        alert("ID de ticket no especificado");
        window.location.href = 'tickets.html';
        return;
    }
    await loadTicket();
    await loadTechnicians();
});

async function loadTicket() {
    const { data: t } = await sb.from('tickets')
        .select('*, institutions(name), equipment(model, serial_number), profiles!reported_by(email)')
        .eq('id', ticketId)
        .single();

    if(t) {
        document.getElementById('tId').innerText = t.id;
        document.getElementById('tTitle').innerText = t.title;
        document.getElementById('tDesc').innerText = t.description;
        document.getElementById('tStatus').innerText = t.status.toUpperCase();
        
        // Datos relacionados
        document.getElementById('tClient').innerText = `${t.institutions?.name} (${t.profiles?.email})`;
        document.getElementById('tEquip').innerText = `${t.equipment?.model} (S/N: ${t.equipment?.serial_number})`;

        // Si ya tiene técnico, pre-seleccionar
        if(t.assigned_to) {
            sessionStorage.setItem('currentTech', t.assigned_to);
        }

        // Si está cerrado, mostrar auditoría
        if(t.status === 'resolved' || t.status === 'closed') {
            document.getElementById('auditCard').style.display = 'block';
            document.getElementById('resDiag').innerText = t.technical_diagnosis;
            document.getElementById('resAction').innerText = t.action_taken;
            document.getElementById('resMeter').innerText = t.final_meter_reading;
        }
    }
}

async function loadTechnicians() {
    // Cargar usuarios con rol 'technician'
    const { data } = await sb.from('profiles').select('id, full_name, email').eq('role', 'technician');
    const sel = document.getElementById('techSelect');
    
    data?.forEach(tech => {
        sel.innerHTML += `<option value="${tech.id}">${tech.full_name || tech.email}</option>`;
    });

    // Marcar el actual
    const current = sessionStorage.getItem('currentTech');
    if(current) sel.value = current;
}

window.assignTech = async () => {
    const techId = document.getElementById('techSelect').value;
    if(!techId) return alert("Selecciona un técnico");

    const { error } = await sb.from('tickets').update({
        assigned_to: techId,
        status: 'assigned' // Cambia estado a asignado
    }).eq('id', ticketId);

    if(error) alert("Error: " + error.message);
    else {
        alert("✅ Técnico asignado correctamente.");
        location.reload();
    }
}
