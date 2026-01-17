const SUPABASE_URL = 'https://esxojlfcjwtahkcrqxkd.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_j0IUHsFoKc8IK7tZbYwEGw_bN4bOD_y'; 
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentSession = null;

async function init() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return window.location.href = "index.html";
    currentSession = session;
    document.getElementById('techNameDisplay').textContent = session.user.email;

    loadMyTickets();
}

async function loadMyTickets() {
    // Buscar perfil del usuario logueado para obtener su ID numérico o UUID
    // Asumimos que 'assigned_to' usa el UUID de auth.users
    const { data: tickets } = await sb
        .from('tickets')
        .select(`*, institutions(name), equipment(model, serial_number)`)
        .eq('assigned_to', currentSession.user.id) // Solo MIS tickets
        .neq('status', 'closed') // Solo activos
        .order('priority', { ascending: false });

    const tbody = document.getElementById('myTicketsTable');
    tbody.innerHTML = '';
    
    document.getElementById('countPending').textContent = tickets?.length || 0;

    tickets?.forEach(t => {
        // Cálculo de SLA
        const deadline = new Date(t.sla_deadline);
        const now = new Date();
        const timeLeft = deadline - now;
        const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
        
        let slaHtml = '';
        if (timeLeft > 0) {
            slaHtml = `<span class="sla-badge sla-ok">Quedan ${hoursLeft}h</span>`;
        } else {
            slaHtml = `<span class="sla-badge sla-danger">VENCIDO (-${Math.abs(hoursLeft)}h)</span>`;
        }

        const btnText = t.tech_arrival ? "Continuar Trabajo" : "Iniciar Atención";
        const btnColor = t.tech_arrival ? "btn-primary" : "btn-danger"; // Rojo si no ha empezado

        tbody.innerHTML += `
            <tr>
                <td><strong>#${t.id}</strong><br><small>${t.priority.toUpperCase()}</small></td>
                <td>
                    ${t.institutions?.name}<br>
                    <small style="color:#666">Eq: ${t.equipment?.model || 'Genérico'}</small>
                </td>
                <td>${slaHtml}</td>
                <td><button class="btn ${btnColor} btn-sm" onclick="openWorkModal(${t.id}, '${t.institutions?.name}', '${t.tech_arrival || ''}')">${btnText}</button></td>
            </tr>`;
    });
}

// LOGICA DEL MODAL
window.openWorkModal = (id, client, arrival) => {
    document.getElementById('workModal').style.display = 'flex';
    document.getElementById('modalTitle').textContent = `Atendiendo Ticket #${id}`;
    document.getElementById('modalClient').textContent = `Cliente: ${client}`;
    document.getElementById('currentTicketId').value = id;

    if (arrival && arrival !== 'null') {
        // Ya hizo check-in, mostrar formulario final
        document.getElementById('stepCheckIn').style.display = 'none';
        document.getElementById('stepReport').style.display = 'block';
        
        // Reloj tiempo real para salida
        setInterval(() => {
            document.getElementById('departureTimeDisplay').textContent = new Date().toLocaleTimeString();
        }, 1000);

    } else {
        // No ha llegado aun
        document.getElementById('stepCheckIn').style.display = 'block';
        document.getElementById('stepReport').style.display = 'none';
    }
}

window.doCheckIn = async () => {
    const id = document.getElementById('currentTicketId').value;
    const now = new Date().toISOString();
    
    const { error } = await sb.from('tickets').update({ 
        tech_arrival: now,
        status: 'in_progress' 
    }).eq('id', id);

    if (!error) {
        alert("📍 Check-in registrado: " + new Date().toLocaleTimeString());
        // Recargar el modal para mostrar el paso 2
        // Truco rápido: cerrar y recargar lista
        closeModal();
        loadMyTickets();
    }
}

document.getElementById('executionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!confirm("¿Estás seguro de cerrar esta orden? Se generará el reporte final.")) return;

    const id = document.getElementById('currentTicketId').value;
    const notes = document.getElementById('techNotes').value;
    const parts = document.getElementById('spareParts').value;
    const departure = new Date().toISOString();

    const { error } = await sb.from('tickets').update({
        tech_departure: departure,
        technical_notes: notes,
        spare_parts: parts,
        status: 'closed' // Cerrado definitivamente
    }).eq('id', id);

    if (!error) {
        alert("✅ Trabajo finalizado correctamente.");
        closeModal();
        loadMyTickets();
    } else {
        alert("Error: " + error.message);
    }
});

window.closeModal = () => { document.getElementById('workModal').style.display = 'none'; }
document.addEventListener("DOMContentLoaded", init);
