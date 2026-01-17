const sb = supabase.createClient('https://esxojlfcjwtahkcrqxkd.supabase.co', 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y');

// Obtener el ID del ticket de la URL (ej: ticket_details.html?id=12)
const params = new URLSearchParams(window.location.search);
const ticketId = params.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión (Seguridad básica)
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return window.location.href = 'index.html';

    if(!ticketId) {
        alert("Error: No se especificó ningún ticket.");
        window.location.href = 'tickets.html';
        return;
    }

    // 1. Cargar la información del Ticket
    await loadTicketData();
    
    // 2. Cargar la lista de Técnicos para el select
    await loadTechnicians();
});

async function loadTicketData() {
    // Traemos el ticket + nombre de la institución + modelo del equipo + email de quien reportó
    const { data: t, error } = await sb.from('tickets')
        .select(`
            *,
            institutions (name),
            equipment (model, serial_number),
            profiles!reported_by (email, full_name)
        `)
        .eq('id', ticketId)
        .single();

    if (error) {
        console.error(error);
        alert("No se pudo cargar el ticket.");
        return;
    }

    // Rellenar el HTML con los datos
    document.getElementById('tId').innerText = t.id;
    document.getElementById('tTitle').innerText = t.title;
    document.getElementById('tDesc').innerText = t.description || "Sin descripción detallada.";
    
    // Estado con colores
    const statusLabel = document.getElementById('tStatus');
    statusLabel.innerText = translateStatus(t.status);
    styleStatus(statusLabel, t.status);

    // Datos Relacionados
    const reportedBy = t.profiles?.full_name || t.profiles?.email || "Usuario desconocido";
    const instName = t.institutions?.name || "Sin Empresa";
    document.getElementById('tClient').innerText = `${instName} \n(Reportado por: ${reportedBy})`;

    const equipModel = t.equipment?.model || "Modelo no especificado";
    const equipSerial = t.equipment?.serial_number || "S/N no registrado";
    document.getElementById('tEquip').innerText = `${equipModel} (Serie: ${equipSerial})`;

    // Si el ticket ya tiene técnico asignado, guardamos ese dato para pre-seleccionar el combo después
    if (t.assigned_to) {
        sessionStorage.setItem('assignedTechId', t.assigned_to);
    }

    // Si el ticket ya está CERRADO (Resolved/Closed), mostramos la tarjeta de Auditoría
    if (t.status === 'resolved' || t.status === 'closed') {
        document.getElementById('auditCard').style.display = 'block';
        document.getElementById('resDiag').innerText = t.technical_diagnosis || "No registrado";
        document.getElementById('resAction').innerText = t.action_taken || "No registrado";
        document.getElementById('resMeter').innerText = t.final_meter_reading || "0";
        
        // Bloquear el selector de técnicos porque ya se cerró
        document.getElementById('techSelect').disabled = true;
        document.querySelector('button[onclick="assignTech()"]').style.display = 'none';
    }
}

async function loadTechnicians() {
    // Buscamos solo usuarios con rol 'technician'
    const { data: techs } = await sb.from('profiles')
        .select('id, full_name, email')
        .eq('role', 'technician');

    const sel = document.getElementById('techSelect');
    sel.innerHTML = '<option value="">-- Seleccionar Técnico --</option>';

    if (techs && techs.length > 0) {
        techs.forEach(tech => {
            const name = tech.full_name || tech.email;
            sel.innerHTML += `<option value="${tech.id}">${name}</option>`;
        });
    }

    // Si ya había uno asignado, lo seleccionamos automáticamente
    const currentTech = sessionStorage.getItem('assignedTechId');
    if (currentTech) {
        sel.value = currentTech;
    }
}

// Función del botón "Guardar Asignación"
window.assignTech = async () => {
    const techId = document.getElementById('techSelect').value;
    
    if (!techId) {
        alert("Por favor selecciona un técnico de la lista.");
        return;
    }

    const btn = document.querySelector('button[onclick="assignTech()"]');
    const oldText = btn.innerHTML;
    btn.innerHTML = "Guardando..."; btn.disabled = true;

    // Actualizamos el ticket
    const { error } = await sb.from('tickets').update({
        assigned_to: techId,
        status: 'assigned' // Cambiamos estado a Asignado automáticamente
    }).eq('id', ticketId);

    if (error) {
        alert("Error al asignar: " + error.message);
        btn.innerHTML = oldText; btn.disabled = false;
    } else {
        alert("✅ Técnico asignado correctamente. Le aparecerá en su App inmediatamente.");
        location.reload(); // Recargar para ver cambios
    }
}

// Utilidades visuales
function translateStatus(status) {
    if (status === 'open') return 'ABIERTO / PENDIENTE';
    if (status === 'assigned') return 'ASIGNADO';
    if (status === 'in_progress') return 'EN PROCESO';
    if (status === 'resolved') return 'RESUELTO / CERRADO';
    return status.toUpperCase();
}

function styleStatus(element, status) {
    if (status === 'open') { element.style.background = '#fee2e2'; element.style.color = '#ef4444'; } // Rojo
    else if (status === 'assigned') { element.style.background = '#e0f2fe'; element.style.color = '#0369a1'; } // Azul
    else if (status === 'in_progress') { element.style.background = '#fef3c7'; element.style.color = '#d97706'; } // Naranja
    else if (status === 'resolved') { element.style.background = '#dcfce7'; element.style.color = '#16a34a'; } // Verde
}
